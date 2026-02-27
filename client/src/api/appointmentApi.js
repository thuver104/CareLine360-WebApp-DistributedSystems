import api from "./axios";

export const createAppointment = (data) => api.post("/appointments", data);

export const getAppointments = (params) => api.get("/appointments", { params });

export const getAppointmentById = (id) => api.get(`/appointments/${id}`);

export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data);

export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);

export const transitionStatus = (id, status) =>
  api.patch(`/appointments/${id}/status`, { status });

export const rescheduleAppointment = (id, date, time) =>
  api.patch(`/appointments/${id}/reschedule`, { date, time });

export const cancelAppointment = (id, reason) =>
  api.patch(`/appointments/${id}/cancel`, { reason });
