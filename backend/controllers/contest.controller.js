import Contest from "../models/contest.js";
import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse,
} from "../utils/apiResponse.js";
import {
  calculatePrize,
  validateContestAmount,
  expireOldOpenContests,
  cancelOtherOpenContests,
  createContestDocument,
  lockEntryFees,
  autoSettleIfPossible,
  refundBothPlayers,
  formatContestResponse,
} from "../services/contest.service.js";
import { getPlayableBalance } from "../services/wallet.service.js";
import { emitContestUpdate } from "../services/socket.service.js";

/**
 * contest.controller.js
 * Core product controller: 1v1 challenge lifecycle.
 */

const MAX_SEARCHING_CONTESTS = 2;

/**
 * Create a new open contest.
 * POST /api/contests/create
 */
export const createContest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const username = req.user.name || "Player";
  const amount = Number(req.body.amount || 0);

  const amountError = validateContestAmount(amount);
  if (amountError) {
    return badRequestResponse(res, amountError, "INVALID_AMOUNT");
  }

  // Clean up stale open contests
  await expireOldOpenContests();

  // Max 2 open contests per user
  const searchingCount = await Contest.countDocuments({
    "players.userId": userId,
    "players.role": "creator",
    status: "open",
  });
  if (searchingCount >= MAX_SEARCHING_CONTESTS) {
    return badRequestResponse(
      res,
      "Maximum 2 searching contests allowed. Cancel one first.",
      "MAX_SEARCHING_CONTESTS"
    );
  }

  // Check wallet balance
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || getPlayableBalance(wallet) < amount) {
    return badRequestResponse(res, "Insufficient wallet balance", "INSUFFICIENT_BALANCE");
  }

  const contest = await createContestDocument({
    entryFee: amount,
    creatorId: userId,
    creatorUsername: username,
  });

  const formatted = formatContestResponse(contest);
  emitContestUpdate("contest-created", formatted);

  return successResponse(res, { contest: formatted }, "Contest created successfully");
});

/**
 * Get list of open contests.
 * GET /api/contests/open
 */
export const getOpenContests = asyncHandler(async (req, res) => {
  await expireOldOpenContests();

  const PUBLIC_STATUSES = ["open", "join_requested", "running", "room_submitted"];

  const contests = await Contest.find({ status: { $in: PUBLIC_STATUSES } })
    .populate("players.userId", "name phone")
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  const shaped = contests.map((contest) => {
    const formatted = formatContestResponse(contest);
    if (formatted.isDummy) {
      formatted.players[0].userId = {
        _id: formatted._id,
        name: formatted.dummyName || "Player",
        phone: formatted.dummyMobile || "",
      };
    }
    return formatted;
  });

  return successResponse(res, { contests: shaped }, "Open contests fetched");
});

/**
 * Request to join an open contest.
 * POST /api/contests/join/:contestId
 */
export const joinContest = asyncHandler(async (req, res) => {
  await expireOldOpenContests();

  const userId = req.user._id;
  const username = req.user.name || "Player";
  const { contestId } = req.params;

  const contest = await Contest.findOne({ contestId });
  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  // Dummy contest: delete and tell user to pick another
  if (contest.isDummy) {
    await Contest.deleteOne({ _id: contest._id });
    return badRequestResponse(
      res,
      "This contest is no longer available. Try another one.",
      "DUMMY_CONTEST"
    );
  }

  if (contest.status !== "open") {
    return badRequestResponse(
      res,
      `Contest is already ${contest.status}`,
      "CONTEST_NOT_OPEN"
    );
  }

  const creator = contest.players.find((p) => p.role === "creator");
  if (String(creator.userId) === String(userId)) {
    return badRequestResponse(res, "Cannot join your own contest", "CANNOT_JOIN_OWN");
  }

  const wallet = await Wallet.findOne({ userId });
  if (!wallet || getPlayableBalance(wallet) < contest.entryFee) {
    return badRequestResponse(res, "Insufficient wallet balance", "INSUFFICIENT_BALANCE");
  }

  contest.players.push({
    userId,
    username,
    amount: contest.entryFee,
    role: "opponent",
    result: null,
    screenshotUrl: "",
    submittedAt: null,
  });

  contest.status = "join_requested";
  contest.timerStartedAt = null;
  await contest.save();

  await cancelOtherOpenContests(userId, contest.contestId);

  const joinFormatted = formatContestResponse(contest);
  emitContestUpdate("contest-updated", joinFormatted);

  return successResponse(res, { contest: joinFormatted }, "Join request sent. Waiting for creator to accept.");
});

