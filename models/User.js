const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "dealer", "admin", "super_admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: null,
    },
    address: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: "Nigeria",
    },
    zipCode: String,
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    // Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isIdVerified: {
      type: Boolean,
      default: false,
    },
    verificationSteps: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      id: { type: Boolean, default: false },
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
      },
    ],
    dealerProfile: {
      companyName: String,
      companyAddress: String,
      dealerType: {
        type: String,
        enum: ["individual", "dealership", "import", "export"],
        default: "individual",
      },
      businessRegistration: String,
      isVerified: { type: Boolean, default: false },
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      subscription: {
        plan: {
          type: String,
          enum: ["free", "basic", "premium", "enterprise"],
          default: "free",
        },
        startDate: Date,
        endDate: Date,
        isActive: { type: Boolean, default: false },
        features: {
          maxListings: { type: Number, default: 5 },
          featuredListings: { type: Number, default: 0 },
          prioritySupport: { type: Boolean, default: false },
          analytics: { type: Boolean, default: false },
        },
      },
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    lockUntil: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    notifications: [
      {
        type: {
          type: String,
          enum: ["info", "success", "warning", "error"],
        },
        title: String,
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    refreshToken: String,
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

// Pre-save middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1, lockUntil: null },
    });
  }

  const updates = {
    $inc: { loginAttempts: 1 },
  };

  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// Virtual for verification percentage
userSchema.virtual("verificationPercentage").get(function () {
  const steps = [
    this.verificationSteps?.email || false,
    this.verificationSteps?.phone || false,
    this.verificationSteps?.id || false,
  ];
  const weights = [20, 20, 60];
  const total = steps.reduce(
    (acc, step, index) => acc + (step ? weights[index] : 0),
    0
  );
  return total;
});

module.exports = mongoose.model("User", userSchema);
