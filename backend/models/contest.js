import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    username: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    role: {
      type: String,
      enum: ["creator", "opponent"],
      default: "player",
    },

    result: {
      type: String,
      enum: ["win", "loss", "cancel", null],
      default: null,
    },

    screenshotUrl: {
      type: String,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const contestSchema = new mongoose.Schema(
  {
    contestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    entryFee: {
      type: Number,
      required: true,
      min: 50,
    },

    prize: {
      type: Number,
      required: true,
      min: 0,
    },

    commission: {
      type: Number,
      default: 0,
      min: 0,
    },

    players: {
      type: [playerSchema],
      validate: {
        validator(arr) {
          return arr.length <= 2;
        },
        message: "Maximum 2 players allowed",
      },
    },

    winner: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      username: {
        type: String,
        default: "",
      },
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
        "cancel_requested",
        "approved",
        "cancelled",
      ],
      default: "open",
      index: true,
    },

    ludoKingRoomCode: {
      type: String,
      default: "",
      validate: {
        validator(v) {
          return v === "" || /^\d{8}$/.test(v);
        },
        message: "Room code must be 8 digits",
      },
    },

    timerStartedAt: {
      type: Date,
      default: null,
    },

    adminNote: {
      type: String,
      default: "",
    },

    cancelledReason: {
      type: String,
      default: "",
    },

    isDummy: {
      type: Boolean,
      default: false,
      index: true,
    },

    dummyName: {
      type: String,
      default: "",
    },

    dummyMobile: {
      type: String,
      default: "",
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Common query indexes
contestSchema.index({ createdAt: -1 });
contestSchema.index({ status: 1, createdAt: -1 });
contestSchema.index({ "players.userId": 1, status: 1 });
contestSchema.index({ isDummy: 1, status: 1 });

export default mongoose.models.Contest || mongoose.model("Contest", contestSchema);
