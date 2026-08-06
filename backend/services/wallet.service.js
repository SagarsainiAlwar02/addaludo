import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";

/**
 * wallet.service.js
 * Single source of truth for ALL wallet operations.
 * Every function here is atomic and creates a corresponding Transaction record.
 */

/**
 * Get a user's wallet. Create one with zero balances if it doesn't exist.
 */
export const getOrCreateWallet = async (userId) => {
  if (!userId) return null;

  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0,
      bonus: 0,
      winnings: 0,
      referralBalance: 0,
      locked: 0,
    });
  }

  return wallet;
};

/**
 * Total money a user can use to play (excluding locked and referral balance).
 */
export const getPlayableBalance = (wallet) => {
  if (!wallet) return 0;
  return (
    Number(wallet.balance || 0) +
    Number(wallet.bonus || 0) +
    Number(wallet.winnings || 0)
  );
};

/**
 * Internal helper: calculate breakdown for deduction priority
 * bonus -> balance -> winnings
 */
const calculateDeductionBreakdown = (wallet, amount) => {
  let remaining = Number(amount || 0);

  const fromBonus = Math.min(Number(wallet.bonus || 0), remaining);
  remaining -= fromBonus;

  const fromBalance = Math.min(Number(wallet.balance || 0), remaining);
  remaining -= fromBalance;

  const fromWinnings = Math.min(Number(wallet.winnings || 0), remaining);
  remaining -= fromWinnings;

  return { fromBonus, fromBalance, fromWinnings, remaining };
};

/**
 * Internal helper: create a transaction record.
 */
const createTransaction = async ({
  userId,
  amount,
  type,
  status = "success",
  direction = null,
  contestId = null,
  note = "",
  uniqueTransactionKey = null,
  balanceAfter = null,
  extra = {},
}) => {
  const payload = {
    userId,
    amount,
    type,
    status,
    direction,
    note,
    balanceAfter,
  };

  if (contestId) payload.contestId = contestId;
  if (uniqueTransactionKey) payload.uniqueTransactionKey = uniqueTransactionKey;

  Object.assign(payload, extra);

  return Transaction.create(payload);
};

/**
 * Lock entry fee from a user's wallet.
 * Deduction priority: bonus -> balance -> winnings.
 * Adds the full amount to wallet.locked.
 */
export const lockAmount = async (userId, amount, { contestId = null, note = "Contest entry fee locked" } = {}) => {
  amount = Number(amount || 0);
  if (amount <= 0) throw new Error("Invalid amount");

  const wallet = await getOrCreateWallet(userId);

  if (getPlayableBalance(wallet) < amount) {
    throw Object.assign(new Error("Insufficient wallet balance"), { code: "INSUFFICIENT_BALANCE" });
  }

  const { fromBonus, fromBalance, fromWinnings } = calculateDeductionBreakdown(wallet, amount);

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      userId,
      bonus: { $gte: fromBonus },
      balance: { $gte: fromBalance },
      winnings: { $gte: fromWinnings },
    },
    {
      $inc: {
        bonus: -fromBonus,
        balance: -fromBalance,
        winnings: -fromWinnings,
        locked: amount,
      },
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw Object.assign(new Error("Wallet update failed, please retry"), { code: "WALLET_UPDATE_FAILED" });
  }

  await createTransaction({
    userId,
    amount,
    type: "game_entry",
    status: "success",
    contestId,
    note: `${note} (bonus:${fromBonus}, balance:${fromBalance}, winnings:${fromWinnings})`,
    uniqueTransactionKey: contestId ? `${contestId}_entry_${userId}` : null,
    balanceAfter: getPlayableBalance(updatedWallet),
  });

  return updatedWallet;
};

/**
 * Refund a locked amount back to user's balance.
 * Used when contest is cancelled.
 */
