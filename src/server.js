const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");
const createSocketServer = require("./socketServer");

// Database connection
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ DB connection successful!"))
  .catch((err) => {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  });

// Create server
const server = http.createServer(app);

// Set trust proxy for Render
app.set("trust proxy", 1);

const PORT = process.env.PORT || 8000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 App running on port ${PORT}...`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Create Socket.IO server
const io = createSocketServer(server);

// Store io instance in app for access in controllers
app.set("io", io);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("📴 Received shutdown signal, closing server...");

  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed.");

    if (io) {
      io.close(() => {
        console.log("✅ Socket.IO server closed.");
      });
    }

    server.close(() => {
      console.log("✅ HTTP server closed.");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error(
        "❌ Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION!", err);
  gracefulShutdown();
});

process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED REJECTION!", err);
  gracefulShutdown();
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully");
  gracefulShutdown();
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received. Shutting down gracefully");
  gracefulShutdown();
});

module.exports = { app, server, io };
