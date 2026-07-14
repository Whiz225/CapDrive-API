const Chat = require("../models/Chat");
const Message = require("../models/Message");
const crypto = require("crypto");

// Encrypt message
function encryptMessage(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// Decrypt message
function decryptMessage(text, key) {
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Create chat
exports.createChat = async (participants, type = "direct") => {
  try {
    const chat = new Chat({
      participants,
      type,
      createdAt: new Date(),
    });

    await chat.save();
    return chat;
  } catch (error) {
    console.error("Create chat error:", error);
    throw error;
  }
};

// Send message
exports.sendMessage = async (chatId, sender, content, encryptionKey) => {
  try {
    // Encrypt message
    const encryptedContent = encryptMessage(content, encryptionKey);

    const message = new Message({
      chat: chatId,
      sender,
      content: encryptedContent,
      read: false,
      sentAt: new Date(),
    });

    await message.save();

    // Update chat last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: message.sentAt,
    });

    return message;
  } catch (error) {
    console.error("Send message error:", error);
    throw error;
  }
};

// Get chat messages
exports.getChatMessages = async (chatId, userId, page = 1, limit = 20) => {
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "firstName lastName email avatar")
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ chat: chatId });

    return {
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    console.error("Get chat messages error:", error);
    throw error;
  }
};

// Mark messages as read
exports.markAsRead = async (chatId, userId) => {
  try {
    await Message.updateMany(
      { chat: chatId, sender: { $ne: userId }, read: false },
      { read: true, readAt: new Date() }
    );
  } catch (error) {
    console.error("Mark as read error:", error);
    throw error;
  }
};
