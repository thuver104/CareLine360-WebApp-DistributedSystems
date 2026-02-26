const ChatMessage = require("../models/ChatMessage");
const Appointment = require("../models/Appointment");

/**
 * Validate that both users (by userId) are part of this appointment
 */
const validateChatAccess = async ({ appointmentId, userId, role }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return false;

  const doctorMatch = appointment.doctor.toString() === userId;
  const patientMatch = appointment.patient.toString() === userId;

  if (role === "doctor") return doctorMatch;
  if (role === "patient") return patientMatch;
  return false;
};

const getMessages = async ({ appointmentId, userId, role, page = 1, limit = 50 }) => {
  const hasAccess = await validateChatAccess({ appointmentId, userId, role });
  if (!hasAccess) return { status: 403, data: { message: "Access denied to this chat" } };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await ChatMessage.countDocuments({ appointmentId });
  const messages = await ChatMessage.find({ appointmentId })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // Mark messages as read if the receiver is viewing
  await ChatMessage.updateMany(
    { appointmentId, senderId: { $ne: userId }, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    status: 200,
    data: { messages, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } },
  };
};

const sendMessage = async ({ appointmentId, senderId, senderRole, message }) => {
  const hasAccess = await validateChatAccess({ appointmentId, userId: senderId, role: senderRole });
  if (!hasAccess) return { status: 403, data: { message: "Access denied" } };

  if (!message?.trim()) return { status: 400, data: { message: "Message cannot be empty" } };

  const msg = await ChatMessage.create({ appointmentId, senderId, senderRole, message: message.trim() });
  return { status: 201, data: { message: "Message sent", chat: msg } };
};

const getUnreadCount = async ({ userId }) => {
  const appointments = await Appointment.find({
    $or: [{ doctor: userId }, { patient: userId }],
  }).select("_id");

  const appointmentIds = appointments.map((a) => a._id);
  const count = await ChatMessage.countDocuments({
    appointmentId: { $in: appointmentIds },
    senderId: { $ne: userId },
    isRead: false,
  });

  return { status: 200, data: { unreadCount: count } };
};

module.exports = { getMessages, sendMessage, getUnreadCount };