import PaymentSetting from "../models/paymentSetting.js";

const getOrCreateSetting = async () => {
  let setting = await PaymentSetting.findOne();
  if (!setting) setting = await PaymentSetting.create({});
  return setting;
};

const normalizeSetting = (setting) => ({
  _id: setting._id,
  scannerImage: setting.scanner?.image || "",
  scanner: setting.scanner || { image: "", min: 0, max: 2000, active: true },
  upiList: setting.upiList || [],
  upiLimit: setting.upiLimit || { min: 2000, max: 100000 },
  bank: setting.bank || { name: "", accountNumber: "", ifsc: "" },
});

export const getPaymentSettings = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();
    res.json(normalizeSetting(setting));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const uploadScanner = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();

    if (req.file) {
      setting.scanner.image = `/uploads/payment/${req.file.filename}`;
    }

   if (req.body.scannerLimit) {
  let limit = {};

  try {
    limit = JSON.parse(req.body.scannerLimit);
  } catch {
    return res.status(400).json({
      success: false,
      msg: "Invalid scanner limit format",
    });
  }

 setting.scanner.min = Math.max(
  0,
  Number(limit.min || 0)
);

setting.scanner.max = Math.max(
  setting.scanner.min,
  Number(limit.max || 2000)
);
}

    setting.scanner.active = true;

    await setting.save();

    res.json({
      success: true,
      msg: "Scanner saved",
      setting: normalizeSetting(setting),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const saveUpi = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();

  setting.upiList = Array.isArray(req.body.upiList)
  ? [
      ...new Set(
        req.body.upiList
          .map((x) => String(x).trim().toLowerCase())
          .filter(Boolean)
      ),
    ]
  : [];

    if (req.body.upiLimit) {
      setting.upiLimit = {
        min: Number(req.body.upiLimit.min || 2000),
        max: Number(req.body.upiLimit.max || 100000),
      };
    }

    await setting.save();

    res.json({
      success: true,
      msg: "UPI saved",
      setting: normalizeSetting(setting),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
// export const saveBank
export const saveBank = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();

 if (!req.body.accountNumber || !req.body.ifsc) {
  return res.status(400).json({
    success: false,
    msg: "Account number and IFSC required",
  });
}

    await setting.save();

    res.json({
      success: true,
      msg: "Bank saved",
      setting: normalizeSetting(setting),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};