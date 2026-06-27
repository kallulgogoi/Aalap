const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const { registerChatHandlers } = require("./chatHandler");

let io = null;

const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: Token missing."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      console.warn(`Socket Auth Failed: ${err.message}`);
      return next(new Error("Authentication error: Invalid or expired token."));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.userId}`);

    try {
      // Register presence in Redis
      await redisClient.set(`user:${socket.userId}`, socket.id);

      // Broadcast online status to all active clients tracking presence
      socket.broadcast.emit("user_presence_change", {
        userId: socket.userId,
        status: "online",
      });

      registerChatHandlers(io, socket);

      // clean disconnections
      socket.on("disconnect", async () => {
        console.log(`Socket disconnected: ${socket.id}`);

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

const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io has not been initialized. Ensure initSockets() is called first.",
    );
  }
  return io;
};

module.exports = { initSockets, getIO };
