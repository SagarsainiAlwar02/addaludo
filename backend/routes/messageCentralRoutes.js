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
  // Provider says host + path:
  // https://cpaas.messagecentral.com/verification/v3/send
  // We keep default exactly as that host/path; if MC_BASE_URL is set, we use it with trimming.
  const fallback = "https://cpaas.messagecentral.com/verification/v3/send";
  const mcBase = process.env.MC_BASE_URL || fallback;
  return String(mcBase).trim().split(/\s+/)[0].replace(/\/$/, "");
}

function getAuthToken() {
  // Provider expects header key: authToken
  // Prefer MC_AUTH_TOKEN; allow MC_PASSWORD fallback via OAuth if needed in future.
  // For this router integration, we require MC_AUTH_TOKEN (production safe).
  if (process.env.MC_AUTH_TOKEN) return process.env.MC_AUTH_TOKEN;
  // Keep backward compatibility: if token isn't present but password is, fail loudly.
  // The existing OTP util supports OAuth, but this router is specifically for "Message Now".
  throw new Error("Message Central authToken missing: set MC_AUTH_TOKEN");
}

function getMessageNowSendUrl(baseUrl) {
  // baseUrl might be provided as ".../verification/v3/send"
  // Ensure it ends with /send
  return baseUrl;
}

function safeErrorResponse(err) {
  const status = err?.response?.status || 500;
  const data = err?.response?.data;
  return { status, data };
}

/**
 * POST /send-single
 * Body (typical - provider may ignore extras):
 * {
 *   "mobileNumber": "9999999999" | "919999999999",
 *   "countryCode": "91",
 *   "messageText": "..."
 * }
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

    // Provider quirk: "config fields" must be query params, not JSON body.
    // We send message content as form fields? For non-file endpoints, we can still use
    // application/json but ensure provider-required config is query params.
    // Since we don't have the exact "Message Now" schema here, we implement:
    // - query params: countryCode, mobileNumber, messageText
    // - empty body: null (provider often accepts null when params drive config)
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
 * Body:
 * {
 *   "countryCode": "91",
 *   "recipients": [
 *     { "mobileNumber": "9999999999", "messageText": "..." },
 *     ...
 *   ]
 * }
 *
 * Note: provider schema unknown; this implementation follows the same "query params only"
 * requirement by sending each recipient as a query-based config.
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

    // Provider often expects multiple recipients in one request; absent exact schema,
    // we iterate and dispatch sequentially to keep behavior predictable.
    // If your provider accepts batch in one call, we can refactor later.
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
 * multipart/form-data:
 *   - file: excel file (field name: "file")
 *   - query params/config fields via body -> converted to query params
 *
 * Expected body fields (best-effort defaults):
 * {
 *   "countryCode": "91",
 *   "templateId": "...",   // if provider supports
 *   "messageType": "SMS"   // optional
 * }
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

    // Convert config from body to query params (provider quirk)
    const countryCode = req.body?.countryCode || "91";
    const templateId = req.body?.templateId;
    const messageType = req.body?.messageType || "SMS";

    // "All config fields must be query params, not JSON body"
    // We'll put config in params and still attach file via multipart.
    const form = new FormData();
    // Append Excel in memory
    form.append("file", file.buffer, {
      filename: file.originalname || "bulk.xlsx",
      contentType: file.mimetype || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Provider may require specific form field name; "file" is most common.
    // If your provider requires a different field (e.g., "excelFile"), update here.

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
 * Provider sends JSON payload; we just acknowledge with 200 OK.
 */
router.post("/callback", async (req, res) => {
  try {
    // Optionally log minimal info
    // console.log("Message Central callback:", req.body);
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ received: false, error: err.message || "Callback failed" });
  }
});

export default router;
