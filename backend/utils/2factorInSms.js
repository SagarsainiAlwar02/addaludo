import axios from "axios";

const DEFAULT_BASE_URL = "https://2factor.in";

function get2factorConfig() {
  const apiKey = process.env.TWO_FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY || process.env.TWOFACTOR_APIKEY || process.env.TWOFACTORIN_API_KEY || process.env.TWOFACTORIN_APIKEY;

  if (!apiKey) {
    throw new Error("2factor.in API key missing. Set TWOFACTOR_API_KEY in .env");
  }
  return { apiKey };
}

/**
 * Sends SMS via 2factor.in using the simple AUTOGEN endpoint style.
 *
 * IMPORTANT:
 * 2factor.in "AUTOGEN" OTP verification is not reliably verifiable server-side without
 * a provider verification API exposing the OTP/code. To guarantee OTP logic working,
 * the app should generate and verify OTP itself by comparing code with otpSessions.
 *
 * This helper therefore sends OTP inside the message text.
 */
export async function sendSms2factor({ phoneNumber, message, templateName }) {
  const { apiKey } = get2factorConfig();

  const to = String(phoneNumber).replace(/\D/g, "");
  if (!to) throw new Error("Invalid phoneNumber for 2factor.in");

  // Supports two 2Factor SMS OTP styles:
  // 1) POST /API/R1/  (form-urlencoded) -> uses `msg` field (no template name needed)
  // 2) Template-based GET /API/V1/<apikey>/SMS/<to>/AUTOGEN/<templateName>
  //    (requires templatename in URL)

  const useTemplate = Boolean(process.env.TWOFACTOR_USE_TEMPLATE) || Boolean(templateName);

  // --- Style 1: R1 (recommended if you're allowed to send `msg`) ---
  if (!useTemplate || useTemplate === false) {
    const senderId = process.env.TWO_FACTOR_SENDER_ID || process.env.TWO_FACTOR_FROM;
    if (!senderId) {
      throw new Error("2factor.in sender id missing. Set TWO_FACTOR_SENDER_ID (or TWO_FACTOR_FROM) in .env");
    }

    const url = `${DEFAULT_BASE_URL}/API/R1/`;

    const data = new URLSearchParams();
    data.append("module", "TRANS_SMS");
    data.append("apikey", apiKey);
    data.append("to", to);
    data.append("from", senderId);

    // message must be DLT-approved exact text (as per your account)
    data.append("msg", message);

    if (process.env.TWOFACTOR_PEID) data.append("peid", process.env.TWOFACTOR_PEID);
    if (process.env.TWOFACTOR_CID || process.env.TWOFACTOR_CTIID) {
      data.append("ctid", process.env.TWOFACTOR_CID || process.env.TWOFACTOR_CTIID);
    }

    const res = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 120000,
    });

    return res.data;
  }

  // --- Style 2: V1 template AUTOGEN endpoint (requires template name in URL) ---
  // IMPORTANT: Do not shove arbitrary message text into URL path.
  // Use the templateName you’ve approved in the 2Factor dashboard.
  const tn = String(templateName || "").trim();
  if (!tn) {
    throw new Error("2factor.in V1 template mode enabled but templatename value is missing");
  }

  // If you want to include dynamic OTP value, the correct approach depends on your template setup.
  // Typically, AUTOGEN generates OTP server-side, and you should verify via that OTP mechanism.
  // This codebase currently generates OTP itself; here we only handle sending.
  // For correctness, ensure your provider/dashboard template is compatible with AUTOGEN.

  // 2factor expects path segments without raw spaces; encode only the template name.
  // apiKey and to are already URL-safe, but we keep encoding for safety.
  const encodedTemplateName = encodeURIComponent(tn);
  const url = `${DEFAULT_BASE_URL}/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(to)}/AUTOGEN/${encodedTemplateName}`;


  const senderId = process.env.TWO_FACTOR_SENDER_ID || process.env.TWO_FACTOR_FROM;

  // Some template configurations may require sender header/field; keep best-effort with query param `from`.
  const res = await axios.get(url, {
    params: senderId ? { from: senderId } : undefined,
    timeout: 120000,
  });

  return res.data;
}