export const refundAmount = async (userId, amount, { contestId = null, note = "Entry fee refunded" } = {}) => {
  amount = Number(amount || 0);
  if (amount <= 0) return null;

  const refundKey = contestId ? `${contestId}_refund_${userId}` : null;

  if (refundKey) {
    const alreadyRefunded = await Transaction.findOne({ uniqueTransactionKey: refundKey });
    if (alreadyRefunded) return null;
  }

  const wallet = await getOrCreateWallet(userId);

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      userId,
      locked: { $gte: amount },
    },
    {
      $inc: {
        locked: -amount,
        balance: amount,
      },
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw Object.assign(new Error("Refund failed: locked amount insufficient"), { code: "REFUND_FAILED" });
  }

  await createTransaction({
    userId,
    amount,
    type: "refund",
    status: "success",
    contestId,
    note,
    uniqueTransactionKey: refundKey,
    balanceAfter: getPlayableBalance(updatedWallet),
  });

  return updatedWallet;
};

/**
 * Credit prize to winner's winnings and unlock their entry fee.
 * @param {string} userId
 * @param {number} prize - Prize amount to credit
 * @param {number} entryFee - Entry fee to unlock from wallet.locked
 * @param {object} options
 */
export const creditWinnings = async (userId, prize, entryFee, { contestId = null, note = "Contest winning prize" } = {}) => {
  prize = Number(prize || 0);
  entryFee = Number(entryFee || 0);
  if (prize <= 0) throw new Error("Invalid prize amount");
  if (entryFee <= 0) throw new Error("Invalid entry fee");

  const wallet = await getOrCreateWallet(userId);

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      userId,
      locked: { $gte: entryFee },
    },
    {
      $inc: {
        locked: -entryFee,
        winnings: prize,
      },
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw Object.assign(new Error("Failed to credit winnings"), { code: "CREDIT_FAILED" });
  }

  await createTransaction({
    userId,
    amount: prize,
    type: "game_win",
    status: "success",
    contestId,
    note,
    uniqueTransactionKey: contestId ? `${contestId}_game_win_${userId}` : null,
    balanceAfter: getPlayableBalance(updatedWallet),
  });

  return updatedWallet;
};

/**
 * Unlock a user's locked entry fee WITHOUT crediting it back.
 * Used for losers after a contest is settled.
 * The original game_entry transaction already records the deduction.
 */
export const unlockAmount = async (userId, amount, { contestId = null } = {}) => {
  amount = Number(amount || 0);
  if (amount <= 0) return null;

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      userId,
      locked: { $gte: amount },
    },
    {
      $inc: {
        locked: -amount,
      },
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw Object.assign(new Error("Unlock failed: locked amount insufficient"), { code: "UNLOCK_FAILED" });
  }

  return updatedWallet;
};

/**
 * Add bonus to a user's wallet.
 */
export const creditBonus = async (userId, amount, { note = "Admin bonus", approvedBy = null } = {}) => {
  amount = Number(amount || 0);
  if (amount <= 0) throw new Error("Invalid bonus amount");

  const wallet = await getOrCreateWallet(userId);

  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { bonus: amount } },
    { new: true }
  );

  await createTransaction({
    userId,
    amount,
    type: "bonus",
    status: "success",
    note,
    approvedBy,
    approvedAt: new Date(),
    balanceAfter: getPlayableBalance(updatedWallet),
  });

  return updatedWallet;
};

/**
 * Deduct penalty from a user's wallet.
 * Priority: bonus -> balance -> winnings
 */
export const deductPenalty = async (userId, amount, { note = "Admin penalty", approvedBy = null } = {}) => {
  amount = Number(amount || 0);
  if (amount <= 0) throw new Error("Invalid penalty amount");

  const wallet = await getOrCreateWallet(userId);

  if (getPlayableBalance(wallet) < amount) {
    throw Object.assign(new Error("Insufficient balance for penalty"), { code: "INSUFFICIENT_BALANCE" });
  }

  const { fromBonus, fromBalance, fromWinnings } = calculateDeductionBreakdown(wallet, amount);

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      userId,
      bonus: { $gte: fromBonus },
      balance: { $gte: fromBalance },
      winnings: { $gte: fromWinnings },
    },
    {
      $inc: {
        bonus: -fromBonus,
        balance: -fromBalance,
        winnings: -fromWinnings,
      },
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw Object.assign(new Error("Penalty deduction failed"), { code: "PENALTY_FAILED" });
  }

  await createTransaction({
    userId,
    amount,
    type: "penalty",
    status: "success",
    note,
    approvedBy,
    approvedAt: new Date(),
    balanceAfter: getPlayableBalance(updatedWallet),
  });

  return updatedWallet;
};

