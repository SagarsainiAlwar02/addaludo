import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Contest from "../models/contest.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, badRequestResponse, notFoundResponse } from "../utils/apiResponse.js";

/**
 * user.controller.js
 * User profile, referral info, and basic stats.
 */

/**
 * Get current user profile + wallet.
 * GET /api/user/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, wallet, totalMatches, wonMatches] = await Promise.all([
    User.findById(userId).select("-password"),
    Wallet.findOne({ userId }),
    Contest.countDocuments({ "players.userId": userId }),
    Contest.countDocuments({ "winner.userId": userId }),
  ]);

  if (!user) {
    return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
  }

  return successResponse(
    res,
    {
      user,
      wallet,
      stats: {
        totalMatches: totalMatches || 0,
        wonMatches: wonMatches || 0,
        totalWon: wallet?.winnings || 0,
      },
    },
    "Profile fetched"
  );
});

/**
 * Update user profile (name only for now).
 * PATCH /api/user/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name } = req.body;

  if (!name || String(name).trim().length < 2) {
    return badRequestResponse(res, "Name must be at least 2 characters", "INVALID_NAME");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name: String(name).trim() },
    { new: true }
  ).select("-password");

  if (!user) {
    return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
  }

  return successResponse(res, { user }, "Profile updated");
});

/**
 * Get referral info and earnings.
 * GET /api/user/referrals
 */
export const getReferrals = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select("referralCode totalReferralEarning");
  const wallet = await Wallet.findOne({ userId }).select("referralBalance");
  const referredUsers = await User.find({ referredBy: userId }).select("name phone createdAt");

  if (!user) {
    return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
  }

  return successResponse(
    res,
    {
      referralCode: user.referralCode,
      totalReferralEarning: user.totalReferralEarning || 0,
      referralBalance: wallet?.referralBalance || 0,
      referredCount: referredUsers.length,
      referredUsers,
    },
    "Referral info fetched"
  );
});

/**
 * Get current user stats (contests played, won, etc.).
 * GET /api/user/stats
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const Contest = (await import("../models/contest.js")).default;

  const [totalContests, wonContests, totalEarnings] = await Promise.all([
    Contest.countDocuments({ "players.userId": userId }),
    Contest.countDocuments({ "winner.userId": userId }),
    Contest.aggregate([
      { $match: { "winner.userId": userId } },
      { $group: { _id: null, total: { $sum: "$prize" } } },
    ]),
  ]);

  return successResponse(
    res,
    {
      totalContests,
      wonContests,
      totalEarnings: totalEarnings[0]?.total || 0,
    },
    "User stats fetched"
  );
});

/**
 * Submit KYC details.
 * POST /api/user/kyc
 */
export const submitKyc = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, dob, docType, docNumber } = req.body;

  if (!name || String(name).trim().length < 3) {
    return badRequestResponse(res, "Full name is required (min 3 chars)", "INVALID_NAME");
  }
  if (!dob) {
    return badRequestResponse(res, "Date of birth is required", "INVALID_DOB");
  }
  if (!docType || !["aadhar", "pan", "passport"].includes(docType)) {
    return badRequestResponse(res, "Valid document type required", "INVALID_DOC_TYPE");
  }
  if (!docNumber || String(docNumber).trim().length < 4) {
    return badRequestResponse(res, "Valid document number required", "INVALID_DOC_NUMBER");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "kyc.name": String(name).trim(),
        "kyc.dob": dob,
        "kyc.docType": docType,
        "kyc.docNumber": String(docNumber).trim().toUpperCase(),
        "kyc.submittedAt": new Date(),
        kycStatus: "pending",
      },
    },
    { new: true }
  ).select("kycStatus");

  if (!user) {
    return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
  }

  return successResponse(res, { kycStatus: user.kycStatus }, "KYC submitted successfully");
});
