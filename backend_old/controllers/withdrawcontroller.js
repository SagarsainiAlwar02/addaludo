import Wallet from "../models/wallet.js";
import Withdraw from "../models/withdraw.js";

// 💰 request withdraw
export const requestWithdraw = async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    if (!["upi", "bank"].includes(method)) {
  return res.status(400).json({
    success: false,
    msg: "Invalid withdraw method",
  });
}

    const withdrawAmount = Number(amount);

  if (!withdrawAmount || withdrawAmount < 200) {
  return res.status(400).json({
    success: false,
    msg: "Minimum withdraw ₹200 hai",
  });
}

    const wallet = await Wallet.findOne({ userId: req.user });
    const pendingWithdraw = await Withdraw.findOne({
  userId: req.user,
  status: "pending",
});

if (pendingWithdraw) {
  return res.status(400).json({
    success: false,
    msg: "Withdraw request already pending",
  });
}

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
  const updatedWallet = await Wallet.findOneAndUpdate(
  {
    userId: req.user,
    balance: { $gte: withdrawAmount },
  },
  {
    $inc: {
      balance: -withdrawAmount,
      locked: withdrawAmount,
    },
  },
  {
    new: true,
  }
);

if (!updatedWallet) {
  return res.status(400).json({
    success: false,
    msg: "Insufficient balance",
  });
}

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
export const getWithdraws = async (req, res) => {
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