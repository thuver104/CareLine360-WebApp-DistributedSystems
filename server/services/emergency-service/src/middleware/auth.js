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

    const user = decoded.userId ? await User.findById(decoded.userId) : null;
    if (user && user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    req.user = {
      userId: decoded.userId,
      role: (decoded.role || user?.role || '').toLowerCase(),
    };

    if (!req.user.userId || !req.user.role) {
      return res.status(401).json({ message: "Invalid/Expired token" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid/Expired token" });
  }
};

const roleMiddleware = (allowedRoles = []) => (req, res, next) => {
  const normalizedAllowed = allowedRoles.map((role) => String(role).toLowerCase());
  const role = String(req.user?.role || '').toLowerCase();
  if (!role || !normalizedAllowed.includes(role)) {
    return res.status(403).json({ message: "Forbidden: role not allowed" });
  }
  next();
};

module.exports = { authMiddleware, roleMiddleware };
