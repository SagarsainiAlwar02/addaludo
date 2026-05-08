const Wallet = require("../models/wallet");
const Withdraw = require("../models/withdraw");
const Transaction = require("../models/transaction");
const User = require("../models/user");

const getUserId = (req) => {
  return req.user?.id || req.user || req.userData?._id || req.userData?.id;
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
        referralBalance: 0,
        locked: 0,
      });
    }

    const user = await User.findById(userId);

    return res.json({
      success: true,
      winningBalance: Number(wallet.winnings || 0),
      referralBalance: Number(wallet.referralBalance || 0),
      totalReferralEarning: Number(user?.totalReferralEarning || 0),
    });
  } catch (err) {
    console.log("❌ Redeem data error:", err.message);

    return res.status(500).json({
      success: false,
      msg: "Failed to load redeem data",
      error: err.message,
    });
  }
};

exports.requestWithdraw = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amount, method, details, type } = req.body;

    if (!userId) {
      return res.status(401).json({ msg: "User not found from token" });
    }

    const redeemAmount = Number(amount);

    if (!redeemAmount || redeemAmount < 200) {
      return res.status(400).json({ msg: "Minimum redeem/withdraw ₹200 hai" });
    }

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        bonus: 0,
        winnings: 0,
        referralBalance: 0,
        locked: 0,
      });
    }

    if (type === "refer_redeem") {
      if (Number(wallet.referralBalance || 0) < redeemAmount) {
        return res.status(400).json({ msg: "Insufficient referral balance" });
      }

      wallet.referralBalance = Number(wallet.referralBalance || 0) - redeemAmount;
      wallet.balance = Number(wallet.balance || 0) + redeemAmount;

      await wallet.save();

      await Transaction.create({
        userId,
        amount: redeemAmount,
        type: "referral_redeem",
        status: "success",
        note: "Referral earning redeemed to main wallet",
        balanceAfter: wallet.balance,
      });

      return res.json({
        success: true,
        msg: "Referral earning wallet me add ho gayi",
        balance: wallet.balance,
        referralBalance: wallet.referralBalance,
      });
    }

    if (!method || !["bank", "upi", "qr"].includes(method)) {
      return res.status(400).json({ msg: "Withdraw method required" });
    }

    if (Number(wallet.winnings || 0) < redeemAmount) {
      return res.status(400).json({ msg: "Insufficient winning balance" });
    }

    wallet.winnings = Number(wallet.winnings || 0) - redeemAmount;
    await wallet.save();

    const withdraw = await Withdraw.create({
      userId,
      amount: redeemAmount,
      method,
      details: details || {},
      status: "pending",
    });

    await Transaction.create({
      userId,
      amount: redeemAmount,
      type: "withdraw",
      status: "pending",
      note: "Withdraw request submitted",
      balanceAfter: wallet.balance,
    });

    return res.json({
      success: true,
      msg: "Withdraw request submitted successfully",
      winnings: wallet.winnings,
      withdraw,
    });
  } catch (err) {
    console.log("❌ Withdraw/Redeem error:", err.message);

    return res.status(500).json({
      success: false,
      msg: "Withdraw failed",
      error: err.message,
    });
  }
};