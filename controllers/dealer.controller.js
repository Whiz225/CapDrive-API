const Car = require("../models/Car");
const User = require("../models/User");
const Booking = require("../models/Booking");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinary.service");
const { redisClient } = require("../config/redis");

// Get dealer stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
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

    const user = await User.findById(userId);
    const subscription = user.dealerProfile?.subscription || {
      plan: "free",
      features: { maxListings: 5 },
    };

    const [totalListings, totalViews, totalInquiries, revenue] =
      await Promise.all([
        Car.countDocuments({ owner: userId }),
        Car.aggregate([
          { $match: { owner: userId } },
          { $group: { _id: null, total: { $sum: "$viewCount" } } },
        ]),
        Booking.countDocuments({
          car: { $in: await Car.find({ owner: userId }).distinct("_id") },
        }),
        Car.aggregate([
          { $match: { owner: userId, status: "sold" } },
          { $group: { _id: null, total: { $sum: "$price" } } },
        ]),
      ]);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - 7);
    const prevTotalListings = await Car.countDocuments({
      owner: userId,
      createdAt: { $lt: startDate, $gte: prevStartDate },
    });

    const stats = {
      totalListings: totalListings || 0,
      totalViews: totalViews[0]?.total || 0,
      totalInquiries: totalInquiries || 0,
      revenue: revenue[0]?.total || 0,
      listingsChange:
        totalListings > 0 && prevTotalListings > 0
          ? `${(
              ((totalListings - prevTotalListings) / prevTotalListings) *
              100
            ).toFixed(0)}%`
          : "+0%",
      subscription: {
        plan: subscription.plan,
        endDate: subscription.endDate,
        isActive: subscription.isActive,
        features: subscription.features,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get dealer stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
};

// Get dealer listings
exports.getListings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      search,
      status,
      sort = "-createdAt",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { owner: userId };
    if (status) filter.status = status;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Car.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Car.countDocuments(filter);

    res.json({
      success: true,
      data: listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get dealer listings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
      error: error.message,
    });
  }
};

// Get single listing
exports.getListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const listing = await Car.findById(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Check if user owns this listing
    if (listing.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this listing",
      });
    }

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error("Get listing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch listing",
      error: error.message,
    });
  }
};

// Create listing
exports.createListing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const carData = req.body;

    const user = await User.findById(userId);
    const maxListings =
      user.dealerProfile?.subscription?.features?.maxListings || 5;
    const currentListings = await Car.countDocuments({ owner: userId });

    if (currentListings >= maxListings) {
      return res.status(403).json({
        success: false,
        message: `You have reached your listing limit (${maxListings}). Please upgrade your subscription.`,
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const result = await uploadToCloudinary(req.files[i].buffer, "cars");
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
          isMain: i === 0,
        });
      }
    }

    const car = new Car({
      ...carData,
      owner: userId,
      images,
      isDealer: true,
    });

    await car.save();

    if (redisClient) {
      await redisClient.flushall();
    }

    res.status(201).json({
      success: true,
      message: "Car listed successfully",
      data: car,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create listing",
      error: error.message,
    });
  }
};

// Update listing
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    if (car.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this listing",
      });
    }

    if (req.files && req.files.length > 0) {
      for (const image of car.images) {
        await deleteFromCloudinary(image.publicId);
      }

      const images = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await uploadToCloudinary(req.files[i].buffer, "cars");
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
          isMain: i === 0,
        });
      }
      updates.images = images;
    }

    const updatedCar = await Car.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (redisClient) {
      await redisClient.flushall();
    }

    res.json({
      success: true,
      message: "Listing updated successfully",
      data: updatedCar,
    });
  } catch (error) {
    console.error("Update listing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update listing",
      error: error.message,
    });
  }
};

// Delete listing
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    if (car.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this listing",
      });
    }

    for (const image of car.images) {
      await deleteFromCloudinary(image.publicId);
    }

    await car.deleteOne();

    if (redisClient) {
      await redisClient.flushall();
    }

    res.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("Delete listing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete listing",
      error: error.message,
    });
  }
};

// Get dealer inquiries
exports.getInquiries = async (req, res) => {
  try {
    const userId = req.user.userId;

    const carIds = await Car.find({ owner: userId }).distinct("_id");

    const inquiries = await Booking.find({ car: { $in: carIds } })
      .populate("user", "firstName lastName email phone avatar")
      .populate("car", "make model year price images")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    console.error("Get inquiries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
      error: error.message,
    });
  }
};

// Get subscription info
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    res.json({
      success: true,
      data: user.dealerProfile?.subscription || {
        plan: "free",
        isActive: false,
        features: { maxListings: 5 },
      },
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription",
      error: error.message,
    });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan, paymentReference } = req.body;

    const plans = {
      free: {
        maxListings: 5,
        featuredListings: 0,
        prioritySupport: false,
        analytics: false,
      },
      basic: {
        maxListings: 20,
        featuredListings: 5,
        prioritySupport: false,
        analytics: false,
      },
      premium: {
        maxListings: 50,
        featuredListings: 15,
        prioritySupport: true,
        analytics: true,
      },
      enterprise: {
        maxListings: 200,
        featuredListings: 50,
        prioritySupport: true,
        analytics: true,
      },
    };

    const user = await User.findById(userId);
    if (!user.dealerProfile) {
      user.dealerProfile = {};
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    user.dealerProfile.subscription = {
      plan,
      startDate: new Date(),
      endDate,
      isActive: true,
      features: plans[plan] || plans.free,
    };

    await user.save();

    res.json({
      success: true,
      message: "Subscription updated successfully",
      data: user.dealerProfile.subscription,
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription",
      error: error.message,
    });
  }
};
