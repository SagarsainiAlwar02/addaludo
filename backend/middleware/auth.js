

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";

export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        msg: "No token provided"
      });
    }

    const token = header.split(" ")[1];
    if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}

const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET
);

if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
  return res.status(401).json({
    success: false,
    msg: "Invalid token",
  });
}
    const user = await User.findById(decoded.id)
      .select("_id status role")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "User not found"
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        msg: "Account blocked"
      });
    }

  req.user = user._id.toString();
    req.userData = user;

    // ✅ NEW: Online-user tracking, fire-and-forget (request slow nahi hoga)
    User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } }).catch(() => {});

    next();

} catch (err) {

  console.log("AUTH ERROR:", err.message);

  return res.status(401).json({
    success: false,
    msg: "Invalid token",
  });
}
};
