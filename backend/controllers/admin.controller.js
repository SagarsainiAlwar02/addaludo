import bcrypt from "bcryptjs";
import Contest from "../models/contest.js";
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import PaymentSetting from "../models/paymentSetting.js";
import TrackedAccount from "../models/trackedAccount.js";
import Setting from "../models/setting.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateReferralCode } from "../utils/generateId.js";
import { sanitizeForUser, sanitizePermissions } from "../utils/permissions.js";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse,
} from "../utils/apiResponse.js";
import {
  settleContest,
  refundBothPlayers,
  formatContestResponse,
} from "../services/contest.service.js";
import { emitContestUpdate } from "../services/socket.service.js";
import {
  creditBonus,
  deductPenalty,
  approveWithdraw as approveWithdrawWallet,
  rejectWithdraw as rejectWithdrawWallet,
  getOrCreateWallet,
} from "../services/wallet.service.js";

/**
 * admin.controller.js
 * Admin dashboard, approvals, user management, KYC, tracked accounts.
 */

const cleanPhone = (phone) => String(phone || "").replace(/\D/g, "");

// ================= DASHBOARD =================

/**
 * All cumulative dashboard stats (deposit, withdraw, earnings, commission,
 * referral, bonus, penalty, hold/wallet balance) are counted from this date
 * onwards. Everything before this reset date is ignored on the dashboard.
 * "Total Users" is NOT affected by this.
 */
const DASHBOARD_START_DATE = new Date("2026-08-05T00:00:00+05:30");

// Contest statuses whose entry fees are currently locked in the platform.
const LOCKED_CONTEST_STATUSES = ["running", "room_submitted", "result_submitted", "cancel_requested"];