/**
 * Creator accepts the join request.
 * POST /api/contests/accept/:contestId
 */
export const acceptContest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { contestId } = req.params;

  const contest = await Contest.findOne({ contestId });
  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  const creator = contest.players.find((p) => p.role === "creator");
  if (String(creator.userId) !== String(userId)) {
    return forbiddenResponse(res, "Only creator can accept this contest", "NOT_CREATOR");
  }

  if (contest.status !== "join_requested" || contest.players.length !== 2) {
    return badRequestResponse(
      res,
      "No pending join request found",
      "NO_JOIN_REQUEST"
    );
  }

  const opponent = contest.players.find((p) => p.role === "opponent");
  if (!opponent || !opponent.userId) {
    return badRequestResponse(res, "Opponent not found", "OPPONENT_NOT_FOUND");
  }

  // Check both wallets before locking
  const [creatorWallet, opponentWallet] = await Promise.all([
    Wallet.findOne({ userId: creator.userId }),
    Wallet.findOne({ userId: opponent.userId }),
  ]);

  if (!creatorWallet || getPlayableBalance(creatorWallet) < contest.entryFee) {
    return badRequestResponse(
      res,
      "Creator has insufficient wallet balance",
      "CREATOR_INSUFFICIENT_BALANCE"
    );
  }

  if (!opponentWallet || getPlayableBalance(opponentWallet) < contest.entryFee) {
    return badRequestResponse(
      res,
      "Opponent has insufficient wallet balance",
      "OPPONENT_INSUFFICIENT_BALANCE"
    );
  }

  // Atomically lock the contest
  const lockedContest = await Contest.findOneAndUpdate(
    {
      _id: contest._id,
      status: "join_requested",
      entryLocked: { $ne: true },
    },
    {
      $set: {
        entryLocked: true,
        status: "running",
        timerStartedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!lockedContest) {
    return badRequestResponse(
      res,
      "Contest already started or amount already locked",
      "ALREADY_STARTED"
    );
  }

  try {
    await lockEntryFees(lockedContest);
  } catch (err) {
    // Rollback contest status if wallet locking fails
    await Contest.findByIdAndUpdate(contest._id, {
      $set: {
        entryLocked: false,
        status: "join_requested",
        timerStartedAt: null,
      },
    });
    throw err;
  }

  const acceptFormatted = formatContestResponse(lockedContest);
  emitContestUpdate("contest-updated", acceptFormatted);

  return successResponse(res, { contest: acceptFormatted }, "Contest started. Entry fees locked.");
});

/**
 * Creator rejects the join request.
 * POST /api/contests/reject/:contestId
 */
export const rejectJoinRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { contestId } = req.params;

  const contest = await Contest.findOne({ contestId });
  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  const creator = contest.players.find((p) => p.role === "creator");
  if (String(creator.userId) !== String(userId)) {
    return forbiddenResponse(res, "Only creator can reject this request", "NOT_CREATOR");
  }

  if (contest.status !== "join_requested" || contest.players.length !== 2) {
    return badRequestResponse(res, "No pending request found", "NO_JOIN_REQUEST");
  }

  contest.players = contest.players.filter((p) => p.role !== "opponent");
  contest.status = "open";
  contest.timerStartedAt = null;
  await contest.save();

  const rejectFormatted = formatContestResponse(contest);
  emitContestUpdate("contest-updated", rejectFormatted);

  return successResponse(res, { contest: rejectFormatted }, "Join request rejected. Contest is open again.");
});

/**
 * Creator submits the Ludo King room code.
 * POST /api/contests/room-code/:contestId
 */
