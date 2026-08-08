import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
} from "../utils/apiResponse.js";
import { generateOtp, generateReferralCode } from "../utils/generateId.js";
import { getOrCreateWallet } from "../services/wallet.service.js";
import { setOtp, isOtpValid, deleteOtp } from "../utils/otpStore.js";

/**
 * auth.controller.js
 * User OTP authentication and admin login.
 */

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in environment");
  return secret;
};
const JWT_EXPIRES_IN = "7d";

/**
 * Send OTP to phone number.
 * POST /api/auth/otp/send
 */
export const sendOtp = asyncHandler(async (req, res) => {
  let phone = req.body?.phone ?? req.body?.mobileNumber ?? req.body?.number;

  if (!phone) {
    return badRequestResponse(res, "Phone number required", "PHONE_REQUIRED");
  }

  phone = String(phone).trim();

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return badRequestResponse(res, "Invalid phone number", "INVALID_PHONE");
  }

  const otp = generateOtp();
  setOtp(phone, otp);

  if (process.env.OTP_DEV_MODE === "true") {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  } else {
    try {
      const smsRes = await fetch("https://meraotp.in/api/sendSMS", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: process.env.MERAOTP_API_KEY,
          mobileNo: phone,
          messageType: "AUTH_OTP",
          brandName: "ADDA",
          otp,
          senderId: "MRAOTP",
        }),
      });
      const smsResponse = await smsRes.json();

      console.log(`SMS sent to ${phone}: ${JSON.stringify(smsResponse)}`);
    } catch (smsErr) {
      console.log(`SMS GATEWAY WARNING (Fallback Mode): ${smsErr.message}`);
    }
  }

  return successResponse(
    res,
    { verificationId: `v_id_${phone}` },
    "OTP generated successfully"
  );
});

/**
 * Verify OTP and login/register user.
 * POST /api/auth/otp/verify
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  let phone = req.body?.phone ?? req.body?.mobileNumber;
  let otp = req.body?.otp ?? req.body?.code;
  let referralCode = req.body?.referralCode;

  if (!phone || !otp) {
    return badRequestResponse(res, "Phone and OTP required", "PHONE_OTP_REQUIRED");
  }

  phone = String(phone).trim();
  otp = String(otp).trim();
  referralCode = referralCode ? String(referralCode).trim().toUpperCase() : "";

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return badRequestResponse(res, "Invalid phone number", "INVALID_PHONE");
  }

  if (!isOtpValid(phone, otp)) {
    return badRequestResponse(res, "Invalid or expired OTP", "INVALID_OTP");
  }

  deleteOtp(phone);

  let user = await User.findOne({ phone });

  // Register new user if not found
  if (!user) {
    let referredBy = null;

    if (referralCode) {
      const refUser = await User.findOne({ referralCode });
      if (!refUser) {
        return badRequestResponse(res, "Invalid referral code", "INVALID_REFERRAL");
      }
      if (String(refUser.phone) === String(phone)) {
        return badRequestResponse(res, "Self referral not allowed", "SELF_REFERRAL");
      }
      referredBy = refUser._id;
    }

    const randomName = "Player" + Math.floor(Math.random() * 10000);

    user = await User.create({
      phone,
      name: randomName,
      password: "nopassword",
      role: "user",
      status: "active",
      referralCode: generateReferralCode(),
      referredBy,
    });

    // Create wallet for new user
    await getOrCreateWallet(user._id);
  }

  if (user.status === "blocked") {
    return unauthorizedResponse(res, "Account blocked", "ACCOUNT_BLOCKED");
  }

  // Ensure user has a referral code
  if (!user.referralCode) {
    user.referralCode = generateReferralCode();
    await user.save();
  }

  // Ensure wallet exists
  const wallet = await getOrCreateWallet(user._id);

  const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });

  return successResponse(
    res,
    {
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        phone: user.phone,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        role: user.role,
        status: user.status,
      },
      wallet,
    },
    "Login successful"
  );
});

/**
 * Admin login with email and password.
 * POST /api/auth/admin/login
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return badRequestResponse(res, "Email and password required", "CREDENTIALS_REQUIRED");
  }

  const admin = await User.findOne({
    email,
    role: { $in: ["admin", "agent"] },
  });

  if (!admin) {
    return unauthorizedResponse(res, "Admin not found", "ADMIN_NOT_FOUND");
  }

  if (admin.status === "blocked") {
    return unauthorizedResponse(res, "Account blocked", "ACCOUNT_BLOCKED");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return unauthorizedResponse(res, "Wrong password", "WRONG_PASSWORD");
  }

  const token = jwt.sign({ id: admin._id, role: admin.role }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });

  return successResponse(
    res,
    {
      token,
      admin: {
        id: admin._id,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
      },
    },
    "Admin login successful"
  );
});

/**
 * Create a default admin (development helper).
 * GET /api/auth/admin/create
 */
export const createAdmin = asyncHandler(async (req, res) => {
  const email = "admin@addaludo.com";
  const password = "admin123";

  let admin = await User.findOne({ email });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (admin) {
    admin.role = "admin";
    admin.status = "active";
    admin.password = hashedPassword;
    await admin.save();

    return successResponse(res, null, "Admin updated");
  }

  admin = await User.create({
    name: "Main Admin",
    email,
    password: hashedPassword,
    phone: "8888888888",
    role: "admin",
    status: "active",
    referralCode: generateReferralCode(),
  });

  await getOrCreateWallet(admin._id);

  return successResponse(res, { admin }, "Admin created");
});
