// backend/src/utils/cleanupService.js

const cron = require("node-cron");
const User = require("./models/User");
const Car = require("./models/Car");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");

// Clean up expired verification tokens
const cleanupExpiredTokens = async () => {
  try {
    const result = await User.updateMany(
      {
        $or: [
          { emailVerificationExpires: { $lt: new Date() } },
          { resetPasswordExpires: { $lt: new Date() } },
        ],
      },
      {
        $set: {
          emailVerificationToken: null,
          emailVerificationExpires: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      }
    );
    console.log(
      `Cleaned up expired tokens: ${result.modifiedCount} users updated`
    );
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  }
};

// Clean up pending bookings older than 7 days
const cleanupPendingBookings = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const result = await Booking.deleteMany({
      status: "pending",
      createdAt: { $lt: cutoffDate },
    });
    console.log(`Cleaned up ${result.deletedCount} stale pending bookings`);
  } catch (error) {
    console.error("Error cleaning up pending bookings:", error);
  }
};

// Clean up failed payments older than 30 days
const cleanupFailedPayments = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await Payment.deleteMany({
      status: "failed",
      createdAt: { $lt: cutoffDate },
    });
    console.log(`Cleaned up ${result.deletedCount} failed payments`);
  } catch (error) {
    console.error("Error cleaning up failed payments:", error);
  }
};

// Run cleanup tasks
const runCleanup = async () => {
  console.log("Running cleanup tasks...");
  await cleanupExpiredTokens();
  await cleanupPendingBookings();
  await cleanupFailedPayments();
  console.log("Cleanup tasks completed.");
};

// Schedule cleanup tasks
if (process.env.NODE_ENV !== "test") {
  // Run every hour
  cron.schedule("0 * * * *", runCleanup);

  // Run once on startup
  runCleanup();
}

module.exports = { runCleanup };
