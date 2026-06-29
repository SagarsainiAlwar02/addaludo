import Battle from "../models/battle.js";
import Match from "../models/match.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";

// ================= SET BATTLE WINNER =================
export const setBattleWinner = async (req, res) => {
  try {
    const battleId = req.params.id;
    const { winnerId } = req.body;
    const adminId = req.user?._id || req.user?.id || null;

    if (!winnerId) return res.status(400).json({ msg: "Winner ID is required" });

    const battle = await Battle.findById(battleId);
    if (!battle) return res.status(404).json({ msg: "Battle not found" });

    if (battle.status === "completed") {
      return res.status(400).json({ msg: "Battle already processed" });
    }
    if (battle.status === "cancelled") {
      return res.status(400).json({ msg: "Cancelled battle ka winner set nahi ho sakta" });
    }

    const prizeAmount = Number(battle.prize || 0);

    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId: winnerId },
      { $inc: { winnings: prizeAmount } },
      { new: true }
    );

    if (!updatedWallet) {
      return res.status(404).json({ msg: "Winner wallet not found" });
    }

    battle.winner = winnerId;
    battle.status = "completed";
    await battle.save();

    await Transaction.create({
      userId: winnerId,
      amount: prizeAmount,
      type: "game_win",
      status: "success",
      note: "Battle win prize added",
      balanceAfter: Number(updatedWallet.winnings || 0),
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    return res.json({
      success: true,
      msg: "Winnings added successfully",
      prize: prizeAmount,
      newWinnings: updatedWallet.winnings,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// ================= CANCEL BATTLE =================
export const cancelBattle = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ msg: "Battle not found" });

    if (battle.status === "completed" || battle.status === "cancelled") {
      return res.status(400).json({ msg: `Battle is already ${battle.status}` });
    }

    const adminId = req.user?._id || req.user?.id || null;
    const { reason } = req.body;
    const refundAmount = Number(battle.entryFee || 0);

    const players = battle.players || [];

    for (const playerId of players) {
      await Wallet.findOneAndUpdate(
        { userId: playerId },
        { $inc: { balance: refundAmount } }
      );

      await Transaction.create({
        userId: playerId,
        amount: refundAmount,
        type: "refund",
        status: "success",
        note: reason ? `Battle cancelled: ${reason}` : "Battle cancelled - entry fee refunded",
        approvedBy: adminId,
        approvedAt: new Date(),
      });
    }

    battle.status = "cancelled";
    if (reason) battle.cancelledReason = reason;
    await battle.save();

    res.json({
      msg: "Battle cancelled and all entry fees refunded",
      refundedPlayers: players.length,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= ADMIN: SET MATCH WINNER =================
export const setMatchWinner = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: "Match not found" });

    if (match.status === "completed") {
      return res.status(400).json({ msg: "Match winner already declared" });
    }
    if (match.status === "cancelled") {
      return res.status(400).json({ msg: "Cancelled match ka winner set nahi ho sakta" });
    }

    const { winnerId, winnerUsername } = req.body;
    if (!winnerId) return res.status(400).json({ msg: "Winner ID is required" });

    const adminId = req.user?._id || req.user?.id || null;

    const winnerPlayer = match.players.find(
      (p) => p.userId && String(p.userId) === String(winnerId)
    );
    if (!winnerPlayer) {
      return res.status(400).json({ msg: "Winner is not a player in this match" });
    }

    const totalPool = Number(match.prizePool || match.entryFee * match.playersLimit || 0);
    const commission = Math.floor(totalPool * 0.1);
    const prize = totalPool - commission;

    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId: winnerId },
      { $inc: { winnings: prize } },
      { new: true }
    );

    if (!updatedWallet) {
      return res.status(404).json({ msg: "Winner wallet not found" });
    }

    await Transaction.create({
      userId: winnerId,
      amount: prize,
      type: "credit",
      status: "success",
      note: `Match win - Room: ${match.roomId}`,
      balanceAfter: Number(updatedWallet.winnings || 0),
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    match.winner = {
      userId: winnerId,
      username: winnerUsername || winnerPlayer.username || "",
    };
    match.winAmount = prize;
    match.commission = commission;
    match.status = "completed";
    match.completedAt = new Date();
    await match.save();

    return res.json({
      success: true,
      msg: "Match winner set successfully",
      winnerId,
      prize,
      roomId: match.roomId,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// ================= ADMIN: CANCEL MATCH =================
export const adminCancelMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: "Match not found" });

    if (match.status === "completed" || match.status === "cancelled") {
      return res.status(400).json({ msg: `Match is already ${match.status}` });
    }

    const adminId = req.user?._id || req.user?.id || null;
    const { reason } = req.body;
    const fee = Number(match.entryFee || 0);

    for (const player of match.players) {
      if (!player.userId || player.isBot) continue;

      await Wallet.findOneAndUpdate(
        { userId: player.userId },
        { $inc: { balance: fee } }
      );

      await Transaction.create({
        userId: player.userId,
        amount: fee,
        type: "refund",
        status: "success",
        note: reason
          ? `Match cancelled: ${reason} - Room: ${match.roomId}`
          : `Match cancelled - Entry fee refunded. Room: ${match.roomId}`,
        approvedBy: adminId,
        approvedAt: new Date(),
      });
    }

    match.status = "cancelled";
    match.cancelledReason = reason || "Admin cancelled";
    await match.save();

    const realPlayers = match.players.filter((p) => p.userId && !p.isBot);

    res.json({
      msg: "Match cancelled and entry fees refunded",
      roomId: match.roomId,
      refundedPlayers: realPlayers.length,
      refundAmount: fee,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ================= 🔥 NEW: GET DASHBOARD STATS (ALL TIME / TODAY FILTER) =================
export const getDashboardStats = async (req, res) => {
  try {
    const { filter } = req.query; // Frontend se 'today' ya 'all' filter aayega
    let dateFilter = {};

    if (filter === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      dateFilter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
    }

    // 1. New Users Today vs Total Users Count
    const usersCount = await Wallet.countDocuments(filter === 'today' ? dateFilter : {}); 

    // 2. Today Deposit vs Total Deposit
    const depositData = await Transaction.aggregate([
      { $match: { type: "deposit", status: "success", ...(filter === 'today' ? dateFilter : {}) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 3. Today Withdraw vs Total Withdraw
    const withdrawData = await Transaction.aggregate([
      { $match: { type: "withdraw", status: "success", ...(filter === 'today' ? dateFilter : {}) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 4. Today Commission vs Total Commission From Matches
    const commissionData = await Match.aggregate([
      { $match: { status: "completed", ...(filter === 'today' ? { completedAt: dateFilter } : {}) } },
      { $group: { _id: null, total: { $sum: "$commission" } } }
    ]);

    // 5. Today Bonus vs Total Bonus
    const bonusData = await Transaction.aggregate([
      { $match: { type: "bonus", status: "success", ...(filter === 'today' ? dateFilter : {}) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 6. Today Penalty vs Total Penalty
    const penaltyData = await Transaction.aggregate([
      { $match: { type: "penalty", status: "success", ...(filter === 'today' ? dateFilter : {}) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalDeposit = depositData[0]?.total || 0;
    const totalWithdraw = withdrawData[0]?.total || 0;

    return res.json({
      success: true,
      stats: {
        users: usersCount,
        deposit: totalDeposit,
        withdraw: totalWithdraw,
        commission: commissionData[0]?.total || 0,
        bonus: bonusData[0]?.total || 0,
        penalty: penaltyData[0]?.total || 0,
        earnings: totalDeposit - totalWithdraw // Earnings calculation
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};
