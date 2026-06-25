const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTPEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"ChatApp Support" <${process.env.SMTP_FROM_EMAIL}>`,
    to: toEmail,
    subject: "Your Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to ChatApp!</h2>
        <p>Your 6-digit verification code is:</p>
        <h1 style="color: #00A884; letter-spacing: 5px;">${otpCode}</h1>
        <p>This code will expire in 15 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Email Delivery Failed (${toEmail}):`, error.message);
    throw new Error("Failed to deliver OTP email.");
  }
};

const sendShadowInviteEmail = async (toEmail, senderName) => {
  const mailOptions = {
    from: `"ChatApp Invites" <${process.env.SMTP_FROM_EMAIL}>`,
    to: toEmail,
    subject: `${senderName} sent you a secure message!`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>You have a new message waiting.</h2>
        <p><strong>${senderName}</strong> is trying to reach you on ChatApp.</p>
        <a href="${process.env.FRONTEND_URL}/signup?email=${toEmail}" 
           style="background-color: #00A884; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           Read Message
        </a>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Invite Email Delivery Failed (${toEmail}):`, error.message);
    throw new Error("Failed to deliver invitation email.");
  }
};

module.exports = { sendOTPEmail, sendShadowInviteEmail };
