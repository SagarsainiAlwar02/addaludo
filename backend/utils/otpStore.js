/**
 * otpStore
 * In-memory storage for OTP codes.
 * OTPs expire after 5 minutes.
 *
 * Note: For multi-server deployments, replace this with Redis.
 */

const otpStore = {};

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MASTER_OTP = "999999"; // For testing only

export const setOtp = (phone, otp) => {
  otpStore[phone] = {
    otp: String(otp),
    createdAt: Date.now(),
  };
};

export const getOtp = (phone) => {
  return otpStore[phone] || null;
};

export const deleteOtp = (phone) => {
  delete otpStore[phone];
};

export const isOtpValid = (phone, inputOtp) => {
  if (!inputOtp) return false;

  // Master OTP bypass for testing
  if (String(inputOtp) === MASTER_OTP) return true;

  const record = otpStore[phone];
  if (!record) return false;

  if (Date.now() - record.createdAt > OTP_EXPIRY_MS) {
    delete otpStore[phone];
    return false;
  }

  return record.otp === String(inputOtp);
};

export const getMasterOtp = () => MASTER_OTP;

// Cleanup expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  Object.keys(otpStore).forEach((phone) => {
    if (now - otpStore[phone].createdAt > OTP_EXPIRY_MS) {
      delete otpStore[phone];
    }
  });
}, 60000);

export default otpStore;
