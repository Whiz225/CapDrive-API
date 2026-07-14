const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const multer = require("multer");
const {
  getCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
} = require("../controllers/car.controller");

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

// Public routes
router.get("/", getCars);
router.get("/:id", getCar);

// Protected routes
router.use(authenticate);

router.post("/", upload.array("images", 10), createCar);
router.put("/:id", upload.array("images", 10), updateCar);
router.delete("/:id", deleteCar);
router.post("/:id/favorite", addToFavorites);
router.delete("/:id/favorite", removeFromFavorites);
router.get("/favorites", getFavorites);

module.exports = router;
