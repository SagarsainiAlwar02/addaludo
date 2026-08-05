/**
 * generateId
 * Unique, human-readable ID generators used across the app.
 */

/**
 * Generate a unique contest ID.
 * Format: contest_<timestamp>_<random4>
 * Example: contest_1699012345678_4821
 */
export const generateContestId = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `contest_${timestamp}_${random}`;
};

/**
 * Generate a unique referral code.
 * Format: BA-<6 digits>
 * Example: BA-482193
 */
export const generateReferralCode = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BA-${random}`;
};

/**
 * Generate a random numeric OTP.
 * Default 6 digits.
 */
export const generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};
