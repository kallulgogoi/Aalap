require("dotenv").config(); // Load environment variables first

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { connectRabbitMQ } = require("./config/rabbitmq");
const { initSockets } = require("./sockets");
const { initializeWorkers } = require("./workers");

// Create the raw HTTP server using the Express app
const server = http.createServer(app);

// --- THE BOOT SEQUENCE ---
const startServer = async () => {
  try {
    console.log("🔄 Booting up infrastructure...");

    // 1. Connect to Database
    await connectDB();

    // 2. Connect to Message Broker (RabbitMQ)
    await connectRabbitMQ();

    // 3. Initialize WebSocket Layer
    initSockets(server);

    // 4. Start Background Workers (Requires DB & RabbitMQ)
    initializeWorkers();

    // 5. Start Listening for Traffic
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Production Server is LIVE on port ${PORT}`);
      console.log(`🌐 Accepting requests from: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error("❌ CRITICAL FATAL ERROR: Boot sequence failed.", error);
    process.exit(1); // Kill the container if boot fails
  }
};

startServer();

// --- GRACEFUL SHUTDOWN HANDLERS ---
// If the server crashes or you deploy new code, these catch the kill signal
// and safely drain the RabbitMQ queues and database connections before shutting down.

const gracefulShutdown = () => {
  console.log("⚠️ Received kill signal, shutting down gracefully...");
  server.close(() => {
    console.log("🛑 HTTP server closed.");
    // Close DB and Redis connections here if needed
    process.exit(0);
  });

  // Force close if it takes longer than 10 seconds
  setTimeout(() => {
    console.error(
      "❌ Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
};

// Listen for Node.js process kill signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Catch unhandled promises that slip through try/catch blocks
process.on("unhandledRejection", (err) => {
  console.error(
    "❌ UNHANDLED REJECTION! Shutting down...",
    err.name,
    err.message,
  );
  server.close(() => {
    process.exit(1);
  });
});
