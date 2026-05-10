const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= ADMIN / AGENT LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    const admin = await User.findOne({
      email,
      role: { $in: ["admin", "agent"] },
    });

    if (!admin) {
      return res.status(400).json({ msg: "Admin / Agent not found" });
    }

    if (admin.status === "blocked") {
      return res.status(403).json({ msg: "Account blocked" });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.log("❌ ADMIN LOGIN ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;