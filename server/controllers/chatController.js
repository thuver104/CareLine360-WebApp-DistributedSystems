const ChatMessage = require("../models/ChatMessage");
const Appointment = require("../models/Appointment");

/**
 * GET /api/chat/:appointmentId
 * Fetch message history for an appointment (both doctor & patient).
 * Real-time messages go through Socket.io; this is for initial load / history.
 */
const getMessages = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { page = 1, limit = 100 } = req.query;
    const userId = req.user.userId;

    // Verify access
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const isDoctor = appointment.doctor.toString() === userId;
    const isPatient = appointment.patient.toString() === userId;
    if (!isDoctor && !isPatient) return res.status(403).json({ message: "Access denied" });

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ChatMessage.countDocuments({ appointmentId });
    const messages = await ChatMessage.find({ appointmentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Mark received messages as read
    await ChatMessage.updateMany(
      { appointmentId, senderId: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      messages,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

/**
 * GET /api/chat/unread/count
 * Total unread messages for the current user across all appointments.
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const appointments = await Appointment.find({
      $or: [{ doctor: userId }, { patient: userId }],
    }).select("_id");

    const appointmentIds = appointments.map((a) => a._id);
    const count = await ChatMessage.countDocuments({
      appointmentId: { $in: appointmentIds },
      senderId: { $ne: userId },
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: "Failed to get unread count" });
  }
};

/**
 * GET /api/chat/appointments
 * List all appointments this user has active chats in (for chat inbox).
 */
const getChatInbox = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const query = role === "doctor" ? { doctor: userId } : { patient: userId };
    const appointments = await Appointment.find({
      ...query,
      status: { $in: ["confirmed", "completed"] },
    })
      .populate("patient", "email phone")
      .populate("doctor", "email phone")
      .sort({ date: -1 })
      .lean();

    // Attach last message & unread count for each appointment
    const enriched = await Promise.all(
      appointments.map(async (appt) => {
        const lastMessage = await ChatMessage.findOne({ appointmentId: appt._id })
          .sort({ createdAt: -1 })
          .lean();

        const unread = await ChatMessage.countDocuments({
          appointmentId: appt._id,
          senderId: { $ne: userId },
          isRead: false,
        });

        return { ...appt, lastMessage, unread };
      })
    );

    res.json({ chats: enriched });
  } catch (err) {
    res.status(500).json({ message: "Failed to load chat inbox" });
  }
};

module.exports = { getMessages, getUnreadCount, getChatInbox };