/**
 * Get dashboard statistics.
 * GET /api/admin/dashboard?filter=all|today
 * - filter=all   : data counted from the reset date (5 Aug 2026) onwards
 * - filter=today : only today's data
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const filter = req.query.filter === "today" ? "today" : "all";

  // "Today" window aligned to IST (same zone as the dashboard reset date).
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  const istMidnight = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()));
  const startOfDay = new Date(istMidnight.getTime() - IST_OFFSET_MS);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const fromDate = filter === "today" ? startOfDay : DASHBOARD_START_DATE;

  const sumGroup = [{ $group: { _id: null, total: { $sum: "$amount" } } }];
  const sumOf = (agg) => agg[0]?.total || 0;

  const [
    totalUsers,
    newUsers,
    totalDeposit,
    totalWithdraw,
    totalBonus,
    totalPenalty,
    totalCommission,
    totalReferral,
    walletCredits,
    walletDebits,
    activeContestHold,
    pendingWithdraws,
    totalVolume,
    todayDeposit,
    todayWithdraw,
    todayCommission,
    todayBonus,
    todayPenalty,
    todayMatches,
    activeContests,
  ] = await Promise.all([
    // Total Users stays untouched (full count).
    User.countDocuments({ role: "user" }),
    User.countDocuments({ createdAt: { $gte: startOfDay } }),
    Transaction.aggregate([
      { $match: { type: "deposit", status: "success", createdAt: { $gte: fromDate } } },
      ...sumGroup,
    ]),
    Transaction.aggregate([
      { $match: { type: "withdraw", status: "success", createdAt: { $gte: fromDate } } },
      ...sumGroup,
    ]),
    Transaction.aggregate([
      { $match: { type: "bonus", status: "success", createdAt: { $gte: fromDate } } },
      ...sumGroup,
    ]),
    Transaction.aggregate([
      { $match: { type: "penalty", status: "success", createdAt: { $gte: fromDate } } },
      ...sumGroup,
    ]),
    Contest.aggregate([
      { $match: { status: "approved", completedAt: { $gte: fromDate } } },
      { $group: { _id: null, total: { $sum: "$commission" } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "referral_commission", status: "success", createdAt: { $gte: fromDate } } },
      ...sumGroup,
    ]),
    // Wallet balance (from today): money that entered player wallets.
    Transaction.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: fromDate },
          type: { $in: ["deposit", "bonus", "game_win", "refund", "referral_commission"] },
        },
      },
      ...sumGroup,
    ]),
    // Wallet balance (from today): money spent / taken out of wallets.
    Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate },
          $or: [
            { type: { $in: ["game_entry", "penalty"] }, status: "success" },
            { type: "withdraw" },
          ],
        },
      },
      ...sumGroup,
    ]),
    // Hold balance: entry fees locked in active (not yet settled) contests.
    Contest.aggregate([
      {
        $match: {
          isDummy: { $ne: true },
          status: { $in: LOCKED_CONTEST_STATUSES },
          createdAt: { $gte: fromDate },
        },
      },
      { $group: { _id: null, total: { $sum: { $multiply: ["$entryFee", { $size: "$players" }] } } } },
    ]),
    // Hold balance: pending withdraws locked from winnings.
    Transaction.aggregate([
      { $match: { type: "withdraw", status: "pending", createdAt: { $gte: fromDate } } },
      ...sumGroup,
    ]),
    // Total successful volume since fromDate (used for the "Others" donut slice).
    Transaction.aggregate([
      { $match: { status: "success", createdAt: { $gte: fromDate } } },
      ...sumGroup,
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: "deposit",
          status: "success",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      ...sumGroup,
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: "withdraw",
          status: "success",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      ...sumGroup,
    ]),
    Contest.aggregate([
      {
        $match: {
          status: "approved",
          completedAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$commission" } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: "bonus",
          status: "success",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      ...sumGroup,
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: "penalty",
          status: "success",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      ...sumGroup,
    ]),
    Contest.countDocuments({
      status: "approved",
      completedAt: { $gte: startOfDay, $lte: endOfDay },
    }),
    Contest.countDocuments({ status: { $in: LOCKED_CONTEST_STATUSES } }),
  ]);

  const deposit = sumOf(totalDeposit);
  const withdraw = sumOf(totalWithdraw);
  const bonus = sumOf(totalBonus);
  const penalty = sumOf(totalPenalty);
  const commission = sumOf(totalCommission);
  const referral = sumOf(totalReferral);
  const credits = sumOf(walletCredits);
  const debits = sumOf(walletDebits);
  const holdLocked = sumOf(activeContestHold);
  const holdPendingWithdraw = sumOf(pendingWithdraws);
  const volume = sumOf(totalVolume);
  const td = sumOf(todayDeposit);
  const tw = sumOf(todayWithdraw);
  const tc = sumOf(todayCommission);
  const tb = sumOf(todayBonus);
  const tp = sumOf(todayPenalty);

  return successResponse(
    res,
    {
      totalUsers,
      newUsers,
      totalDeposit: deposit,
      totalWithdraw: withdraw,
      totalEarnings: commission + penalty,
      totalCommission: commission,
      totalReferral: referral,
      totalBonus: bonus,
      totalPenalty: penalty,
      // Hold & wallet balances are derived from transactions since the reset date.
      holdBalance: Math.max(0, holdLocked + holdPendingWithdraw),
      walletBalance: Math.max(0, credits - debits),
      today: {
        deposit: td,
        withdraw: tw,
        earnings: tc + tp,
        commission: tc,
        bonus: tb,
        penalty: tp,
        newUsers,
        matches: todayMatches,
      },
      breakdown: {
        deposit,
        withdraw,
        bonus,
        others: Math.max(0, volume - deposit - withdraw - bonus),
      },
      activeGames: activeContests,
      // Backward-compatible flat fields
      todayDeposit: td,
      todayWithdraw: tw,
      todayCommission: tc,
      todayBonus: tb,
      todayPenalty: tp,
      activeContests,
      // Placeholder sparkline arrays (can be enhanced later)
      users: [totalUsers],
      deposit: [deposit],
      withdraw: [withdraw],
      commission: [commission],
    },
    "Dashboard stats fetched"
  );
});

// ================= USERS =================

/**
 * Get users list with search.
 * GET /api/admin/users
 */
