import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Battle from "../models/battle.js";
import generateToken from "../utils/generateToken.js";
import axios from "axios";

const otpStore = {};

function makeReferralCode() {
  return "BA-" + Math.floor(100000 + Math.random() * 900000);
}

async function generateUniqueReferralCode() {
  let code;
  let exists = true;

  while (exists) {
    code = makeReferralCode();
    exists = await User.findOne({ referralCode: code });
  }

  return code;
}


async function sendFast2SMS(phone, otp) {
  try {
    const message = `Welcome to the ABC powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;

    const url = `http://cloud.smsindiahub.in/api/mt/SendSMS?user=${process.env.SMS_USERNAME}&password=${process.env.SMS_PASSWORD}&senderid=SMSHUB&channel=Transactional&DCS=0&flashsms=0&number=91${phone}&text=${encodeURIComponent(message)}&DLTTemplateId=${process.env.SMS_DLT_TEMPLATE_ID}&route=${process.env.SMS_ROUTE}&PEId=${process.env.SMS_PE_ID}`;

    const response = await axios.get(url);

    console.log("SMS RESPONSE:", response.data);

    return response.data;
  } catch (error) {
    console.error("SMS ERROR:", error.response?.data || error.message);
    return null;
  }
}

export const sendOtp = async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) return res.status(400).json({ msg: "Phone number required" });

    phone = String(phone).trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ msg: "Invalid Indian phone number" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const smsRes = await sendFast2SMS(phone, otp);

    console.log("📲 OTP:", phone, otp);
    console.log("✅ FAST2SMS RESPONSE:", smsRes);

   otpStore[phone] = {
  otp,
  createdAt: Date.now(),
  attempts: 0,
};

