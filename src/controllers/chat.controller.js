const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const { encryptMessage, decryptMessage } = require("../services/chat.service");

// Get or create chat
exports.getOrCreateChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant ID is required",
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] },
      type: "direct",
      isActive: true,
    });

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [userId, participantId],
        type: "direct",
      });
      await chat.save();
    }

    // Populate participants
    await chat.populate("participants", "firstName lastName email avatar");

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Get or create chat error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get or create chat",
      error: error.message,
    });
  }
};

// Get user's chats
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({
      participants: userId,
      isActive: true,
    })
      .populate("participants", "firstName lastName email avatar")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    console.error("Get user chats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
      error: error.message,
    });
  }
};

// Get chat messages
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this chat",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ chat: chatId, isDeleted: false })
      .populate("sender", "firstName lastName email avatar")
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      chat: chatId,
      isDeleted: false,
    });

    // Mark messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get chat messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId, content, type = "text", repliedTo } = req.body;

    if (!content && type === "text") {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Check if chat exists and user is part of it
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      isActive: true,
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: "Chat not found or you are not a participant",
      });
    }

    // Handle file uploads if type is image or file
    let fileData = {};
    if (req.file && (type === "image" || type === "file")) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, "chat");
      fileData = {
        fileUrl: result.secure_url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      };
    }

    const message = new Message({
      chat: chatId,
      sender: userId,
      content,
      type,
      ...fileData,
      repliedTo: repliedTo || null,
      sentAt: new Date(),
    });

    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: message.sentAt,
    });

    // Populate sender
    await message.populate("sender", "firstName lastName email avatar");

    // Emit via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`chat_${chatId}`).emit("new-message", message);
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    message.isDeleted = true;
    await message.save();

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

// React to message
exports.reactToMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === userId
    );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Remove reaction if same emoji
        message.reactions = message.reactions.filter(
          (r) => r.user.toString() !== userId
        );
      } else {
        // Update reaction
        existingReaction.emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("React to message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to react to message",
      error: error.message,
    });
  }
};

// Mark chat as read
exports.markChatAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: "Chat marked as read",
    });
  } catch (error) {
    console.error("Mark chat as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark chat as read",
      error: error.message,
    });
  }
};

// Typing indicator
exports.typingIndicator = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId, isTyping } = req.body;

    const io = req.app.get("io");
    if (io) {
      io.to(`chat_${chatId}`).emit("user-typing", {
        userId,
        isTyping,
      });
    }

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Typing indicator error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send typing indicator",
      error: error.message,
    });
  }
};
