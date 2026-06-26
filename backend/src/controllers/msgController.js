const Message = require("../models/Message");
const Chat = require("../models/Chat");
const fs = require("fs");
const { uploadImage } = require("../services/cloudinary");
const { getChannel } = require("../config/rabbitmq");
const { getIO } = require("../sockets/index");
const redisClient = require("../config/redis");

// Fetch message history for the active chat window
const fetchMessages = async (req, res, next) => {
  try {
    // 1. Automatically mark all messages sent to this user in this chat as read
    const updateResult = await Message.updateMany(
      {
        chatId: req.params.chatId,
        receiverId: req.user._id,
        status: "delivered",
      },
      { $set: { status: "read" } },
    );

    // 2. THE FIX: If messages were updated during fetch, notify the sender via Socket.io
    if (updateResult.modifiedCount > 0) {
      const chat = await Chat.findById(req.params.chatId);
      if (chat) {
        // Find the original sender's ID
        const senderId = chat.participants.find(
          (p) => p.toString() !== req.user._id.toString(),
        );

        if (senderId) {
          const senderSocketId = await redisClient.get(`user:${senderId}`);
          if (senderSocketId) {
            getIO().to(senderSocketId).emit("receipts_updated", {
              chatId: req.params.chatId,
              readBy: req.user._id,
            });
          }
        }
      }
    }

    // 3. Fetch the newly updated messages to send to the receiver
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate("senderId", "username profilePic.url")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// Phase 1 of Shadow Architecture: Send an invite message
const sendShadowMessage = async (req, res, next) => {
  try {
    const { targetEmail, text } = req.body;

    if (!targetEmail?.trim()) {
      return res.status(400).json({ message: "Target email is required." });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "Message text is required." });
    }

    const normalizedEmail = targetEmail.toLowerCase().trim();

    if (normalizedEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({
        message: "You cannot send an invite to yourself.",
      });
    }

    // Save the pending message
    const shadowMsg = await Message.create({
      chatId: null, // No chat container exists yet
      senderId: req.user._id,
      receiverId: null,
      targetEmail: normalizedEmail,
      text: text.trim(),
      status: "pending_registration",
    });

    // Push task to RabbitMQ to email the unregistered user
    try {
      const channel = getChannel();
      channel.sendToQueue(
        "invite_queue",
        Buffer.from(
          JSON.stringify({
            toEmail: targetEmail,
            senderName: req.user.username,
          }),
        ),
      );
    } catch (mqError) {
      console.warn(
        "RabbitMQ unavailable, invite email skipped:",
        mqError.message,
      );
    }

    res.status(200).json({ success: true, message: shadowMsg });
  } catch (error) {
    next(error);
  }
};

// The Cloudinary File Upload Endpoint
const uploadMessageMedia = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file provided." });

    const result = await uploadImage(req.file.path, "chat_app_media");
    fs.unlinkSync(req.file.path); // Clean up local server

    res.status(200).json({
      success: true,
      mediaUrl: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// Soft Delete
const softDeleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, senderId: req.user._id },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!msg)
      return res
        .status(404)
        .json({ message: "Message not found or unauthorized." });

    if (msg.receiverId) {
      const receiverSocket = await redisClient.get(`user:${msg.receiverId}`);
      if (receiverSocket)
        getIO()
          .to(receiverSocket)
          .emit("message_deleted", { messageId: msg._id });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Undo Delete
const restoreMessage = async (req, res, next) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, senderId: req.user._id },
      { isDeleted: false, deletedAt: null },
      { new: true },
    );
    if (!msg) return res.status(404).json({ message: "Message not found." });

    if (msg.receiverId) {
      const receiverSocket = await redisClient.get(`user:${msg.receiverId}`);
      if (receiverSocket)
        getIO()
          .to(receiverSocket)
          .emit("message_restored", { messageId: msg._id, msg });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Send a message via REST (used by ChatArea for both ghost and existing chats)
const sendMessage = async (req, res, next) => {
  try {
    const { chatId, receiverId, content } = req.body;
    const senderId = req.user._id;
    let targetChatId = chatId;

    if (receiverId && receiverId.toString() === senderId.toString()) {
      return res.status(400).json({
        message: "You cannot send messages to yourself.",
      });
    }

    // Ghost chat flow: no chatId means this is a new conversation
    if (!targetChatId && receiverId) {
      // Find existing chat between these two users, or create one
      let chat = await Chat.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!chat) {
        chat = await Chat.create({
          participants: [senderId, receiverId],
        });
      }

      targetChatId = chat._id;
    }

    if (!targetChatId) {
      return res
        .status(400)
        .json({ message: "chatId or receiverId is required." });
    }

    // Verify the sender is a participant in this chat
    const chat = await Chat.findOne({
      _id: targetChatId,
      participants: senderId,
    });
    if (!chat) {
      return res
        .status(403)
        .json({ message: "Unauthorized to post in this chat." });
    }

    // Determine the receiverId from chat participants if not provided
    const resolvedReceiverId =
      receiverId ||
      chat.participants.find((p) => p.toString() !== senderId.toString());

    if (
      resolvedReceiverId &&
      resolvedReceiverId.toString() === senderId.toString()
    ) {
      return res.status(400).json({
        message: "You cannot send messages to yourself.",
      });
    }

    // Create the message
    const newMessage = await Message.create({
      chatId: targetChatId,
      senderId,
      receiverId: resolvedReceiverId,
      text: content || "",
      mediaUrl: req.body.mediaUrl || null, // <-- ADD THIS
      messageType: req.body.mediaUrl ? "image" : "text", // <-- DYNAMIC TYPE
      status: "delivered",
    });

    // Update lastMessage on the chat for sidebar preview
    chat.lastMessage = newMessage._id;
    await chat.save();

    // Push to receiver via WebSocket if they're online
    try {
      if (resolvedReceiverId) {
        const receiverSocketId = await redisClient.get(
          `user:${resolvedReceiverId}`,
        );
        if (receiverSocketId) {
          getIO().to(receiverSocketId).emit("receive_message", newMessage);
        }
      }
    } catch (socketErr) {
      console.warn("WebSocket push failed:", socketErr.message);
    }

    res
      .status(201)
      .json({ success: true, message: newMessage, chatId: targetChatId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  fetchMessages,
  sendMessage,
  sendShadowMessage,
  uploadMessageMedia,
  softDeleteMessage,
  restoreMessage,
};