export const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const search = String(req.query.search || "").trim();
  const skip = (page - 1) * limit;

  const query = { role: { $in: ["user", "agent"] } };
  if (search) {
    const phoneSearch = search.replace(/\D/g, "");
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: phoneSearch, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  const userIds = users.map((u) => u._id);
  const wallets = await Wallet.find({ userId: { $in: userIds } }).lean();
  const walletMap = {};
  wallets.forEach((w) => {
    walletMap[String(w.userId)] = w;
  });

  const usersWithWallet = users.map((u) => ({
    ...u,
    wallet: walletMap[String(u._id)] || null,
  }));

  return successResponse(
    res,
    sanitizeForUser(
      {
        users: usersWithWallet,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      req.user
    ),
    "Users fetched"
  );
});

/**
 * Block or unblock a user.
 * PATCH /api/admin/users/:id/block
 */
export const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!["active", "blocked"].includes(status)) {
    return badRequestResponse(res, "Status must be active or blocked", "INVALID_STATUS");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).select("-password");

  if (!user) {
    return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
  }

  return successResponse(
    res,
    { user },
    `User ${status === "blocked" ? "blocked" : "unblocked"} successfully`
  );
});

// ================= CONTESTS =================

/**
 * Get all contests with filters.
 * GET /api/admin/contests
 */
export const getContests = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const status = req.query.status;
  const contestId = req.query.contestId;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.status = status;
  if (contestId) query.contestId = contestId;

  const [contests, total] = await Promise.all([
    Contest.find(query)
      .populate("players.userId", "name phone")
      .populate("winner.userId", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Contest.countDocuments(query),
  ]);

  return successResponse(
    res,
    sanitizeForUser(
      {
        contests: contests.map(formatContestResponse),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      req.user
    ),
    "Contests fetched"
  );
});

/**
 * Get single contest detail.
 * GET /api/admin/contests/:id
 */
export const getContestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contest = await Contest.findById(id)
    .populate("players.userId", "name phone")
    .populate("winner.userId", "name phone");

  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  return successResponse(
    res,
    sanitizeForUser({ contest: formatContestResponse(contest) }, req.user),
    "Contest fetched"
  );
});

/**
 * Approve contest winner.
 * PATCH /api/admin/contests/:id/approve
 */
export const approveContest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { winnerId, adminNote } = req.body || {};

  if (!winnerId) {
    return badRequestResponse(res, "Winner ID required", "WINNER_ID_REQUIRED");
  }

  const contest = await Contest.findById(id);
  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  const isPlayer = contest.players.some(
    (p) => p.userId && String(p.userId) === String(winnerId)
  );
  if (!isPlayer) {
    return badRequestResponse(res, "Winner is not a player in this contest", "INVALID_WINNER");
  }

  if (adminNote) contest.adminNote = adminNote;

  const settled = await settleContest(contest, winnerId);
  if (!settled) {
    return badRequestResponse(
      res,
      "Contest already settled or invalid status",
      "ALREADY_SETTLED"
    );
  }

  const approveFormatted = formatContestResponse(settled);
  emitContestUpdate("contest-updated", approveFormatted);

  return successResponse(res, { contest: approveFormatted }, "Winner approved and prize credited");
});

/**
 * Reject/cancel a contest and refund both players.
 * PATCH /api/admin/contests/:id/reject
 */
export const rejectContest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminNote } = req.body || {};

  const contest = await Contest.findById(id);
  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  if (["approved", "cancelled"].includes(contest.status)) {
    return badRequestResponse(res, "Contest already closed", "ALREADY_CLOSED");
  }

  const reason = adminNote || "Cancelled by admin";
  const refunded = await refundBothPlayers(contest, reason);

  if (adminNote && !refunded.adminNote) refunded.adminNote = adminNote;

  const rejectFormatted = formatContestResponse(refunded);
  emitContestUpdate("contest-updated", rejectFormatted);

  return successResponse(res, { contest: rejectFormatted }, "Contest cancelled and refunded");
});

// ================= DEPOSITS =================

/**
 * Get pending deposits list.
 * GET /api/admin/deposits
 */
