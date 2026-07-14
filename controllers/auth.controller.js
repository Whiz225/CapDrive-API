const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail, sendSMS } = require("../services/notification.service");
const { redisClient } = require("../config/redis");

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate Refresh Token
const generateRefreshToken = async (userId) => {
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  await User.findByIdAndUpdate(userId, { refreshToken });
  return refreshToken;
};

// // Register
// exports.register = async (req, res) => {
//   try {
//     const { firstName, lastName, email, phone, password, role } = req.body;

//     // Check if user exists
//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists with this email or phone",
//       });
//     }

//     // Create user
//     const user = new User({
//       firstName,
//       lastName,
//       email,
//       phone,
//       password,
//       role: role || "user",
//     });

//     // Generate email verification token
//     const verificationToken = crypto.randomBytes(32).toString("hex");
//     user.emailVerificationToken = crypto
//       .createHash("sha256")
//       .update(verificationToken)
//       .digest("hex");
//     user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

//     await user.save();

//     // Send verification email
//     const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
//     await sendEmail({
//       to: email,
//       subject: "Verify your email address",
//       html: `
//         <h1>Welcome to Car Marketplace!</h1>
//         <p>Please click the link below to verify your email address:</p>
//         <a href="${verificationUrl}">Verify Email</a>
//         <p>This link expires in 24 hours.</p>
//       `,
//     });

//     const token = generateToken(user._id, user.role);
//     const refreshToken = await generateRefreshToken(user._id);

//     res.status(201).json({
//       success: true,
//       message:
//         "Registration successful. Please check your email to verify your account.",
//       data: {
//         token,
//         refreshToken,
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//           role: user.role,
//           isEmailVerified: user.isEmailVerified,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Registration failed",
//       error: error.message,
//     });
//   }
// };

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(401).json({
        success: false,
        message: "Account is locked. Please try again later.",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);
    const refreshToken = await generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Register
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or phone",
      });
    }

    // Determine role - if role is 'true' from checkbox, set to 'dealer', else 'user'
    let userRole = "user";
    if (role === "dealer" || role === true) {
      userRole = "dealer";
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: userRole,
      isEmailVerified: false,
      isPhoneVerified: false,
      isIdVerified: false,
      verificationSteps: {
        email: false,
        phone: false,
        id: false,
      },
      // If dealer, set up dealer profile
      ...(userRole === "dealer" && {
        dealerProfile: {
          companyName: "",
          companyAddress: "",
          isVerified: false,
          subscription: {
            plan: "free",
            isActive: true,
            features: {
              maxListings: 5,
              featuredListings: 0,
              prioritySupport: false,
              analytics: false,
            },
          },
        },
      }),
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    // Generate phone verification code
    const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.phoneVerificationCode = phoneCode;
    user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: email,
      subject: "Verify your email address",
      html: `
        <h1>Welcome to CapDrive!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        <p>Your phone verification code is: <strong>${phoneCode}</strong></p>
      `,
    });

    // Send phone verification code via SMS (if configured)
    try {
      await sendSMS({
        to: phone,
        message: `Your CapDrive verification code is: ${phoneCode}`,
      });
    } catch (smsError) {
      console.log("SMS not sent (service not configured):", smsError.message);
    }

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = await generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email and phone.",
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isIdVerified: user.isIdVerified,
          verificationSteps: user.verificationSteps,
          needsProfileCompletion: !user.profileCompleted,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Complete Profile
exports.completeProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      address,
      city,
      state,
      country,
      zipCode,
      companyName,
      companyAddress,
      dealerType,
      businessRegistration,
      avatar,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update profile fields
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.country = country || user.country || "Nigeria";
    user.zipCode = zipCode || user.zipCode;
    user.avatar = avatar || user.avatar;

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
          profileCompleted: user.profileCompleted,
          verificationSteps: user.verificationSteps,
        },
      },
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete profile",
      error: error.message,
    });
  }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.verificationSteps.email = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        verificationSteps: user.verificationSteps,
        totalVerificationPercentage: calculateVerificationPercentage(user),
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
};

