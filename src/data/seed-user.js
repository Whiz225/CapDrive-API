const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config({ path: "./config.env" });

const users = [
  {
    firstName: "Premium",
    lastName: "Dealer",
    email: "dealer@carmarket.com",
    phone: "+2348000000000",
    password: "password123",
    role: "dealer",
    isEmailVerified: true,
    dealerProfile: {
      companyName: "Premium Cars Nigeria",
      companyAddress: "Lagos, Nigeria",
      isVerified: true,
      subscription: {
        plan: "premium",
        isActive: true,
        features: {
          maxListings: 50,
          featuredListings: 15,
          prioritySupport: true,
          analytics: true,
        },
      },
    },
  },
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    phone: "+2348000000001",
    password: "password123",
    role: "user",
    isEmailVerified: true,
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@email.com",
    phone: "+2348000000002",
    password: "password123",
    role: "user",
    isEmailVerified: true,
  },
  {
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.j@email.com",
    phone: "+2348000000003",
    password: "password123",
    role: "user",
    isEmailVerified: true,
  },
  {
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.w@email.com",
    phone: "+2348000000004",
    password: "password123",
    role: "user",
    isEmailVerified: true,
  },
  {
    firstName: "David",
    lastName: "Brown",
    email: "david.b@email.com",
    phone: "+2348000000005",
    password: "password123",
    role: "dealer",
    isEmailVerified: true,
    dealerProfile: {
      companyName: "Brown Auto Sales",
      companyAddress: "Abuja, Nigeria",
      isVerified: true,
      subscription: {
        plan: "basic",
        isActive: true,
        features: {
          maxListings: 20,
          featuredListings: 5,
          prioritySupport: false,
          analytics: true,
        },
      },
    },
  },
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@carmarket.com",
    phone: "+2348000000006",
    password: "admin123",
    role: "admin",
    isEmailVerified: true,
  },
];

const seedUsers = async () => {
  try {
    const DB = process.env.DATABASE.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD
    );
    await mongoose.connect(DB);
    console.log("✅ Connected to MongoDB");

    // Clear existing users (optional - comment out if you want to keep existing)
    // await User.deleteMany();
    // console.log('🗑️ Cleared existing users');

    let created = 0;
    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        created++;
      } else {
        console.log(`⏭️ User already exists: ${userData.email}`);
      }
    }

    console.log(`✅ Successfully created ${created} new users!`);
    console.log("\n📋 Users:");
    console.log("🔑 Dealer: dealer@carmarket.com / password123");
    console.log("🔑 Admin: admin@carmarket.com / admin123");
    console.log(
      "🔑 Users: john.doe@email.com, jane.smith@email.com, michael.j@email.com, sara h.w@email.com / password123"
    );
    console.log("🔑 Dealer 2: david.b@email.com / password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
};

seedUsers();
