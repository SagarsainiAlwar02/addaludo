const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  type: {
    type: String,
    enum: [
      "deposit",
      "withdraw",
      "game_entry",
      "game_win",
      "refund",
      "admin_adjust",
      "bonus",
      "penalty"
    ],
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "success",
    index: true
  },

  note: {
    type: String,
    default: ""
  },

  roomId: {
    type: String,
    default: null,
    index: true
  },

  balanceAfter: {
    type: Number,
    default: null
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },

  approvedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);