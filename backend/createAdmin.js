require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const hashedPassword = await bcrypt.hash("Mohit@9250", 10);

    const admin = await User.findOneAndUpdate(
      { email: "Adda48931@gmail.com" },
      {
        name: "Admin",
        email: "Adda48931@gmail.com",
        phone: "9000000001",
        password: hashedPassword,
        role: "admin",
        status: "active"
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log("✅ Admin Ready");
    console.log("Email: Adda48931@gmail.com");
    console.log("Phone: 9000000001 ");
    console.log("Password: Mohit@9250");

    process.exit(0);
  } catch (err) {
    console.log("❌ Error:", err.message);
    process.exit(1);
  }
}

createAdmin();