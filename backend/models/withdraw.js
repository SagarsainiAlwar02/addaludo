const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  amount: {
    type: Number,
    required: true,
    min: 1
  },

  method: {
    type: String,
    enum: ["bank", "upi", "qr"],
    required: true
  },

  details: {
    type: Object,
    default: {}
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Withdraw", withdrawSchema);