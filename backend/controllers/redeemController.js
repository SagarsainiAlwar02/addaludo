const User = require("../models/user");
const Wallet = require("../models/wallet");
const Withdraw = require("../models/withdraw");
const Transaction = require("../models/transaction");

// ================= GET REDEEM DATA =================
exports.getRedeemData = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ msg: "User not found" });

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

    res.json({
      success: true,
      winningBalance: Number(wallet.winnings || 0),
      referralBalance: Number(wallet.referralBalance || 0),
      totalReferralEarning: Number(user.totalReferralEarning || 0),
      kycStatus: user.kycStatus || "not_submitted",
      wallet,
    });
  } catch (err) {
    console.log("❌ GET REDEEM DATA ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// ================= REQUEST WITHDRAW =================
exports.requestWithdraw = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;

    // ✅ KYC CHECK
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.kycStatus !== "approved") {
      return res.status(403).json({
        msg: "Withdraw ke liye KYC complete karna jaruri hai",
        kycRequired: true,
        kycStatus: user.kycStatus || "not_submitted",
      });
    }

    const { amount, method, details } = req.body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount < 200) {
      return res.status(400).json({ msg: "Minimum withdraw ₹200 hai" });
    }

    if (!["upi", "bank"].includes(method)) {
      return res.status(400).json({ msg: "Invalid withdraw method" });
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

    if (Number(wallet.winnings || 0) < withdrawAmount) {
      return res.status(400).json({ msg: "Insufficient winning balance" });
    }

    // ✅ winnings se amount hold/lock
    wallet.winnings = Number(wallet.winnings || 0) - withdrawAmount;
    wallet.locked = Number(wallet.locked || 0) + withdrawAmount;

    await wallet.save();

    const withdraw = await Withdraw.create({
      userId,
      amount: withdrawAmount,
      method,
      details: details || {},
      status: "pending",
    });

    await Transaction.create({
      userId,
      amount: withdrawAmount,
      type: "withdraw",
      status: "pending",
      note: "Withdraw request created",
      balanceAfter: wallet.balance,
    });

    res.json({
      success: true,
      msg: "Withdraw request submitted successfully",
      withdraw,
      wallet,
    });
  } catch (err) {
    console.log("❌ REQUEST WITHDRAW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// ================= GET WITHDRAW HISTORY =================
exports.getWithdrawHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;

    const withdraws = await Withdraw.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      withdraws,
    });
  } catch (err) {
    console.log("❌ WITHDRAW HISTORY ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};