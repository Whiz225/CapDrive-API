const User = require("../models/User");
const {
  sendPushNotification,
  sendEmail,
} = require("../services/notification.service");

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, read } = req.query;

    const user = await User.findById(userId);
    let notifications = user.notifications || [];

    // Filter by read status
    if (read !== undefined) {
      const isRead = read === "true";
      notifications = notifications.filter((n) => n.read === isRead);
    }

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = notifications.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.length,
        pages: Math.ceil(notifications.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const user = await User.findById(userId);
    const notification = user.notifications.id(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.read = true;
    await user.save();

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark as read",
      error: error.message,
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    user.notifications.forEach((n) => (n.read = true));
    await user.save();

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all as read",
      error: error.message,
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const user = await User.findById(userId);
    user.notifications = user.notifications.filter(
      (n) => n._id.toString() !== id
    );
    await user.save();

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const unreadCount = user.notifications?.filter((n) => !n.read).length || 0;

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

// Send test notification
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, message, type = "info" } = req.body;

    // Add to user's notifications
    const user = await User.findById(userId);
    user.notifications.push({
      type,
      title: title || "Test Notification",
      message: message || "This is a test notification",
      read: false,
    });
    await user.save();

    // Send push notification
    await sendPushNotification(userId, {
      title: title || "Test Notification",
      body: message || "This is a test notification",
    });

    res.json({
      success: true,
      message: "Test notification sent",
    });
  } catch (error) {
    console.error("Send test notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
      error: error.message,
    });
  }
};
