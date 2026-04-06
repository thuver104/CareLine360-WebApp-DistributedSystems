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
  getStats,
};
