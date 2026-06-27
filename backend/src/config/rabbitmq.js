const amqp = require("amqplib");

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URI);

    connection.on("error", (err) => {
      console.error("RabbitMQ Connection Error:", err.message);
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on("close", () => {
      console.warn("RabbitMQ Connection Closed. Reconnecting in 5s...");
      setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();

    await channel.assertQueue("email_queue", { durable: true });
    await channel.assertQueue("invite_queue", { durable: true });
    console.log("RabbitMQ Connected & Channels Asserted");
    return channel;
  } catch (error) {
    console.error("RabbitMQ Initialization Failed:", error.message);

    setTimeout(connectRabbitMQ, 5000);
  }
};

const getChannel = () => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized yet.");
  }
  return channel;
};

module.exports = { connectRabbitMQ, getChannel };
