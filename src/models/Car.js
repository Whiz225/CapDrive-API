const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    condition: {
      type: String,
      enum: ["new", "used", "certified_pre_owned"],
      required: true,
    },
    make: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    mileage: {
      type: Number,
      min: 0,
      default: 0,
    },
    transmission: {
      type: String,
      enum: ["automatic", "manual", "cvt", "semi_automatic"],
    },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "electric", "hybrid", "cng"],
    },
    color: {
      type: String,
      trim: true,
    },
    interiorColor: {
      type: String,
      trim: true,
    },
    seats: {
      type: Number,
      min: 2,
      max: 15,
    },
    doors: {
      type: Number,
      min: 2,
      max: 5,
    },
    engineSize: {
      type: String,
      trim: true,
    },
    horsepower: {
      type: Number,
      min: 0,
    },
    bodyType: {
      type: String,
      enum: [
        "sedan",
        "suv",
        "truck",
        "coupe",
        "convertible",
        "hatchback",
        "wagon",
        "van",
        "sports",
        "luxury",
      ],
    },
    images: [
      {
        url: String,
        publicId: String,
        isMain: { type: Boolean, default: false },
      },
    ],
    features: [
      {
        name: String,
        icon: String,
        value: String,
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDealer: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["available", "pending", "sold", "reserved", "inspection"],
      default: "available",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        index: "2dsphere",
      },
      address: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    inspectionReport: {
      hasReport: { type: Boolean, default: false },
      reportUrl: String,
      inspectedBy: String,
      inspectedDate: Date,
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
      details: mongoose.Schema.Types.Mixed,
    },
    testDriveAvailable: {
      type: Boolean,
      default: true,
    },
    financingAvailable: {
      type: Boolean,
      default: false,
    },
    warranty: {
      hasWarranty: { type: Boolean, default: false },
      months: Number,
      miles: Number,
      details: String,
    },
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

// Index for search optimization
carSchema.index({
  make: "text",
  model: "text",
  description: "text",
  title: "text",
});
carSchema.index({ price: 1, year: -1 });
carSchema.index({ location: "2dsphere" });

// Virtuals
carSchema.virtual("isSold").get(function () {
  return this.status === "sold";
});

carSchema.virtual("daysSinceListed").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Middleware
carSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "sold") {
    this.updatedAt = Date.now();
  }
  next();
});

carSchema.post("findOneAndUpdate", function (doc) {
  if (doc && doc.status === "sold") {
    // Trigger notification to owner
    // This would be handled by a service or queue
  }
});

module.exports = mongoose.model("Car", carSchema);
