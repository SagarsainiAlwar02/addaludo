/**
 * permissions.js
 * Central definition of agent permissions and response sanitizers.
 *
 * Permissions (agent can see ONLY what admin grants):
 *  - dashboard        : Dashboard page (stats)
 *  - mobile           : phone numbers of users (if OFF, no phone visible anywhere)
 *  - matches          : Matches page
 *  - admin_control    : Admin Control -> only "Website Settings" for agents
 *  - client_tracking  : Client Tracking page
 *  - kyc              : KYC page
 *  - deposit          : Deposit page
 *  - withdraw         : Withdraw page
 *  - setting          : Settings page
 *  - payment_control  : Payment Control page
 *  - user             : Users page
 */

export const ALL_PERMISSIONS = [
  "dashboard",
  "mobile",
  "matches",
  "admin_control",
  "client_tracking",
  "kyc",
  "deposit",
  "withdraw",
  "setting",
  "payment_control",
  "user",
];

/**
 * Keep only known permission keys (deduped).
 */
export const sanitizePermissions = (perms) => {
  if (!Array.isArray(perms)) return [];
  return [...new Set(perms.filter((p) => ALL_PERMISSIONS.includes(p)))];
};

/* ------------------------------------------------------------------ */
/* Phone masking - agents without the "mobile" permission never see    */
/* any phone number in any admin API response.                         */
/* ------------------------------------------------------------------ */

const PHONE_KEYS = new Set(["phone", "mobile", "mobileNumber", "adminPhone", "userPhone"]);

const maskValue = (value, keepKeys = new Set()) => {
  if (Array.isArray(value)) return value.map((v) => maskValue(v, keepKeys));
  if (value && typeof value === "object" && value.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (PHONE_KEYS.has(k) && typeof v === "string" && !keepKeys.has(k)) {
        out[k] = null;
      } else {
        out[k] = maskValue(v, keepKeys);
      }
    }
    return out;
  }
  return value;
};

/**
 * Return data unchanged for admins / agents with "mobile" permission.
 * Otherwise deep-mask every phone-like field in the payload.
 *
 * keepKeys: optional set of phone-ish keys that must stay visible even without
 * the "mobile" permission (e.g. tracked-account phone numbers, which are the
 * account identifiers in Client Tracking).
 */
export const sanitizeForUser = (data, user, keepKeys = []) => {
  if (!user || user.role === "admin") return data;
  if (Array.isArray(user.permissions) && user.permissions.includes("mobile")) return data;
  return maskValue(data, new Set(keepKeys));
};
