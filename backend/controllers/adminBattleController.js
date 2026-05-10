const Battle = require("../models/battle");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

exports.getAllBattles = async (req, res) => {
  try {
    const battles = await Battle.find()
      .populate("createdBy", "name phone email")
      .populate("opponent", "name phone email")
      .populate("winner", "name phone email")
      .populate("roomCodeSetBy", "name phone email")
      .populate("resultSubmittedBy", "name phone email")
      .populate("results.user", "name phone email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(battles);
  } catch (err) {
    console.log("❌ ADMIN GET BATTLES ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.approveBattle = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.battleId);

    if (!battle) return res.status(404).json({ msg: "Battle not found" });

    if (battle.resultSettled) {
      return res.status(400).json({ msg: "Battle already settled" });
    }

    const winnerId = req.body?.winnerId || battle.winner || battle.resultSubmittedBy;

    if (!winnerId) {
      return res.status(400).json({ msg: "Winner not found" });
    }

    const isCreator = String(winnerId) === String(battle.createdBy);
    const isOpponent = String(winnerId) === String(battle.opponent);

    if (!isCreator && !isOpponent) {
      return res.status(400).json({ msg: "Winner is not in this battle" });
    }

    const amount = Number(battle.amount || 0);
    const prize = Number(battle.prize || amount * 2);

    const creatorWallet = await Wallet.findOne({ userId: battle.createdBy });
    const opponentWallet = await Wallet.findOne({ userId: battle.opponent });
    const winnerWallet = await Wallet.findOne({ userId: winnerId });

    if (!winnerWallet) {
      return res.status(404).json({ msg: "Winner wallet not found" });
    }

    if (creatorWallet) {
      creatorWallet.locked = Math.max(0, Number(creatorWallet.locked || 0) - amount);
      await creatorWallet.save();
    }

    if (opponentWallet) {
      opponentWallet.locked = Math.max(0, Number(opponentWallet.locked || 0) - amount);
      await opponentWallet.save();
    }

    winnerWallet.balance = Number(winnerWallet.balance || 0) + prize;
    winnerWallet.winnings = Number(winnerWallet.winnings || 0) + prize;
    await winnerWallet.save();

    battle.winner = winnerId;
    battle.status = "approved";
    battle.resultSettled = true;
    battle.adminNote = req.body?.adminNote || "Winner approved by admin";
    await battle.save();

    await Transaction.create({
      userId: winnerId,
      amount: prize,
      type: "game_win",
      status: "success",
      note: `Battle ${battle.battleId} approved`,
      roomId: battle.battleId,
      balanceAfter: winnerWallet.balance,
    });

    res.json({ msg: "Battle approved", battle });
  } catch (err) {
    console.log("❌ APPROVE BATTLE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.rejectBattle = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.battleId);

    if (!battle) return res.status(404).json({ msg: "Battle not found" });

    if (battle.resultSettled) {
      return res.status(400).json({ msg: "Battle already settled" });
    }

    const amount = Number(battle.amount || 0);

    const creatorWallet = await Wallet.findOne({ userId: battle.createdBy });
    const opponentWallet = await Wallet.findOne({ userId: battle.opponent });

    if (creatorWallet) {
      creatorWallet.balance = Number(creatorWallet.balance || 0) + amount;
      creatorWallet.locked = Math.max(0, Number(creatorWallet.locked || 0) - amount);
      await creatorWallet.save();

      await Transaction.create({
        userId: battle.createdBy,
        amount,
        type: "refund",
        status: "success",
        note: `Battle ${battle.battleId} cancelled refund`,
        roomId: battle.battleId,
        balanceAfter: creatorWallet.balance,
      });
    }

    if (opponentWallet) {
      opponentWallet.balance = Number(opponentWallet.balance || 0) + amount;
      opponentWallet.locked = Math.max(0, Number(opponentWallet.locked || 0) - amount);
      await opponentWallet.save();

      await Transaction.create({
        userId: battle.opponent,
        amount,
        type: "refund",
        status: "success",
        note: `Battle ${battle.battleId} cancelled refund`,
        roomId: battle.battleId,
        balanceAfter: opponentWallet.balance,
      });
    }

    battle.status = "cancelled";
    battle.resultSettled = true;
    battle.adminNote = req.body?.adminNote || "Cancelled by admin";
    await battle.save();

    res.json({ msg: "Battle cancelled and refunded", battle });
  } catch (err) {
    console.log("❌ REJECT BATTLE ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};