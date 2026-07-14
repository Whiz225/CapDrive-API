const Booking = require("../models/Booking");
const Car = require("../models/Car");
const {
  sendEmail,
  sendPushNotification,
} = require("../services/notification.service");

// Create booking (test drive/inspection)
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { carId, type, scheduledDate, message } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    // Check if booking slot is available
    const existingBooking = await Booking.findOne({
      carId,
      scheduledDate,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    const booking = new Booking({
      user: userId,
      car: carId,
      type,
      scheduledDate,
      message,
      status: "pending",
    });

    await booking.save();

    // Notify car owner
    await sendPushNotification(car.owner, {
      title: "New Booking Request",
      body: `Someone wants to ${
        type === "test_drive" ? "test drive" : "inspect"
      } your ${car.make} ${car.model}`,
      data: { bookingId: booking._id },
    });

    // Send email notification
    await sendEmail({
      to: car.owner.email,
      subject: "New Booking Request",
      html: `
        <h1>New Booking Request</h1>
        <p>A user has requested a ${type.replace("_", " ")} for your ${
        car.make
      } ${car.model}</p>
        <p>Date: ${new Date(scheduledDate).toLocaleString()}</p>
        <p>Message: ${message || "No message provided"}</p>
        <a href="${process.env.CLIENT_URL}/bookings/${
        booking._id
      }">View Booking</a>
      `,
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate("car", "make model year price images location")
      .populate("user", "firstName lastName email phone")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.userId;

    const booking = await Booking.findById(id)
      .populate("car", "make model owner")
      .populate("user", "firstName lastName email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization (only car owner or admin can update)
    if (
      booking.car.owner._id.toString() !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this booking",
      });
    }

    const validTransitions = {
      pending: ["confirmed", "cancelled", "rejected"],
      confirmed: ["completed", "cancelled"],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${booking.status} to ${status}`,
      });
    }

    booking.status = status;
    booking.notes = notes || booking.notes;

    if (status === "confirmed") {
      booking.confirmedAt = new Date();
    } else if (status === "completed") {
      booking.completedAt = new Date();
    }

    await booking.save();

    // Notify user
    await sendPushNotification(booking.user._id, {
      title: `Booking ${status}`,
      body: `Your booking has been ${status}`,
      data: { bookingId: booking._id },
    });

    await sendEmail({
      to: booking.user.email,
      subject: `Booking ${status}`,
      html: `
        <h1>Booking ${status}</h1>
        <p>Your booking for ${booking.car.make} ${
        booking.car.model
      } has been ${status}</p>
        ${notes ? `<p>Notes: ${notes}</p>` : ""}
        <a href="${process.env.CLIENT_URL}/bookings/${
        booking._id
      }">View Booking</a>
      `,
    });

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

// Get booking by ID
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const booking = await Booking.findById(id)
      .populate("car", "make model year price images location owner")
      .populate("user", "firstName lastName email phone avatar");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization
    if (
      booking.user._id.toString() !== userId &&
      booking.car.owner._id.toString() !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this booking",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};
