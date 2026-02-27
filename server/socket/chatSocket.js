const jwt = require("jsonwebtoken");
const { sendMessage } = require("../services/chatService");

/**
 * Authenticate a socket connection via JWT passed in handshake auth.
 */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication error: no token"));

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.user = decoded; // { id, role, ... }
    next();
  } catch (err) {
    next(new Error("Authentication error: invalid token"));
  }
};

/**
 * Register all Socket.io event handlers on the given io instance.
 * Called once from server.js after the io server is created.
 */
const registerSocketHandlers = (io) => {
  // Apply JWT auth middleware to every socket connection
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { userId, role } = socket.user;
    console.log(
      `🔌 Socket connected: userId=${userId} role=${role} socketId=${socket.id}`,
    );

    /**
     * Client joins a room scoped to an appointment.
     * Event: "join_room"  payload: { appointmentId: string }
     */
    socket.on("join_room", ({ appointmentId }) => {
      if (!appointmentId) return;
      socket.join(appointmentId);
      console.log(`📥 ${role}:${userId} joined room ${appointmentId}`);
      // Confirm to the joining client that they are now in the room
      socket.emit("room_joined", { appointmentId });
    });

    /**
     * Client leaves a room.
     * Event: "leave_room"  payload: { appointmentId: string }
     */
    socket.on("leave_room", ({ appointmentId }) => {
      if (!appointmentId) return;
      socket.leave(appointmentId);
      console.log(`📤 ${role}:${userId} left room ${appointmentId}`);
    });

    /**
     * Client sends a chat message.
     * Event: "send_message"  payload: { appointmentId, message }
     * Emits back: "new_message" to all sockets in the room (including sender)
     *             "send_error"  to sender on failure
     */
    socket.on("send_message", async ({ appointmentId, message }) => {
      try {
        const result = await sendMessage({
          appointmentId,
          senderId: userId,
          senderRole: role,
          message,
        });

        if (result.status !== 201) {
          return socket.emit("send_error", { message: result.data.message });
        }

        // Broadcast to everyone in the room (including sender)
        io.to(appointmentId).emit("new_message", result.data.chat);
      } catch (err) {
        console.error("Socket send_message error:", err);
        socket.emit("send_error", { message: "Failed to send message" });
      }
    });

    /**
     * Notify room members that this user is typing.
     * Event: "typing"  payload: { appointmentId }
     */
    socket.on("typing", ({ appointmentId, isTyping }) => {
      socket
        .to(appointmentId)
        .emit("user_typing", { userId, role, isTyping: !!isTyping });
    });

    /**
     * Notify room members that this user stopped typing.
     * Event: "stop_typing"  payload: { appointmentId }
     */
    socket.on("stop_typing", ({ appointmentId }) => {
      socket
        .to(appointmentId)
        .emit("user_typing", { userId, role, isTyping: false });
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: userId=${userId} reason=${reason}`);
    });
  });
};

module.exports = { registerSocketHandlers };
