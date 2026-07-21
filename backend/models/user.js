import mongoose from "mongoose";

// Helper function: Generate 5 random characters (e.g., Hwhos, x7K2p)
function makeRandomName() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function makeReferralCode() {
  return "BA-" + Math.floor(100000 + Math.random() * 900000);
}

const userSchema = new mongoose.Schema(
  {
    // Auto generate 5 random characters as initial name
    name: { 
      type: String, 
      default: makeRandomName 
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
      default: "nopassword",
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      uppercase: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    totalReferralEarning: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["user", "admin", "agent"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },

    kyc: {
      name: { type: String, default: "" },
      dob: { type: String, default: "" },
      docType: { type: String, default: "aadhar" },
      docNumber: { type: String, default: "" },
      submittedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
      rejectedAt: { type: Date, default: null },
      rejectReason: { type: String, default: "" },
    },

    lastActiveAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (this.referralCode) return next();

    let code;
    let exists = true;

    while (exists) {
      code = makeReferralCode();
      exists = await mongoose.models.User.findOne({ referralCode: code });
    }

    this.referralCode = code;
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
