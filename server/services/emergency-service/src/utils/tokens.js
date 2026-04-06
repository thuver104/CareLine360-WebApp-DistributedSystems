const jwt = require("jsonwebtoken");

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);

module.exports = { verifyAccessToken };
