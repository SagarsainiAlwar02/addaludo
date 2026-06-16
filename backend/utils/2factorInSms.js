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
 * Sends SMS via 2factor.in aligning the custom database-generated OTP code.
 */
export async function sendSms2factor({ phoneNumber, message, templateName }) {
  const { apiKey } = get2factorConfig();

  const to = String(phoneNumber).replace(/\D/g, "");
  if (!to) throw new Error("Invalid phoneNumber for 2factor.in");

  // Extract the generated OTP from the message string (looks for a 4-6 digit sequence)
  const otpMatch = message.match(/\d{4,6}/);
  const customOtp = otpMatch ? otpMatch[0] : "123456";

  const useTemplate = Boolean(process.env.TWOFACTOR_USE_TEMPLATE) || Boolean(templateName);

  // --- Style 1: R1 (Transactional Custom Text SMS Payload) ---
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

  // --- Style 2: V1 template explicit code injection (Forces 2Factor to use OUR OTP) ---
  const tn = String(templateName || "").trim();
  if (!tn) {
    throw new Error("2factor.in V1 template mode enabled but templatename value is missing");
  }

  const encodedTemplateName = encodeURIComponent(tn);
  
  // 🟢 OPTIMIZATION: Appending the custom database OTP directly to the URL parameters
  // This passes our customOtp variable directly into the 2Factor template structure
  const url = `${DEFAULT_BASE_URL}/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(to)}/${encodeURIComponent(customOtp)}/${encodedTemplateName}`;

  const senderId = process.env.TWO_FACTOR_SENDER_ID || process.env.TWO_FACTOR_FROM;

  const res = await axios.get(url, {
    params: senderId ? { from: senderId } : undefined,
    timeout: 120000,
  });

  return res.data;
}