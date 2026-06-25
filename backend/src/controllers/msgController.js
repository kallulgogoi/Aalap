const Message = require("../models/Message");
const fs = require("fs");
const { uploadImage } = require("../services/cloudinary");
const { getChannel } = require("../config/rabbitmq");
const { getIO } = require("../sockets/index");
const redisClient = require("../config/redis");

// Fetch message history for the active chat window
const fetchMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate("senderId", "username profilePic.url")
      .sort({ createdAt: 1 }); // Oldest to newest (top to bottom reading)

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// Phase 1 of Shadow Architecture: Send an invite message
const sendShadowMessage = async (req, res, next) => {
  try {
    const { targetEmail, text } = req.body;

    // Save the pending message
    const shadowMsg = await Message.create({
      chatId: null, // No chat container exists yet
      senderId: req.user._id,
      receiverId: null,
      targetEmail: targetEmail.toLowerCase(),
      text,
      status: "pending_registration",
    });

    // Push task to RabbitMQ to email the unregistered user
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

module.exports = {
  fetchMessages,
  sendShadowMessage,
  uploadMessageMedia,
  softDeleteMessage,
  restoreMessage,
};
