const { verifyAccessToken } = require("../utils/tokens");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // 👇 Fetch user from DB to check active status
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    req.user = {
      userId: user._id,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid/Expired token" });
  }
};

const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: role not allowed" });
    }
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
