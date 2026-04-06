const User = require("../models/User");
const Appointment = require("../models/Appointment");

const listUsers = async ({ page = 1, limit = 10, role = "all", search = "" }) => {
  const query = {};
  if (role !== "all") query.role = role;
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
};

const listPendingDoctors = async () => {
  return User.find({ role: "doctor", status: "PENDING", isActive: true }).select("-passwordHash");
};

const updateUserStatus = async (userId, status) => {
  const allowed = ["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"];
  if (!allowed.includes(status)) {
    const error = new Error("Invalid status");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(userId, { status }, { new: true }).select("-passwordHash");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const getStats = async () => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
    totalAppointments,
    pendingAppointments,
    completedAppointments,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "patient" }),
    User.countDocuments({ role: "doctor" }),
    User.countDocuments({ role: "admin" }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: "pending" }),
    Appointment.countDocuments({ status: "completed" }),
  ]);

  return {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
    totalAppointments,
    pendingAppointments,
    completedAppointments,
  };
};

module.exports = {
  listUsers,
  listPendingDoctors,
  updateUserStatus,
  getStats,
};
