import api from "./axios";

export const createPayment = (data) => api.post("/payments", data);

export const getPaymentById = (id) => api.get(`/payments/${id}`);

export const getPaymentByAppointment = (appointmentId) =>
  api.get(`/payments/appointment/${appointmentId}`);

export const verifyPayment = (id) => api.patch(`/payments/${id}/verify`);

export const failPayment = (id) => api.patch(`/payments/${id}/fail`);