export const submitRoomCode = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { contestId } = req.params;
  const roomCode = String(req.body.roomCode || "").trim();

  if (!/^\d{8}$/.test(roomCode)) {
    return badRequestResponse(res, "Room code must be 8 digits", "INVALID_ROOM_CODE");
  }

  const contest = await Contest.findOne({ contestId });
  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  const creator = contest.players.find((p) => p.role === "creator");
  if (String(creator.userId) !== String(userId)) {
    return forbiddenResponse(res, "Only creator can submit room code", "NOT_CREATOR");
  }

  if (!["running", "room_submitted"].includes(contest.status)) {
    return badRequestResponse(
      res,
      "Room code cannot be submitted now",
      "INVALID_STATUS_FOR_ROOM_CODE"
    );
  }

  contest.ludoKingRoomCode = roomCode;
  contest.status = "room_submitted";
  await contest.save();

  const roomFormatted = formatContestResponse(contest);
  emitContestUpdate("contest-updated", roomFormatted);

  return successResponse(res, { contest: roomFormatted }, "Room code submitted");
});

/**
 * Player submits result (win/loss/cancel) + screenshot.
 * POST /api/contests/result/:contestId
 */
export const submitResult = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { contestId } = req.params;
  const result = String(req.body.result || "").toLowerCase();

  const contest = await Contest.findOne({ contestId });
  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  const playerIndex = contest.players.findIndex(
    (p) => p.userId && String(p.userId) === String(userId)
  );
  if (playerIndex === -1) {
    return forbiddenResponse(res, "You are not part of this contest", "NOT_A_PLAYER");
  }

  if (!["running", "room_submitted", "cancel_requested", "result_submitted"].includes(contest.status)) {
    return badRequestResponse(
      res,
      "Result cannot be submitted now",
      "INVALID_STATUS_FOR_RESULT"
    );
  }

  if (!["win", "loss", "cancel"].includes(result)) {
    return badRequestResponse(res, "Invalid result type", "INVALID_RESULT");
  }

  if (result === "win" && !req.file) {
    return badRequestResponse(res, "Winning screenshot required", "SCREENSHOT_REQUIRED");
  }

  if (contest.players[playerIndex].result) {
    return badRequestResponse(
      res,
      "You already submitted your result",
      "RESULT_ALREADY_SUBMITTED"
    );
  }

  const screenshotPath = result === "win" && req.file
    ? `/uploads/results/${req.file.filename}`
    : "";

  contest.players[playerIndex].result = result;
  contest.players[playerIndex].screenshotUrl = screenshotPath;
  contest.players[playerIndex].submittedAt = new Date();
  await contest.save();

  // Check if both players submitted
  const bothSubmitted = contest.players.every((p) => p.result);

  if (!bothSubmitted) {
    contest.status = result === "cancel" ? "cancel_requested" : "result_submitted";
    await contest.save();

    const partialFormatted = formatContestResponse(contest);
    emitContestUpdate("contest-updated", partialFormatted);

    return successResponse(
      res,
      { contest: partialFormatted },
      result === "win"
        ? "Win submitted. Waiting for opponent."
        : result === "loss"
        ? "Loss submitted. Waiting for opponent."
        : "Cancel request submitted. Waiting for opponent."
    );
  }

  // Both submitted - try auto settlement
  const { settled, conflict } = await autoSettleIfPossible(contest);

  const resultFormatted = formatContestResponse(contest);
  emitContestUpdate("contest-updated", resultFormatted);

  if (conflict) {
    return successResponse(res, { contest: resultFormatted }, "Result submitted. Admin approval pending due to conflict.");
  }

  if (settled) {
    return successResponse(res, { contest: resultFormatted }, "Result submitted and auto approved.");
  }

  return successResponse(res, { contest: resultFormatted }, "Result submitted.");
});

/**
 * Cancel contest.
 * POST /api/contests/cancel/:contestId
 */
