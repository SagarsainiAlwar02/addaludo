const Wallet = require("../models/wallet");
const Withdraw = require("../models/withdraw");

// 💰 request withdraw
exports.requestWithdraw = async (req, res) => {
  try {
    const { amount, method, details } = req.body;

    const wallet = await Wallet.findOne({ userId: req.user });

    if (!wallet) {
      return res.status(404).json({ msg: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // deduct balance
    wallet.balance -= Number(amount);
    await wallet.save();

    const withdraw = await Withdraw.create({
      userId: req.user,
      amount: Number(amount),
      method: method || "upi",
      details: details || {},
      status: "pending",
    });

    res.json({
      success: true,
      msg: "Withdraw request created",
      withdraw,
    });
  } catch (err) {
    console.log("Withdraw request error:", err);
    res.status(500).json({ msg: err.message });
  }
};

// 📜 get user withdraw history
exports.getWithdraws = async (req, res) => {
  try {
    const data = await Withdraw.find({ userId: req.user }).sort({
      createdAt: -1,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};