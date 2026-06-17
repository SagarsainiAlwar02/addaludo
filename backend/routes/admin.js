// ... existing routes (users, dashboard, settings, etc.)

// ================= BATTLE / WINNER MANAGEMENT =================
// ✅ Route to set winner and credit amount
router.put("/battle/set-winner/:id", auth, async (req, res) => {
  try {
    const battleId = req.params.id;
    const { winnerId } = req.body; // Front-end se winner ki userId aayegi
    const adminId = req.user?._id || req.user?.id || req.user || null;

    if (!winnerId) {
      return res.status(400).json({ msg: "Winner User ID required hai" });
    }

    // 1. Find the battle
    const battle = await Battle.findById(battleId);
    if (!battle) {
      return res.status(404).json({ msg: "Battle/Game nahi mila" });
    }

    if (battle.status === "completed") {
      return res.status(400).json({ msg: "Ye match pehle se completed hai" });
    }

    // 2. Calculate Prize (Manlo entry fee aur prize pool battle schema me saved hai)
    // Agar aapke schema fields alag hain toh change kar lena (e.g., battle.prize)
    const prizeAmount = Number(battle.prize || battle.winnings || 0);

    // 3. Find Winner's Wallet
    let wallet = await Wallet.findOne({ userId: winnerId });
    if (!wallet) {
      return res.status(404).json({ msg: "Winner ka wallet nahi mila" });
    }

    // 4. Update Wallet (Winning Balance add karein)
    wallet.winnings = Number(wallet.winnings || 0) + prizeAmount;
    await wallet.save();

    // 5. Update Battle Status
    battle.winner = winnerId;
    battle.status = "completed";
    battle.closedBy = adminId;
    battle.closedAt = new Date();
    await battle.save();

    // 6. Create a Transaction Entry for Tracking/Passbook
    await Transaction.create({
      userId: winnerId,
      amount: prizeAmount,
      type: "game_win",
      status: "success",
      note: `Won Battle #${battleId}. Prize credited to winnings.`,
      balanceAfter: Number(wallet.balance || 0) + Number(wallet.winnings || 0),
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    res.json({
      success: true,
      msg: "Winner set successfully aur prize amount wallet me credit ho gaya.",
      battle,
      winningsBalance: wallet.winnings
    });

  } catch (err) {
    console.log("❌ SET WINNER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;