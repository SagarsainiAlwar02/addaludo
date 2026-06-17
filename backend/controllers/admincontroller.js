import Battle from "../models/battle.js";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.js";

export const setBattleWinner = async (req, res) => {
  try {
    const battleId = req.params.id;
    const { winnerId } = req.body;
    const adminId = req.user?._id || req.user?.id || req.user || null;

    if (!winnerId) return res.status(400).json({ msg: "Winner ID is required" });

    const battle = await Battle.findById(battleId);
    if (!battle) return res.status(404).json({ msg: "Battle not found" });
    if (battle.status === "completed") return res.status(400).json({ msg: "Already processed" });

    // Calculate prize money (Aapke Battle schema ke mutabik field name check karein)
    const prizeAmount = Number(battle.prize || 0);

    const wallet = await Wallet.findOne({ userId: winnerId });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    // Core fix: Adding to winnings
    wallet.winnings = Number(wallet.winnings || 0) + prizeAmount;
    await wallet.save();

    battle.winner = winnerId;
    battle.status = "completed";
    await battle.save();

    await Transaction.create({
      userId: winnerId,
      amount: prizeAmount,
      type: "game_win",
      status: "success",
      note: `Battle win prize amount added`,
      balanceAfter: Number(wallet.balance || 0) + Number(wallet.winnings || 0),
      approvedBy: adminId,
      approvedAt: new Date()
    });

    return res.json({ success: true, msg: "Winnings added successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};