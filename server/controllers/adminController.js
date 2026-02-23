const { validationResult } = require("express-validator");
const {
  listPendingDoctors,
  updateUserStatus,
  createUser: serviceCreateUser,
  getAllUsers: serviceGetAllUsers,
  toggleUserStatus: serviceToggleUserStatus,
  deleteUser: serviceDeleteUser,
  getStats: serviceGetStats,
  getAppointments: serviceGetAppointments,
  createMeetingLink: serviceCreateMeetingLink
} = require("../services/adminService");


const getPendingDoctors = async (req, res, next) => {
  try {
    const result = await listPendingDoctors();
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "all";

    const result = await serviceGetAllUsers(page, limit, search, role);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const result = await serviceToggleUserStatus(req.params.id);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await serviceDeleteUser(req.params.id);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const result = await serviceGetStats();
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const patchUserStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const result = await updateUserStatus({ userId: req.params.id, status: req.body.status });
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const postCreateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const result = await serviceCreateUser(req.body);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const getAppointments = async (req, res, next) => {
  try {
    const result = await serviceGetAppointments();
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};

const createMeetingLink = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const result = await serviceCreateMeetingLink(appointmentId);
    return res.status(result.status).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getPendingDoctors,
  patchUserStatus,
  postCreateUser,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getStats,
  getAppointments
  ,
  createMeetingLink
};

