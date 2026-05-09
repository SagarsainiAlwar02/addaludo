const PaymentSetting = require("../models/paymentSetting");

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

exports.getPaymentSettings = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();
    res.json(normalizeSetting(setting));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.uploadScanner = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();

    if (req.file) {
      setting.scanner.image = `/uploads/payment/${req.file.filename}`;
    }

    if (req.body.scannerLimit) {
      const limit = JSON.parse(req.body.scannerLimit);
      setting.scanner.min = Number(limit.min || 0);
      setting.scanner.max = Number(limit.max || 2000);
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

exports.saveUpi = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();

    setting.upiList = Array.isArray(req.body.upiList)
      ? req.body.upiList.map((x) => String(x).trim()).filter(Boolean)
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

exports.saveBank = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();

    setting.bank = {
      name: req.body.name || "",
      accountNumber: req.body.accountNumber || "",
      ifsc: req.body.ifsc || "",
    };

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