export const getDeposits = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;

  const query = { type: "deposit" };
  if (req.query.status) query.status = req.query.status;

  const [deposits, total] = await Promise.all([
    Transaction.find(query)
      .populate("userId", "name phone")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return successResponse(
    res,
    sanitizeForUser(
      {
        deposits,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      req.user
    ),
    "Deposits fetched"
  );
});

/**
 * Approve a deposit.
 * PATCH /api/admin/deposits/:id/approve
 */
export const approveDeposit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: id,
      type: "deposit",
      status: "pending",
    },
    {
      $set: {
        status: "success",
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!transaction) {
    return notFoundResponse(res, "Pending deposit not found", "DEPOSIT_NOT_FOUND");
  }

  // Credit to user's balance
  const wallet = await getOrCreateWallet(transaction.userId);
  wallet.balance = Number(wallet.balance || 0) + Number(transaction.amount);
  await wallet.save();

  return successResponse(
    res,
    { transaction },
    "Deposit approved and balance credited"
  );
});

/**
 * Reject a deposit.
 * PATCH /api/admin/deposits/:id/reject
 */
export const rejectDeposit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminNote } = req.body || {};
  const adminId = req.user._id;

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: id,
      type: "deposit",
      status: "pending",
    },
    {
      $set: {
        status: "rejected",
        adminNote: adminNote || "",
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!transaction) {
    return notFoundResponse(res, "Pending deposit not found", "DEPOSIT_NOT_FOUND");
  }

  return successResponse(res, { transaction }, "Deposit rejected");
});

// ================= WITHDRAWS =================

/**
 * Get pending withdraws list.
 * GET /api/admin/withdraws
 */
export const getWithdraws = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;

  const query = { type: "withdraw" };
  if (req.query.status) query.status = req.query.status;

  const [withdraws, total] = await Promise.all([
    Transaction.find(query)
      .populate("userId", "name phone")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return successResponse(
    res,
    sanitizeForUser(
      {
        withdraws,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      req.user
    ),
    "Withdraws fetched"
  );
});

/**
 * Approve a withdraw.
 * PATCH /api/admin/withdraws/:id/approve
 */
export const approveWithdraw = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: id,
      type: "withdraw",
      status: "pending",
    },
    {
      $set: {
        status: "success",
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!transaction) {
    return notFoundResponse(res, "Pending withdraw not found", "WITHDRAW_NOT_FOUND");
  }

  await approveWithdrawWallet(transaction.userId, transaction.amount);

  return successResponse(res, { transaction }, "Withdraw approved");
});

/**
 * Reject a withdraw.
 * PATCH /api/admin/withdraws/:id/reject
 */
export const rejectWithdraw = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminNote } = req.body || {};
  const adminId = req.user._id;

  const transaction = await Transaction.findOneAndUpdate(
    {
      _id: id,
      type: "withdraw",
      status: "pending",
    },
    {
      $set: {
        status: "rejected",
        adminNote: adminNote || "",
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!transaction) {
    return notFoundResponse(res, "Pending withdraw not found", "WITHDRAW_NOT_FOUND");
  }

  await rejectWithdrawWallet(transaction.userId, transaction.amount);

  await Transaction.create({
    userId: transaction.userId,
    amount: transaction.amount,
    type: "refund",
    status: "success",
    direction: "in",
    note: adminNote || "Withdraw rejected - amount refunded to winnings",
    balanceAfter: null,
  });

  return successResponse(res, { transaction }, "Withdraw rejected and amount refunded");
});

// ================= BONUS / PENALTY =================

/**
 * Add bonus to a user.
 * POST /api/admin/bonus
 */
export const addBonus = asyncHandler(async (req, res) => {
  let { userId, mobile, amount, note } = req.body || {};
  const adminId = req.user._id;

  const bonusAmount = Number(amount || 0);
  if (!bonusAmount || bonusAmount <= 0) {
    return badRequestResponse(res, "Invalid bonus amount", "INVALID_AMOUNT");
  }

  if (!userId && mobile) {
    const phone = String(mobile).replace(/\D/g, "").slice(-10);
    const user = await User.findOne({ phone });
    if (!user) return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
    userId = user._id;
  }

  if (!userId) {
    return badRequestResponse(res, "userId or mobile required", "USER_ID_REQUIRED");
  }

  const user = await User.findById(userId);
  if (!user) return notFoundResponse(res, "User not found", "USER_NOT_FOUND");

  await creditBonus(userId, bonusAmount, {
    note: note || "Admin bonus",
    approvedBy: adminId,
  });

  return successResponse(res, null, "Bonus added successfully");
});

