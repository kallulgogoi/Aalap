const Message = require("../models/Message");
const Chat = require("../models/Chat");
const fs = require("fs");
const { uploadImage } = require("../services/cloudinary");
const { getChannel } = require("../config/rabbitmq");
const { getIO } = require("../sockets/index");
const redisClient = require("../config/redis");

const fetchMessages = async (req, res, next) => {
  try {
    const updateResult = await Message.updateMany(
      {
        chatId: req.params.chatId,
        receiverId: req.user._id,
        status: "delivered",
      },
      { $set: { status: "read" } },
    );

    if (updateResult.modifiedCount > 0) {
      const chat = await Chat.findById(req.params.chatId);
      if (chat) {
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

    const { limit = 100, before } = req.query;
    const query = { chatId: req.params.chatId };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate("senderId", "username profilePic.url")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    messages.reverse();

    let hasMore = false;
    if (messages.length > 0) {
      const oldestMessageDate = messages[0].createdAt;
      const count = await Message.countDocuments({
        chatId: req.params.chatId,
        createdAt: { $lt: oldestMessageDate },
      });
      hasMore = count > 0;
    }

    res.status(200).json({ success: true, messages, hasMore });
  } catch (error) {
    next(error);
  }
};

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

    const shadowMsg = await Message.create({
      chatId: null,
      senderId: req.user._id,
      receiverId: null,
      targetEmail: normalizedEmail,
      text: text.trim(),
      status: "pending_registration",
    });

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

const uploadMessageMedia = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file provided." });

    const result = await uploadImage(req.file.path, "chat_app_media");
    fs.unlinkSync(req.file.path);

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

    if (!targetChatId && receiverId) {
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

    const chat = await Chat.findOne({
      _id: targetChatId,
      participants: senderId,
    });
    if (!chat) {
      return res
        .status(403)
        .json({ message: "Unauthorized to post in this chat." });
    }

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

    const newMessage = await Message.create({
      chatId: targetChatId,
      senderId,
      receiverId: resolvedReceiverId,
      text: content || "",
      mediaUrl: req.body.mediaUrl || null,
      messageType: req.body.mediaUrl ? "image" : "text",
      status: "delivered",
    });

    chat.lastMessage = newMessage._id;
    await chat.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "username profilePic email",
    );

    try {
      if (resolvedReceiverId) {
        const receiverSocketId = await redisClient.get(
          `user:${resolvedReceiverId}`,
        );
        if (receiverSocketId) {
          getIO()
            .to(receiverSocketId)
            .emit("receive_message", populatedMessage || newMessage);
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
