const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 100,
      max: 100000,
    },

    paymentMethod: {
      type: String,
      enum: ["qr", "upi_bank"],
      required: true,
      index: true,
    },

    utr: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    screenshot: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Deposit || mongoose.model("Deposit", depositSchema);