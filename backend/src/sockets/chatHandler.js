const Message = require("../models/Message");
const Chat = require("../models/Chat");
const redisClient = require("../config/redis");

const registerChatHandlers = (io, socket) => {
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

      const chat = await Chat.findOne({ _id: chatId, participants: senderId });
      if (!chat) {
        return callback({
          success: false,
          error: "Unauthorized to post in this chat.",
        });
      }

      const newMessage = await Message.create({
        chatId,
        senderId,
        receiverId,
        messageType: messageType || "text",
        text: text || "",
        mediaUrl: mediaUrl || null,
        status: "delivered",
      });

      chat.lastMessage = newMessage._id;
      await chat.save();

      const populatedMessage = await Message.findById(newMessage._id).populate(
        "senderId",
        "username profilePic email",
      );

      const receiverSocketId = await redisClient.get(`user:${receiverId}`);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "receive_message",
          populatedMessage || newMessage,
        );
      }

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

  socket.on("typing", async ({ receiverId, chatId, isTyping }) => {
    try {
      const receiverSocketId = await redisClient.get(`user:${receiverId}`);
      if (receiverSocketId) {
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

  socket.on("mark_messages_read", async ({ chatId, senderId }) => {
    try {
      const readerId = socket.userId;

      const result = await Message.updateMany(
        { chatId, senderId, receiverId: readerId, status: "delivered" },
        { $set: { status: "read" } },
      );

      if (result.modifiedCount === 0) return;

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
