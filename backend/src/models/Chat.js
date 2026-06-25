const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Storing the latest message here makes rendering the sidebar extremely fast
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// idx: Allows extremely fast fetching of all chats a specific user is a part of
chatSchema.index({ participants: 1 });

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
