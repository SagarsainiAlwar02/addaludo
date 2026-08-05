import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[6-9]\d{9}$/,
      index: true,
    },

    name: {
      type: String,
      required: true,
      default: "Player",
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      default: "nopassword",
    },

    role: {
      type: String,
      enum: ["user", "admin", "agent"],
      default: "user",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
    },

    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    totalReferralEarning: {
      type: Number,
      default: 0,
    },

    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected", ""],
      default: "",
      index: true,
    },

    kyc: {
      name: { type: String, default: "" },
      dob: { type: String, default: "" },
      docType: { type: String, default: "aadhar" },
      docNumber: { type: String, default: "" },
      frontImage: { type: String, default: "" },
      backImage: { type: String, default: "" },
      selfieImage: { type: String, default: "" },
      submittedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
      rejectedAt: { type: Date, default: null },
      rejectReason: { type: String, default: "" },
    },

    lastActiveAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes for common queries
userSchema.index({ status: 1, role: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
