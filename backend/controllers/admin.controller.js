import Contest from "../models/contest.js";
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";
import PaymentSetting from "../models/paymentSetting.js";
import TrackedAccount from "../models/trackedAccount.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
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
 * Get dashboard statistics.
 * GET /api/admin/dashboard
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfDay = new Date(today);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalUsers,
    newUsers,
    totalDeposit,
    totalWithdraw,
    totalBonus,
    totalPenalty,
    totalCommission,
    totalReferral,
    walletBalances,
    todayDeposit,
    todayWithdraw,
    todayCommission,
    todayBonus,
    todayPenalty,
    activeContests,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ createdAt: { $gte: startOfDay } }),
    Transaction.aggregate([
      { $match: { type: "deposit", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "withdraw", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "bonus", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "penalty", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Contest.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$commission" } } },
    ]),
    Transaction.aggregate([
      { $match: { type: "referral_commission", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Wallet.aggregate([
      {
        $group: {
          _id: null,
          balance: { $sum: "$balance" },
          bonus: { $sum: "$bonus" },
          winnings: { $sum: "$winnings" },
          referralBalance: { $sum: "$referralBalance" },
          locked: { $sum: "$locked" },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: "deposit",
          status: "success",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: "withdraw",
          status: "success",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
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
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: "penalty",
          status: "success",
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Contest.countDocuments({
      status: { $in: ["running", "room_submitted", "result_submitted", "cancel_requested"] },
    }),
  ]);

  const balances = walletBalances[0] || {
    balance: 0,
    bonus: 0,
    winnings: 0,
    referralBalance: 0,
    locked: 0,
  };

  const totalEarnings =
    (totalCommission[0]?.total || 0) +
    (totalPenalty[0]?.total || 0);

  return successResponse(
    res,
    {
      totalUsers,
      newUsers,
      totalDeposit: totalDeposit[0]?.total || 0,
      totalWithdraw: totalWithdraw[0]?.total || 0,
      totalEarnings,
      totalCommission: totalCommission[0]?.total || 0,
      totalReferral: totalReferral[0]?.total || 0,
      totalBonus: totalBonus[0]?.total || 0,
      totalPenalty: totalPenalty[0]?.total || 0,
      holdBalance: balances.locked,
      walletBalance: balances.balance + balances.bonus + balances.winnings + balances.referralBalance,
      todayDeposit: todayDeposit[0]?.total || 0,
      todayWithdraw: todayWithdraw[0]?.total || 0,
      todayCommission: todayCommission[0]?.total || 0,
      todayBonus: todayBonus[0]?.total || 0,
      todayPenalty: todayPenalty[0]?.total || 0,
      activeContests,
      // Placeholder sparkline arrays (can be enhanced later)
      users: [totalUsers],
      deposit: [totalDeposit[0]?.total || 0],
      withdraw: [totalWithdraw[0]?.total || 0],
      commission: [totalCommission[0]?.total || 0],
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
    {
      users: usersWithWallet,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
    "Users fetched"
  );
});

/**
 * Block or unblock a user.
 * PATCH /api/admin/users/:id/block
 */
export const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

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
    {
      contests: contests.map(formatContestResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
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
    { contest: formatContestResponse(contest) },
    "Contest fetched"
  );
});

/**
 * Approve contest winner.
 * PATCH /api/admin/contests/:id/approve
 */
export const approveContest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { winnerId, adminNote } = req.body;

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
  const { adminNote } = req.body;

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
    {
      deposits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
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
  const { adminNote } = req.body;
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
    {
      withdraws,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
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
  const { adminNote } = req.body;
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
  let { userId, mobile, amount, note } = req.body;
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
  let { userId, mobile, amount, note } = req.body;
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
 * Get pending KYC list.
 * GET /api/admin/kyc
 */
export const getKycList = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;

  const query = { kycStatus: { $in: ["pending", "not_submitted"] } };

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
    {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
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
  const { reason } = req.body;

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

// ================= TRACKED ACCOUNTS =================

/**
 * Add a tracked account.
 * POST /api/admin/tracked-accounts
 */
export const addTrackedAccount = asyncHandler(async (req, res) => {
  const { phone, note } = req.body;
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
  return successResponse(res, { accounts }, "Tracked accounts fetched");
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

  return successResponse(res, { accounts, summary, trackedList: tracked }, "Tracked accounts report fetched");
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

  return successResponse(res, {
    bonus: bonusTxns.map(mapTxn),
    penalty: penaltyTxns.map(mapTxn),
  }, "Settings report fetched");
});
