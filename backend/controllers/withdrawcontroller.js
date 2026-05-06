const Wallet = require("../models/wallet");
const Withdraw = require("../models/withdraw");

// 💰 request withdraw
exports.requestWithdraw = async (req, res) => {
  try {
    const { amount } = req.body;

    const wallet = await Wallet.findOne({ userId: req.user });

    if (!wallet) {
      return res.status(404).json({ msg: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // balance hold (deduct temporarily)
    wallet.balance -= amount;
    await wallet.save();

    const withdraw = await Withdraw.create({
      userId: req.user,
      amount,
      status: "pending"
    });

    res.json({
      msg: "Withdraw request created",
      withdraw
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// 📜 get user withdraw history
exports.getWithdraws = async (req, res) => {
  try {
    const data = await Withdraw.find({ userId: req.user });
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};