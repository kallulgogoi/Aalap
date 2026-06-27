const { getChannel } = require("../config/rabbitmq");
const {
  sendOTPEmail,
  sendShadowInviteEmail,
} = require("../services/emailService");

const startEmailWorkers = async () => {
  try {
    const channel = getChannel();

    channel.prefetch(10);

    console.log("Email Worker started. Listening for tasks...");

    // The OTP Queue
    channel.consume("email_queue", async (msg) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          const { toEmail, otpCode } = payload;
          await sendOTPEmail(toEmail, otpCode);

          // Acknowledge the message so RabbitMQ removes it from the queue
          channel.ack(msg);
        } catch (error) {
          console.error("OTP Worker Failed to process message:", error.message);
          channel.nack(msg, false, true);
        }
      }
    });

    // The Shadow Invite Queue
    channel.consume("invite_queue", async (msg) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          const { toEmail, senderName } = payload;

          await sendShadowInviteEmail(toEmail, senderName);

          channel.ack(msg);
        } catch (error) {
          console.error(
            "Invite Worker Failed to process message:",
            error.message,
          );
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (error) {
    console.error("Failed to start Email Workers:", error.message);
  }
};

module.exports = { startEmailWorkers };
