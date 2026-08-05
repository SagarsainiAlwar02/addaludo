import Contest from "../models/contest.js";
import User from "../models/user.js";
import { generateContestId } from "../utils/generateId.js";
import {
  lockAmount,
  refundAmount,
  creditWinnings,
  unlockAmount,
  creditReferralCommission,
  getPlayableBalance,
} from "./wallet.service.js";

/**
 * contest.service.js
 * Business logic for contests: prize calculation, settlement, result conflict detection.
 * All functions are pure and reusable across controllers.
 */

const OPEN_CONTEST_EXPIRE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate prize and commission for an entry fee.
 * 50-500: 10% total commission (5% per player)
 * 501-100000: 5% total commission (2.5% per player)
 */
export const calculatePrize = (entryFee) => {
  const fee = Number(entryFee || 0);
  if (!fee || fee < 50) return { prize: 0, commission: 0 };

  const pool = fee * 2;
  let commission = 0;

  if (fee >= 50 && fee <= 500) {
    commission = Math.floor(pool * 0.1);
  } else if (fee > 500 && fee <= 100000) {
    commission = Math.floor(pool * 0.05);
  }

  const prize = Math.max(0, pool - commission);

  return { prize, commission };
};

/**
 * Validate that a contest amount is valid.
 * Returns error string or null.
 */
export const validateContestAmount = (amount) => {
  amount = Number(amount || 0);
  if (!amount || amount < 50) return "Minimum contest amount is ₹50";
  if (amount > 100000) return "Maximum contest amount is ₹1,00,000";
  if (amount % 50 !== 0) return "Amount must be in multiples of ₹50";
  return null;
};

/**
 * Check if a user has an active contest that blocks them from creating/joining.
 */
export const hasActiveUnsubmittedContest = async (userId) => {
  const activeStatuses = [
    "join_requested",
    "running",
    "room_submitted",
    "cancel_requested",
    "result_submitted",
  ];

  const contests = await Contest.find({
    status: { $in: activeStatuses },
    "players.userId": userId,
  }).select("status players resultSettled");

  return contests.some((contest) => {
    const status = String(contest.status || "").toLowerCase();
    if (["cancel_requested", "result_submitted"].includes(status)) {
      const submitted = contest.players.some(
        (p) => String(p.userId) === String(userId) && p.result
      );
      return !submitted;
    }
    return true;
  });
};

/**
 * Expire old open contests that have no opponent after 5 minutes.
 * Dummy (social proof) contests are kept alive.
 */
export const expireOldOpenContests = async () => {
  const expiryDate = new Date(Date.now() - OPEN_CONTEST_EXPIRE_MS);

  const result = await Contest.deleteMany({
    status: "open",
    isDummy: { $ne: true },
    createdAt: { $lte: expiryDate },
  });

  return result.deletedCount || 0;
};

/**
 * Cancel other open contests by a user when they start/join a new one.
 */
export const cancelOtherOpenContests = async (userId, excludeContestId) => {
  const contests = await Contest.find({
    contestId: { $ne: excludeContestId },
    "players.userId": userId,
    status: "open",
  });

  for (const contest of contests) {
    contest.status = "cancelled";
    contest.cancelledReason = "Auto cancelled because another contest was joined";
    await contest.save();
  }

  return contests.length;
};

/**
 * Build a new contest document.
 */
export const createContestDocument = async ({
  entryFee,
  creatorId,
  creatorUsername,
  isDummy = false,
  dummyName = "",
  dummyMobile = "",
}) => {
  const { prize, commission } = calculatePrize(entryFee);

  const contest = await Contest.create({
    contestId: generateContestId(),
    entryFee,
    prize,
    commission,
    players: [
      {
        userId: creatorId,
        username: creatorUsername,
        amount: entryFee,
        role: "creator",
        result: null,
        screenshotUrl: "",
        submittedAt: null,
      },
    ],
    status: "open",
    isDummy,
    dummyName,
    dummyMobile,
  });

  return contest;
};

/**
 * Atomically lock entry fees from both players when creator accepts the join request.
 */
export const lockEntryFees = async (contest) => {
  const creator = contest.players.find((p) => p.role === "creator");
  const opponent = contest.players.find((p) => p.role === "opponent");

  if (!creator || !opponent || !creator.userId || !opponent.userId) {
    throw new Error("Both players required to lock entry fees");
  }

  await lockAmount(creator.userId, contest.entryFee, {
    contestId: contest.contestId,
    note: "Contest entry fee locked",
  });

  await lockAmount(opponent.userId, contest.entryFee, {
    contestId: contest.contestId,
    note: "Contest entry fee locked",
  });

  contest.entryLocked = true;
  contest.status = "running";
  contest.timerStartedAt = new Date();
  contest.startedAt = new Date();
  await contest.save();

  return contest;
};

/**
 * Check if both players have submitted results.
 */
export const hasBothResults = (contest) => {
  return contest.players.length === 2 && contest.players.every((p) => p.result);
};

/**
 * Determine winner from player results.
 * Returns { winner: playerObject, loser: playerObject } or null if conflict.
 */
