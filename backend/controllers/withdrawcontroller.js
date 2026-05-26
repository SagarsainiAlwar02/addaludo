const Wallet = require("../models/wallet");
const Withdraw = require("../models/withdraw");

// 💰 request withdraw
exports.requestWithdraw = async (req, res) => {
  try {
    const { amount, method, details } = req.body;

    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        msg: "Invalid withdraw amount",
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        msg: "Wallet not found",
      });
    }

    if (Number(wallet.balance || 0) < withdrawAmount) {
      return res.status(400).json({
        success: false,
        msg: "Insufficient balance",
      });
    }

    // balance se amount hatao aur locked me hold karo
    wallet.balance = Number(wallet.balance || 0) - withdrawAmount;
    wallet.locked = Number(wallet.locked || 0) + withdrawAmount;

    await wallet.save();

    const withdraw = await Withdraw.create({
      userId: req.user,
      amount: withdrawAmount,
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
    res.status(500).json({
      success: false,
      msg: err.message,
    });
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
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};