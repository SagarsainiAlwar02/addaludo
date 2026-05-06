// const jwt = require("jsonwebtoken");
// const User = require("../models/user");

// module.exports = async (req, res, next) => {
//   try {
//     let token = req.header("Authorization") || req.headers.authorization;

//     if (!token) {
//       return res.status(401).json({ msg: "No token, access denied" });
//     }

//     if (token.startsWith("Bearer ")) {
//       token = token.slice(7).trim();
//     }

//     if (!token) {
//       return res.status(401).json({ msg: "Token missing" });
//     }

//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET || "secret"
//     );

//     if (!decoded || !decoded.id) {
//       return res.status(401).json({ msg: "Invalid token payload" });
//     }

//     const userId = String(decoded.id);

//     const user = await User.findById(userId).select("-password");

//     if (!user) {
//       return res.status(401).json({ msg: "User not found" });
//     }

//     if (user.status === "blocked") {
//       return res.status(403).json({ msg: "Account blocked" });
//     }

//     // ✅ Controllers ke liye clean string id
//     req.user = userId;

//     // ✅ Full user data agar kahin zarurat pade
//     req.userData = user;

//     next();

//   } catch (err) {
//     console.error("❌ AUTH ERROR:", err.message);

//     return res.status(401).json({
//       msg: "Token invalid or expired"
//     });
//   }
// };




const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        msg: "No token provided"
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const user = await User.findById(decoded.id);

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

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      msg: "Invalid token"
    });
  }
};