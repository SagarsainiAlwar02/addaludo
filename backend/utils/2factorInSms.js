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

  // Latest 2factor.in API style for sending SMS:
  // POST https://2factor.in/API/R1/
  // x-www-form-urlencoded
  // module=TRANS_SMS, apikey, to, from, msg (+ optional DLT fields)
  const url = `${DEFAULT_BASE_URL}/API/R1/`;

  const senderId = process.env.TWO_FACTOR_SENDER_ID || process.env.TWO_FACTOR_FROM;
  if (!senderId) {
    throw new Error("2factor.in sender id missing. Set TWO_FACTOR_SENDER_ID (or TWO_FACTOR_FROM) in .env");
  }


  const data = new URLSearchParams();
  data.append("module", "TRANS_SMS");
  data.append("apikey", apiKey);
  data.append("to", to);
  data.append("from", senderId);


  // message must be DLT-approved exact text (as per your account)
  // templateName is ignored here because this API uses `msg`.
  data.append("msg", message);

  if (process.env.TWOFACTOR_PEID) data.append("peid", process.env.TWOFACTOR_PEID);
  if (process.env.TWOFACTOR_CID || process.env.TWOFACTOR_CTIID) {
    // Some setups use ctid. Keep flexible.
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

