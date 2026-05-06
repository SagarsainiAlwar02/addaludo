const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, default: "New User" },

  email: {
    type: String,
    unique: true,
    sparse: true
  },

  password: {
    type: String,
    default: "nopassword"
  },

  phone: {
    type: String,
    required: true,
    unique: true
  },

  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  totalReferralEarning: {
    type: Number,
    default: 0
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  status: {
    type: String,
    enum: ["active", "blocked"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);