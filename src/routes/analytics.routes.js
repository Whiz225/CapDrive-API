const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  getDashboardAnalytics,
  getCarAnalytics,
  getRideAnalytics,
  getUserAnalytics,
  getRevenueAnalytics,
  getDealerAnalytics,
} = require("../controllers/analytics.controller");

// All routes require authentication
router.use(authenticate);

// Admin routes
router.get(
  "/dashboard",
  authorize("admin", "super_admin"),
  getDashboardAnalytics
);
router.get("/cars", authorize("admin", "super_admin"), getCarAnalytics);
router.get("/rides", authorize("admin", "super_admin"), getRideAnalytics);
router.get("/users", authorize("admin", "super_admin"), getUserAnalytics);
router.get("/revenue", authorize("admin", "super_admin"), getRevenueAnalytics);

// Dealer routes
router.get("/dealer", authorize("dealer", "admin"), getDealerAnalytics);

module.exports = router;
