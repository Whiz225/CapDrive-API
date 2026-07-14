const Ride = require("../models/Ride");
const User = require("../models/User");
const { sendPushNotification } = require("../services/notification.service");
const { redisClient } = require("../config/redis");

// Request a ride
exports.requestRide = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rideData = req.body;

    // Calculate fare
    const fare = await calculateFare(rideData);

    const ride = new Ride({
      ...rideData,
      rider: userId,
      fare,
      status: "pending",
      requestedAt: new Date(),
    });

    await ride.save();

    // Find nearby drivers (simplified)
    const nearbyDrivers = await findNearbyDrivers(rideData.pickup.coordinates);

    // Notify drivers
    for (const driver of nearbyDrivers) {
      await sendPushNotification(driver._id, {
        title: "New Ride Request",
        body: `New ride request nearby`,
        data: { rideId: ride._id },
      });
    }

    res.status(201).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    console.error("Request ride error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request ride",
      error: error.message,
    });
  }
};

// Calculate fare
async function calculateFare(rideData) {
  const basePrice = 300; // Base fare
  const distancePrice = 150; // Per km
  const timePrice = 50; // Per minute

  // Mock calculation - In production, use maps API
  const distance = rideData.distance?.value || 5;
  const duration = rideData.duration?.value || 15;

  const total = basePrice + distance * distancePrice + duration * timePrice;

  return {
    basePrice,
    distancePrice: distance * distancePrice,
    timePrice: duration * timePrice,
    surgeMultiplier: 1,
    total,
    currency: "NGN",
  };
}

// Find nearby drivers
async function findNearbyDrivers(coordinates) {
  // In production, use geospatial queries
  // For now, return some mock drivers
  return await User.find({
    role: "driver",
    isActive: true,
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat],
        },
        $maxDistance: 5000, // 5km
      },
    },
  }).limit(5);
}

// Accept ride
exports.acceptRide = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.userId;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Ride is no longer available",
      });
    }

    ride.driver = driverId;
    ride.status = "accepted";
    ride.acceptedAt = new Date();
    await ride.save();

    // Notify rider
    await sendPushNotification(ride.rider, {
      title: "Driver Found",
      body: "A driver has accepted your ride request",
      data: { rideId: ride._id },
    });

    // Notify driver
    await sendPushNotification(driverId, {
      title: "Ride Accepted",
      body: "You have accepted a ride request",
      data: { rideId: ride._id },
    });

    res.json({
      success: true,
      data: ride,
    });
  } catch (error) {
    console.error("Accept ride error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept ride",
      error: error.message,
    });
  }
};

// Update ride status
exports.updateRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;
    const userId = req.user.userId;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Check authorization
    if (ride.driver.toString() !== userId && ride.rider.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this ride",
      });
    }

    const validTransitions = {
      pending: ["accepted", "cancelled"],
      accepted: ["en_route", "cancelled"],
      en_route: ["arrived", "cancelled"],
      arrived: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[ride.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${ride.status} to ${status}`,
      });
    }

    ride.status = status;
    if (location) {
      ride["pickup.coordinates"] = location;
    }

    if (status === "completed") {
      ride.completedAt = new Date();
    } else if (status === "cancelled") {
      ride.cancelledAt = new Date();
      ride.cancellationReason = req.body.reason;
    }

    await ride.save();

    // Send notifications
    const notifyUserId =
      ride.rider.toString() === userId ? ride.driver : ride.rider;
    await sendPushNotification(notifyUserId, {
      title: `Ride ${status}`,
      body: `Your ride has been ${status}`,
      data: { rideId: ride._id },
    });

    res.json({
      success: true,
      data: ride,
    });
  } catch (error) {
    console.error("Update ride status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ride status",
      error: error.message,
    });
  }
};

// Rate ride
exports.rateRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, type } = req.body;
    const userId = req.user.userId;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed rides can be rated",
      });
    }

    if (type === "rider" && ride.rider.toString() === userId) {
      ride.rating.riderRating = {
        score: rating,
        comment,
        createdAt: new Date(),
      };
    } else if (type === "driver" && ride.driver.toString() === userId) {
      ride.rating.driverRating = {
        score: rating,
        comment,
        createdAt: new Date(),
      };
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to rate this ride",
      });
    }

    await ride.save();

    res.json({
      success: true,
      message: "Ride rated successfully",
      data: ride,
    });
  } catch (error) {
    console.error("Rate ride error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to rate ride",
      error: error.message,
    });
  }
};

// Get ride history
exports.getRideHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const filter = {
      $or: [{ rider: userId }, { driver: userId }],
    };

    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rides = await Ride.find(filter)
      .populate("rider", "firstName lastName email phone avatar")
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
    console.error("Get ride history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ride history",
      error: error.message,
    });
  }
};

// Get active rides
exports.getActiveRides = async (req, res) => {
  try {
    const userId = req.user.userId;

    const rides = await Ride.find({
      $or: [{ rider: userId }, { driver: userId }],
      status: {
        $in: ["pending", "accepted", "en_route", "arrived", "in_progress"],
      },
    })
      .populate("rider", "firstName lastName email phone avatar")
      .populate("driver", "firstName lastName email phone avatar")
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      data: rides,
    });
  } catch (error) {
    console.error("Get active rides error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active rides",
      error: error.message,
    });
  }
};

// Cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.status === "completed" || ride.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be cancelled",
      });
    }

    if (
      ride.rider.toString() !== userId &&
      ride.driver?.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this ride",
      });
    }

    ride.status = "cancelled";
    ride.cancelledAt = new Date();
    ride.cancellationReason = reason;
    await ride.save();

    // Notify other party
    const notifyUserId =
      ride.rider.toString() === userId ? ride.driver : ride.rider;
    if (notifyUserId) {
      await sendPushNotification(notifyUserId, {
        title: "Ride Cancelled",
        body: `Your ride has been cancelled: ${reason || "No reason provided"}`,
        data: { rideId: ride._id },
      });
    }

    res.json({
      success: true,
      message: "Ride cancelled successfully",
      data: ride,
    });
  } catch (error) {
    console.error("Cancel ride error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel ride",
      error: error.message,
    });
  }
};
