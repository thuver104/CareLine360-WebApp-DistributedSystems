const { verifyAccessToken } = require("../utils/tokens");

const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded; // { userId, role }
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
