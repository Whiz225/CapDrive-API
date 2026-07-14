const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const passport = require("passport");
const multer = require("multer");
const {
  register,
  login,
  verifyEmail,
  verifyPhone,
  resendVerification,
  getVerificationStatus,
  completeProfile,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  completeGoogleProfileWithAvatar,
} = require("../controllers/auth.controller");
const {
  googleAuthSuccess,
  googleAuthFailure,
  handleGoogleCallback,
  completeGoogleProfile,
} = require("../controllers/googleAuth.controller");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
});

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshToken);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
    session: true,
  }),
  googleAuthSuccess
);

router.get("/google/failure", googleAuthFailure);
router.get("/google/callback/handle", handleGoogleCallback);

// Protected routes
router.use(authenticate);
router.post("/complete-profile", completeProfile);
// Single endpoint for Google profile completion with avatar
router.post(
  "/complete-google-profile",
  upload.single("avatar"),
  completeGoogleProfileWithAvatar
);
router.post("/verify-phone", verifyPhone);
router.post("/resend-verification", resendVerification);
router.get("/verification-status", getVerificationStatus);
router.post("/logout", logout);

module.exports = router;
