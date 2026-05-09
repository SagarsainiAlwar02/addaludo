const mongoose = require("mongoose");

const battleSchema = new mongoose.Schema(
  {
    battleId: { type: String, unique: true, index: true },

    amount: { type: Number, required: true, min: 50 },
    prize: { type: Number, required: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    ludoKingRoomCode: { type: String, default: "" },

    roomCodeSetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    screenshot: { type: String, default: "" },

    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resultSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resultType: {
      type: String,
      enum: ["", "win", "loss", "cancel"],
      default: "",
    },

    results: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        result: {
          type: String,
          enum: ["win", "loss", "cancel"],
          required: true,
        },
        screenshot: {
          type: String,
          default: "",
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    cancelVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    timerStartedAt: {
      type: Date,
      default: null,
    },

    entryLocked: {
      type: Boolean,
      default: false,
    },

    resultSettled: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "open",
        "join_requested",
        "running",
        "room_submitted",
        "result_submitted",
        "loss_submitted",
        "cancel_requested",
        "approved",
        "rejected",
        "cancelled",
      ],
      default: "open",
      index: true,
    },

    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Battle || mongoose.model("Battle", battleSchema);