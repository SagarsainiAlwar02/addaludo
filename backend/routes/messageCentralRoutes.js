import express from "express";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";

const router = express.Router();

// Upload in memory; provider expects multipart/form-data
const upload = multer({ storage: multer.memoryStorage() });

function getRequiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Message Central env missing: ${name}`);
  return v;
}

function normalizeBaseUrl() {
  const fallback = "https://cpaas.messagecentral.com/verification/v3/send";
  const mcBase = process.env.MC_BASE_URL || fallback;
  return String(mcBase).trim().split(/\s+/)[0].replace(/\/$/, "");
}

function getAuthToken() {
  if (process.env.MC_AUTH_TOKEN) return process.env.MC_AUTH_TOKEN;
  throw new Error("Message Central authToken missing: set MC_AUTH_TOKEN");
}

function getMessageNowSendUrl(baseUrl) {
  return baseUrl;
}

function safeErrorResponse(err) {
  const status = err?.response?.status || 500;
  const data = err?.response?.data;
  return { status, data };
}

/**
 * 🟢 ADDED: POST /verify
 * Matches your frontend's dynamic payload keys perfectly
 * Validates the OTP pin directly against the Message Central infrastructure
 */
router.post("/verify", async (req, res) => {
  try {
    // Read every possible frontend variant safely
    const verificationId = req.body.verificationId;
    const otpCode = req.body.code || req.body.otp;
    const mobileNumber = req.body.mobileNumber || req.body.phone;

    if (!verificationId || !otpCode || !mobileNumber) {
      return res.status(200).json({ 
        success: false, 
        msg: "Phone and OTP required" 
      });
    }

    const authToken = getAuthToken();
    
    // Message Central validation URL structure: 
    // https://cpaas.messagecentral.com/verification/v3/validateOtp
    const validateUrl = "https://cpaas.messagecentral.com/verification/v3/validateOtp";

    console.log("FORWARDING TO MESSAGE CENTRAL VALIDATION:", {
      verificationId,
      mobileNumber,
      code: otpCode
    });

    const response = await axios.get(validateUrl, {
      headers: { authToken },
      params: {
        customerId: process.env.MC_CUSTOMER_ID,
        countryCode: "91",
        mobileNumber: mobileNumber,
        verificationId: verificationId,
        code: otpCode
      }
    });

    console.log("MESSAGE CENTRAL RESPONSE:", response.data);

    // If Message Central validates successfully
    if (response.data?.status === "VALIDATED" || response.data?.success === true) {
      
      // 💡 NOTE: If you need to generate a JWT login token or create a user in your 
      // database, that logic should be executed here before returning success.
      
      return res.status(200).json({ 
        success: true, 
        msg: "OTP Verified successfully",
        token: "mock-session-token-replace-with-your-jwt", // Swap with a real signing token if needed
        user: { mobileNumber }
      });
    } else {
      return res.status(200).json({ 
        success: false, 
        msg: response.data?.message || response.data?.msg || "Invalid OTP" 
      });
    }

  } catch (err) {
    console.error("BACKEND OTP VERIFY EXCEPTION:", err.response?.data || err.message);
    const { status, data } = safeErrorResponse(err);
    return res.status(200).json({
      success: false,
      msg: data?.message || data?.msg || "Invalid OTP"
    });
  }
});

/**
 * POST /send-single
 */
router.post("/send-single", async (req, res) => {
  try {
    const { mobileNumber, countryCode = "91", messageText } = req.body || {};

    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: "Missing mobileNumber" });
    }
    if (!messageText) {
      return res.status(400).json({ success: false, error: "Missing messageText" });
    }

    const authToken = getAuthToken();
    const baseUrl = normalizeBaseUrl();
    const url = getMessageNowSendUrl(baseUrl);

    const response = await axios.post(
      url,
      null,
      {
        headers: { authToken },
        params: {
          customerId: process.env.MC_CUSTOMER_ID,
          countryCode,
          mobileNumber,
          message: messageText,
          flowType: "SMS",
        },
        timeout: 120000,
      }
    );

    return res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    const { status, data } = safeErrorResponse(err);
    return res.status(status).json({
      success: false,
      error: data || err.message || "Failed to send Message Now (single)",
    });
  }
});

/**
 * POST /send-bulk-strings
 */
router.post("/send-bulk-strings", async (req, res) => {
  try {
    const { countryCode = "91", recipients } = req.body || {};

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing recipients array",
      });
    }

    const authToken = getAuthToken();
    const baseUrl = normalizeBaseUrl();
    const url = getMessageNowSendUrl(baseUrl);

    const results = [];
    for (const r of recipients) {
      const mobileNumber = r?.mobileNumber;
      const messageText = r?.messageText;
      if (!mobileNumber || !messageText) {
        results.push({ mobileNumber: mobileNumber || null, ok: false, error: "Missing mobileNumber/messageText" });
        continue;
      }

      const response = await axios.post(
        url,
        null,
        {
          headers: { authToken },
          params: {
            customerId: process.env.MC_CUSTOMER_ID,
            countryCode,
            mobileNumber,
            message: messageText,
            flowType: "SMS",
          },
          timeout: 120000,
        }
      );

      results.push({ mobileNumber, ok: true, data: response.data });
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    const { status, data } = safeErrorResponse(err);
    return res.status(status).json({
      success: false,
      error: data || err.message || "Failed to send Message Now (bulk strings)",
    });
  }
});

/**
 * POST /send-bulk-file
 */
router.post("/send-bulk-file", upload.single("file"), async (req, res) => {
  try {
    const authToken = getAuthToken();
    const baseUrl = normalizeBaseUrl();
    const url = getMessageNowSendUrl(baseUrl);

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "Missing file (multipart field: file)" });
    }

    const countryCode = req.body?.countryCode || "91";
    const templateId = req.body?.templateId;
    const messageType = req.body?.messageType || "SMS";

    const form = new FormData();
    form.append("file", file.buffer, {
      filename: file.originalname || "bulk.xlsx",
      contentType: file.mimetype || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        authToken,
      },
      params: {
        customerId: process.env.MC_CUSTOMER_ID,
        countryCode,
        messageType,
        ...(templateId ? { templateId } : {}),
      },
      timeout: 180000,
    });

    return res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    const { status, data } = safeErrorResponse(err);
    return res.status(status).json({
      success: false,
      error: data || err.message || "Failed to send Message Now (bulk file)",
    });
  }
});

/**
 * POST /callback
 */
router.post("/callback", async (req, res) => {
  try {
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ received: false, error: err.message || "Callback failed" });
  }
});

export default router;