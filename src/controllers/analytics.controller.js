const User = require("../models/User");
const Car = require("../models/Car");
const Ride = require("../models/Ride");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// Get dashboard analytics (Admin)
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { range = "month" } = req.query;

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
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get aggregated data
    const [
      totalUsers,
      totalCars,
      totalRides,
      totalBookings,
      revenue,
      usersGrowth,
      carsGrowth,
      ridesGrowth,
    ] = await Promise.all([
      User.countDocuments(),
      Car.countDocuments(),
      Ride.countDocuments(),
      Booking.countDocuments(),
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Car.countDocuments({ createdAt: { $gte: startDate } }),
      Ride.countDocuments({ createdAt: { $gte: startDate } }),
    ]);

    // Get daily data for charts
    const dailyData = await Payment.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCars,
          totalRides,
          totalBookings,
          revenue: revenue[0]?.total || 0,
          growth: {
            users: usersGrowth,
            cars: carsGrowth,
            rides: ridesGrowth,
          },
        },
        daily: dailyData,
        period: range,
      },
    });
  } catch (error) {
    console.error("Get dashboard analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};

// Get car analytics (Admin)
exports.getCarAnalytics = async (req, res) => {
  try {
    const { range = "month" } = req.query;

    // Get car statistics
    const [totalCars, availableCars, soldCars, popularMakes, avgPrice] =
      await Promise.all([
        Car.countDocuments(),
        Car.countDocuments({ status: "available" }),
        Car.countDocuments({ status: "sold" }),
        Car.aggregate([
          { $group: { _id: "$make", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        Car.aggregate([{ $group: { _id: null, avg: { $avg: "$price" } } }]),
      ]);

    res.json({
      success: true,
      data: {
        total: totalCars,
        available: availableCars,
        sold: soldCars,
        popularMakes,
        avgPrice: avgPrice[0]?.avg || 0,
      },
    });
  } catch (error) {
    console.error("Get car analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch car analytics",
      error: error.message,
    });
  }
};

// Get ride analytics (Admin)
exports.getRideAnalytics = async (req, res) => {
  try {
    const { range = "month" } = req.query;

    const [totalRides, completedRides, cancelledRides, avgFare] =
      await Promise.all([
        Ride.countDocuments(),
        Ride.countDocuments({ status: "completed" }),
        Ride.countDocuments({ status: "cancelled" }),
        Ride.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, avg: { $avg: "$fare.total" } } },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        total: totalRides,
        completed: completedRides,
        cancelled: cancelledRides,
        avgFare: avgFare[0]?.avg || 0,
      },
    });
  } catch (error) {
    console.error("Get ride analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ride analytics",
      error: error.message,
    });
  }
};

// Get user analytics (Admin)
exports.getUserAnalytics = async (req, res) => {
  try {
    const [totalUsers, activeUsers, dealerUsers, userGrowth] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: "dealer" }),
        User.aggregate([
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 12 },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        dealers: dealerUsers,
        growth: userGrowth,
      },
    });
  } catch (error) {
    console.error("Get user analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
      error: error.message,
    });
  }
};

// Get revenue analytics (Admin)
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { range = "month" } = req.query;

    const [totalRevenue, thisMonthRevenue, lastMonthRevenue, revenueByMethod] =
      await Promise.all([
        Payment.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          { $match: { status: "completed" } },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" },
              },
              total: { $sum: "$amount" },
            },
          },
          { $sort: { "_id.year": -1, "_id.month": -1 } },
          { $limit: 1 },
        ]),
        Payment.aggregate([
          { $match: { status: "completed" } },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" },
              },
              total: { $sum: "$amount" },
            },
          },
          { $sort: { "_id.year": -1, "_id.month": -1 } },
          { $skip: 1 },
          { $limit: 1 },
        ]),
        Payment.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } },
        ]),
      ]);

    const revenue = totalRevenue[0]?.total || 0;
    const thisMonth = thisMonthRevenue[0]?.total || 0;
    const lastMonth = lastMonthRevenue[0]?.total || 0;
    const growth =
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    res.json({
      success: true,
      data: {
        total: revenue,
        thisMonth,
        lastMonth,
        growth: growth.toFixed(2),
        byMethod: revenueByMethod,
      },
    });
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error: error.message,
    });
  }
};

// Get dealer analytics (Dealer)
exports.getDealerAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { range = "month" } = req.query;

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
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const [
      totalListings,
      activeListings,
      totalViews,
      totalInquiries,
      totalBookings,
      revenue,
    ] = await Promise.all([
      Car.countDocuments({ owner: userId }),
      Car.countDocuments({ owner: userId, status: "available" }),
      Car.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: null, total: { $sum: "$viewCount" } } },
      ]),
      Booking.countDocuments({
        car: { $in: await Car.find({ owner: userId }).distinct("_id") },
      }),
      Booking.countDocuments({
        car: { $in: await Car.find({ owner: userId }).distinct("_id") },
        status: "confirmed",
      }),
      Car.aggregate([
        { $match: { owner: userId, status: "sold" } },
        { $group: { _id: null, total: { $sum: "$price" } } },
      ]),
    ]);

    // Get listing performance over time
    const performance = await Car.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          views: { $sum: "$viewCount" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalListings,
          activeListings,
          totalViews: totalViews[0]?.total || 0,
          totalInquiries,
          totalBookings,
          revenue: revenue[0]?.total || 0,
        },
        performance,
        period: range,
      },
    });
  } catch (error) {
    console.error("Get dealer analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dealer analytics",
      error: error.message,
    });
  }
};
