import { api } from "./axios";

// ── Profile ────────────────────────────────────────────────────────────────────
export const createDoctorProfile = (data) => api.post("/doctor/profile", data);
export const getDoctorProfile = () => api.get("/doctor/profile");
export const updateDoctorProfile = (data) => api.put("/doctor/profile", data);
export const updateDoctorAvatar = (base64Image) =>
  api.put("/doctor/profile/avatar", { image: base64Image });

// ── Dashboard & Analytics ─────────────────────────────────────────────────────
export const getDoctorDashboard = () => api.get("/doctor/dashboard");
export const getDoctorAnalytics = () => api.get("/doctor/analytics");

// ── Availability ──────────────────────────────────────────────────────────────
export const getAvailability = () => api.get("/doctor/availability");
export const addAvailabilitySlots = (slots) => api.post("/doctor/availability", { slots });
export const deleteAvailabilitySlot = (slotId) => api.delete(`/doctor/availability/${slotId}`);
export const updateAvailabilitySlot = (slotId, { startTime, endTime }) =>
  api.put(`/doctor/availability/${slotId}`, { startTime, endTime });

// ── Appointments ──────────────────────────────────────────────────────────────
export const getDoctorAppointments = (params) => api.get("/doctor/appointments", { params });
export const updateAppointmentStatus = (appointmentId, data) =>
  api.patch(`/doctor/appointments/${appointmentId}`, data);
export const deleteAppointment = (appointmentId) =>
  api.delete(`/doctor/appointments/${appointmentId}`);

// ── Patients ──────────────────────────────────────────────────────────────────
export const getDoctorPatients = (params) => api.get("/doctor/patients", { params });
export const getDoctorPatientDetail = (patientId) => api.get(`/doctor/patients/${patientId}`);

// ── Medical Records ───────────────────────────────────────────────────────────
export const createMedicalRecord = (data) => api.post("/doctor/records", data);
export const getPatientRecords = (patientId, params) =>
  api.get(`/doctor/records/${patientId}`, { params });
export const updateMedicalRecord = (recordId, data) => api.put(`/doctor/records/${recordId}`, data);

// ── Prescriptions ─────────────────────────────────────────────────────────────
export const generatePrescriptionPdf = (data) => api.post("/doctor/prescriptions/generate", data);
export const savePrescription = (data) => api.post("/doctor/prescriptions", data);
export const getDoctorPrescriptions = (params) => api.get("/doctor/prescriptions", { params });

// ── Ratings ───────────────────────────────────────────────────────────────────
export const getDoctorRatings = (params) => api.get("/doctor/ratings", { params });

// ── Public ────────────────────────────────────────────────────────────────────
export const getPublicDoctors = (params) => api.get("/doctor/public", { params });

// ── Chat ──────────────────────────────────────────────────────────────────────
export const getChatMessages = (appointmentId, params) =>
  api.get(`/chat/${appointmentId}`, { params });
// Alias used by ChatWidget
export const getChatHistory = (appointmentId, params) =>
  api.get(`/chat/${appointmentId}`, { params });
export const sendChatMessage = (appointmentId, message) =>
  api.post(`/chat/${appointmentId}`, { message });
export const getUnreadCount = () => api.get("/chat/unread/count");