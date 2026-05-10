const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
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
      min: 1,
    },

    method: {
      type: String,
      enum: ["bank", "upi", "qr", "penalty"],
      required: true,
    },

    details: {
      type: Object,
      default: {},
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actionAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Withdraw || mongoose.model("Withdraw", withdrawSchema);