const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const { createRedisClient } = require("../config/redis");
const { createAdapter } = require("@socket.io/redis-adapter");
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

  // Create dedicated pub/sub Redis clients for the adapter
  const pubClient = createRedisClient();
  const subClient = createRedisClient();

  Promise.all([
    new Promise((resolve) => pubClient.on("connect", resolve)),
    new Promise((resolve) => subClient.on("connect", resolve)),
  ]).then(() => {
    console.log("Socket.io Redis Adapter connected (pub/sub ready)");
  });

  io.adapter(createAdapter(pubClient, subClient));

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

        // Only remove from Redis if this socket is still the registered one
        // (prevents a race condition with reconnects)
        const currentSocketId = await redisClient.get(`user:${socket.userId}`);
        if (currentSocketId === socket.id) {
          await redisClient.del(`user:${socket.userId}`);

          // Broadcast offline status
          socket.broadcast.emit("user_presence_change", {
            userId: socket.userId,
            status: "offline",
          });
        }
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

