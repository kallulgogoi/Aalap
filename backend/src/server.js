require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { connectRabbitMQ } = require("./config/rabbitmq");
const { initSockets } = require("./sockets");
const { initializeWorkers } = require("./workers");

const server = http.createServer(app);

const startServer = async () => {
  try {
    console.log("Booting up infrastructure...");

    await connectDB();

    await connectRabbitMQ();

    initSockets(server);

    // Start Background Workers
    initializeWorkers();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Production Server is LIVE on port ${PORT}`);
      console.log(`Accepting requests from: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error("CRITICAL FATAL ERROR: Boot sequence failed.", error);
    process.exit(1);
  }
};

startServer();

// If the server crashes or i deploy new code, these catch the kill signal
// and safely drain the RabbitMQ queues and database connections before shutting down.

const gracefulShutdown = () => {
  console.log("Received kill signal, shutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("unhandledRejection", (err) => {
  console.error(
    " UNHANDLED REJECTION! Shutting down...",
    err.name,
    err.message,
  );
  server.close(() => {
    process.exit(1);
  });
});
