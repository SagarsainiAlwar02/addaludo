const jwt = require("jsonwebtoken");

/**
 * Generate JWT Token for user authentication
 * @param {Object} user - mongoose user object
 * @returns {String} token
 */

const generateToken = (user) => {
  if (!user) {
    throw new Error("User is required to generate token");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role || "user"
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

module.exports = generateToken;