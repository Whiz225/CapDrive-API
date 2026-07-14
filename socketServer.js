const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

function createSocketServer(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    transports: ["websocket", "polling"],
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      );
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    // Authenticate user and join their room
    socket.on("authenticate", (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`🔐 User ${userId} authenticated`);
      }
    });

    // Join chat room
    socket.on("join-chat", (chatId) => {
      if (chatId) {
        socket.join(`chat_${chatId}`);
        console.log(`💬 User joined chat: ${chatId}`);
      }
    });

    // Leave chat room
    socket.on("leave-chat", (chatId) => {
      if (chatId) {
        socket.leave(`chat_${chatId}`);
        console.log(`💬 User left chat: ${chatId}`);
      }
    });

    // Send message
    socket.on("send-message", (data) => {
      if (data && data.chatId) {
        io.to(`chat_${data.chatId}`).emit("new-message", data);
        console.log(`📨 Message sent to chat: ${data.chatId}`);
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      if (data && data.chatId) {
        socket.to(`chat_${data.chatId}`).emit("user-typing", {
          userId: socket.user?.userId || socket.id,
          isTyping: data.isTyping,
        });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });

    // Error handler
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
}

module.exports = createSocketServer;
