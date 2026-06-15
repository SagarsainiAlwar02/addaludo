const Match = require("../models/match");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

// ================= CREATE MATCH =================
exports.createMatch = async (req, res) => {
  try {
    const { entryFee, playersLimit } = req.body;

    const wallet = await Wallet.findOne({ userId: req.user._id });

if (!wallet) {
  return res.status(404).json({ msg: "Wallet not found" });
}

if (Number(wallet.balance || 0) < Number(entryFee || 0)) {
  return res.status(400).json({
    msg: "Insufficient balance",
  });
}

wallet.balance =
  Number(wallet.balance || 0) - Number(entryFee || 0);

await wallet.save();

await Transaction.create({
  userId: req.user._id,
  amount: entryFee,
  type: "debit",
  status: "success",
  note: "Match creator entry fee",
});

    const match = await Match.create({
      entryFee,
      playersLimit: playersLimit || 2,
      players: [req.user._id],
      status: "waiting"
    });

    res.json(match);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= JOIN MATCH =================
exports.joinMatch = async (req, res) => {
  try {
    const match = await Match.findOneAndUpdate(
  {
    _id: req.params.id,
    status: { $ne: "completed" },
  },
  {
    $set: {
      status: "completed",
    },
  },
  {
    new: true,
  }
);

if (!match) {
  return res.status(400).json({
    msg: "Winner already declared",
  });
}

    if (!match) return res.status(404).json({ msg: "Match not found" });

    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    // already joined
    if (match.players.includes(req.user._id.toString())) {
      return res.status(400).json({ msg: "Already joined" });
    }

    if (match.players.length >= match.playersLimit) {
      return res.status(400).json({ msg: "Match full" });
    }

    // balance check + deduction
    if (wallet.balance < match.entryFee) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    wallet.balance -= match.entryFee;

    await Transaction.create({
      userId: req.user._id,
      amount: match.entryFee,
      type: "debit",
      status: "success",
      note: "Match entry fee"
    });

    match.players.push(req.user._id);

    if (match.players.length === match.playersLimit) {
      match.status = "ongoing";
    }

    await wallet.save();
    await match.save();

    res.json(match);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= DECLARE WINNER =================
exports.declareWinner = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) return res.status(404).json({ msg: "Match not found" });

    const { winnerId } = req.body;

    if (!match.players.includes(winnerId)) {
      return res.status(400).json({ msg: "Invalid winner" });
    }

    const wallet = await Wallet.findOne({ userId: winnerId });

    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    // ================= PRIZE CALCULATION =================
    const totalPool = match.entryFee * match.playersLimit;

    const commission = Math.floor(totalPool * 0.1); // 10% platform fee
    const prize = totalPool - commission;

   await Wallet.findOneAndUpdate(
  { userId: winnerId },
  {
    $inc: {
      balance: prize,
    },
  }
);

await Transaction.create({
  userId: winnerId,
  amount: prize,
  type: "credit",
  status: "success",
  note: "Match winning prize"
});
    match.winner = winnerId;
    match.status = "completed";

   
    await match.save();

    res.json({
      msg: "Winner declared",
      winnerId,
      prize
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};