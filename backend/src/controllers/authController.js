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

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

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

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      profilePic: {
        url: generateDefaultAvatar(username, email.toLowerCase()),
        publicId: null,
      },
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.setex(`otp:${email.toLowerCase()}`, 900, otpCode);

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

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Check Redis for the OTP
    const storedOtp = await redisClient.get(`otp:${email.toLowerCase()}`);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isVerified: true },
      { new: true },
    );

    // Clear the OTP from Redis
    await redisClient.del(`otp:${email.toLowerCase()}`);

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

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified)
        return res
          .status(401)
          .json({ message: "Please verify your email first." });

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

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res
        .status(404)
        .json({ message: "If this email exists, an OTP has been sent." });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await redisClient.setex(`reset_otp:${email.toLowerCase()}`, 600, otpCode);

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

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long." });
    }

    const storedOtp = await redisClient.get(`reset_otp:${email.toLowerCase()}`);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: hashedPassword },
    );

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
