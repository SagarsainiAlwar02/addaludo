// import Battle from "../models/battle.js";
// import Wallet from "../models/wallet.js";
// import Transaction from "../models/transaction.js";

// export const setBattleWinner = async (req, res) => {
//   try {
//     const battleId = req.params.id;
//     const { winnerId } = req.body;
//     const adminId = req.user?._id || req.user?.id || req.user || null;

//     if (!winnerId) return res.status(400).json({ msg: "Winner ID is required" });

//     const battle = await Battle.findById(battleId);
//     if (!battle) return res.status(404).json({ msg: "Battle not found" });
//     if (battle.status === "completed") return res.status(400).json({ msg: "Already processed" });

//     // Calculate prize money (Aapke Battle schema ke mutabik field name check karein)
//     const prizeAmount = Number(battle.prize || 0);

//     const wallet = await Wallet.findOne({ userId: winnerId });
//     if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

//     // Core fix: Adding to winnings
//     wallet.winnings = Number(wallet.winnings || 0) + prizeAmount;
//     await wallet.save();

//     battle.winner = winnerId;
//     battle.status = "completed";
//     await battle.save();

//     await Transaction.create({
//       userId: winnerId,
//       amount: prizeAmount,
//       type: "game_win",
//       status: "success",
//       note: `Battle win prize amount added`,
//       balanceAfter: Number(wallet.balance || 0) + Number(wallet.winnings || 0),
//       approvedBy: adminId,
//       approvedAt: new Date()
//     });

//     return res.json({ success: true, msg: "Winnings added successfully" });
//   } catch (err) {
//     return res.status(500).json({ msg: err.message });
//   }
// };



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

    // ✅ winnings field mein add karo (wallet schema ke mutabik)
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
        { $inc: { balance: refundAmount } } // ✅ balance mein refund
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

    // ✅ Winner players array of objects mein check karo
    const winnerPlayer = match.players.find(
      (p) => p.userId && String(p.userId) === String(winnerId)
    );
    if (!winnerPlayer) {
      return res.status(400).json({ msg: "Winner is not a player in this match" });
    }

    const totalPool = Number(match.prizePool || match.entryFee * match.playersLimit || 0);
    const commission = Math.floor(totalPool * 0.1);
    const prize = totalPool - commission;

    // ✅ winnings mein add
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

    // ✅ Sabhi real players ko balance refund
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