import User from "../models/user.js";
import Wallet from "../models/wallet.js";
import Withdraw from "../models/withdraw.js";
import Transaction from "../models/transaction.js";

// ================= GET REDEEM DATA =================
export const getRedeemData = async (req, res) => {
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
export const requestWithdraw = async (req, res) => {
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

    const { amount, method, details, type } = req.body;

    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount < 200) {
      return res.status(400).json({ msg: "Minimum withdraw ₹200 hai" });
    }

    // ✅ REFER REDEEM
    if (type === "refer_redeem") {

      if (withdrawAmount > 10000) {
        return res.status(400).json({ msg: "Maximum redeem ₹10000 hai" });
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

      if (Number(wallet.referralBalance || 0) < withdrawAmount) {
        return res.status(400).json({ msg: "Insufficient referral balance" });
      }

      // referral balance -> main wallet
      const updatedWallet = await Wallet.findOneAndUpdate(
  {
    userId,
    referralBalance: { $gte: withdrawAmount },
  },
  {
    $inc: {
      referralBalance: -withdrawAmount,
      balance: withdrawAmount,
    },
  },
  {
    new: true,
  }
);

if (!updatedWallet) {
  return res.status(400).json({
    msg: "Insufficient referral balance",
  });
}

      await Transaction.create({
        userId,
        amount: withdrawAmount,
        type: "referral_redeem",
        status: "success",
        note: "Referral balance redeemed to main wallet",
        balanceAfter: Number(wallet.balance || 0),
      });

      return res.json({
        success: true,
        msg: "Referral earning main wallet me add ho gayi",
      wallet: updatedWallet,
      });
    }

    // ✅ NORMAL WITHDRAW

    const pendingWithdraw = await Withdraw.findOne({
  userId,
  status: "pending",
});

if (pendingWithdraw) {
  return res.status(400).json({
    msg: "Aapki ek withdraw request already pending hai",
  });
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

    // winnings se amount hold/lock
   const updatedWallet = await Wallet.findOneAndUpdate(
  {
    userId,
    winnings: { $gte: withdrawAmount },
  },
  {
    $inc: {
      winnings: -withdrawAmount,
      locked: withdrawAmount,
    },
  },
  {
    new: true,
  }
);

if (!updatedWallet) {
  return res.status(400).json({
    msg: "Insufficient winning balance",
  });
}
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
   balanceAfter: Number(updatedWallet.balance || 0),
    });

    res.json({
      success: true,
      msg: "Withdraw request submitted successfully",
      withdraw,
   wallet: updatedWallet,
    });

  } catch (err) {
    console.log("❌ REQUEST WITHDRAW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};

// ================= GET WITHDRAW HISTORY =================
export const getWithdrawHistory = async (req, res) => {
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