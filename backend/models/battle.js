const mongoose = require("mongoose");

const battleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    unique: true,
    index: true
  },

  amount: {
    type: Number,
    required: true,
    min: 1
  },

  prize: {
    type: Number,
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  opponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  ludoKingRoomCode: {
    type: String,
    default: ""
  },

  screenshot: {
    type: String,
    default: ""
  },

  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  status: {
    type: String,
    enum: [
      "open",
      "running",
      "room_submitted",
      "result_submitted",
      "approved",
      "rejected",
      "cancelled"
    ],
    default: "open",
    index: true
  },

  adminNote: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("Battle", battleSchema);