export const cancelContest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { contestId } = req.params;

  const contest = await Contest.findOne({ contestId });
  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  const playerIndex = contest.players.findIndex(
    (p) => p.userId && String(p.userId) === String(userId)
  );
  if (playerIndex === -1) {
    return forbiddenResponse(res, "You are not part of this contest", "NOT_A_PLAYER");
  }

  const player = contest.players[playerIndex];
  const isCreator = player.role === "creator";

  if (contest.status === "open") {
    if (!isCreator) {
      return forbiddenResponse(
        res,
        "Only creator can cancel an open contest",
        "NOT_CREATOR"
      );
    }
    contest.status = "cancelled";
    contest.cancelledReason = "Cancelled by creator";
    await contest.save();
    const cancelFormatted = formatContestResponse(contest);
    emitContestUpdate("contest-updated", cancelFormatted);
    return successResponse(res, { contest: cancelFormatted }, "Contest cancelled");
  }

  if (contest.status === "join_requested") {
    if (isCreator) {
      contest.status = "cancelled";
      contest.cancelledReason = "Cancelled by creator";
      await contest.save();
      const cancelFormatted2 = formatContestResponse(contest);
      emitContestUpdate("contest-updated", cancelFormatted2);
      return successResponse(res, { contest: cancelFormatted2 }, "Contest cancelled");
    } else {
      contest.players = contest.players.filter((p) => p.role !== "opponent");
      contest.status = "open";
      contest.timerStartedAt = null;
      contest.adminNote = "Join request cancelled by opponent";
      await contest.save();
      const requestCancelFormatted = formatContestResponse(contest);
      emitContestUpdate("contest-updated", requestCancelFormatted);
      return successResponse(res, { contest: requestCancelFormatted }, "Request cancelled");
    }
  }

  return badRequestResponse(
    res,
    "Running contest cannot be cancelled. Use cancel result submission.",
    "CANNOT_CANCEL_RUNNING"
  );
});

/**
 * Get current user's contest history.
 * GET /api/contests/my-contests
 */
export const getMyContests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const contests = await Contest.find({ "players.userId": userId })
    .populate("players.userId", "name phone")
    .populate("winner.userId", "name phone")
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(50)
    .lean();

  return successResponse(
    res,
    { contests: contests.map(formatContestResponse) },
    "My contests fetched"
  );
});

/**
 * Get single contest details.
 * GET /api/contests/:contestId
 */
export const getSingleContest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { contestId } = req.params;

  const contest = await Contest.findOne({ contestId })
    .populate("players.userId", "name phone")
    .populate("winner.userId", "name phone")
    .lean();

  if (!contest) {
    return notFoundResponse(res, "Contest not found", "CONTEST_NOT_FOUND");
  }

  const isPlayer = contest.players.some(
    (p) => p.userId && String(p.userId._id || p.userId) === String(userId)
  );
  if (!isPlayer) {
    return forbiddenResponse(res, "You are not part of this contest", "NOT_A_PLAYER");
  }

  return successResponse(
    res,
    { contest: formatContestResponse(contest) },
    "Contest details fetched"
  );
});

/**
 * Create a dummy contest (admin only via admin route, but function lives here).
 * POST /api/admin/dummy-contests
 *
 * Accepts both service-style (entryFee/dummyName/dummyMobile) and
 * admin-panel-style (amount/name/mobile) field names.
 */
export const createDummyContest = asyncHandler(async (req, res) => {
  const { entryFee, dummyName, dummyMobile, amount, name, mobile } = req.body;

  const fee = Number(amount ?? entryFee);
  const dName = dummyName || name || "Player";
  const dMobile = dummyMobile || mobile || "";

  const amountError = validateContestAmount(fee);
  if (amountError) {
    return badRequestResponse(res, amountError, "INVALID_AMOUNT");
  }

  const contest = await createContestDocument({
    entryFee: fee,
    creatorId: null,
    creatorUsername: dName,
    isDummy: true,
    dummyName: dName,
    dummyMobile: dMobile,
  });

  const dummyFormatted = formatContestResponse(contest);
  emitContestUpdate("contest-created", dummyFormatted);

  return successResponse(res, { contest: dummyFormatted }, "Dummy contest created");
});

/**
 * Delete a dummy contest (admin only).
 * DELETE /api/admin/dummy-contests/:id
 */
export const deleteDummyContest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contest = await Contest.findOneAndDelete({
    _id: id,
    isDummy: true,
  });

  if (!contest) {
    return notFoundResponse(res, "Dummy contest not found", "DUMMY_NOT_FOUND");
  }

  emitContestUpdate("contest-deleted", { id });
  return successResponse(res, null, "Dummy contest deleted");
});
