const User = require("../models/User");
const { generateDefaultAvatar } = require("../utils/avatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const { getChannel } = require("../config/rabbitmq");
const { resolveShadowMessages } = require("../services/messageService");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// 1. Sign Up (Initiates OTP via RabbitMQ)
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 1. Basic Check: Do all fields exist?
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Strict Validation: Match Mongoose schema rules
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }

    if (username.length > 50) {
      return res
        .status(400)
        .json({ message: "Username cannot exceed 50 characters." });
    }

    // 3. Check for existing user
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 4. Hash the validated password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create unverified user
    await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      profilePic: {
        url: generateDefaultAvatar(username, email.toLowerCase()),
        publicId: null,
      },
    });

    // 6. Generate 6-digit OTP and store in Redis (Expires in 15 mins / 900 secs)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.setex(`otp:${email.toLowerCase()}`, 900, otpCode);

    // 7. Push to RabbitMQ for background sending
    const channel = getChannel();
    channel.sendToQueue(
      "email_queue",
      Buffer.from(JSON.stringify({ toEmail: email, otpCode })),
    );

    res
      .status(201)
      .json({ success: true, message: "OTP sent to email. Please verify." });
  } catch (error) {
    next(error);
  }
};

// 2. Verify OTP & Issue Token (Resolves Shadow Messages here)
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Check Redis for the OTP
    const storedOtp = await redisClient.get(`otp:${email.toLowerCase()}`);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Mark user as verified
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isVerified: true },
      { new: true },
    );

    // Clear the OTP from Redis
    await redisClient.del(`otp:${email.toLowerCase()}`);

    // THE MAGIC: Attach any pending shadow messages to this newly registered user
    await resolveShadowMessages(user._id, user.email);

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }
    // Use +password to explicitly fetch the password hash that we hid in the schema
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified)
        return res
          .status(401)
          .json({ message: "Please verify your email first." });

      // Resolve any pending invites once the invited user logs in
      try {
        await resolveShadowMessages(user._id, user.email);
      } catch (shadowError) {
        console.warn(
          "Shadow resolution on login skipped:",
          shadowError.message,
        );
      }

      res.status(200).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePic: user.profilePic,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    next(error);
  }
};

// --- FORGOT PASSWORD INITIATION ---
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // 1. Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res
        .status(404)
        .json({ message: "If this email exists, an OTP has been sent." });
    // ^ Pro-tip: Never confirm if an email exists to prevent user enumeration attacks!

    // 2. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save to Redis with a strict prefix and 10-minute expiry (600 seconds)
    await redisClient.setex(`reset_otp:${email.toLowerCase()}`, 600, otpCode);

    // 4. Reuse your existing RabbitMQ worker to send the email
    const channel = getChannel();
    channel.sendToQueue(
      "email_queue",
      Buffer.from(JSON.stringify({ toEmail: email, otpCode })),
    );

    res
      .status(200)
      .json({ success: true, message: "Password reset OTP sent to email." });
  } catch (error) {
    next(error);
  }
};

// --- RESET PASSWORD COMPLETION ---
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1. Basic validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long." });
    }

    // 2. Check Redis for the OTP
    const storedOtp = await redisClient.get(`reset_otp:${email.toLowerCase()}`);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update the user in MongoDB
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: hashedPassword },
    );

    // 5. Clean up Redis so the OTP can't be reused
    await redisClient.del(`reset_otp:${email.toLowerCase()}`);

    res.status(200).json({
      success: true,
      message: "Password successfully reset. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
};
