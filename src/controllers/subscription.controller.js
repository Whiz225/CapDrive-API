const User = require("../models/User");
const Payment = require("../models/Payment");

// Subscription plans
const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: {
      maxListings: 5,
      featuredListings: 0,
      prioritySupport: false,
      analytics: false,
      chatSupport: false,
    },
  },
  basic: {
    name: "Basic",
    price: 9999,
    features: {
      maxListings: 20,
      featuredListings: 5,
      prioritySupport: false,
      analytics: true,
      chatSupport: true,
    },
  },
  premium: {
    name: "Premium",
    price: 24999,
    features: {
      maxListings: 50,
      featuredListings: 15,
      prioritySupport: true,
      analytics: true,
      chatSupport: true,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: 99999,
    features: {
      maxListings: 200,
      featuredListings: 50,
      prioritySupport: true,
      analytics: true,
      chatSupport: true,
    },
  },
};

// Get subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    res.json({
      success: true,
      data: PLANS,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans",
      error: error.message,
    });
  }
};

// Get current subscription
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    res.json({
      success: true,
      data: user.dealerProfile?.subscription || {
        plan: "free",
        isActive: true,
        features: PLANS.free.features,
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

// Subscribe to plan
exports.subscribeToPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan, paymentReference } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    // Verify payment if not free
    if (plan !== "free" && paymentReference) {
      // Verify payment reference
      const payment = await Payment.findOne({ reference: paymentReference });
      if (!payment || payment.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Payment not verified",
        });
      }
    }

    const user = await User.findById(userId);
    if (!user.dealerProfile) {
      user.dealerProfile = {};
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    user.dealerProfile.subscription = {
      plan,
      startDate: new Date(),
      endDate: plan === "free" ? null : endDate,
      isActive: true,
      features: PLANS[plan].features,
    };

    await user.save();

    res.json({
      success: true,
      message: `Subscribed to ${PLANS[plan].name} plan successfully`,
      data: user.dealerProfile.subscription,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to subscribe",
      error: error.message,
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user.dealerProfile?.subscription?.isActive) {
      return res.status(400).json({
        success: false,
        message: "No active subscription to cancel",
      });
    }

    if (user.dealerProfile.subscription.plan === "free") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel free plan",
      });
    }

    user.dealerProfile.subscription.isActive = false;
    user.dealerProfile.subscription.plan = "free";
    user.dealerProfile.subscription.features = PLANS.free.features;
    await user.save();

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: user.dealerProfile.subscription,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};

// Get subscription history
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    // Get payment history for subscriptions
    const payments = await Payment.find({
      user: userId,
      "metadata.purpose": "subscription",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        current: user.dealerProfile?.subscription || null,
        history: payments,
      },
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history",
      error: error.message,
    });
  }
};
