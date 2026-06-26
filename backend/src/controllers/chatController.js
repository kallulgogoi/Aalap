const Message = require("../models/Message");
const Chat = require("../models/Chat");
const redisClient = require("../config/redis");
const { generateDefaultAvatar } = require("../utils/avatar");

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

    // Pending shadow invites the current user has sent to unregistered emails
    const pendingShadowMessages = await Message.find({
      senderId: req.user._id,
      status: "pending_registration",
      chatId: null,
    }).sort({ createdAt: -1 });

    const pendingByEmail = new Map();
    pendingShadowMessages.forEach((msg) => {
      if (msg.targetEmail && !pendingByEmail.has(msg.targetEmail)) {
        pendingByEmail.set(msg.targetEmail, msg);
      }
    });

    const pendingInviteChats = Array.from(pendingByEmail.entries()).map(
      ([email, msg]) => {
        const displayName = email.split("@")[0];
        return {
          _id: `pending_${email}`,
          isPendingInvite: true,
          targetEmail: email,
          chatName: displayName,
          avatar: generateDefaultAvatar(displayName, email),
          latestMessage: msg,
          participants: [req.user._id],
          isOnline: false,
          unreadCount: 0,
          updatedAt: msg.createdAt,
        };
      },
    );

    const allChats = [...chatsWithMetadata, ...pendingInviteChats].sort(
      (a, b) =>
        new Date(b.latestMessage?.createdAt || b.updatedAt || 0) -
        new Date(a.latestMessage?.createdAt || a.updatedAt || 0),
    );

    res.status(200).json({ success: true, chats: allChats });
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

    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot start a chat with yourself.",
      });
    }

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
