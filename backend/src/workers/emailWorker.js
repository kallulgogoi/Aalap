const { getChannel } = require("../config/rabbitmq");
const {
  sendOTPEmail,
  sendShadowInviteEmail,
} = require("../services/emailService");

/**
 * Initializes the RabbitMQ consumers for all email-related queues.
 */
const startEmailWorkers = async () => {
  try {
    const channel = getChannel();

    // PRODUCTION SETTING: Prefetch
    // Tells RabbitMQ: "Only give this worker 10 emails at a time."
    // This prevents the worker from running out of RAM if you suddenly get 100,000 signups.
    channel.prefetch(10);

    console.log("👷 Email Worker started. Listening for tasks...");

    // --- CONSUMER 1: The OTP Queue ---
    channel.consume("email_queue", async (msg) => {
      if (msg !== null) {
        try {
          // Parse the JSON payload pushed by the Auth Controller
          const payload = JSON.parse(msg.content.toString());
          const { toEmail, otpCode } = payload;

          // Attempt to send the email
          await sendOTPEmail(toEmail, otpCode);

          // Success: Acknowledge the message so RabbitMQ removes it from the queue
          channel.ack(msg);
        } catch (error) {
          console.error(
            "❌ OTP Worker Failed to process message:",
            error.message,
          );

          // Failure: Put it back in the queue to try again later
          // (The second parameter 'false' means don't nack all messages, just this one.
          // The third parameter 'true' means requeue it).
          channel.nack(msg, false, true);
        }
      }
    });

    // --- CONSUMER 2: The Shadow Invite Queue ---
    channel.consume("invite_queue", async (msg) => {
      if (msg !== null) {
        try {
          // Parse the JSON payload pushed by the Message Controller
          const payload = JSON.parse(msg.content.toString());
          const { toEmail, senderName } = payload;

          // Attempt to send the invite email
          await sendShadowInviteEmail(toEmail, senderName);

          // Success: Acknowledge
          channel.ack(msg);
        } catch (error) {
          console.error(
            "❌ Invite Worker Failed to process message:",
            error.message,
          );

          // Failure: Requeue
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to start Email Workers:", error.message);
  }
};

module.exports = { startEmailWorkers };
