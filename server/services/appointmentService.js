const Appointment = require("../models/Appointment");
const User = require("../models/User");
const emailService = require("./emailService");

const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
};

const checkDoubleBooking = async (doctorId, date, time, excludeId = null) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    doctor: doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    time: time,
    status: { $nin: ["cancelled"] },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Appointment.findOne(query);
  return !!existing;
};

const createAppointment = async (data) => {
  const isBooked = await checkDoubleBooking(data.doctor, data.date, data.time);
  if (isBooked) {
    const error = new Error("Doctor already has an appointment at this date and time");
    error.statusCode = 409;
    throw error;
  }

  const appointment = await Appointment.create(data);
  const populated = await Appointment.findById(appointment._id).populate("patient doctor");

  try {
    await emailService.sendAppointmentCreated(populated, populated.patient, populated.doctor);
  } catch (e) {
    console.error("Email notification failed:", e.message);
  }

  return populated;
};

const getAppointments = async (filters = {}) => {
  const {
    status, doctor, patient, dateFrom, dateTo,
    page = 1, limit = 10, sort = "-createdAt",
  } = filters;

  const query = {};

  if (status) {
    const statuses = status.split(",").map((s) => s.trim());
    query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  if (doctor) query.doctor = doctor;
  if (patient) query.patient = patient;
  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) query.date.$gte = new Date(dateFrom);
    if (dateTo) query.date.$lte = new Date(dateTo);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Appointment.countDocuments(query);

  const appointments = await Appointment.find(query)
    .populate("patient doctor")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  return {
    appointments,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

const getAppointmentById = async (id) => {
  const appointment = await Appointment.findById(id).populate("patient doctor");
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }
  return appointment;
};

const updateAppointment = async (id, data) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (appointment.status !== "pending") {
    const error = new Error("Can only update pending appointments");
    error.statusCode = 400;
    throw error;
  }

  if (data.date && data.time) {
    const isBooked = await checkDoubleBooking(appointment.doctor, data.date, data.time, id);
    if (isBooked) {
      const error = new Error("Doctor already has an appointment at this date and time");
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(appointment, data);
  await appointment.save();
  return appointment.populate("patient doctor");
};

const deleteAppointment = async (id) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (appointment.status !== "pending") {
    const error = new Error("Can only delete pending appointments");
    error.statusCode = 400;
    throw error;
  }

  await appointment.deleteOne();
  return { message: "Appointment deleted" };
};

const transitionStatus = async (id, newStatus) => {
  const appointment = await Appointment.findById(id).populate("patient doctor");
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  const allowed = VALID_TRANSITIONS[appointment.status];
  if (!allowed || !allowed.includes(newStatus)) {
    const error = new Error(
      `Cannot transition from "${appointment.status}" to "${newStatus}"`
    );
    error.statusCode = 400;
    throw error;
  }

  appointment.status = newStatus;
  await appointment.save();

  try {
    if (newStatus === "confirmed") {
      await emailService.sendAppointmentConfirmed(appointment, appointment.patient, appointment.doctor);
    }
  } catch (e) {
    console.error("Email notification failed:", e.message);
  }

  return appointment;
};

const rescheduleAppointment = async (id, newDate, newTime) => {
  const appointment = await Appointment.findById(id).populate("patient doctor");
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (appointment.status !== "confirmed") {
    const error = new Error("Can only reschedule confirmed appointments");
    error.statusCode = 400;
    throw error;
  }

  const isBooked = await checkDoubleBooking(appointment.doctor._id, newDate, newTime, id);
  if (isBooked) {
    const error = new Error("Doctor already has an appointment at this date and time");
    error.statusCode = 409;
    throw error;
  }

  appointment.rescheduleHistory.push({
    previousDate: appointment.date,
    previousTime: appointment.time,
  });

  appointment.date = new Date(newDate);
  appointment.time = newTime;
  appointment.reminderSent = false;
  await appointment.save();

  try {
    await emailService.sendAppointmentRescheduled(appointment, appointment.patient, appointment.doctor);
  } catch (e) {
    console.error("Email notification failed:", e.message);
  }

  return appointment;
};

const cancelAppointment = async (id, reason) => {
  const appointment = await Appointment.findById(id).populate("patient doctor");
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (appointment.status === "completed" || appointment.status === "cancelled") {
    const error = new Error("Cannot cancel a completed or already cancelled appointment");
    error.statusCode = 400;
    throw error;
  }

  appointment.status = "cancelled";
  appointment.cancellationReason = reason;
  await appointment.save();

  try {
    await emailService.sendAppointmentCancelled(appointment, appointment.patient, appointment.doctor);
  } catch (e) {
    console.error("Email notification failed:", e.message);
  }

  return appointment;
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  transitionStatus,
  rescheduleAppointment,
  cancelAppointment,
};
