const User = require("../models/User");

const getUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;

    const users = await User.find(query).select("-passwordHash").sort("email");
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById };
