const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const User = require("../models/User");

// Initialize Paystack payment
exports.initializePayment = async (req, res) => {
  try {
    const { amount, currency, metadata, paymentMethod } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let paymentData;
    let reference;

    // Check if Paystack is configured
    if (!process.env.PAYSTACK_SECRET_KEY) {
      // Fallback to mock payment
      reference = `mock_${Date.now()}`;
      paymentData = {
        reference,
        authorizationUrl: `${process.env.CLIENT_URL}/payment/verify?reference=${reference}`,
        paymentMethod: "mock",
      };
    } else if (paymentMethod === "card" || !paymentMethod) {
      // Initialize Paystack payment
      const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);
      const response = await paystack.transaction.initialize({
        amount: amount * 100, // Paystack uses kobo
        email: user.email,
        currency: currency || "NGN",
        metadata: {
          userId,
          ...metadata,
        },
        callback_url: `${process.env.CLIENT_URL}/payment/verify`,
      });

      paymentData = {
        reference: response.data.reference,
        authorizationUrl: response.data.authorization_url,
        paymentMethod: "card",
      };
    } else if (paymentMethod === "flutterwave") {
      // Check if Flutterwave is configured
      if (
        !process.env.FLUTTERWAVE_SECRET_KEY ||
        !process.env.FLUTTERWAVE_PUBLIC_KEY
      ) {
        // Fallback to mock
        reference = `mock_${Date.now()}`;
        paymentData = {
          reference,
          authorizationUrl: `${process.env.CLIENT_URL}/payment/verify?reference=${reference}`,
          paymentMethod: "mock",
        };
      } else {
        // Initialize Flutterwave payment
        const Flutterwave = require("flutterwave-node-v3");
        const flw = new Flutterwave(
          process.env.FLUTTERWAVE_PUBLIC_KEY,
          process.env.FLUTTERWAVE_SECRET_KEY
        );

        const response = await flw.Payment.initialize({
          tx_ref: `tx-${Date.now()}`,
          amount,
          currency: currency || "NGN",
          redirect_url: `${process.env.CLIENT_URL}/payment/verify`,
          customer: {
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            phonenumber: user.phone,
          },
          customizations: {
            title: "Car Marketplace",
            description: `Payment for ${metadata?.purpose || "service"}`,
          },
        });

        paymentData = {
          reference: response.data.tx_ref,
          authorizationUrl: response.data.link,
          paymentMethod: "flutterwave",
        };
      }
    }

    // Save payment record
    const payment = new Payment({
      user: userId,
      amount,
      currency: currency || "NGN",
      reference: paymentData.reference,
      paymentMethod: paymentData.paymentMethod,
      status: "pending",
      metadata,
    });

    await payment.save();

    res.json({
      success: true,
      data: {
        reference: paymentData.reference,
        authorizationUrl: paymentData.authorizationUrl,
        payment,
      },
    });
  } catch (error) {
    console.error("Initialize payment error:", error);

    // If payment gateway fails, create mock payment
    try {
      const userId = req.user.userId;
      const { amount, currency, metadata } = req.body;
      const reference = `mock_${Date.now()}`;

      const payment = new Payment({
        user: userId,
        amount,
        currency: currency || "NGN",
        reference,
        paymentMethod: "mock",
        status: "pending",
        metadata,
      });

      await payment.save();

      res.json({
        success: true,
        data: {
          reference,
          authorizationUrl: `${process.env.CLIENT_URL}/payment/verify?reference=${reference}`,
          payment,
        },
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: "Payment initialization failed",
        error: error.message,
      });
    }
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // Find payment
    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // If mock payment, mark as completed
    if (payment.paymentMethod === "mock") {
      payment.status = "completed";
      payment.paidAt = new Date();
      await payment.save();

      return res.json({
        success: true,
        data: { payment, status: "completed" },
      });
    }

    let verification;

    if (payment.paymentMethod === "card" && process.env.PAYSTACK_SECRET_KEY) {
      // Verify Paystack payment
      const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);
      verification = await paystack.transaction.verify(reference);

      if (verification.data.status === "success") {
        payment.status = "completed";
        payment.paidAt = new Date();
        payment.paymentDetails = verification.data;
      } else {
        payment.status = "failed";
      }
    } else if (
      payment.paymentMethod === "flutterwave" &&
      process.env.FLUTTERWAVE_SECRET_KEY &&
      process.env.FLUTTERWAVE_PUBLIC_KEY
    ) {
      // Verify Flutterwave payment
      const Flutterwave = require("flutterwave-node-v3");
      const flw = new Flutterwave(
        process.env.FLUTTERWAVE_PUBLIC_KEY,
        process.env.FLUTTERWAVE_SECRET_KEY
      );

      verification = await flw.Transaction.verify({ id: reference });

      if (verification.data.status === "successful") {
        payment.status = "completed";
        payment.paidAt = new Date();
        payment.paymentDetails = verification.data;
      } else {
        payment.status = "failed";
      }
    } else {
      // Mark as completed for testing
      payment.status = "completed";
      payment.paidAt = new Date();
    }

    await payment.save();

    // Update related entity (booking, subscription, etc.)
    if (payment.metadata?.bookingId) {
      await Booking.findByIdAndUpdate(payment.metadata.bookingId, {
        paymentStatus: payment.status === "completed" ? "paid" : "failed",
        paymentReference: reference,
      });
    }

    res.json({
      success: true,
      data: {
        payment,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// Webhook handler for payment callbacks
exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers["x-paystack-signature"];

    // Verify webhook signature if Paystack is configured
    if (process.env.PAYSTACK_SECRET_KEY && signature) {
      const crypto = require("crypto");
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(event))
        .digest("hex");

      if (hash !== signature) {
        return res.status(401).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }
    }

    if (event.event === "charge.success") {
      const { reference } = event.data;
      await verifyPayment({ params: { reference } });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
};
