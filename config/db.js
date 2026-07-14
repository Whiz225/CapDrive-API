// config/db.js
const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const connectDB = async () => {
  mongoose
    .connect(DB)
    .then(() => console.log("DB connection successful!"))
    .catch((err) => console.error("DB connection error:", err));
};

module.exports = connectDB;
