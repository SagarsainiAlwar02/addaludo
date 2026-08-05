import PaymentSetting from "../models/paymentSetting.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, badRequestResponse } from "../utils/apiResponse.js";

/**
 * payment.controller.js
 * Platform payment receiving settings (QR, UPI, Bank).
 */

/**
 * Get or create default payment settings.
 */
const getOrCreateSetting = async () => {
  let setting = await PaymentSetting.findOne();
  if (!setting) {
    setting = await PaymentSetting.create({});
  }
  return setting;
};

/**
 * Normalize payment settings for response.
 */
const normalizeSetting = (setting) => ({
  _id: setting._id,
  scanner: setting.scanner || { image: "", min: 0, max: 2000, active: true },
  scannerImage: setting.scanner?.image || "",
  upiList: setting.upiList || [],
  upiLimit: setting.upiLimit || { min: 2000, max: 100000 },
  bank: setting.bank || { name: "", accountNumber: "", ifsc: "", active: true },
  active: setting.active,
});

/**
 * Get public payment settings.
 * GET /api/payment/settings
 */
export const getPaymentSettings = asyncHandler(async (req, res) => {
  const setting = await getOrCreateSetting();
  return successResponse(res, normalizeSetting(setting), "Payment settings fetched");
});

/**
 * Upload/update QR scanner image and limits.
 * POST /api/payment/upload-scanner
 */
export const uploadScanner = asyncHandler(async (req, res) => {
  const setting = await getOrCreateSetting();

  if (req.file) {
    setting.scanner.image = `/uploads/payment/${req.file.filename}`;
  }

  if (req.body.scannerLimit) {
    let limit = {};
    try {
      limit = JSON.parse(req.body.scannerLimit);
    } catch {
      return badRequestResponse(res, "Invalid scanner limit format", "INVALID_LIMIT_FORMAT");
    }

    setting.scanner.min = Math.max(0, Number(limit.min || 0));
    setting.scanner.max = Math.max(
      setting.scanner.min,
      Number(limit.max || 2000)
    );
  }

  setting.scanner.active = true;
  await setting.save();

  return successResponse(
    res,
    normalizeSetting(setting),
    "Scanner settings saved"
  );
});

/**
 * Save UPI list and limits.
 * POST /api/payment/save-upi
 */
export const saveUpi = asyncHandler(async (req, res) => {
  const setting = await getOrCreateSetting();
  const { upiList, upiLimit } = req.body;

  const cleanUpi = Array.isArray(upiList)
    ? [
        ...new Set(
          upiList
            .map((x) => String(x).trim().toLowerCase())
            .filter(Boolean)
        ),
      ]
    : [];

  setting.upiList = cleanUpi;

  if (upiLimit) {
    setting.upiLimit = {
      min: Number(upiLimit.min || 2000),
      max: Number(upiLimit.max || 100000),
    };
  }

  await setting.save();

  return successResponse(res, normalizeSetting(setting), "UPI settings saved");
});

/**
 * Save bank details.
 * POST /api/payment/save-bank
 */
export const saveBank = asyncHandler(async (req, res) => {
  const setting = await getOrCreateSetting();
  const { name, accountNumber, ifsc } = req.body;

  if (!accountNumber || !ifsc) {
    return badRequestResponse(
      res,
      "Account number and IFSC required",
      "BANK_DETAILS_REQUIRED"
    );
  }

  setting.bank = {
    name: String(name || ""),
    accountNumber: String(accountNumber || ""),
    ifsc: String(ifsc || ""),
    active: true,
  };

  await setting.save();

  return successResponse(res, normalizeSetting(setting), "Bank details saved");
});
