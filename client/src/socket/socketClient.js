import { io } from "socket.io-client";

// Strip /api suffix — socket.io connects to the root, not the API path
const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:1111").replace(/\/api\/?$/, "");

let socket = null;

/**
 * Connect to the Socket.io server using the stored JWT access token.
 * Safe to call multiple times — won't create duplicate connections.
 */
export const connectSocket = () => {
  if (socket?.connected) {
    console.log("🔌 Socket already connected:", socket.id);
    return socket;
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.warn(
      "⚠️ No access token found. Socket connection requires authentication.",
    );
    return null;
  }

  console.log(
    "🔌 Attempting socket connection with token:",
    token.substring(0, 20) + "...",
  );
  console.log("🔌 Socket URL:", SOCKET_URL);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected successfully:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message, err);
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Socket disconnected:", reason);
  });

  socket.on("error", (err) => {
    console.error("❌ Socket error event:", err);
  });

  return socket;
};

/**
 * Disconnect the socket cleanly (call on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket manually disconnected");
  }
};

/**
 * Get the current socket instance.
 * Initializes connection if not already done.
 */
export const getSocket = () => {
  if (!socket) {
    connectSocket();
  }
  return socket;
};

/**
 * Join a chat room for a specific appointment.
 * @param {string} appointmentId
 */
export const joinChatRoom = (appointmentId) => {
  const s = getSocket();
  if (!s) {
    console.error("❌ joinChatRoom: socket not available");
    return;
  }

  if (s.connected) {
    console.log(
      "📥 joinChatRoom: Emitting join_room (socket connected):",
      appointmentId,
    );
    s.emit("join_room", { appointmentId });
  } else {
    console.log(
      "⏳ joinChatRoom: Socket not connected yet, waiting for connect event. appointmentId=",
      appointmentId,
    );
    s.once("connect", () => {
      console.log(
        "📥 joinChatRoom: Socket connected, now emitting join_room:",
        appointmentId,
      );
      s.emit("join_room", { appointmentId });
    });
  }
};

/**
 * Leave a chat room for a specific appointment.
 * @param {string} appointmentId
 */
export const leaveChatRoom = (appointmentId) => {
  const s = getSocket();
  if (s?.connected) {
    console.log("🚪 leaveChatRoom: Emitting leave_room:", appointmentId);
    s.emit("leave_room", { appointmentId });
  }
};

/**
 * Send a chat message on a specific appointment room.
 * @param {string} appointmentId
 * @param {string} message
 */
export const sendChatMessage = (appointmentId, message) => {
  const s = getSocket();
  if (!s?.connected) {
    console.warn(
      "⚠️ sendChatMessage: Socket not connected. Cannot send message.",
    );
    return;
  }
  console.log(
    "📮 sendChatMessage: Emitting send_message for appointmentId=",
    appointmentId,
    "message length=",
    message.length,
  );
  s.emit("send_message", { appointmentId, message });
};

/**
 * Emit typing indicator.
 * @param {string} appointmentId
 */
export const emitTyping = (appointmentId) => {
  const s = getSocket();
  if (s?.connected) {
    console.log(
      "✏️ emitTyping: Emitting typing event for appointmentId=",
      appointmentId,
    );
    s.emit("typing", { appointmentId, isTyping: true });
  } else {
    console.warn("⚠️ emitTyping: Socket not connected");
  }
};

/**
 * Emit stop typing indicator.
 * @param {string} appointmentId
 */
export const emitStopTyping = (appointmentId) => {
  const s = getSocket();
  if (s?.connected) {
    console.log(
      "✏️ emitStopTyping: Emitting stop_typing event for appointmentId=",
      appointmentId,
    );
    s.emit("stop_typing", { appointmentId });
  } else {
    console.warn("⚠️ emitStopTyping: Socket not connected");
  }
};
