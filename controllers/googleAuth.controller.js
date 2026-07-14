const User = require("../models/User");
const jwt = require("jsonwebtoken");

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

// Google OAuth Success Handler
exports.googleAuthSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        // `${process.env.CLIENT_URL}/auth/callback?error=google_auth_failed`
        `${process.env.CLIENT_URL}/callback?error=google_auth_failed`
      );
    }

    const user = req.user;

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = await generateRefreshToken(user._id);

    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.CLIENT_URL}/callback?token=${token}&refreshToken=${refreshToken}&userId=${user._id}`;
    // const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&userId=${user._id}`;

    console.log("Redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google auth success error:", error);
    res.redirect(
      `${process.env.CLIENT_URL}/callback?error=google_auth_failed`
      // `${process.env.CLIENT_URL}/auth/callback?error=google_auth_failed`
    );
  }
};

// Google Auth Failure Handler
exports.googleAuthFailure = (req, res) => {
  res.redirect(
    `${process.env.CLIENT_URL}/callback?error=google_auth_failed`
    // `${process.env.CLIENT_URL}/auth/callback?error=google_auth_failed`
  );
};

// Handle Google Auth Callback from Frontend
exports.handleGoogleCallback = async (req, res) => {
  try {
    const { token, refreshToken, userId } = req.query;

    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid callback parameters",
      });
    }

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        token,
        refreshToken: refreshToken || null,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          isIdVerified: user.isIdVerified,
          verificationSteps: user.verificationSteps,
          profileCompleted: user.profileCompleted,
        },
      },
    });
  } catch (error) {
    console.error("Google callback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to handle Google callback",
      error: error.message,
    });
  }
};

// Complete Google User Profile
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
    const token = generateToken(user._id, user.role);

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
