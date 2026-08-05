import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { unauthorizedResponse, forbiddenResponse } from "../utils/apiResponse.js";

const auth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return unauthorizedResponse(res, "No token provided", "NO_TOKEN");
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return unauthorizedResponse(res, "Invalid or expired token", "INVALID_TOKEN");
  }

  const user = await User.findById(decoded.id)
    .select("_id name phone role status referralCode kycStatus")
    .lean();

  if (!user) {
    return unauthorizedResponse(res, "User not found", "USER_NOT_FOUND");
  }

  if (user.status === "blocked") {
    return forbiddenResponse(res, "Account is blocked", "ACCOUNT_BLOCKED");
  }

  User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } }).catch(() => {});

  req.user = user;
  req.userId = user._id;

  next();
};

export default auth;
