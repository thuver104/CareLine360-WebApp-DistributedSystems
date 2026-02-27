import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:1111";

let socket = null;

/**
 * Connect to the Socket.io server using the stored JWT access token.
 * Safe to call multiple times — won't create duplicate connections.
 */
export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("⚠️ Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
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
 * Get the current socket instance (may be null if not connected).
 */
export const getSocket = () => socket;

/**
 * Join a chat room for a specific appointment.
 * @param {string} appointmentId
 */
export const joinChatRoom = (appointmentId) => {
  if (socket?.connected) {
    socket.emit("join_room", { appointmentId });
  }
};

/**
 * Leave a chat room for a specific appointment.
 * @param {string} appointmentId
 */
export const leaveChatRoom = (appointmentId) => {
  if (socket?.connected) {
    socket.emit("leave_room", { appointmentId });
  }
};

/**
 * Send a chat message on a specific appointment room.
 * @param {string} appointmentId
 * @param {string} message
 */
export const sendChatMessage = (appointmentId, message) => {
  if (socket?.connected) {
    socket.emit("send_message", { appointmentId, message });
  }
};

/**
 * Emit typing indicator.
 * @param {string} appointmentId
 */
export const emitTyping = (appointmentId) => {
  if (socket?.connected) {
    socket.emit("typing", { appointmentId });
  }
};

/**
 * Emit stop typing indicator.
 * @param {string} appointmentId
 */
export const emitStopTyping = (appointmentId) => {
  if (socket?.connected) {
    socket.emit("stop_typing", { appointmentId });
  }
};
