const User = require("../models/User");
const Appointment = require("../models/Appointment");
const bcrypt = require("bcryptjs");

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

const createUser = async ({ fullName, email, phone, password, role = "patient" }) => {
  if (!fullName || !password || (!email && !phone)) {
    const error = new Error("fullName, password and either email or phone are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedRole = String(role || "patient").toLowerCase();
  const allowedRoles = ["patient", "doctor", "responder", "admin"];
  if (!allowedRoles.includes(normalizedRole)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: email || undefined,
    phone: phone || undefined,
    passwordHash,
    role: normalizedRole,
    status: normalizedRole === "doctor" ? "PENDING" : "ACTIVE",
    isActive: true,
  });

  return User.findById(user._id).select("-passwordHash");
};

const updateUser = async (userId, payload = {}) => {
  const allowed = ["fullName", "email", "phone", "role", "status", "isActive"];
  const set = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      set[key] = payload[key];
    }
  }

  if (set.role) set.role = String(set.role).toLowerCase();
  if (set.status) set.status = String(set.status).toUpperCase();

  const user = await User.findByIdAndUpdate(userId, { $set: set }, { new: true }).select("-passwordHash");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId).select("-passwordHash");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const toggleUserStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  user.status = nextStatus;
  user.isActive = nextStatus === "ACTIVE";
  await user.save();

  return User.findById(user._id).select("-passwordHash");
};

const resetUserPassword = async (userId, password) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const generatedPassword =
    password || `CL360@${Math.random().toString(36).slice(-6)}A1`;
  user.passwordHash = await bcrypt.hash(generatedPassword, 10);
  await user.save();

  return {
    userId: user._id,
    userEmail: user.email || null,
    userPhone: user.phone || null,
    newPassword: generatedPassword,
    notificationMethod: user.email ? "email_failed" : user.phone ? "manual_phone" : "none",
  };
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
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getStats,
};