// Verify Phone
exports.verifyPhone = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { code } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.phoneVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (user.phoneVerificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Please request a new one.",
      });
    }

    user.isPhoneVerified = true;
    user.verificationSteps.phone = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Phone verified successfully",
      data: {
        verificationSteps: user.verificationSteps,
        totalVerificationPercentage: calculateVerificationPercentage(user),
      },
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(500).json({
      success: false,
      message: "Phone verification failed",
      error: error.message,
    });
  }
};

// Resend Verification Code
exports.resendVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.body; // 'email' or 'phone'

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (type === "email") {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      user.emailVerificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

      await user.save();

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `
          <h1>Verify Your Email</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link expires in 24 hours.</p>
        `,
      });

      res.json({
        success: true,
        message: "Verification email sent",
      });
    } else if (type === "phone") {
      const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.phoneVerificationCode = phoneCode;
      user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000;

      await user.save();

      try {
        await sendSMS({
          to: user.phone,
          message: `Your CapDrive verification code is: ${phoneCode}`,
        });
      } catch (smsError) {
        console.log("SMS not sent:", smsError.message);
      }

      res.json({
        success: true,
        message: "Verification code sent to your phone",
        data: { code: phoneCode }, // Remove in production
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid verification type",
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification",
      error: error.message,
    });
  }
};

// Calculate verification percentage
function calculateVerificationPercentage(user) {
  const steps = [
    user.verificationSteps?.email || false,
    user.verificationSteps?.phone || false,
    user.verificationSteps?.id || false,
  ];
  const weights = [20, 20, 60];
  const total = steps.reduce(
    (acc, step, index) => acc + (step ? weights[index] : 0),
    0
  );
  return total;
}

// Get Verification Status
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select(
      "verificationSteps isEmailVerified isPhoneVerified isIdVerified"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        steps: user.verificationSteps || {
          email: false,
          phone: false,
          id: false,
        },
        isEmailVerified: user.isEmailVerified || false,
        isPhoneVerified: user.isPhoneVerified || false,
        isIdVerified: user.isIdVerified || false,
        totalPercentage: calculateVerificationPercentage(user),
      },
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get verification status",
      error: error.message,
    });
  }
};

// // Verify Email
// exports.verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.params;

//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     const user = await User.findOne({
//       emailVerificationToken: hashedToken,
//       emailVerificationExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired verification token",
//       });
//     }

//     user.isEmailVerified = true;
//     user.emailVerificationToken = undefined;
//     user.emailVerificationExpires = undefined;
//     await user.save();

//     res.json({
//       success: true,
//       message: "Email verified successfully",
//     });
//   } catch (error) {
//     console.error("Email verification error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Email verification failed",
//       error: error.message,
//     });
//   }
// };

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: error.message,
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const token = generateToken(user._id, user.role);
    const newRefreshToken = await generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
      error: error.message,
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { userId } = req.user;
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};

// Complete Google Profile
exports.completeGoogleProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      phone,
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
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update profile
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.country = country || user.country || "Nigeria";
    user.zipCode = zipCode || user.zipCode;

    // Update role
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

    // Generate new token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      }
    );

    res.json({
      success: true,
      message: "Profile completed successfully",
      data: {
        token,
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
    console.error("Complete Google profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete profile",
      error: error.message,
    });
  }
};

// Complete Google Profile with Avatar (Single API Call)
exports.completeGoogleProfileWithAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Parse the data from FormData
    let profileData;
    try {
      profileData = JSON.parse(req.body.data);
    } catch (e) {
      profileData = req.body;
    }

    const {
      phone,
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
      const result = await uploadToCloudinary(req.file.buffer, "avatars");
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

    // Update profile
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.country = country || user.country || "Nigeria";
    user.zipCode = zipCode || user.zipCode;
    user.avatar = avatarUrl;

    // Update role
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

    // Generate new token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      }
    );

    res.json({
      success: true,
      message: "Profile completed successfully",
      data: {
        token,
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
    console.error("Complete Google profile with avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete profile",
      error: error.message,
    });
  }
};
