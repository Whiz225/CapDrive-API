const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const multer = require("multer");
const {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  deleteMessage,
  reactToMessage,
  markChatAsRead,
  typingIndicator,
} = require("../controllers/chat.controller");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("application/pdf") ||
      file.mimetype.startsWith("application/msword") ||
      file.mimetype.startsWith("application/vnd.openxmlformats-officedocument")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
});

router.use(authenticate);

// Chat management
router.post("/create", getOrCreateChat);
router.get("/chats", getUserChats);
router.get("/:chatId/messages", getChatMessages);
router.post("/:chatId/messages", upload.single("file"), sendMessage);
router.delete("/messages/:messageId", deleteMessage);
router.post("/messages/:messageId/react", reactToMessage);
router.post("/:chatId/read", markChatAsRead);
router.post("/typing", typingIndicator);

module.exports = router;
