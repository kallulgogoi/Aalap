const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // --- ROUTING & RELATIONSHIPS ---
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true, // Critical for fetching chat history instantly
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null indicates a pending Shadow Message
    },
    targetEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null, // Only populated if receiverId is null
    },

    // --- PAYLOAD (TEXT & MEDIA) ---
    messageType: {
      type: String,
      enum: ["text", "image", "document"],
      default: "text",
    },
    text: {
      type: String,
      default: "", // Text remains intact here even when isDeleted is true
    },
    mediaUrl: {
      type: String,
      default: null, // Stores the secure Cloudinary URL
    },
    publicId: {
      type: String,
      default: null, // Critical for the Garbage Collector to wipe Cloudinary files
    },

    // --- STATE & LIFECYCLE ---
    status: {
      type: String,
      enum: ["delivered", "read", "pending_registration"],
      default: "delivered",
    },
    isDeleted: {
      type: Boolean,
      default: false, // Flips to true on delete, false on undo
    },
    deletedAt: {
      type: Date,
      default: null, // Used by the nightly worker to permanently wipe after 24h
    },
  },
  {
    timestamps: true,
  },
);

// --- ENTERPRISE DATA INTEGRITY CHECK ---
// Runs on every save/update to ensure empty/broken messages never enter the database
messageSchema.pre("validate", function (next) {
  // 1. Text validation
  if (this.messageType === "text" && (!this.text || !this.text.trim())) {
    this.invalidate("text", "Text is required for a standard text message.");
  }

  // 2. Media validation
  if (
    (this.messageType === "image" || this.messageType === "document") &&
    !this.mediaUrl
  ) {
    this.invalidate(
      "mediaUrl",
      "A valid Cloudinary URL is required for media messages.",
    );
  }

  next();
});

// --- PRODUCTION INDEXES ---

// idx 1: Standard Chat Loading. Speeds up fetching a chat's history chronologically.
messageSchema.index({ chatId: 1, createdAt: -1 });

// idx 2: Shadow Architecture. Makes the O(1) pending email lookup lightning fast.
messageSchema.index(
  { targetEmail: 1, status: 1 },
  { partialFilterExpression: { status: "pending_registration" } },
);

// idx 3: Garbage Collection Optimization.
// Without this, your nightly worker would have to scan millions of messages one-by-one.
messageSchema.index(
  { isDeleted: 1, deletedAt: 1 },
  { partialFilterExpression: { isDeleted: true } },
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