/**
 * Deduct penalty from a user.
 * POST /api/admin/penalty
 */
export const addPenalty = asyncHandler(async (req, res) => {
  let { userId, mobile, amount, note } = req.body || {};
  const adminId = req.user._id;

  const penaltyAmount = Number(amount || 0);
  if (!penaltyAmount || penaltyAmount <= 0) {
    return badRequestResponse(res, "Invalid penalty amount", "INVALID_AMOUNT");
  }

  if (!userId && mobile) {
    const phone = String(mobile).replace(/\D/g, "").slice(-10);
    const user = await User.findOne({ phone });
    if (!user) return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
    userId = user._id;
  }

  if (!userId) {
    return badRequestResponse(res, "userId or mobile required", "USER_ID_REQUIRED");
  }

  const user = await User.findById(userId);
  if (!user) return notFoundResponse(res, "User not found", "USER_NOT_FOUND");

  await deductPenalty(userId, penaltyAmount, {
    note: note || "Admin penalty",
    approvedBy: adminId,
  });

  return successResponse(res, null, "Penalty deducted successfully");
});

// ================= KYC =================

/**
 * Get KYC list of all users.
 * GET /api/admin/kyc?status=pending|approved|rejected|not_submitted
 */
export const getKycList = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;

  const query = { role: { $in: ["user", "agent"] } };
  const status = String(req.query.status || "").trim();
  if (status && status !== "all") {
    // "not_submitted" covers both the legacy string and the empty-string default
    query.kycStatus = status === "not_submitted" ? { $in: ["not_submitted", ""] } : status;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return successResponse(
    res,
    sanitizeForUser(
      {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      req.user
    ),
    "KYC list fetched"
  );
});

/**
 * Approve KYC.
 * PATCH /api/admin/kyc/:id/approve
 */
export const approveKyc = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        kycStatus: "approved",
        "kyc.approvedAt": new Date(),
      },
    },
    { new: true }
  ).select("-password");

  if (!user) {
    return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
  }

  return successResponse(res, { user }, "KYC approved");
});

/**
 * Reject KYC.
 * PATCH /api/admin/kyc/:id/reject
 */
export const rejectKyc = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  const user = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        kycStatus: "rejected",
        "kyc.rejectedAt": new Date(),
        "kyc.rejectReason": reason || "",
      },
    },
    { new: true }
  ).select("-password");

  if (!user) {
    return notFoundResponse(res, "User not found", "USER_NOT_FOUND");
  }

  return successResponse(res, { user }, "KYC rejected");
});

// ================= DUMMY CONTESTS =================

/**
 * Get all dummy contests.
 * GET /api/admin/dummy-contests
 */
export const getDummyContests = asyncHandler(async (req, res) => {
  const contests = await Contest.find({ isDummy: true })
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(res, { contests }, "Dummy contests fetched");
});

// ================= ADMIN / AGENT MANAGEMENT =================

/**
 * Get admin/agent list.
 * GET /api/admin/admin-list
 */
export const getAdminList = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    return forbiddenResponse(res, "Only main admin can view admin list", "ADMIN_ONLY");
  }

  const admins = await User.find({ role: { $in: ["admin", "agent"] } })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(res, { admins }, "Admin list fetched");
});

/**
 * Create an admin/agent account.
 * POST /api/admin/create-admin (main admin only)
 */
