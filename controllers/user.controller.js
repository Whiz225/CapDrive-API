const User = require("../models/User");
const Car = require("../models/Car");
const Booking = require("../models/Booking");
const Ride = require("../models/Ride");
const Chat = require("../models/Chat");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinary.service");

// Get user stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [favorites, bookings, rides, messages] = await Promise.all([
      User.findById(userId).select("favorites"),
      Booking.countDocuments({ user: userId }),
      Ride.countDocuments({ rider: userId }),
      Chat.countDocuments({ participants: userId }),
    ]);

    res.json({
      success: true,
      data: {
        favorites: favorites?.favorites?.length || 0,
        bookings: bookings || 0,
        rides: rides || 0,
        messages: messages || 0,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password -refreshToken");

    const [listings, favorites, bookings, rides] = await Promise.all([
      Car.countDocuments({ owner: userId }),
      user.favorites.length,
      Booking.countDocuments({ user: userId }),
      Ride.countDocuments({ rider: userId }),
    ]);

    const profile = {
      ...user.toObject(),
      stats: { listings, favorites, bookings, rides },
    };

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    delete updates.password;
    delete updates.role;
    delete updates.isEmailVerified;

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Complete Profile with Avatar (Single API Call)
exports.completeProfileWithAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Received request body:", req.body);

    // Parse the data from FormData
    let profileData;
    try {
      profileData = JSON.parse(req.body.data);
    } catch (e) {
      // If data is not JSON, use req.body directly (for non-FormData requests)
      profileData = req.body;
    }

    const {
      address,
      city,
      state,
      country,
      zipCode,
      role,
      companyName,
      companyAddress,
      dealerType,
      businessRegistration,
    } = profileData;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Handle avatar upload if present
    let avatarUrl = user.avatar;
    if (req.file) {
      // Upload new avatar
      const result = await uploadToCloudinary(req.file.buffer, "avatars");

      // Delete old avatar if exists
      if (user.avatar) {
        const publicId = user.avatar.split("/").pop().split(".")[0];
        try {
          await deleteFromCloudinary(`avatars/${publicId}`);
        } catch (error) {
          console.log("Error deleting old avatar:", error.message);
        }
      }
      avatarUrl = result.secure_url;
    }

    // Update profile fields
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.country = country || user.country || "Nigeria";
    user.zipCode = zipCode || user.zipCode;
    user.avatar = avatarUrl;

    // Update role if provided
    if (role) {
      user.role = role;
    }

    // If dealer, update dealer profile
    if (user.role === "dealer") {
      if (!user.dealerProfile) user.dealerProfile = {};
      user.dealerProfile.companyName =
        companyName || user.dealerProfile.companyName;
      user.dealerProfile.companyAddress =
        companyAddress || user.dealerProfile.companyAddress;
      user.dealerProfile.dealerType =
        dealerType || user.dealerProfile.dealerType;
      user.dealerProfile.businessRegistration =
        businessRegistration || user.dealerProfile.businessRegistration;
    }

    user.profileCompleted = true;
    await user.save();

    res.json({
      success: true,
      message: "Profile completed successfully",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          profileCompleted: user.profileCompleted,
          verificationSteps: user.verificationSteps,
        },
      },
    });
  } catch (error) {
    console.error("Complete profile with avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete profile",
      error: error.message,
    });
  }
};

// Update avatar (standalone - kept for backward compatibility)
exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(
      "Received avatar update request for user:",
      userId,
      "with file:",
      req.file
    );

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "avatars");

    const user = await User.findById(userId);
    if (user.avatar) {
      const publicId = user.avatar.split("/").pop().split(".")[0];
      await deleteFromCloudinary(`avatars/${publicId}`);
    }

    user.avatar = result.secure_url;
    await user.save();

    res.json({
      success: true,
      message: "Avatar updated successfully",
      data: { avatar: user.avatar },
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update avatar",
      error: error.message,
    });
  }
};

// Get user favorites
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate({
      path: "favorites",
      populate: {
        path: "owner",
        select: "firstName lastName email phone avatar dealerProfile",
      },
    });

    res.json({
      success: true,
      data: user.favorites,
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
      error: error.message,
    });
  }
};

// Get user bookings
exports.getBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate("car", "make model year price images location")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// Get user rides
exports.getRides = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { rider: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rides = await Ride.find(filter)
      .populate("driver", "firstName lastName email phone avatar")
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ride.countDocuments(filter);

    res.json({
      success: true,
      data: rides,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get rides error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rides",
      error: error.message,
    });
  }
};

// Get user messages
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({
      participants: userId,
      isActive: true,
    })
      .populate("participants", "firstName lastName email avatar")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    const unreadCount = await Chat.aggregate([
      { $match: { participants: userId } },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "chat",
          as: "messages",
        },
      },
      {
        $project: {
          unread: {
            $size: {
              $filter: {
                input: "$messages",
                as: "msg",
                cond: {
                  $and: [
                    { $ne: ["$$msg.sender", userId] },
                    { $eq: ["$$msg.read", false] },
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    const totalUnread = unreadCount.reduce((acc, curr) => acc + curr.unread, 0);

    res.json({
      success: true,
      data: {
        chats,
        unreadCount: totalUnread,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};
