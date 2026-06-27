const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null, // null for shadow messages
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for pending Shadow Message
    },
    targetEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "document"],
      default: "text",
    },
    text: {
      type: String,
      default: "",
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    publicId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["delivered", "read", "pending_registration"],
      default: "delivered",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.pre("validate", function () {
  if (this.messageType === "text" && (!this.text || !this.text.trim())) {
    this.invalidate("text", "Text is required for a standard text message.");
  }

  if (
    (this.messageType === "image" || this.messageType === "document") &&
    !this.mediaUrl
  ) {
    this.invalidate(
      "mediaUrl",
      "A valid Cloudinary URL is required for media messages.",
    );
  }
});

messageSchema.index({ chatId: 1, createdAt: -1 });

messageSchema.index(
  { targetEmail: 1, status: 1 },
  { partialFilterExpression: { status: "pending_registration" } },
);

messageSchema.index(
  { isDeleted: 1, deletedAt: 1 },
  { partialFilterExpression: { isDeleted: true } },
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
