const Message = require("../models/Message");
const Chat = require("../models/Chat");
const redisClient = require("../config/redis");
const { getIO } = require("../sockets/index"); // Centralized socket getter

/**
 * Phase 3 + Real-Time Sync: Resolves pending shadow messages for a newly registered user
 * @param {ObjectId} newUserId - The MongoDB ObjectId of the user who just registered
 * @param {String} userEmail - The email address they registered with
 */
const resolveShadowMessages = async (newUserId, userEmail) => {
  try {
    const formattedEmail = userEmail.toLowerCase().trim();

    // 1. Find all messages left for this email to identify the unique senders
    const pendingMessages = await Message.find({
      targetEmail: formattedEmail,
      status: "pending_registration",
    }).select("senderId");

    if (pendingMessages.length === 0) return;

    // Extract unique sender IDs to group updates by chat
    const uniqueSenderIds = [
      ...new Set(pendingMessages.map((msg) => msg.senderId.toString())),
    ];

    // 2. Process each sender to resolve database states and trigger real-time events
    for (const senderId of uniqueSenderIds) {
      // Ensure a structured Chat container exists between the two users
      let existingChat = await Chat.findOne({
        participants: { $all: [senderId, newUserId] },
      });

      let chatId;
      if (!existingChat) {
        const newChat = await Chat.create({
          participants: [senderId, newUserId],
        });
        chatId = newChat._id;
      } else {
        chatId = existingChat._id;
      }

      // Bulk update all shadow messages from this specific sender to the new user
      await Message.updateMany(
        {
          targetEmail: formattedEmail,
          status: "pending_registration",
          senderId: senderId,
        },
        {
          $set: {
            receiverId: newUserId,
            status: "delivered",
            chatId: chatId,
            targetEmail: null, // Clear out temporary email mapping
          },
        },
      );

      // Update the Chat parent container with the reference to the latest resolved message
      const latestMessage = await Message.findOne({ chatId }).sort({
        createdAt: -1,
      });
      if (latestMessage) {
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: latestMessage._id,
        });
      }

      // 3. THE REAL-TIME PUSH LAYER
      // Look up the sender's active connection string in RAM (O(1) complexity)
      const senderSocketId = await redisClient.get(`user:${senderId}`);

      if (senderSocketId) {
        const io = getIO();

        // Push an instant reactive payload down the active WebSocket pipeline
        io.to(senderSocketId).emit("shadow_resolved", {
          chatId: chatId,
          targetEmail: formattedEmail,
          resolvedWithUserId: newUserId,
          message: "Your pending invitation chat is now active.",
        });
      }
    }

    console.log(
      `Shadow resolution and real-time sync complete for ${formattedEmail}.`,
    );
  } catch (error) {
    console.error(
      `Shadow Resolution Pipeline Failure for ${userEmail}:`,
      error.message,
    );
    throw new Error(
      "Database or network synchronization failed during user resolution.",
    );
  }
};

module.exports = { resolveShadowMessages };
