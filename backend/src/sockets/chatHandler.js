const Message = require("../models/Message");
const Chat = require("../models/Chat");
const redisClient = require("../config/redis");

/**
 * Registers all chat-related WebSocket events for a connected client
 * @param {Object} io - The main Socket.io server instance
 * @param {Object} socket - The individual client's socket connection
 */
const registerChatHandlers = (io, socket) => {
  // --- 1. SENDING A MESSAGE ---
  socket.on("send_message", async (payload, callback) => {
    try {
      const { chatId, receiverId, text, messageType, mediaUrl } = payload;
      const senderId = socket.userId;

      if (receiverId && receiverId.toString() === senderId.toString()) {
        return callback({
          success: false,
          error: "You cannot send messages to yourself.",
        });
      }

      // Security: Verify the user is actually a participant in this chat
      const chat = await Chat.findOne({ _id: chatId, participants: senderId });
      if (!chat) {
        return callback({
          success: false,
          error: "Unauthorized to post in this chat.",
        });
      }

      // 1. Persist the message to MongoDB instantly
      const newMessage = await Message.create({
        chatId,
        senderId,
        receiverId,
        messageType: messageType || "text",
        text: text || "",
        mediaUrl: mediaUrl || null,
        status: "delivered",
      });

      // 2. Update the Chat container's lastMessage for fast sidebar rendering
      chat.lastMessage = newMessage._id;
      await chat.save();

      // 3. Routing (Redis O(1) Lookup)
      const receiverSocketId = await redisClient.get(`user:${receiverId}`);

      if (receiverSocketId) {
        // Receiver is online: Push the message to them instantly
        io.to(receiverSocketId).emit("receive_message", newMessage);
      }

      // 4. Acknowledge success back to the sender's frontend
      if (typeof callback === "function") {
        callback({ success: true, message: newMessage });
      }
    } catch (error) {
      console.error(`Socket Error (send_message):`, error.message);
      if (typeof callback === "function") {
        callback({ success: false, error: "Failed to process message." });
      }
    }
  });

  // --- 2. TYPING INDICATORS ---
  socket.on("typing", async ({ receiverId, chatId, isTyping }) => {
    try {
      const receiverSocketId = await redisClient.get(`user:${receiverId}`);
      if (receiverSocketId) {
        // Only route the typing event, no database interaction needed
        io.to(receiverSocketId).emit("user_typing", {
          chatId,
          senderId: socket.userId,
          isTyping,
        });
      }
    } catch (error) {
      console.error(`Socket Error (typing):`, error.message);
    }
  });

  // --- 3. READ RECEIPTS (Offline to Online Resolution) ---
  socket.on("mark_messages_read", async ({ chatId, senderId }) => {
    try {
      const readerId = socket.userId;

      // 1. Bulk update the database in a single transaction
      const result = await Message.updateMany(
        { chatId, senderId, receiverId: readerId, status: "delivered" },
        { $set: { status: "read" } },
      );

      // If no documents were updated, halt to prevent unnecessary WebSocket emits
      if (result.modifiedCount === 0) return;

      // 2. Alert the original sender so their UI updates to double blue checkmarks
      const senderSocketId = await redisClient.get(`user:${senderId}`);
      if (senderSocketId) {
        io.to(senderSocketId).emit("receipts_updated", {
          chatId,
          readBy: readerId,
        });
      }
    } catch (error) {
      console.error(`Socket Error (mark_messages_read):`, error.message);
    }
  });
};

module.exports = { registerChatHandlers };
