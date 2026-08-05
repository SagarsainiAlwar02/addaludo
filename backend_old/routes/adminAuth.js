import express from "express";
const router = express.Router();
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// CREATE ADMIN TEMP
router.get("/create-admin", async (req, res) => {
  try {
    const email = "admin@addaludo.com";
    const password = "admin123";

    let admin = await User.findOne({ email });

    if (admin) {
      admin.role = "admin";
      admin.status = "active";
      admin.password = await bcrypt.hash(password, 10);
      await admin.save();

      return res.json({
        success: true,
        msg: "Admin updated",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    admin = await User.create({
      name: "Main Admin",
      email,
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
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
});

// ADMIN LOGIN
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

  if (!process.env.JWT_SECRET) {
  return res.status(500).json({
    msg: "JWT_SECRET missing in env"
  });
}

const token = jwt.sign(
  {
    id: admin._id,
    role: admin.role,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d",
  }
);

    res.json({
      success: true,
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
    res.status(500).json({ msg: err.message });
  }
});

export default router;