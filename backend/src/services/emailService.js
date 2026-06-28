const nodemailer = require("nodemailer");

const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);

const getEmailTransport = () => {
  const configured = process.env.EMAIL_TRANSPORT?.toLowerCase();

  if (configured === "brevo") {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("EMAIL_TRANSPORT=brevo but BREVO_API_KEY is not set.");
    }
    return "brevo";
  }

  if (configured === "resend") {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("EMAIL_TRANSPORT=resend but RESEND_API_KEY is not set.");
    }
    return "resend";
  }

  if (configured === "smtp") {
    return "smtp";
  }

  if (process.env.RESEND_API_KEY) {
    return "resend";
  }

  return "smtp";
};

const createSmtpTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error("SMTP credentials are not fully configured.");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    requireTLS: smtpPort === 587,
    tls: {
      minVersion: "TLSv1.2",
    },
  });
};

let smtpTransporter = null;

const getSmtpTransporter = () => {
  if (!smtpTransporter) {
    smtpTransporter = createSmtpTransporter();
  }
  return smtpTransporter;
};

// NEW: Function to send via Brevo HTTP API
const sendViaBrevoHTTP = async ({ toEmail, subject, html, fromName }) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SMTP_FROM_EMAIL is required.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo HTTP API error (${response.status}): ${errorBody}`);
  }
};

const sendViaResend = async ({ toEmail, subject, html, fromName }) => {
  const fromEmail =
    process.env.SMTP_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SMTP_FROM_EMAIL or RESEND_FROM_EMAIL is required.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [toEmail],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
};

const sendViaSmtp = async ({ toEmail, subject, html, fromName }) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SMTP_FROM_EMAIL is required.");
  }

  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject,
    html,
  });
};

const sendEmail = async ({ toEmail, subject, html, fromName }) => {
  const transport = getEmailTransport();

  if (transport === "brevo") {
    await sendViaBrevoHTTP({ toEmail, subject, html, fromName });
    return;
  }

  if (transport === "resend") {
    await sendViaResend({ toEmail, subject, html, fromName });
    return;
  }

  await sendViaSmtp({ toEmail, subject, html, fromName });
};

const sendOTPEmail = async (toEmail, otpCode) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome to ChatApp!</h2>
      <p>Your 6-digit verification code is:</p>
      <h1 style="color: #00A884; letter-spacing: 5px;">${otpCode}</h1>
      <p>This code will expire in 15 minutes.</p>
    </div>
  `;

  try {
    await sendEmail({
      toEmail,
      subject: "Your Verification Code",
      html,
      fromName: "ChatApp Support",
    });
  } catch (error) {
    console.error(`Email Delivery Failed (${toEmail}):`, error.message);
    throw new Error("Failed to deliver OTP email.");
  }
};

const sendShadowInviteEmail = async (toEmail, senderName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>You have a new message waiting.</h2>
      <p><strong>${senderName}</strong> is trying to reach you on ChatApp.</p>
      <a href="${process.env.FRONTEND_URL}/signup?email=${toEmail}" 
         style="background-color: #00A884; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
         Read Message
      </a>
    </div>
  `;

  try {
    await sendEmail({
      toEmail,
      subject: `${senderName} sent you a secure message!`,
      html,
      fromName: "ChatApp Invites",
    });
  } catch (error) {
    console.error(`Invite Email Delivery Failed (${toEmail}):`, error.message);
    throw new Error("Failed to deliver invitation email.");
  }
};

module.exports = { sendOTPEmail, sendShadowInviteEmail, getEmailTransport };
