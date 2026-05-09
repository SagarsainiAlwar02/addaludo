const path = require("path");
const fs = require("fs");
const PaymentSetting = require("../models/paymentSetting");

const getOrCreateSetting = async () => {
  let setting = await PaymentSetting.findOne();
  if (!setting) setting = await PaymentSetting.create({});
  return setting;
};

exports.getPaymentSettings = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.uploadScanner = async (req, res) => {
  try {
    const setting = await getOrCreateSetting();

    if (req.file) {
      setting.scannerImage = `/uploads/payment/${req.file.filename}`;
    }

    if (req.body.scannerLimit) {
      setting.scannerLimit = JSON.parse(req.body.scannerLimit);
    }

    await setting.save();
    res.json({ success: true, msg: "Scanner saved", setting });
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

    setting.upiLimit = req.body.upiLimit || setting.upiLimit;

    await setting.save();
    res.json({ success: true, msg: "UPI saved", setting });
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
    res.json({ success: true, msg: "Bank saved", setting });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};