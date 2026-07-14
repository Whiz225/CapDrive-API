const nodemailer = require("nodemailer");
const twilio = require("twilio");
const admin = require("firebase-admin");

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Initialize Firebase Admin for push notifications
if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

// Send email
exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@carmarketplace.com",
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

// Send SMS (Twilio)
exports.sendSMS = async ({ to, message }) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return response;
  } catch (error) {
    console.error("SMS error:", error);
    throw error;
  }
};

// Send push notification
exports.sendPushNotification = async (userId, notification) => {
  try {
    // Get user's FCM tokens from database
    const User = require("../models/User");
    const user = await User.findById(userId);

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: user.fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("Push notifications sent:", response);
    return response;
  } catch (error) {
    console.error("Push notification error:", error);
    throw error;
  }
};

// Send OTP
exports.sendOTP = async ({ to, type = "email", otp }) => {
  if (type === "email") {
    await exports.sendEmail({
      to,
      subject: "Your OTP Code",
      html: `
        <h1>Your OTP Code</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  } else if (type === "sms") {
    await exports.sendSMS({
      to,
      message: `Your verification code is: ${otp}. Expires in 10 minutes.`,
    });
  }
};
