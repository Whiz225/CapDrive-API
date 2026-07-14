// backend/src/routes/admin.routes.js
const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getCars,
  updateCar,
  deleteCar,
  getRides,
  getPayments,
  getRecentActivities,
} = require("../controllers/admin.controller");

router.use(authenticate);
router.use(authorize("admin", "super_admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/cars", getCars);
router.put("/cars/:id", updateCar);
router.delete("/cars/:id", deleteCar);
router.get("/rides", getRides);
router.get("/payments", getPayments);
router.get("/activities", getRecentActivities);

module.exports = router;
