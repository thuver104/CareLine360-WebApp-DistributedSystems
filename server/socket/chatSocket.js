const jwt = require("jsonwebtoken");
const { sendMessage } = require("../services/chatService");

/**
 * Authenticate a socket connection via JWT passed in handshake auth.
 */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      console.error("❌ Socket auth failed: No token provided in handshake");
      return next(new Error("Authentication error: no token"));
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      console.error("❌ Critical: JWT_ACCESS_SECRET not set in environment");
      return next(
        new Error("Server configuration error: JWT_ACCESS_SECRET not set"),
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      console.error("❌ JWT verification failed:", jwtErr.message);
      // Check if token is expired
      if (jwtErr.name === "TokenExpiredError") {
        return next(new Error("Authentication error: token expired"));
      }
      return next(new Error(`Authentication error: ${jwtErr.message}`));
    }

    // Validate decoded token has required fields
    if (!decoded.userId) {
      console.error("❌ Token missing userId property", decoded);
      return next(new Error("Authentication error: invalid token structure"));
    }

    socket.user = decoded; // { userId, role, ... }
    console.log(
      "✅ Socket authenticated - userId:",
      decoded.userId,
      "role:",
      decoded.role,
    );
    next();
  } catch (err) {
    console.error("❌ Socket auth error:", err.message);
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
      if (!appointmentId) {
        console.warn(`⚠️ Server: join_room called without appointmentId`);
        return;
      }
      socket.join(appointmentId);
      console.log(
        `📥 Server: ${role}:${userId} joined room ${appointmentId}, socketId=${socket.id}`,
      );
      // Confirm to the joining client that they are now in the room
      socket.emit("room_joined", { appointmentId });
    });

    /**
     * Client leaves a room.
     * Event: "leave_room"  payload: { appointmentId: string }
     */
    socket.on("leave_room", ({ appointmentId }) => {
      if (!appointmentId) {
        console.warn(`⚠️ Server: leave_room called without appointmentId`);
        return;
      }
      socket.leave(appointmentId);
      console.log(`🚪 Server: ${role}:${userId} left room ${appointmentId}`);
    });

    /**
     * Client sends a chat message.
     * Event: "send_message"  payload: { appointmentId, message }
     * Emits back: "new_message" to all sockets in the room (including sender)
     *             "send_error"  to sender on failure
     */
    socket.on("send_message", async ({ appointmentId, message }) => {
      try {
        console.log(`📮 Server: Received send_message from ${role}:${userId}`, {
          appointmentId,
          messageLength: message?.length || 0,
        });

        const result = await sendMessage({
          appointmentId,
          senderId: userId,
          senderRole: role,
          message,
        });

        if (result.status !== 201) {
          console.error(
            `❌ Server: sendMessage returned non-201 status:`,
            result.status,
          );
          return socket.emit("send_error", { message: result.data.message });
        }

        // Broadcast to everyone in the room (including sender)
        console.log(
          `📡 Server: Broadcasting new_message to room ${appointmentId}, messageId=`,
          result.data.chat._id,
        );
        io.to(appointmentId).emit("new_message", result.data.chat);
      } catch (err) {
        console.error(`❌ Server: send_message error:`, err.message);
        socket.emit("send_error", { message: "Failed to send message" });
      }
    });

    /**
     * Notify room members that this user is typing.
     * Event: "typing"  payload: { appointmentId, isTyping }
     */
    socket.on("typing", ({ appointmentId, isTyping }) => {
      console.log(
        `✏️ Server: Received typing event from ${role}:${userId}, appointmentId=${appointmentId}, isTyping=${isTyping}`,
      );
      socket.to(appointmentId).emit("user_typing", {
        userId,
        role,
        isTyping: !!isTyping,
        senderRole: role,
      });
    });

    /**
     * Notify room members that this user stopped typing.
     * Event: "stop_typing"  payload: { appointmentId }
     */
    socket.on("stop_typing", ({ appointmentId }) => {
      console.log(
        `✏️ Server: Received stop_typing event from ${role}:${userId}, appointmentId=${appointmentId}`,
      );
      socket.to(appointmentId).emit("user_typing", {
        userId,
        role,
        isTyping: false,
        senderRole: role,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: userId=${userId} reason=${reason}`);
    });
  });
};

module.exports = { registerSocketHandlers };
