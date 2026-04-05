const ChatMessage = require("../models/ChatMessage");
const Appointment = require("../models/Appointment");

/**
 * Validate that both users (by userId) are part of this appointment
 */
const validateChatAccess = async ({ appointmentId, userId, role }) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.warn(
        `⚠️ ChatService.validateChatAccess: Appointment not found: ${appointmentId}`,
      );
      return false;
    }

    const doctorMatch = appointment.doctor.toString() === userId;
    const patientMatch = appointment.patient.toString() === userId;

    if (role === "doctor") {
      console.log(
        `🔐 ChatService: Access check for doctor:${userId} on appointment ${appointmentId}: ${doctorMatch ? "✅ allowed" : "❌ denied"}`,
      );
      return doctorMatch;
    }
    if (role === "patient") {
      console.log(
        `🔐 ChatService: Access check for patient:${userId} on appointment ${appointmentId}: ${patientMatch ? "✅ allowed" : "❌ denied"}`,
      );
      return patientMatch;
    }
    console.warn(`⚠️ ChatService: Unknown role: ${role}`);
    return false;
  } catch (err) {
    console.error(`❌ ChatService.validateChatAccess: Error:`, err.message);
    return false;
  }
};

const getMessages = async ({
  appointmentId,
  userId,
  role,
  page = 1,
  limit = 50,
}) => {
  try {
    console.log(
      `📖 ChatService.getMessages: Loading messages for appointment ${appointmentId}`,
      {
        userId,
        role,
        page,
        limit,
      },
    );

    const hasAccess = await validateChatAccess({ appointmentId, userId, role });
    if (!hasAccess) {
      console.error(
        `❌ ChatService.getMessages: Access denied for ${role}:${userId}`,
      );
      return { status: 403, data: { message: "Access denied to this chat" } };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ChatMessage.countDocuments({ appointmentId });
    const messages = await ChatMessage.find({ appointmentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    console.log(
      `✅ ChatService.getMessages: Retrieved ${messages.length} messages (total: ${total})`,
    );

    // Mark messages as read if the receiver is viewing
    await ChatMessage.updateMany(
      { appointmentId, senderId: { $ne: userId }, isRead: false },
      { $set: { isRead: true } },
    );

    return {
      status: 200,
      data: {
        messages,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    };
  } catch (err) {
    console.error(`❌ ChatService.getMessages: Error:`, err.message);
    throw err;
  }
};

const sendMessage = async ({
  appointmentId,
  senderId,
  senderRole,
  message,
}) => {
  try {
    console.log(
      `📨 ChatService.sendMessage: Processing message from ${senderRole}:${senderId}`,
      {
        appointmentId,
        messageLength: message?.length || 0,
      },
    );

    const hasAccess = await validateChatAccess({
      appointmentId,
      userId: senderId,
      role: senderRole,
    });
    if (!hasAccess) {
      console.error(
        `❌ ChatService.sendMessage: Access denied for ${senderRole}:${senderId} on appointment ${appointmentId}`,
      );
      return { status: 403, data: { message: "Access denied" } };
    }

    if (!message?.trim()) {
      console.warn(
        `⚠️ ChatService.sendMessage: Empty message attempt from ${senderRole}:${senderId}`,
      );
      return { status: 400, data: { message: "Message cannot be empty" } };
    }

    const msg = await ChatMessage.create({
      appointmentId,
      senderId,
      senderRole,
      message: message.trim(),
    });
    console.log(
      `✅ ChatService.sendMessage: Message created successfully, messageId=${msg._id}`,
    );
    return { status: 201, data: { message: "Message sent", chat: msg } };
  } catch (err) {
    console.error(
      `❌ ChatService.sendMessage: Error creating message:`,
      err.message,
    );
    throw err;
  }
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
