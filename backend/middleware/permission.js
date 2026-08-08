import { forbiddenResponse, unauthorizedResponse } from "../utils/apiResponse.js";

/**
 * permission.js
 * Middleware that gates admin/agent routes by role + permissions.
 *
 * - role "admin" => full access to everything.
 * - role "agent" => only routes whose permission key is present in req.user.permissions.
 */

/**
 * Require a specific section permission.
 * Usage: router.get("/users", requirePermission("user"), getUsers)
 */
export const requirePermission = (perm) => (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, "Authentication required", "AUTH_REQUIRED");
  }

  if (req.user.role === "admin") return next();

  const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
  if (!perms.includes(perm)) {
    return forbiddenResponse(
      res,
      "You don't have permission to access this section",
      "PERMISSION_DENIED"
    );
  }

  next();
};

/**
 * Require the caller to be a main admin (role === "admin").
 * Agents can never use these endpoints (admin/agent management etc.).
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, "Authentication required", "AUTH_REQUIRED");
  }

  if (req.user.role !== "admin") {
    return forbiddenResponse(
      res,
      "Only main admin can access this",
      "ADMIN_ONLY"
    );
  }

  next();
};