setTimeout(() => {
  delete otpStore[phone];
}, 5 * 60 * 1000);

    return res.json({
      success: true,
      msg: "OTP sent successfully",
    });
  } catch (err) {
    console.log("❌ SEND OTP ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      msg: "Failed to send OTP",
      error: err.response?.data || err.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    let { phone, otp, referralCode } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ msg: "Phone and OTP required" });
    }

    phone = String(phone).trim();
    otp = String(otp).trim();
    referralCode = referralCode ? String(referralCode).trim().toUpperCase() : "";

    const stored = otpStore[phone];

    if (!stored) {
      return res.status(400).json({ msg: "OTP not found or expired" });
    }

    const isExpired = Date.now() - stored.createdAt > 5 * 60 * 1000;

    if (isExpired) {
      delete otpStore[phone];
      return res.status(400).json({ msg: "OTP expired" });
    }

  if (stored.otp !== otp) {
  stored.attempts = (stored.attempts || 0) + 1;

  if (stored.attempts >= 5) {
    delete otpStore[phone];

    return res.status(400).json({
      msg: "Too many attempts. Request OTP again",
    });
  }

  return res.status(400).json({
    msg: "Invalid OTP",
  });
}
    delete otpStore[phone];

    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      let referredBy = null;

      if (referralCode) {
        const refUser = await User.findOne({ referralCode });

        if (!refUser) {
          return res.status(400).json({ msg: "Invalid referral code" });
        }

        if (String(refUser.phone) === String(phone)) {
          return res.status(400).json({ msg: "Self referral not allowed" });
        }

        referredBy = refUser._id;
      }

      user = await User.create({
        phone,
        name: "Player" + Math.floor(Math.random() * 1000),
        referralCode: await generateUniqueReferralCode(),
        referredBy,
      });

     await Wallet.findOneAndUpdate(
  { userId: user._id },
  {
    $setOnInsert: {
      userId: user._id,
      balance: 0,
      bonus: 0,
      winnings: 0,
      referralBalance: 0,
      locked: 0,
    },
  },
  {
    upsert: true,
    new: true,
  }
);

      isNewUser = true;
    }

    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    if (user.status === "blocked") {
      return res.status(403).json({ msg: "Account blocked" });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      msg: "Login successful",
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        kycStatus: user.kycStatus || "not_submitted",
      },
    });
  } catch (err) {
    console.log("❌ VERIFY OTP ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const register = async (req, res) => {
  try {
    let { phone, name, referralCode } = req.body;

    if (!phone) return res.status(400).json({ msg: "Phone number required" });

    phone = String(phone).trim();
    referralCode = referralCode ? String(referralCode).trim().toUpperCase() : "";

    if (phone.length !== 10) {
      return res.status(400).json({ msg: "Invalid phone number" });
    }

    let user = await User.findOne({ phone });

    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    let referredBy = null;

    if (referralCode) {
      const refUser = await User.findOne({ referralCode });

      if (!refUser) {
        return res.status(400).json({ msg: "Invalid referral code" });
      }

      referredBy = refUser._id;
    }

    user = await User.create({
      phone,
      name: name || "Player" + Math.floor(Math.random() * 1000),
      referralCode: await generateUniqueReferralCode(),
      referredBy,
    });

    await Wallet.create({
      userId: user._id,
      balance: 0,
      bonus: 0,
      winnings: 0,
      referralBalance: 0,
      locked: 0,
    });

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        referralCode: user.referralCode,
        kycStatus: user.kycStatus || "not_submitted",
      },
    });
  } catch (err) {
    console.log("❌ REGISTER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) return res.status(400).json({ msg: "Phone number required" });

    phone = String(phone).trim();

    if (phone.length !== 10) {
      return res.status(400).json({ msg: "Invalid phone number" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        name: "Player" + Math.floor(Math.random() * 1000),
        referralCode: await generateUniqueReferralCode(),
      });

      await Wallet.create({
        userId: user._id,
        balance: 0,
        bonus: 0,
        winnings: 0,
        referralBalance: 0,
        locked: 0,
      });
    }

    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    if (user.status === "blocked") {
      return res.status(403).json({ msg: "Account blocked" });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        referralCode: user.referralCode,
        kycStatus: user.kycStatus || "not_submitted",
      },
    });
  } catch (err) {
    console.log("❌ LOGIN ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const profile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;

    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    const wallet = await Wallet.findOne({ userId: user._id });

    const referralCount = await User.countDocuments({
      referredBy: user._id,
    });

    const matches = await Battle.countDocuments({
      $or: [{ createdBy: user._id }, { opponent: user._id }],
      status: { $in: ["pending", "running", "completed", "cancelled"] },
    });

    res.json({
      ...user.toObject(),
      kycStatus: user.kycStatus || "not_submitted",

      totalWon: Number(wallet?.winnings || 0),
      matches: Number(matches || 0),

      referralStats: {
        referrals: referralCount,
        earned: Number(user.totalReferralEarning || 0),
        referralBalance: Number(wallet?.referralBalance || 0),
      },
    });
  } catch (err) {
    console.log("❌ PROFILE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

export const submitKyc = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    const { name, dob, docType, docNumber } = req.body;

    if (!name || !dob || !docType || !docNumber) {
      return res.status(400).json({
        success: false,
        msg: "All KYC fields are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    if (user.kycStatus === "approved") {
      return res.status(400).json({
        success: false,
        msg: "KYC already approved",
        kycStatus: "approved",
      });
    }

    if (user.kycStatus === "pending") {
      return res.status(400).json({
        success: false,
        msg: "KYC already submitted and under review",
        kycStatus: "pending",
      });
    }

    user.kycStatus = "pending";
    user.kyc = {
      name: String(name).trim(),
      dob: String(dob).trim(),
      docType: String(docType).trim(),
      docNumber: String(docNumber).trim(),
      submittedAt: new Date(),
      approvedAt: null,
      rejectedAt: null,
      rejectReason: "",
    };

    await user.save();

    return res.json({
      success: true,
      msg: "KYC submitted successfully",
      kycStatus: user.kycStatus,
      kyc: user.kyc,
    });
  } catch (err) {
    console.log("❌ SUBMIT KYC ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};


export const updateName = async (req, res) => {
  try {
    const userId = req.user?.id || req.user;
    let { name } = req.body;

    name = String(name || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, msg: "Name required" });
    }


    if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
  return res.status(400).json({
    success: false,
    msg: "Invalid name",
  });
}
    if (name.length < 3 || name.length > 20) {
      return res.status(400).json({
        success: false,
        msg: "Name 3 se 20 character ke beech hona chahiye",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true }
    ).select("-password -__v");

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    return res.json({
      success: true,
      msg: "Name updated successfully",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        phone: user.phone,
        referralCode: user.referralCode,
        kycStatus: user.kycStatus || "not_submitted",
      },
    });
  } catch (err) {
    console.log("❌ UPDATE NAME ERROR:", err);
    return res.status(500).json({ success: false, msg: err.message });
  }
};