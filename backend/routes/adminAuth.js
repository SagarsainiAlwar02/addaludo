const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= ADMIN / AGENT LOGIN =================
// ================= CREATE DEFAULT ADMIN =================
router.get("/create-admin", async (req, res) => {
  try {
    const existing = await User.findOne({
      email: "admin@addaludo.com",
    });

    if (existing) {
      return res.json({
        success: true,
        msg: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      name: "Main Admin",
      email: "admin@addaludo.com",
      password: hashedPassword,
      phone: "8888888888",
      role: "admin",
      status: "active",
    });

    res.json({
      success: true,
      msg: "Admin created",
      admin,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
});

module.exports = router;