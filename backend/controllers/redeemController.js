const Wallet = require("../models/wallet");
const Withdraw = require("../models/withdraw");

const getUserId = (req) => {
  return req.user || req.userData?._id || req.userData?.id;
};

exports.getRedeemData = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ msg: "User not found from token" });
    }

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        bonus: 0,
        winnings: 0,
        locked: 0,
      });
    }

    return res.json({
      winningBalance: wallet.winnings || 0,
      referralBalance: wallet.referralBalance || 0,
      totalReferralEarning: wallet.totalReferralEarning || 0,
    });

  } catch (err) {
    console.log("❌ Redeem data error:", err.message);

    return res.status(500).json({
      msg: "Failed to load redeem data",
      error: err.message,
    });
  }
};

exports.requestWithdraw = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amount, method, details } = req.body;

    if (!userId) {
      return res.status(401).json({ msg: "User not found from token" });
    }

    if (!amount || Number(amount) < 200) {
      return res.status(400).json({ msg: "Minimum withdraw ₹200 hai" });
    }

    if (!method || !["bank", "upi", "qr"].includes(method)) {
      return res.status(400).json({ msg: "Withdraw method required" });
    }

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        bonus: 0,
        winnings: 0,
        locked: 0,
      });
    }

    if ((wallet.winnings || 0) < Number(amount)) {
      return res.status(400).json({ msg: "Insufficient winning balance" });
    }

    wallet.winnings -= Number(amount);
    await wallet.save();

    const withdraw = await Withdraw.create({
      userId,
      amount: Number(amount),
      method,
      details: details || {},
      status: "pending",
    });

    return res.json({
      msg: "Withdraw request submitted successfully",
      winnings: wallet.winnings,
      withdraw,
    });

  } catch (err) {
    console.log("❌ Withdraw error:", err.message);

    return res.status(500).json({
      msg: "Withdraw failed",
      error: err.message,
    });
  }
};