export const createAdminAccount = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    return forbiddenResponse(res, "Only main admin can manage admin accounts", "ADMIN_ONLY");
  }

  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "admin").trim();
  const permissions = sanitizePermissions(req.body.permissions);

  if (!name || !email || !password) {
    return badRequestResponse(res, "Name, Email aur Password required hai", "FIELDS_REQUIRED");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequestResponse(res, "Invalid email address", "INVALID_EMAIL");
  }
  if (!["admin", "agent"].includes(role)) {
    return badRequestResponse(res, "Invalid role", "INVALID_ROLE");
  }
  if (password.length < 6) {
    return badRequestResponse(res, "Password minimum 6 characters hona chahiye", "WEAK_PASSWORD");
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return badRequestResponse(res, "Email already exists", "EMAIL_EXISTS");
  }

  // The User schema requires a valid 10-digit Indian mobile.
  // Generate a unique one if the form did not provide it.
  const genUniquePhone = async () => {
    let p = `9${Date.now().toString().slice(-9)}`;
    while (await User.exists({ phone: p })) {
      p = `9${String(Math.floor(100000000 + Math.random() * 900000000))}`;
    }
    return p;
  };

  let phone = String(req.body.phone || "").replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(phone)) {
    phone = await genUniquePhone();
  } else if (await User.exists({ phone })) {
    return badRequestResponse(res, "Phone number already in use", "PHONE_EXISTS");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role,
    status: "active",
    permissions: role === "agent" ? permissions : [],
    referralCode: generateReferralCode(),
  });

  return successResponse(
    res,
    {
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions || [],
      },
    },
    `${role} created successfully`
  );
});

/**
 * Update an admin/agent account (name, email, password, role, permissions).
 * PATCH /api/admin/update/:id (main admin only)
 */
export const updateAdminAccount = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    return forbiddenResponse(res, "Only main admin can manage admin accounts", "ADMIN_ONLY");
  }

  const { id } = req.params;

  const target = await User.findById(id);
  if (!target || !["admin", "agent"].includes(target.role)) {
    return notFoundResponse(res, "Admin / Agent not found", "ADMIN_NOT_FOUND");
  }

  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = req.body.password ? String(req.body.password) : "";
  const role = String(req.body.role || target.role || "agent").trim();
  const permissions = req.body.permissions !== undefined
    ? sanitizePermissions(req.body.permissions)
    : target.permissions || [];

  if (!["admin", "agent"].includes(role)) {
    return badRequestResponse(res, "Invalid role", "INVALID_ROLE");
  }

  // Can't demote yourself / remove your own admin role via this endpoint.
  if (String(id) === String(req.user._id) && role !== "admin") {
    return badRequestResponse(res, "You cannot change your own role", "CANNOT_CHANGE_SELF");
  }

  if (name) target.name = name;
  if (email && email !== target.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequestResponse(res, "Invalid email address", "INVALID_EMAIL");
    }
    const exists = await User.findOne({ email, _id: { $ne: id } });
    if (exists) {
      return badRequestResponse(res, "Email already exists", "EMAIL_EXISTS");
    }
    target.email = email;
  }

  if (password) {
    if (password.length < 6) {
      return badRequestResponse(res, "Password minimum 6 characters hona chahiye", "WEAK_PASSWORD");
    }
    target.password = await bcrypt.hash(password, 10);
  }

  target.role = role;
  target.permissions = role === "agent" ? permissions : [];
  await target.save();

  return successResponse(
    res,
    {
      admin: {
        _id: target._id,
        name: target.name,
        email: target.email,
        role: target.role,
        status: target.status,
        permissions: target.permissions || [],
      },
    },
    "Admin / Agent updated successfully"
  );
});

/**
 * Get the currently logged-in admin/agent session (role + permissions).
 * GET /api/admin/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id).select("-password").lean();
  if (!admin) {
    return notFoundResponse(res, "Admin / Agent not found", "ADMIN_NOT_FOUND");
  }

  return successResponse(
    res,
    {
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions || [],
      },
    },
    "Session fetched"
  );
});

/**
 * Delete an admin/agent account.
 * DELETE /api/admin/delete/:id (main admin only)
 */
export const deleteAdminAccount = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    return forbiddenResponse(res, "Only main admin can manage admin accounts", "ADMIN_ONLY");
  }

  const { id } = req.params;

  if (String(id) === String(req.user._id)) {
    return badRequestResponse(res, "Cannot delete your own account", "CANNOT_DELETE_SELF");
  }

  const admin = await User.findById(id);
  if (!admin) {
    return notFoundResponse(res, "Admin / Agent not found", "ADMIN_NOT_FOUND");
  }
  if (!["admin", "agent"].includes(admin.role)) {
    return badRequestResponse(res, "Only admin/agent delete ho sakta hai", "INVALID_ROLE");
  }

  await User.findByIdAndDelete(id);
  return successResponse(res, null, "Admin / Agent deleted successfully");
});

