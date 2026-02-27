import api from "./axios";

export const sendMessage = (data) => api.post("/chat", data);

export const getMessages = (appointmentId, since) => {
  const params = since ? { since } : {};
  return api.get(`/chat/${appointmentId}`, { params });
};

export const markAsRead = (appointmentId, userId) =>
  api.patch(`/chat/${appointmentId}/read`, { userId });
