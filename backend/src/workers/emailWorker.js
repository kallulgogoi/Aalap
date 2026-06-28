const { getChannel } = require("../config/rabbitmq");
const {
  sendShadowInviteEmail,
  getEmailTransport,
} = require("../services/emailService");

const MAX_EMAIL_RETRIES = 3;

const getRetryCount = (msg) => msg.properties.headers?.["x-retry-count"] || 0;

const requeueWithRetry = (channel, msg, queueName) => {
  const retryCount = getRetryCount(msg) + 1;

  if (retryCount > MAX_EMAIL_RETRIES) {
    console.error(
      `Dropping invite email after ${MAX_EMAIL_RETRIES} failed attempts:`,
      msg.content.toString(),
    );
    channel.ack(msg);
    return;
  }

  channel.sendToQueue(queueName, msg.content, {
    persistent: true,
    headers: { "x-retry-count": retryCount },
  });
  channel.ack(msg);
};

const startEmailWorkers = async () => {
  try {
    const channel = getChannel();

    channel.prefetch(10);

    console.log("Invite email worker started.");
    console.log(`Email transport: ${getEmailTransport()}`);

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
          requeueWithRetry(channel, msg, "invite_queue");
        }
      }
    });
  } catch (error) {
    console.error("Failed to start Email Workers:", error.message);
  }
};

module.exports = { startEmailWorkers };
