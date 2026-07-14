const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
  createBooking,
  getUserBookings,
  updateBookingStatus,
  getBooking,
} = require("../controllers/booking.controller");

router.use(authenticate);

router.post("/", createBooking);
router.get("/", getUserBookings);
router.get("/:id", getBooking);
router.patch("/:id/status", updateBookingStatus);

module.exports = router;
