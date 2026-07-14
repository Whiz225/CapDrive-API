const User = require("../models/User");
const Car = require("../models/Car");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// Get admin stats
exports.getStats = async (req, res) => {
  try {
    const { range = "week" } = req.query;

    const now = new Date();
    let startDate;
    switch (range) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "quarter":
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const [
      totalUsers,
      totalCars,
      totalRides,
      revenue,
      activeDealers,
      pendingApprovals,
    ] = await Promise.all([
      User.countDocuments(),
      Car.countDocuments(),
      Ride.countDocuments(),
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.countDocuments({ role: "dealer", isActive: true }),
      Car.countDocuments({ status: "pending" }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalCars: totalCars || 0,
        totalRides: totalRides || 0,
        revenue: revenue[0]?.total || 0,
        activeDealers: activeDealers || 0,
        pendingApprovals: pendingApprovals || 0,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
};

// Get users
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent role changes to super_admin
    if (updates.role === "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot assign super_admin role",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete super_admin",
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Get cars (admin view)
exports.getCars = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cars = await Car.find(filter)
      .populate("owner", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Car.countDocuments(filter);

    res.json({
      success: true,
      data: cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get cars error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cars",
      error: error.message,
    });
  }
};

// Update car (admin)
exports.updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const car = await Car.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    res.json({
      success: true,
      message: "Car updated successfully",
      data: car,
    });
  } catch (error) {
    console.error("Update car error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update car",
      error: error.message,
    });
  }
};

// Delete car (admin)
exports.deleteCar = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    // Delete images from cloudinary
    for (const image of car.images) {
      await deleteFromCloudinary(image.publicId);
    }

    await car.deleteOne();

    res.json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    console.error("Delete car error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete car",
      error: error.message,
    });
  }
};

// Get rides (admin)
exports.getRides = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rides = await Ride.find(filter)
      .populate("rider", "firstName lastName email phone")
      .populate("driver", "firstName lastName email phone")
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

// Get payments (admin)
exports.getPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
  try {
    // Get recent activities from various collections
    const [newUsers, newCars, newRides, newBookings] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("firstName lastName email createdAt"),
      Car.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("owner", "firstName lastName"),
      Ride.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("rider", "firstName lastName"),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "firstName lastName")
        .populate("car", "make model"),
    ]);

    const activities = [];

    newUsers.forEach((user) => {
      activities.push({
        description: `${user.firstName} ${user.lastName} joined the platform`,
        createdAt: user.createdAt,
        type: "user",
      });
    });

    newCars.forEach((car) => {
      activities.push({
        description: `${car.owner?.firstName} ${car.owner?.lastName} listed a ${car.make} ${car.model}`,
        createdAt: car.createdAt,
        type: "car",
      });
    });

    newRides.forEach((ride) => {
      activities.push({
        description: `${ride.rider?.firstName} ${ride.rider?.lastName} requested a ride`,
        createdAt: ride.createdAt,
        type: "ride",
      });
    });

    newBookings.forEach((booking) => {
      activities.push({
        description: `${booking.user?.firstName} ${booking.user?.lastName} booked a ${booking.car?.make} ${booking.car?.model}`,
        createdAt: booking.createdAt,
        type: "booking",
      });
    });

    // Sort by date
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: activities.slice(0, 10),
    });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};