/**
 * Get admin/agent activity report (deposits, withdraws, bonus, penalty).
 * GET /api/admin/agent-report
 */
export const getAgentReport = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const report = await Transaction.aggregate([
    {
      $match: {
        approvedBy: { $ne: null },
        status: "success",
        type: { $in: ["deposit", "withdraw", "bonus", "penalty"] },
      },
    },
    {
      $group: {
        _id: "$approvedBy",
        totalDeposit: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] } },
        totalWithdraw: { $sum: { $cond: [{ $eq: ["$type", "withdraw"] }, "$amount", 0] } },
        todayDeposit: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$type", "deposit"] }, { $gte: ["$approvedAt", start] }, { $lte: ["$approvedAt", end] }] },
              "$amount",
              0,
            ],
          },
        },
        todayWithdraw: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$type", "withdraw"] }, { $gte: ["$approvedAt", start] }, { $lte: ["$approvedAt", end] }] },
              "$amount",
              0,
            ],
          },
        },
        totalBonus: { $sum: { $cond: [{ $eq: ["$type", "bonus"] }, "$amount", 0] } },
        totalPenalty: { $sum: { $cond: [{ $eq: ["$type", "penalty"] }, "$amount", 0] } },
        totalApprovedCount: { $sum: 1 },
      },
    },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "admin" } },
    { $unwind: { path: "$admin", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        adminId: "$_id",
        adminName: { $ifNull: ["$admin.name", "Unknown Admin"] },
        adminEmail: { $ifNull: ["$admin.email", ""] },
        adminPhone: { $ifNull: ["$admin.phone", ""] },
        adminRole: { $ifNull: ["$admin.role", "admin"] },
        totalDeposit: 1,
        totalWithdraw: 1,
        todayDeposit: 1,
        todayWithdraw: 1,
        totalBonus: 1,
        totalPenalty: 1,
        totalApprovedCount: 1,
      },
    },
    { $sort: { totalDeposit: -1 } },
  ]);

  return successResponse(res, { agentReport: report }, "Agent report fetched");
});

// ================= WEBSITE SETTINGS =================

const getOrCreateSetting = async () => {
  let setting = await Setting.findOne();
  if (!setting) {
    setting = await Setting.create({});
  }
  return setting;
};

/**
 * Get website settings.
 * GET /api/admin/settings
 */
export const getWebsiteSettings = asyncHandler(async (req, res) => {
  const setting = await getOrCreateSetting();
  return successResponse(
    res,
    {
      websiteName: setting.websiteName || "",
      supportNumber: setting.supportNumber || "",
    },
    "Settings fetched"
  );
});

/**
 * Save website settings.
 * POST /api/admin/settings
 */
export const saveWebsiteSettings = asyncHandler(async (req, res) => {
  const setting = await getOrCreateSetting();

  setting.websiteName = String(req.body.websiteName || "").trim();
  setting.supportNumber = String(req.body.supportNumber || "").trim();
  await setting.save();

  return successResponse(
    res,
    {
      websiteName: setting.websiteName,
      supportNumber: setting.supportNumber,
    },
    "Settings saved"
  );
});

// ================= TRACKED ACCOUNTS =================

/**
 * Add a tracked account.
 * POST /api/admin/tracked-accounts
 */
export const addTrackedAccount = asyncHandler(async (req, res) => {
  const { phone, note } = req.body || {};
  const clean = cleanPhone(phone);

  if (!clean || clean.length !== 10) {
    return badRequestResponse(res, "Valid 10 digit mobile number required", "INVALID_PHONE");
  }

  const exists = await TrackedAccount.findOne({ phone: clean });
  if (exists) {
    return badRequestResponse(res, "This number is already tracked", "ALREADY_TRACKED");
  }

  const account = await TrackedAccount.create({
    phone: clean,
    note: String(note || "").trim(),
  });

  return successResponse(res, { account }, "Tracked account added");
});

/**
 * Get all tracked accounts.
 * GET /api/admin/tracked-accounts
 */
