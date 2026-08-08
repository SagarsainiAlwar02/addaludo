import Transaction from "../models/transaction.js";
import PaymentSetting from "../models/paymentSetting.js";
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  conflictResponse,
} from "../utils/apiResponse.js";
import { lockWithdrawAmount, redeemReferral } from "../services/wallet.service.js";

/**
 * transaction.controller.js
 * User-facing deposit requests, withdraw requests, and transaction history.
 */

/**
 * Get or create default payment settings.
 */
const getPaymentSettings = async () => {
  let settings = await PaymentSetting.findOne();
  if (!settings) {
    settings = await PaymentSetting.create({});
  }
  return settings;
};

/**
 * Validate deposit amount against payment method limits.
 */
const validateDepositAmount = (amount, method, settings) => {
  amount = Number(amount || 0);
  if (!amount || amount < 1) return "Invalid amount";

  if (method === "qr") {
    const min = Number(settings?.scanner?.min || 0);
    const max = Number(settings?.scanner?.max || 2000);
    if (amount < min) return `Minimum QR deposit is ₹${min}`;
    if (amount > max) return `Maximum QR deposit is ₹${max}`;
  } else if (method === "upi_bank") {
    const min = Number(settings?.upiLimit?.min ?? 100);
    const max = Number(settings?.upiLimit?.max ?? 100000);
    if (amount < min) return `Minimum UPI/Bank deposit is ₹${min}`;
    if (amount > max) return `Maximum UPI/Bank deposit is ₹${max}`;
  }

  return null;
};

/**
 * Request a deposit.
 * POST /api/transactions/deposit
 */
export const requestDeposit = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { amount, paymentMethod, utr } = req.body;

  const rawMethod = String(paymentMethod || "").toLowerCase();
  const methodMap = { qr: "qr", upi: "upi_bank", bank: "upi_bank", upi_bank: "upi_bank" };
  const method = methodMap[rawMethod];
  if (!method) {
    return badRequestResponse(res, "Invalid payment method", "INVALID_PAYMENT_METHOD");
  }

  if (!utr || String(utr).trim().length < 6) {
    return badRequestResponse(res, "UTR is required (min 6 chars)", "INVALID_UTR");
  }

  if (!req.file) {
    return badRequestResponse(res, "Screenshot is required", "SCREENSHOT_REQUIRED");
  }

  const settings = await getPaymentSettings();
  const amountError = validateDepositAmount(amount, method, settings);
  if (amountError) {
    return badRequestResponse(res, amountError, "INVALID_AMOUNT");
  }

  const utrString = String(utr).trim();

  // Duplicate UTR check
  const existingUtr = await Transaction.findOne({ utr: utrString });
  if (existingUtr) {
    return conflictResponse(res, "UTR already submitted", "UTR_EXISTS");
  }

  const screenshotPath = `/uploads/deposits/${req.file.filename}`;

  const transaction = await Transaction.create({
    userId,
    amount: Number(amount),
    type: "deposit",
    status: "pending",
    direction: "in",
    paymentMethod: method,
    utr: utrString,
    screenshot: screenshotPath,
    note: "Deposit request pending admin approval",
  });

  return successResponse(
    res,
    { transaction },
    "Deposit request submitted. Pending admin approval."
  );
});

/**
 * Get user's deposit history.
 * GET /api/transactions/deposits
 */
export const getMyDeposits = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const transactions = await Transaction.find({
    userId,
    type: "deposit",
  })
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(res, { deposits: transactions }, "Deposit history fetched");
});

/**
 * Request a withdraw.
 * POST /api/transactions/withdraw
 */
export const requestWithdraw = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { amount, method, details } = req.body;

  const withdrawMethod = String(method || "").toLowerCase();
  if (!["bank", "upi", "qr"].includes(withdrawMethod)) {
    return badRequestResponse(res, "Invalid withdraw method", "INVALID_WITHDRAW_METHOD");
  }

  const withdrawAmount = Number(amount || 0);
  if (!withdrawAmount || withdrawAmount < 1) {
    return badRequestResponse(res, "Invalid amount", "INVALID_AMOUNT");
  }

  // KYC check
  const user = await User.findById(userId).select("kycStatus");
  if (user?.kycStatus !== "approved") {
    return badRequestResponse(
      res,
      "KYC approval required for withdrawals",
      "KYC_REQUIRED"
    );
  }

  // Check pending withdraws
  const pendingWithdraw = await Transaction.findOne({
    userId,
    type: "withdraw",
    status: "pending",
  });
  if (pendingWithdraw) {
    return badRequestResponse(
      res,
      "You already have a pending withdraw request",
      "PENDING_WITHDRAW_EXISTS"
    );
  }

  const wallet = await Wallet.findOne({ userId });
  if (!wallet || Number(wallet.winnings || 0) < withdrawAmount) {
    return badRequestResponse(
      res,
      "Insufficient winnings balance",
      "INSUFFICIENT_WINNINGS"
    );
  }

  // Lock withdraw amount from winnings
  await lockWithdrawAmount(userId, withdrawAmount);

  const transaction = await Transaction.create({
    userId,
    amount: withdrawAmount,
    type: "withdraw",
    status: "pending",
    direction: "out",
    withdrawMethod,
    details: details || {},
    note: "Withdraw request pending admin approval",
  });

  return successResponse(
    res,
    { transaction },
    "Withdraw request submitted. Pending admin approval."
  );
});

/**
 * Get user's withdraw history.
 * GET /api/transactions/withdraws
 */
export const getMyWithdraws = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const transactions = await Transaction.find({
    userId,
    type: "withdraw",
  })
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(res, { withdraws: transactions }, "Withdraw history fetched");
});

/**
 * Get all transaction history for current user.
 * GET /api/transactions/history
 */
export const getMyHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const transactions = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(
    res,
    { transactions },
    "Transaction history fetched"
  );
});

/**
 * Redeem referral balance to main balance.
 * POST /api/transactions/redeem-referral
 */
export const redeemReferralBalance = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { amount } = req.body;

  const redeemAmount = Number(amount || 0);
  if (!redeemAmount || redeemAmount < 1) {
    return badRequestResponse(res, "Invalid amount", "INVALID_AMOUNT");
  }

  try {
    await redeemReferral(userId, redeemAmount);
  } catch (err) {
    if (err.code === "INSUFFICIENT_REFERRAL") {
      return badRequestResponse(res, "Insufficient referral balance", "INSUFFICIENT_REFERRAL");
    }
    throw err;
  }

  return successResponse(res, null, "Referral balance redeemed to wallet");
});
