const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    repliedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ chat: 1, sentAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ read: 1 });

module.exports = mongoose.model("Message", messageSchema);
