import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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
      min: 0,
    },

    type: {
      type: String,
      enum: [
        "deposit",
        "withdraw",
        "game_entry",
        "game_win",
        "refund",
        "bonus",
        "penalty",
        "referral_commission",
        "referral_redeem",
        "admin_adjust",
      ],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "rejected"],
      default: "success",
      index: true,
    },

    direction: {
      type: String,
      enum: ["in", "out", null],
      default: null,
    },

    note: {
      type: String,
      default: "",
    },

    adminNote: {
      type: String,
      default: "",
    },

    contestId: {
      type: String,
      default: null,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["qr", "upi_bank", null],
      default: null,
    },

    utr: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },

    screenshot: {
      type: String,
      default: "",
    },

    withdrawMethod: {
      type: String,
      enum: ["bank", "upi", "qr", null],
      default: null,
    },

    details: {
      type: Object,
      default: {},
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    uniqueTransactionKey: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },

    balanceAfter: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Common query indexes
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });
// Prevent duplicate successful game_win for the same contest
transactionSchema.index(
  { contestId: 1, type: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "game_win",
      status: "success",
      contestId: { $type: "string" },
    },
  }
);

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
