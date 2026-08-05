import mongoose from "mongoose";

const matchProofSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    roomId: {
      type: String,
      required: true,
      index: true,
    },

    entryAmount: {
      type: Number,
      default: 0,
    },

    prizePool: {
      type: Number,
      default: 0,
    },

    winAmount: {
      type: Number,
      default: 0,
    },

    screenshotUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MatchProof", matchProofSchema);