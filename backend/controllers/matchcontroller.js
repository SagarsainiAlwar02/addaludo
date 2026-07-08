






import Match from "../models/match.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";

// ================= CREATE MATCH =================
export const createMatch = async (req, res) => {
  try {
    const { entryFee, playersLimit, roomId, username, color } = req.body;

    if (!roomId) return res.status(400).json({ msg: "Room ID is required" });

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const fee = Number(entryFee || 0);

    // ✅ Balance check — deposit (balance) se katega
    if (Number(wallet.balance || 0) < fee) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    wallet.balance = Number(wallet.balance || 0) - fee;
    await wallet.save();

    await Transaction.create({
      userId: req.user._id,
      amount: fee,
      type: "debit",
      status: "success",
      note: "Match creator entry fee",
    });

    const prizePool = fee * (playersLimit || 2);
    const commission = Math.floor(prizePool * 0.1);
    const winAmount = prizePool - commission;

    const match = await Match.create({
      roomId,
      entryFee: fee,
      playersLimit: playersLimit || 2,
      prizePool,
      commission,
      winAmount,
      status: "pending",
      players: [
        {
          userId: req.user._id,
          username: username || "",
          amount: fee,
          color: color || "",
          isBot: false,
        },
      ],
    });

    res.json(match);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= JOIN MATCH =================
export const joinMatch = async (req, res) => {
  try {
    const { username, color } = req.body;

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: "Match not found" });

    // ✅ Status check
    if (match.status === "completed" || match.status === "cancelled") {
      return res.status(400).json({ msg: `Match is already ${match.status}` });
    }

    // ✅ Already joined check — players array of objects hai
    const alreadyJoined = match.players.some(
      (p) => p.userId && String(p.userId) === String(req.user._id)
    );
    if (alreadyJoined) return res.status(400).json({ msg: "Already joined this match" });

    // ✅ Match full check
    if (match.players.length >= match.playersLimit) {
      return res.status(400).json({ msg: "Match is full" });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const fee = Number(match.entryFee || 0);

    if (Number(wallet.balance || 0) < fee) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // ✅ Balance deduct + save
    wallet.balance = Number(wallet.balance || 0) - fee;
    await wallet.save();

    await Transaction.create({
      userId: req.user._id,
      amount: fee,
      type: "debit",
      status: "success",
      note: "Match entry fee",
    });

    match.players.push({
      userId: req.user._id,
      username: username || "",
      amount: fee,
      color: color || "",
      isBot: false,
    });

    // ✅ Jab sab players aa jaayein to "running"
    if (match.players.length === match.playersLimit) {
      match.status = "running";
      match.startedAt = new Date();
    }

    await match.save();
    res.json(match);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= DECLARE WINNER (Admin) =================
export const declareWinner = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: "Match not found" });

    // ✅ Already completed check
    if (match.status === "completed") {
      return res.status(400).json({ msg: "Winner already declared for this match" });
    }
    if (match.status === "cancelled") {
      return res.status(400).json({ msg: "Cancelled match ka winner declare nahi ho sakta" });
    }

    const { winnerId, winnerUsername } = req.body;
    if (!winnerId) return res.status(400).json({ msg: "Winner ID is required" });

    // ✅ Winner players mein hai ya nahi — players array of objects hai
    const winnerPlayer = match.players.find(
      (p) => p.userId && String(p.userId) === String(winnerId)
    );
    if (!winnerPlayer) {
      return res.status(400).json({ msg: "Winner is not a player in this match" });
    }

    // ✅ Prize calculation schema fields se
    const totalPool = Number(match.prizePool || match.entryFee * match.playersLimit || 0);
    const commission = Math.floor(totalPool * 0.1);
    const prize = totalPool - commission;

    // ✅ Winnings field mein add karo (wallet schema ke mutabik)
    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId: winnerId },
      {
        $inc: { winnings: prize },
      },
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
      note: `Match winning prize - Room: ${match.roomId}`,
      balanceAfter: Number(updatedWallet.winnings || 0),
    });

    // ✅ Match schema ke winner object fields set karo
    match.winner = {
      userId: winnerId,
      username: winnerUsername || winnerPlayer.username || "",
    };
    match.winAmount = prize;
    match.commission = commission;
    match.status = "completed";
    match.completedAt = new Date();

    await match.save();

    res.json({
      msg: "Winner declared successfully",
      winnerId,
      prize,
      roomId: match.roomId,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= CANCEL MATCH (Admin) =================
export const cancelMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: "Match not found" });

    if (match.status === "completed" || match.status === "cancelled") {
      return res.status(400).json({ msg: `Match is already ${match.status}` });
    }

    const { reason } = req.body;
    const fee = Number(match.entryFee || 0);

    // ✅ Sabhi players ko refund — balance mein wapas jaayega
    for (const player of match.players) {
      if (!player.userId || player.isBot) continue; // bots ko refund nahi

      await Wallet.findOneAndUpdate(
        { userId: player.userId },
        { $inc: { balance: fee } }
      );

      await Transaction.create({
        userId: player.userId,
        amount: fee,
        type: "refund",
        status: "success",
        note: `Match cancelled - Entry fee refunded. Room: ${match.roomId}`,
      });
    }

    match.status = "cancelled";
    match.cancelledReason = reason || "Admin cancelled";
    await match.save();

    res.json({
      msg: "Match cancelled and entry fees refunded to all players",
      roomId: match.roomId,
      refundedPlayers: match.players.filter((p) => p.userId && !p.isBot).length,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};