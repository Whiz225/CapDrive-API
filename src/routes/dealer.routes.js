const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const multer = require("multer");
const {
  getStats,
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getInquiries,
  getSubscription,
  updateSubscription,
} = require("../controllers/dealer.controller");

// Configure multer for image uploads
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
router.use(authorize("dealer", "admin"));

router.get("/stats", getStats);
router.get("/listings", getListings);
router.get("/listings/:id", getListing);
router.post("/listings", upload.array("images", 10), createListing);
router.put("/listings/:id", upload.array("images", 10), updateListing);
router.delete("/listings/:id", deleteListing);
router.get("/inquiries", getInquiries);
router.get("/subscription", getSubscription);
router.put("/subscription", updateSubscription);

module.exports = router;
