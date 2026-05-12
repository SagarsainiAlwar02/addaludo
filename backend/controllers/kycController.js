const User = require("../models/user");

exports.submitKyc = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { name, dob, docType, docNumber } = req.body;

    if (!name || !dob || !docNumber) {
      return res.status(400).json({ msg: "All KYC fields required" });
    }

    const frontImage = req.files?.frontImage?.[0];
    const backImage = req.files?.backImage?.[0];

    if (!frontImage || !backImage) {
      return res.status(400).json({ msg: "Front and back document images required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.kycStatus === "approved") {
      return res.status(400).json({ msg: "KYC already approved" });
    }

    user.kycStatus = "pending";
    user.kyc = {
      name,
      dob,
      docType: docType || "aadhar",
      docNumber,
      frontImage: `/uploads/kyc/${frontImage.filename}`,
      backImage: `/uploads/kyc/${backImage.filename}`,
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

exports.getAllKyc = async (req, res) => {
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

exports.approveKyc = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.kycStatus = "approved";
    user.kyc.approvedAt = new Date();
    user.kyc.rejectedAt = null;
    user.kyc.rejectReason = "";

    await user.save();

    res.json({ success: true, msg: "KYC approved", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.rejectKyc = async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

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