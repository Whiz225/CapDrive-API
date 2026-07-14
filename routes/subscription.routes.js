const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  getSubscriptionPlans,
  getCurrentSubscription,
  subscribeToPlan,
  cancelSubscription,
  getSubscriptionHistory,
} = require("../controllers/subscription.controller");

// Public routes
router.get("/plans", getSubscriptionPlans);

// Protected routes
router.use(authenticate);

router.get("/current", getCurrentSubscription);
router.post("/subscribe", subscribeToPlan);
router.post("/cancel", cancelSubscription);
router.get("/history", getSubscriptionHistory);

// Admin only routes
router.get("/all", authorize("admin", "super_admin"), getSubscriptionPlans);

module.exports = router;
