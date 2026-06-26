const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");
const redisClient = require("../config/redis");

// Fetch all chats for the logged-in user to render the sidebar
const fetchChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: { $in: [req.user._id] } })
      .populate("participants", "-password") // Get user details, exclude passwords
      .populate({
        path: "lastMessage",
        match: { isDeleted: false }, // Don't show deleted messages as the preview
      })
      .sort({ updatedAt: -1 }); // Newest chats at the top

    // For each chat, fetch unread messages count and participant online status
    const chatsWithMetadata = await Promise.all(
      chats.map(async (chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== req.user._id.toString()
        );

        let isOnline = false;
        if (otherParticipant) {
          const socketId = await redisClient.get(`user:${otherParticipant._id}`);
          isOnline = !!socketId;
        }

        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          receiverId: req.user._id,
          status: "delivered",
        });

        const chatObj = chat.toObject();
        chatObj.isOnline = isOnline;
        chatObj.unreadCount = unreadCount;
        return chatObj;
      })
    );

    res.status(200).json({ success: true, chats: chatsWithMetadata });
  } catch (error) {
    next(error);
  }
};

// Start a new 1-on-1 chat or return the existing one
const accessChat = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId)
      return res.status(400).json({ message: "Target User ID required." });

    let existingChat = await Chat.findOne({
      participants: { $all: [req.user._id, targetUserId] },
    }).populate("participants", "-password");

    if (existingChat) {
      return res.status(200).json({ success: true, chat: existingChat });
    }

    const newChat = await Chat.create({
      participants: [req.user._id, targetUserId],
    });
    const fullChat = await Chat.findById(newChat._id).populate(
      "participants",
      "-password",
    );

    res.status(201).json({ success: true, chat: fullChat });
  } catch (error) {
    next(error);
  }
};

module.exports = { fetchChats, accessChat };