export const getTrackedAccounts = asyncHandler(async (req, res) => {
  const accounts = await TrackedAccount.find().sort({ createdAt: -1 }).lean();
  return successResponse(
    res,
    // Tracked phone numbers are the account identifiers -> stay visible with client_tracking
    sanitizeForUser({ accounts }, req.user, ["phone"]),
    "Tracked accounts fetched"
  );
});

/**
 * Delete a tracked account.
 * DELETE /api/admin/tracked-accounts/:id
 */
export const deleteTrackedAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const account = await TrackedAccount.findByIdAndDelete(id);
  if (!account) {
    return notFoundResponse(res, "Tracked account not found", "TRACKED_NOT_FOUND");
  }

  return successResponse(res, null, "Tracked account removed");
});

/**
 * Get tracked accounts report.
 * GET /api/admin/tracked-accounts/report
 */
export const getTrackedAccountsReport = asyncHandler(async (req, res) => {
  const tracked = await TrackedAccount.find().sort({ createdAt: -1 }).lean();
  const phones = tracked.map((t) => t.phone);

  if (phones.length === 0) {
    return successResponse(res, { accounts: [], summary: null, trackedList: tracked }, "No tracked accounts");
  }

  const users = await User.find({ phone: { $in: phones } }).select("_id phone name").lean();
  const userIds = users.map((u) => String(u._id));
  const userMap = {};
  users.forEach((u) => {
    userMap[String(u._id)] = u;
  });

  const contests = await Contest.find({
    status: { $in: ["approved", "cancelled"] },
    "players.userId": { $in: userIds },
  }).lean();

  const accounts = tracked.map((t) => {
    const user = users.find((u) => u.phone === t.phone);
    const userContests = user
      ? contests.filter((c) =>
          c.players.some((p) => String(p.userId) === String(user._id))
        )
      : [];

    const wins = userContests.filter(
      (c) => c.winner?.userId && String(c.winner.userId) === String(user?._id)
    ).length;
    const losses = userContests.length - wins;
    const totalEntry = userContests.reduce((sum, c) => sum + (c.entryFee || 0), 0);
    const totalWinnings = userContests
      .filter((c) => c.winner?.userId && String(c.winner.userId) === String(user?._id))
      .reduce((sum, c) => sum + (c.prize || 0), 0);
    const net = totalWinnings - totalEntry;

    return {
      userId: user?._id || null,
      name: user?.name || "Unknown",
      phone: t.phone,
      note: t.note || "",
      matchesPlayed: userContests.length,
      wins,
      losses,
      totalEntry,
      totalWinnings,
      net,
    };
  });

  const summary = {
    matchesPlayed: accounts.reduce((s, a) => s + a.matchesPlayed, 0),
    wins: accounts.reduce((s, a) => s + a.wins, 0),
    losses: accounts.reduce((s, a) => s + a.losses, 0),
    totalEntry: accounts.reduce((s, a) => s + a.totalEntry, 0),
    totalWinnings: accounts.reduce((s, a) => s + a.totalWinnings, 0),
    net: accounts.reduce((s, a) => s + a.net, 0),
  };

  return successResponse(
    res,
    // Tracked phone numbers are the account identifiers -> stay visible with client_tracking
    sanitizeForUser(
      { accounts, summary, trackedList: tracked },
      req.user,
      ["phone"]
    ),
    "Tracked accounts report fetched"
  );
});

/**
 * Get bonus/penalty report for Settings page.
 * GET /api/admin/settings-report
 */
export const getSettingsReport = asyncHandler(async (req, res) => {
  const bonusTxns = await Transaction.find({ type: "bonus" })
    .populate("userId", "name phone")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const penaltyTxns = await Transaction.find({ type: "penalty" })
    .populate("userId", "name phone")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const mapTxn = (t) => ({
    _id: t._id,
    name: t.userId?.name || "",
    mobile: t.userId?.phone || "",
    amount: t.amount || 0,
    reason: t.note || "",
    balanceAfter: t.balanceAfter || 0,
    adminName: t.approvedBy?.name || "Admin",
    createdAt: t.createdAt,
  });

  return successResponse(
    res,
    sanitizeForUser(
      {
        bonus: bonusTxns.map(mapTxn),
        penalty: penaltyTxns.map(mapTxn),
      },
      req.user
    ),
    "Settings report fetched"
  );
});
