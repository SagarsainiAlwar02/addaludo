/**
 * permissions.js
 * Admin panel permission definitions shared by the sidebar, routes, and
 * the Add/Edit Admin-Agent forms.
 *
 * An admin (role === "admin") implicitly has all access.
 * An agent only sees the sections whose permission key the admin granted.
 */

export const PERMISSIONS = [
  { key: "dashboard", label: "Dashboard", desc: "Dashboard stats" },
  { key: "mobile", label: "Mobile No", desc: "See user phone numbers" },
  { key: "matches", label: "Matches", desc: "Matches section" },
  { key: "admin_control", label: "Admin Control", desc: "Website Settings only" },
  { key: "client_tracking", label: "Client Tracking", desc: "Tracked accounts" },
  { key: "kyc", label: "KYC", desc: "KYC panel" },
  { key: "deposit", label: "Deposit", desc: "Deposit panel" },
  { key: "withdraw", label: "Withdraw", desc: "Withdraw panel" },
  { key: "setting", label: "Setting", desc: "Settings page" },
  { key: "payment_control", label: "Payment Control", desc: "Payment control page" },
  { key: "user", label: "User", desc: "Users panel" },
];

/** Route path -> permission key required to view it (admin always allowed). */
export const PATH_PERMISSION = {
  "/dashboard": "dashboard",
  "/users": "user",
  "/kyc": "kyc",
  "/deposit": "deposit",
  "/withdraw": "withdraw",
  "/matches": "matches",
  "/dummy-battles": null, // admin only - no permission grants this
  "/settings": "setting",
  "/payment": "payment_control",
  "/admin-control": "admin_control",
  "/client-tracking": "client_tracking",
};

export const getAdminUser = () => {
  try {
    return JSON.parse(localStorage.getItem("adminUser") || "null");
  } catch {
    return null;
  }
};

export const isAdmin = (user = getAdminUser()) => user?.role === "admin";

export const hasPermission = (perm, user = getAdminUser()) => {
  if (isAdmin(user)) return true;
  return Array.isArray(user?.permissions) && user.permissions.includes(perm);
};

/** First route the user is allowed to land on after login. */
export const firstAllowedPath = (user = getAdminUser()) => {
  if (isAdmin(user)) return "/dashboard";
  const order = [
    "/dashboard",
    "/users",
    "/kyc",
    "/deposit",
    "/withdraw",
    "/matches",
    "/settings",
    "/payment",
    "/admin-control",
    "/client-tracking",
  ];
  for (const path of order) {
    const perm = PATH_PERMISSION[path];
    if (perm && hasPermission(perm, user)) return path;
  }
  return "/no-access";
};
