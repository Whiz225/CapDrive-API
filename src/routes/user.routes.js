const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const multer = require("multer");
const {
  getStats,
  getProfile,
  updateProfile,
  updateAvatar,
  completeProfileWithAvatar,
  getFavorites,
  getBookings,
  getRides,
  getMessages,
} = require("../controllers/user.controller");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
});

router.use(authenticate);

router.get("/stats", getStats);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
// Single endpoint for profile completion with avatar
router.post(
  "/complete-profile",
  upload.single("avatar"),
  completeProfileWithAvatar
);
// Standalone avatar update (for later updates)
router.post("/avatar", upload.single("avatar"), updateAvatar);
router.get("/favorites", getFavorites);
router.get("/bookings", getBookings);
router.get("/rides", getRides);
router.get("/messages", getMessages);

module.exports = router;