export const determineWinnerFromResults = (contest) => {
  const creator = contest.players.find((p) => p.role === "creator");
  const opponent = contest.players.find((p) => p.role === "opponent");

  if (!creator || !opponent) return null;

  const r1 = creator.result;
  const r2 = opponent.result;

  // Both cancel -> no winner, but settled
  if (r1 === "cancel" && r2 === "cancel") {
    return { winner: null, loser: null, bothCancelled: true };
  }

  // One win + one loss -> clear winner
  if (r1 === "win" && r2 === "loss") {
    return { winner: creator, loser: opponent };
  }
  if (r1 === "loss" && r2 === "win") {
    return { winner: opponent, loser: creator };
  }

  // Everything else is a conflict
  return null;
};

/**
 * Settle the contest winner and pay out.
 * Returns the updated contest.
 */
export const settleContest = async (contest, winnerId) => {
  const locked = await Contest.findOneAndUpdate(
    {
      _id: contest._id,
      resultSettled: { $ne: true },
      status: { $nin: ["approved", "cancelled"] },
    },
    {
      $set: {
        resultSettled: true,
        winner: winnerId
          ? { userId: winnerId }
          : { userId: null, username: "" },
        status: winnerId ? "approved" : "cancelled",
        completedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!locked) return null;

  const winnerPlayer = winnerId
    ? locked.players.find((p) => String(p.userId) === String(winnerId))
    : null;

  if (winnerId && winnerPlayer) {
    locked.winner.username = winnerPlayer.username;
    await locked.save();
  }

  // Distribute money
  for (const player of locked.players) {
    if (!player.userId) continue;

    if (winnerId && String(player.userId) === String(winnerId)) {
      // Winner gets prize and unlocks their entry fee
      await creditWinnings(player.userId, locked.prize, locked.entryFee, {
        contestId: locked.contestId,
        note: "Contest winning prize",
      });

      // Referral commission
      await creditReferralCommissionForWinner(player.userId, locked.entryFee, locked.contestId);
    } else {
      // Loser or cancelled player unlocks their entry fee
      await unlockAmount(player.userId, locked.entryFee, {
        contestId: locked.contestId,
      });
    }
  }

  return locked;
};

/**
 * Auto-settle based on player results.
 * Returns { contest, settled: boolean, conflict: boolean }
 */
export const autoSettleIfPossible = async (contest) => {
  if (!hasBothResults(contest)) {
    return { contest, settled: false, conflict: false };
  }

  const result = determineWinnerFromResults(contest);

  if (!result) {
    // Conflict - admin must decide
    contest.status = "result_submitted";
    contest.adminNote = "Admin approval required because result conflict found";
    await contest.save();
    return { contest, settled: false, conflict: true };
  }

  if (result.bothCancelled) {
    // Both cancelled - refund both
    for (const player of contest.players) {
      if (player.userId) {
        await refundAmount(player.userId, contest.entryFee, {
          contestId: contest.contestId,
          note: "Contest cancelled by both users",
        });
      }
    }

    contest.resultSettled = true;
    contest.winner = { userId: null, username: "" };
    contest.status = "cancelled";
    contest.adminNote = "Auto cancelled because both users cancelled";
    contest.completedAt = new Date();
    await contest.save();

    return { contest, settled: true, conflict: false };
  }

  const winner = contest.players.find(
    (p) => String(p.userId) === String(result.winner.userId)
  );

  const settled = await settleContest(contest, winner.userId);

  if (settled) {
    return { contest: settled, settled: true, conflict: false };
  }

  return { contest, settled: false, conflict: false };
};

/**
 * Refund both players when admin cancels the contest.
 */
export const refundBothPlayers = async (contest, reason = "Cancelled by admin") => {
  for (const player of contest.players) {
    if (!player.userId) continue;
    await refundAmount(player.userId, contest.entryFee, {
      contestId: contest.contestId,
      note: reason,
    });
  }

  contest.resultSettled = true;
  contest.winner = { userId: null, username: "" };
  contest.status = "cancelled";
  contest.cancelledReason = reason;
  contest.completedAt = new Date();
  await contest.save();

  return contest;
};

/**
 * Give referral commission (2% of winner's bet) to referrer.
 */
const creditReferralCommissionForWinner = async (winnerId, betAmount, contestId) => {
  try {
    const winner = await User.findById(winnerId).select("referredBy");
    if (!winner || !winner.referredBy) return;

    const commission = Number((Number(betAmount || 0) * 0.02).toFixed(2));
    if (commission <= 0) return;

    await creditReferralCommission(winner.referredBy, commission, {
      contestId,
      note: "Referral commission 2% from referred player's winning contest",
    });
  } catch (err) {
    // Referral commission is a side effect. Do not fail the main settlement.
    console.error("[Referral Commission] Failed:", err.message);
  }
};

/**
 * Format a contest for the admin panel / frontend response.
 * Includes backward-compatible createdBy/opponent fields.
 */
export const formatContestResponse = (contest) => {
  if (!contest) return null;

  const plain = contest.toObject ? contest.toObject() : contest;

  const creator = plain.players?.find((p) => p.role === "creator");
  const opponent = plain.players?.find((p) => p.role === "opponent");

  return {
    ...plain,
    createdBy: creator?.userId || null,
    opponent: opponent?.userId || null,
    entryFee: plain.entryFee,
    results: plain.players?.map((p) => ({
      user: p.userId,
      username: p.username,
      result: p.result,
      screenshot: p.screenshotUrl,
      submittedAt: p.submittedAt,
    })),
  };
};
