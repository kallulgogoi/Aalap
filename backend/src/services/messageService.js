const Message = require("../models/Message");
const Chat = require("../models/Chat");
const redisClient = require("../config/redis");
const { getIO } = require("../sockets/index");

/**
 
 * @param {ObjectId} newUserId 
 * @param {String} userEmail
 */
const resolveShadowMessages = async (newUserId, userEmail) => {
  try {
    const formattedEmail = userEmail.toLowerCase().trim();

    const pendingMessages = await Message.find({
      targetEmail: formattedEmail,
      status: "pending_registration",
    }).select("senderId");

    if (pendingMessages.length === 0) return;

    const uniqueSenderIds = [
      ...new Set(pendingMessages.map((msg) => msg.senderId.toString())),
    ];

    for (const senderId of uniqueSenderIds) {
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
            targetEmail: null,
          },
        },
      );

      const latestMessage = await Message.findOne({ chatId }).sort({
        createdAt: -1,
      });
      if (latestMessage) {
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: latestMessage._id,
        });
      }

      const senderSocketId = await redisClient.get(`user:${senderId}`);

      if (senderSocketId) {
        const io = getIO();

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
