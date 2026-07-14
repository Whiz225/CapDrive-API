const { body, param, query, validationResult } = require("express-validator");

exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  };
};

// Validation rules
exports.userValidation = {
  register: [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  login: [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
};

exports.carValidation = {
  create: [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("make").notEmpty().withMessage("Make is required"),
    body("model").notEmpty().withMessage("Model is required"),
    body("year").isInt({ min: 1900 }).withMessage("Valid year is required"),
    body("condition")
      .isIn(["new", "used", "certified_pre_owned"])
      .withMessage("Invalid condition"),
  ],
};

exports.rideValidation = {
  request: [
    body("pickup.address").notEmpty().withMessage("Pickup address is required"),
    body("dropoff.address")
      .notEmpty()
      .withMessage("Dropoff address is required"),
    body("pickup.coordinates.lat")
      .isNumeric()
      .withMessage("Valid pickup coordinates required"),
    body("pickup.coordinates.lng")
      .isNumeric()
      .withMessage("Valid pickup coordinates required"),
    body("paymentMethod")
      .isIn(["card", "wallet", "cash"])
      .withMessage("Invalid payment method"),
  ],
};
