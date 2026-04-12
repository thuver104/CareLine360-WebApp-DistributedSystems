const adminService = require("../services/adminService");

const getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const role = req.query.role || "all";
    const search = req.query.search || "";
    const data = await adminService.listUsers({ page, limit, role, search });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await adminService.listPendingDoctors();
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
};

const patchUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.updateUserStatus(req.params.id, req.body.status);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await adminService.deleteUser(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    const result = await adminService.resetUserPassword(
      req.params.id,
      req.body?.password || req.body?.newPassword
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getPendingDoctors,
  patchUserStatus,
  toggleUserStatus,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getStats,
};
