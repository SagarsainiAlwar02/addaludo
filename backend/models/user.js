const mongoose = require("mongoose");

function makeReferralCode() {
  return "BA-" + Math.floor(100000 + Math.random() * 900000);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "New User" },

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
      enum: ["user", "admin"],
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

module.exports = mongoose.models.User || mongoose.model("User", userSchema);