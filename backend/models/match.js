const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  roomId: {
    type: String,
    unique: true,
    index: true,
    required: true
  },

  players: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      username: {
        type: String,
        default: ""
      },
      amount: {
        type: Number,
        default: 0
      },
      color: {
        type: String,
        default: ""
      },
      isBot: {
        type: Boolean,
        default: false
      }
    }
  ],

  entryFee: {
    type: Number,
    required: true,
    min: 1
  },

  playersLimit: {
    type: Number,
    enum: [2, 4],
    default: 2
  },

  status: {
    type: String,
    enum: ["pending", "running", "completed", "cancelled"],
    default: "pending",
    index: true
  },

  winner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    username: {
      type: String,
      default: ""
    }
  },

  winAmount: {
    type: Number,
    default: 0
  },

  prizePool: {
    type: Number,
    default: 0
  },

  commission: {
    type: Number,
    default: 0
  },

  cancelledReason: {
    type: String,
    default: ""
  },

  startedAt: {
    type: Date,
    default: null
  },

  completedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Match", matchSchema);