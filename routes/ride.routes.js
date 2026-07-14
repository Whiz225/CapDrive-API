const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
  requestRide,
  acceptRide,
  updateRideStatus,
  rateRide,
  getRideHistory,
  getActiveRides,
  cancelRide,
} = require("../controllers/ride.controller");

router.use(authenticate);

router.post("/request", requestRide);
router.post("/:id/accept", acceptRide);
router.patch("/:id/status", updateRideStatus);
router.post("/:id/rate", rateRide);
router.get("/history", getRideHistory);
router.get("/active", getActiveRides);
router.post("/:id/cancel", cancelRide);

module.exports = router;
