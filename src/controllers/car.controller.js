const Car = require("../models/Car");
const User = require("../models/User");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinary.service");
const { redisClient } = require("../config/redis");

// Helper function to check if Redis is available
const isRedisAvailable = () => {
  return redisClient && typeof redisClient.get === "function";
};

// Get all cars with caching
exports.getCars = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      make,
      model,
      year,
      minPrice,
      maxPrice,
      condition,
      transmission,
      fuelType,
      bodyType,
      city,
      state,
      search,
      sort = "-createdAt",
    } = req.query;

    // Create cache key
    const cacheKey = `cars:${JSON.stringify(req.query)}`;

    // Check cache only if Redis is available
    if (isRedisAvailable()) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json(JSON.parse(cachedData));
        }
      } catch (cacheError) {
        console.warn("Redis cache read error:", cacheError.message);
        // Continue without cache
      }
    }

    // Build filter
    const filter = { status: "available" };

    if (make) filter.make = make;
    if (model) filter.model = { $regex: model, $options: "i" };
    if (year) filter.year = parseInt(year);
    if (condition) filter.condition = condition;
    if (transmission) filter.transmission = transmission;
    if (fuelType) filter.fuelType = fuelType;
    if (bodyType) filter.bodyType = bodyType;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    if (city) filter["location.city"] = { $regex: city, $options: "i" };
    if (state) filter["location.state"] = { $regex: state, $options: "i" };

    if (search) {
      filter.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const cars = await Car.find(filter)
      .populate("owner", "firstName lastName email phone avatar dealerProfile")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Car.countDocuments(filter);

    // console.log("result", {
    //   success: true,
    //   data: cars,
    //   pagination: {
    //     page: parseInt(page),
    //     limit: parseInt(limit),
    //     total,
    //     pages: Math.ceil(total / parseInt(limit)),
    //   },
    // });

    const result = {
      success: true,
      data: cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    // Cache for 5 minutes only if Redis is available
    if (isRedisAvailable()) {
      try {
        await redisClient.setex(cacheKey, 300, JSON.stringify(result));
      } catch (cacheError) {
        console.warn("Redis cache write error:", cacheError.message);
        // Continue without cache
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Get cars error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cars",
      error: error.message,
    });
  }
};

// Get single car
exports.getCar = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id).populate(
      "owner",
      "firstName lastName email phone avatar dealerProfile"
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    // Increment view count
    car.viewCount += 1;
    await car.save();

    res.json({
      success: true,
      data: car,
    });
  } catch (error) {
    console.error("Get car error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch car details",
      error: error.message,
    });
  }
};

// Create car listing
exports.createCar = async (req, res) => {
  try {
    const userId = req.user.userId;
    const carData = req.body;

    // Check user subscription limits
    const user = await User.findById(userId);
    const maxListings =
      user.dealerProfile?.subscription?.features?.maxListings || 5;
    const currentListings = await Car.countDocuments({ owner: userId });

    if (currentListings >= maxListings) {
      return res.status(403).json({
        success: false,
        message:
          "You have reached your listing limit. Please upgrade your subscription.",
      });
    }

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "cars");
        imageUrls.push({
          url: result.secure_url,
          publicId: result.public_id,
          isMain: imageUrls.length === 0,
        });
      }
    }

    const car = new Car({
      ...carData,
      owner: userId,
      images: imageUrls,
      isDealer: user.role === "dealer",
    });

    await car.save();

    // Invalidate cache if Redis is available
    if (isRedisAvailable()) {
      try {
        await redisClient.flushall();
      } catch (cacheError) {
        console.warn("Redis flush error:", cacheError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Car listed successfully",
      data: car,
    });
  } catch (error) {
    console.error("Create car error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create car listing",
      error: error.message,
    });
  }
};

// Update car
exports.updateCar = async (req, res) => {
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

    // Check ownership
    if (car.owner.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this listing",
      });
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      // Delete old images
      for (const image of car.images) {
        await deleteFromCloudinary(image.publicId);
      }

      // Upload new images
      const imageUrls = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "cars");
        imageUrls.push({
          url: result.secure_url,
          publicId: result.public_id,
          isMain: imageUrls.length === 0,
        });
      }
      updates.images = imageUrls;
    }

    const updatedCar = await Car.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    // Invalidate cache if Redis is available
    if (isRedisAvailable()) {
      try {
        await redisClient.flushall();
      } catch (cacheError) {
        console.warn("Redis flush error:", cacheError.message);
      }
    }

    res.json({
      success: true,
      message: "Car updated successfully",
      data: updatedCar,
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

// Delete car
exports.deleteCar = async (req, res) => {
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

    // Check ownership
    if (car.owner.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this listing",
      });
    }

    // Delete images from cloudinary
    for (const image of car.images) {
      await deleteFromCloudinary(image.publicId);
    }

    await car.remove();

    // Invalidate cache if Redis is available
    if (isRedisAvailable()) {
      try {
        await redisClient.flushall();
      } catch (cacheError) {
        console.warn("Redis flush error:", cacheError.message);
      }
    }

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

// Add to favorites
exports.addToFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (user.favorites.includes(id)) {
      return res.status(400).json({
        success: false,
        message: "Car already in favorites",
      });
    }

    user.favorites.push(id);
    await user.save();

    // Update car favorites count
    await Car.findByIdAndUpdate(id, {
      $addToSet: { favorites: userId },
    });

    res.json({
      success: true,
      message: "Added to favorites",
    });
  } catch (error) {
    console.error("Add to favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add to favorites",
      error: error.message,
    });
  }
};

// Remove from favorites
exports.removeFromFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await User.findByIdAndUpdate(userId, {
      $pull: { favorites: id },
    });

    await Car.findByIdAndUpdate(id, {
      $pull: { favorites: userId },
    });

    res.json({
      success: true,
      message: "Removed from favorites",
    });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove from favorites",
      error: error.message,
    });
  }
};

// Get user's favorites
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
