import axios from "axios";

const DEFAULT_BASE_URL = "https://cpaas.messagecentral.com";

function getMessageCentralConfig() {
  const customerId = process.env.MC_CUSTOMER_ID;
  // Project currently provides MC_AUTH_TOKEN (not MC_PASSWORD)
  const password = process.env.MC_PASSWORD;
  const authToken = process.env.MC_AUTH_TOKEN;

  // Note: your .env currently has an MC_BASE_URL like:
  // https://cpaas.messagecentral.comAction: ...
  // The code below strips any trailing garbage + trailing slashes.
  let baseURL = process.env.MC_BASE_URL || DEFAULT_BASE_URL;
  baseURL = String(baseURL).trim();
  // Remove any accidental inline text after the URL
  baseURL = baseURL.split(/\s+/)[0];
  baseURL = baseURL.replace(/\/$/, "");

  if (!customerId) {
    throw new Error("Message Central customer id missing (MC_CUSTOMER_ID)");
  }

  if (!password && !authToken) {
    throw new Error("Message Central credentials missing (set MC_PASSWORD or MC_AUTH_TOKEN)");
  }

  return { customerId, password, authToken, baseURL };
}

function pickToken(data) {
  return data?.token || data?.access_token || data?.data?.token || data?.data?.access_token;
}

function pickVerificationId(data) {
  return (
    data?.verificationId ||
    data?.verification_id ||
    data?.data?.verificationId ||
    data?.data?.verification_id ||
    data?.response?.verificationId
  );
}

export async function getMessageCentralToken() {
  const { customerId, password, authToken, baseURL } = getMessageCentralConfig();

  // If MC_AUTH_TOKEN is provided (token already available), use it directly.
  if (authToken) return authToken;

  // Otherwise fetch token using customerId + password
  const response = await axios.post(`${baseURL}/v3/oauth/token`, null, {
    params: {
      customerId,
      password,
    },
  });

  const token = pickToken(response.data);

  if (!token) {
    throw new Error("Message Central token missing in response");
  }

  return token;
}

export async function sendMessageCentralOtp({ countryCode = "91", mobileNumber }) {
  const { baseURL } = getMessageCentralConfig();
  const token = await getMessageCentralToken();

  // Your runtime logs show the provider expects this path on cpaas host.
  // Using /verification/v3/send to match your observed working endpoint shape.
  const url = `${baseURL}/verification/v3/send`;

  // Try Bearer auth first (common case)
  const tryHeaders = (authHeaderValue) => ({
    Authorization: authHeaderValue,
  });

  try {
    const response = await axios.post(
      url,
      {
        countryCode,
        mobileNumber,
        flowType: "SMS",
      },
      {
        // Fix: your provider expects token under header key `authToken`, not Authorization Bearer
        headers: {
          authToken: token,
        },
        timeout: 120000,
      }
    );

    const verificationId = pickVerificationId(response.data);

    if (!verificationId) {
      throw new Error("Message Central verificationId missing in response");
    }

    return {
      verificationId,
      data: response.data,
    };
  } catch (err) {
    // Retry once using raw token in Authorization (some gateways accept this)
    const apiError = err;
    if (apiError?.response?.status !== 401) {
      throw err;
    }

    const response2 = await axios.post(
      url,
      {
        countryCode,
        mobileNumber,
        flowType: "SMS",
      },
      {
        headers: {
          authToken: token,
        },
        timeout: 120000,
      }
    );

    const verificationId = pickVerificationId(response2.data);

    if (!verificationId) {
      throw new Error("Message Central verificationId missing in response");
    }

    return {
      verificationId,
      data: response2.data,
    };
  }


}

export async function verifyMessageCentralOtp({ verificationId, code }) {
  const { baseURL } = getMessageCentralConfig();
  const token = await getMessageCentralToken();

  const url = `${baseURL}/verification/v3/validate`;

  try {
    const response = await axios.post(url, null, {
      params: {
        verificationId,
        code,
      },
      headers: {
        authToken: token,
      },
      timeout: 120000,
    });

    return response.data;
  } catch (err) {
    if (err?.response?.status !== 401) throw err;

    const response2 = await axios.post(url, null, {
      params: {
        verificationId,
        code,
      },
      headers: {
        authToken: token,
      },
      timeout: 120000,
    });

    return response2.data;
  }
}
