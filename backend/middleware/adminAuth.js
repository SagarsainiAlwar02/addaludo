import { forbiddenResponse, unauthorizedResponse } from "../utils/apiResponse.js";

const adminAuth = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, "Authentication required", "AUTH_REQUIRED");
  }

  if (req.user.role !== "admin" && req.user.role !== "agent") {
    return forbiddenResponse(res, "Admin access required", "ADMIN_ONLY");
  }

  next();
};

export default adminAuth;