/**
 * Convert referralBalance to balance.
 */
export const redeemReferral = async (userId, amount) => {
  amount = Number(amount || 0);
  if (amount <= 0) throw new Error("Invalid redeem amount");

  const wallet = await getOrCreateWallet(userId);

  if (Number(wallet.referralBalance || 0) < amount) {
    throw Object.assign(new Error("Insufficient referral balance"), { code: "INSUFFICIENT_REFERRAL" });
  }

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      userId,
      referralBalance: { $gte: amount },
    },
    {
      $inc: {
        referralBalance: -amount,
        balance: amount,
      },
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw Object.assign(new Error("Referral redeem failed"), { code: "REDEEM_FAILED" });
  }

  await createTransaction({
    userId,
    amount,
    type: "referral_redeem",
    status: "success",
    note: "Referral balance redeemed to main balance",
    balanceAfter: getPlayableBalance(updatedWallet),
  });

  return updatedWallet;
};

/**
 * Credit referral commission to referrer's referralBalance.
 */
export const creditReferralCommission = async (userId, amount, { contestId = null, note = "Referral commission" } = {}) => {
  amount = Number(amount || 0);
  if (amount <= 0) return null;

  const wallet = await getOrCreateWallet(userId);

  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { referralBalance: amount } },
    { new: true }
  );

  await createTransaction({
    userId,
    amount,
    type: "referral_commission",
    status: "success",
    contestId,
    note,
    balanceAfter: Number(updatedWallet.referralBalance || 0),
  });

  return updatedWallet;
};

/**
 * Lock withdraw amount from winnings.
 */
export const lockWithdrawAmount = async (userId, amount) => {
  amount = Number(amount || 0);
  if (amount <= 0) throw new Error("Invalid withdraw amount");

  const wallet = await getOrCreateWallet(userId);

  if (Number(wallet.winnings || 0) < amount) {
    throw Object.assign(new Error("Insufficient winnings"), { code: "INSUFFICIENT_WINNINGS" });
  }

  const updatedWallet = await Wallet.findOneAndUpdate(
    {
      userId,
      winnings: { $gte: amount },
    },
    {
      $inc: {
        winnings: -amount,
        locked: amount,
      },
    },
    { new: true }
  );

  if (!updatedWallet) {
    throw Object.assign(new Error("Withdraw lock failed"), { code: "WITHDRAW_LOCK_FAILED" });
  }

  return updatedWallet;
};

/**
 * Approve a withdraw: remove from locked (money leaves platform).
 * Releases only what is actually locked, so older pending withdraws that
 * were created before locking existed still approve cleanly.
 */
export const approveWithdraw = async (userId, amount) => {
  amount = Number(amount || 0);
  if (amount <= 0) throw new Error("Invalid amount");

  const wallet = await getOrCreateWallet(userId);

  const release = Math.min(Number(wallet.locked || 0), amount);

  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId },
    {
      $inc: {
        locked: -release,
      },
    },
    { new: true }
  );

  return updatedWallet;
};

/**
 * Reject a withdraw: move locked amount back to winnings.
 * Always credits the full amount back to winnings and releases whatever is
 * locked, so legacy withdraws (created before locking existed) also work.
 */
export const rejectWithdraw = async (userId, amount) => {
  amount = Number(amount || 0);
  if (amount <= 0) throw new Error("Invalid amount");

  const wallet = await getOrCreateWallet(userId);

  const release = Math.min(Number(wallet.locked || 0), amount);

  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId },
    {
      $inc: {
        locked: -release,
        winnings: amount,
      },
    },
    { new: true }
  );

  return updatedWallet;
};

/**
 * Manual admin balance adjustment.
 */
export const adminAdjustBalance = async (userId, amount, { note = "Admin adjustment", approvedBy = null } = {}) => {
  const wallet = await getOrCreateWallet(userId);

  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { new: true }
  );

  await createTransaction({
    userId,
    amount: Math.abs(amount),
    type: "admin_adjust",
    status: "success",
    note,
    approvedBy,
    approvedAt: new Date(),
    balanceAfter: getPlayableBalance(updatedWallet),
  });

  return updatedWallet;
};
