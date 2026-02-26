const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const request = require("supertest");

const User = require("../../../models/User");
const Appointment = require("../../../models/Appointment");
const appointmentRoutes = require("../../../routes/appointmentRoutes");
const errorHandler = require("../../../middleware/errorHandler");
const { signAccessToken } = require("../../../utils/tokens");

// Mock email service
jest.mock("../../../services/emailService", () => ({
  sendAppointmentCreated: jest.fn(),
  sendAppointmentConfirmed: jest.fn(),
  sendAppointmentRescheduled: jest.fn(),
  sendAppointmentCancelled: jest.fn(),
}));

let mongoServer;
let app;
let patient, doctor;
let patientToken, doctorToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  process.env.JWT_ACCESS_SECRET = "test-secret";

  app = express();
  app.use(express.json());
  app.use("/api/appointments", appointmentRoutes);
  app.use(errorHandler);

  patient = await User.create({
    fullName: "Test Patient",
    email: "patient@test.com",
    role: "patient",
    passwordHash: "hashedpassword123",
  });
  doctor = await User.create({
    fullName: "Test Doctor",
    email: "doctor@test.com",
    role: "doctor",
    passwordHash: "hashedpassword123",
  });

  patientToken = signAccessToken({ userId: patient._id, role: "patient" });
  doctorToken = signAccessToken({ userId: doctor._id, role: "doctor" });
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Appointment.deleteMany({});
});

describe("Appointment API", () => {
  const validAppointment = () => ({
    doctor: doctor._id.toString(),
    date: "2026-04-01",
    time: "10:00",
    consultationType: "video",
    symptoms: "headache",
    priority: "medium",
  });

  // Helper to create an appointment as the patient
  const createAsPatient = (overrides = {}) =>
    request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ ...validAppointment(), ...overrides });

  // ─── POST /api/appointments ───────────────────────────────────────

  describe("POST /api/appointments", () => {
    it("should create an appointment", async () => {
      const res = await createAsPatient().expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("pending");
    });

    it("should prevent double booking", async () => {
      await createAsPatient();

      const res = await createAsPatient().expect(409);

      expect(res.body.success).toBe(false);
    });

    it("should reject invalid data", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ doctor: "invalid" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── GET /api/appointments ────────────────────────────────────────

  describe("GET /api/appointments", () => {
    it("should list appointments with pagination", async () => {
      await createAsPatient();

      const res = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.appointments).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
    });

    it("should filter by status", async () => {
      await createAsPatient();

      const res = await request(app)
        .get("/api/appointments?status=confirmed")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.appointments).toHaveLength(0);
    });
  });

  // ─── GET /api/appointments/:id ────────────────────────────────────

  describe("GET /api/appointments/:id", () => {
    it("should fetch appointment by ID", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/appointments/${id}`)
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(id);
    });

    it("should return 400 for invalid ID format", async () => {
      await request(app)
        .get("/api/appointments/not-a-valid-id")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(400);
    });
  });

  // ─── PUT /api/appointments/:id ────────────────────────────────────

  describe("PUT /api/appointments/:id", () => {
    it("should update a pending appointment", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/appointments/${id}`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ symptoms: "severe headache" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.symptoms).toBe("severe headache");
    });

    it("should reject updating a non-pending appointment", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      // Confirm it first
      await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed" });

      await request(app)
        .put(`/api/appointments/${id}`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ symptoms: "updated" })
        .expect(400);
    });

    it("should validate input on update", async () => {
      await request(app)
        .put("/api/appointments/invalid-id")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ priority: "super-urgent" })
        .expect(400);
    });
  });

  // ─── DELETE /api/appointments/:id ─────────────────────────────────

  describe("DELETE /api/appointments/:id", () => {
    it("should delete a pending appointment", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/appointments/${id}`)
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Appointment deleted");
    });

    it("should reject deleting a non-pending appointment", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed" });

      await request(app)
        .delete(`/api/appointments/${id}`)
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(400);
    });
  });

  // ─── PATCH /api/appointments/:id/status ───────────────────────────

  describe("PATCH /api/appointments/:id/status", () => {
    it("should transition pending to confirmed", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed" })
        .expect(200);

      expect(res.body.data.status).toBe("confirmed");
    });

    it("should reject invalid transitions", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "completed" })
        .expect(400);
    });
  });

  // ─── PATCH /api/appointments/:id/reschedule ───────────────────────

  describe("PATCH /api/appointments/:id/reschedule", () => {
    it("should reschedule a confirmed appointment", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed" });

      const res = await request(app)
        .patch(`/api/appointments/${id}/reschedule`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ date: "2026-05-01", time: "14:00" })
        .expect(200);

      expect(res.body.data.time).toBe("14:00");
    });

    it("should reject rescheduling a pending appointment", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id}/reschedule`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ date: "2026-05-01", time: "14:00" })
        .expect(400);
    });

    it("should reject reschedule on double-booked slot", async () => {
      // Create first appointment and confirm
      const createRes1 = await createAsPatient();
      const id1 = createRes1.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id1}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed" });

      // Create second appointment at a different time and confirm
      const createRes2 = await createAsPatient({ time: "11:00" });
      const id2 = createRes2.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id2}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed" });

      // Try to reschedule second appointment to first's slot
      await request(app)
        .patch(`/api/appointments/${id2}/reschedule`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ date: "2026-04-01", time: "10:00" })
        .expect(409);
    });
  });

  // ─── PATCH /api/appointments/:id/cancel ───────────────────────────

  describe("PATCH /api/appointments/:id/cancel", () => {
    it("should cancel with reason", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/appointments/${id}/cancel`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ reason: "Schedule conflict" })
        .expect(200);

      expect(res.body.data.status).toBe("cancelled");
      expect(res.body.data.cancellationReason).toBe("Schedule conflict");
    });
  });

  // ─── Full Lifecycle ───────────────────────────────────────────────

  describe("Full Lifecycle", () => {
    it("should complete: create → confirm → complete", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed" })
        .expect(200);

      const completeRes = await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "completed" })
        .expect(200);

      expect(completeRes.body.data.status).toBe("completed");
    });

    it("should complete: create → confirm → reschedule → cancel", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "confirmed" });

      await request(app)
        .patch(`/api/appointments/${id}/reschedule`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ date: "2026-06-01", time: "15:00" })
        .expect(200);

      const cancelRes = await request(app)
        .patch(`/api/appointments/${id}/cancel`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ reason: "Changed plans" })
        .expect(200);

      expect(cancelRes.body.data.status).toBe("cancelled");
    });
  });

  // ─── RBAC ─────────────────────────────────────────────────────────

  describe("RBAC", () => {
    it("should prevent doctor from creating appointments", async () => {
      await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send(validAppointment())
        .expect(403);
    });

    it("should prevent patient from transitioning status", async () => {
      const createRes = await createAsPatient();
      const id = createRes.body.data._id;

      await request(app)
        .patch(`/api/appointments/${id}/status`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({ status: "confirmed" })
        .expect(403);
    });
  });
});
