import User from "../models/user.js";

export const submitKyc = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { name, dob, docType, docNumber } = req.body;

    if (!name || !dob || !docNumber) {
      return res.status(400).json({ msg: "All KYC fields required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

  if (["approved", "pending"].includes(user.kycStatus)) {
  return res.status(400).json({
    msg: "KYC already submitted",
  });
}

    user.kycStatus = "pending";
    user.kyc = {
      name,
      dob,
      docType: docType || "aadhar",
      docNumber,
      submittedAt: new Date(),
      approvedAt: null,
      rejectedAt: null,
      rejectReason: "",
    };

    await user.save();

    res.json({
      success: true,
      msg: "KYC submitted successfully",
      kycStatus: user.kycStatus,
      kyc: user.kyc,
    });
  } catch (err) {
    console.log("KYC SUBMIT ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};



export const getAllKyc = async (req, res) => {
  try {
    const users = await User.find({
      kycStatus: { $in: ["pending", "approved", "rejected"] },
    })
      .select("name phone email kycStatus kyc createdAt updatedAt")
      .sort({ "kyc.submittedAt": -1, createdAt: -1 })
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const approveKyc = async (req, res) => {
  try {
  const user = await User.findOneAndUpdate(
  {
    _id: req.params.id,
    kycStatus: "pending",
  },
  {
    $set: {
      kycStatus: "approved",
      "kyc.approvedAt": new Date(),
      "kyc.rejectedAt": null,
      "kyc.rejectReason": "",
    },
  },
  {
    new: true,
  }
);

if (!user) {
  return res.status(400).json({
    msg: "KYC already processed or user not found",
  });
}

    res.json({ success: true, msg: "KYC approved", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const rejectKyc = async (req, res) => {
  try {
    const { reason } = req.body;

   const user = await User.findOneAndUpdate(
  {
    _id: req.params.id,
    kycStatus: "pending",
  },
  {
    $set: {
      kycStatus: "rejected",
      "kyc.rejectedAt": new Date(),
      "kyc.approvedAt": null,
      "kyc.rejectReason": reason || "KYC rejected by admin",
    },
  },
  {
    new: true,
  }
);

if (!user) {
  return res.status(400).json({
    msg: "KYC already processed or user not found",
  });
}

    user.kycStatus = "rejected";
    user.kyc.rejectedAt = new Date();
    user.kyc.approvedAt = null;
    user.kyc.rejectReason = reason || "KYC rejected by admin";

    await user.save();

    res.json({ success: true, msg: "KYC rejected", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

