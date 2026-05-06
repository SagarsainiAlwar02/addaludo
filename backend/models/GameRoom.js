const mongoose = require("mongoose");

const gameRoomSchema = new mongoose.Schema({

  // 🔑 unique room id
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // 👥 players in room
  players: [
    {
      userId: {
        type: String,
        required: true
      },
      socketId: {
        type: String,
        required: true
      },
      username: {
        type: String,
        default: "Player"
      },
      amount: {
        type: Number,
        default: 0
      }
    }
  ],

  // 🎮 game state (tokens position etc)
  state: {
    type: Object,
    default: {}
  },

  // 🔄 whose turn (0 or 1)
  turn: {
    type: Number,
    default: 0
  },

  // 🎲 last dice value (NEW - helps sync UI)
  lastDice: {
    type: Number,
    default: null
  },

  // 📊 game status
  status: {
    type: String,
    enum: ["waiting", "ongoing", "completed"],
    default: "waiting"
  },

  // 🏆 winner
  winner: {
    type: String,
    default: null
  },

  // 💰 total pool amount (NEW - for reward calculation)
  totalAmount: {
    type: Number,
    default: 0
  },

  // ⏱ auto cleanup (24h)
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24
  }

}, { timestamps: true });

module.exports = mongoose.model("GameRoom", gameRoomSchema);