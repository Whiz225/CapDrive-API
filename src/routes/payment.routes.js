const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
  initializePayment,
  verifyPayment,
  getPaymentHistory,
  handleWebhook,
} = require("../controllers/payment.controller");

// Webhook (no auth)
router.post("/webhook", handleWebhook);

// Protected routes
router.use(authenticate);
router.post("/initialize", initializePayment);
router.get("/verify/:reference", verifyPayment);
router.get("/history", getPaymentHistory);

module.exports = router;
