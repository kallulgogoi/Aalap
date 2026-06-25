const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const { registerChatHandlers } = require("./chatHandler");

let io = null;

const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL, // e.g., 'http://localhost:3000'
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Production setting: drop idle connections to save server memory
    pingTimeout: 60000,
  });

  // --- PRODUCTION MIDDLEWARE: Security & Authentication ---
  io.use((socket, next) => {
    try {
      // Allow token from handshake auth or headers
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: Token missing."));
      }

      // Verify the JWT synchronously
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the secure userId directly to the socket instance for downstream use
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.warn(`Socket Auth Failed: ${err.message}`);
      return next(new Error("Authentication error: Invalid or expired token."));
    }
  });

  // --- CONNECTION MANAGER ---
  io.on("connection", async (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.userId}`);

    try {
      // 1. Register presence in Redis (O(1) memory state)
      await redisClient.set(`user:${socket.userId}`, socket.id);

      // 2. Broadcast online status to all active clients tracking presence
      socket.broadcast.emit("user_presence_change", {
        userId: socket.userId,
        status: "online",
      });

      // 3. Bind the business logic handlers
      registerChatHandlers(io, socket);

      // 4. Handle clean disconnections
      socket.on("disconnect", async () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);

        // Remove from Redis memory
        await redisClient.del(`user:${socket.userId}`);

        // Broadcast offline status
        socket.broadcast.emit("user_presence_change", {
          userId: socket.userId,
          status: "offline",
        });
      });
    } catch (error) {
      console.error("Connection Setup Error:", error.message);
    }
  });

  return io;
};

// Safe getter function so your REST Controllers can trigger WebSocket events
const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io has not been initialized. Ensure initSockets() is called first.",
    );
  }
  return io;
};

module.exports = { initSockets, getIO };
