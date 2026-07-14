const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["standard", "premium", "xl", "luxury"],
      default: "standard",
    },
    pickup: {
      address: { type: String, required: true },
      city: String,
      state: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      note: String,
    },
    dropoff: {
      address: { type: String, required: true },
      city: String,
      state: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      note: String,
    },
    waypoints: [
      {
        address: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
    ],
    distance: {
      value: Number,
      unit: { type: String, default: "km" },
    },
    duration: {
      value: Number,
      unit: { type: String, default: "minutes" },
    },
    fare: {
      basePrice: Number,
      distancePrice: Number,
      timePrice: Number,
      surgeMultiplier: { type: Number, default: 1 },
      total: { type: Number, required: true },
      currency: { type: String, default: "NGN" },
    },
    paymentMethod: {
      type: String,
      enum: ["card", "wallet", "cash"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentReference: String,
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "en_route",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "pending",
    },
    scheduledAt: Date,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    rating: {
      riderRating: {
        score: { type: Number, min: 0, max: 5 },
        comment: String,
        createdAt: Date,
      },
      driverRating: {
        score: { type: Number, min: 0, max: 5 },
        comment: String,
        createdAt: Date,
      },
    },
    vehicle: {
      make: String,
      model: String,
      color: String,
      plateNumber: String,
      year: Number,
    },
    notes: String,
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedRiders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
rideSchema.index({ "pickup.coordinates": "2dsphere" });
rideSchema.index({ "dropoff.coordinates": "2dsphere" });
rideSchema.index({ status: 1, requestedAt: -1 });

rideSchema.methods.calculateETA = function () {
  // This would integrate with a mapping service API
  // Returns estimated time of arrival
  return this.duration.value || 15;
};

module.exports = mongoose.model("Ride", rideSchema);
