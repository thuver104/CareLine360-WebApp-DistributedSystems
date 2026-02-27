const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const request = require("supertest");

const Payment = require("../../../models/Payment");
const Appointment = require("../../../models/Appointment");
const User = require("../../../models/User");
const paymentRoutes = require("../../../routes/paymentRoutes");
const errorHandler = require("../../../middleware/errorHandler");

let mongoServer;
let app;
let patient, doctor, appointment;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use("/api/payments", paymentRoutes);
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
  appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    date: new Date("2026-04-01"),
    time: "10:00",
    consultationType: "video",
  });
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Payment.deleteMany({});
});

describe("Payment API", () => {
  const validPayment = () => ({
    appointment: appointment._id.toString(),
    patient: patient._id.toString(),
    amount: 75,
  });

  // ─── POST /api/payments ───────────────────────────────────────────

  describe("POST /api/payments", () => {
    it("should create a payment", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send(validPayment())
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.amount).toBe(75);
    });

    it("should prevent duplicate payment for same appointment", async () => {
      await request(app).post("/api/payments").send(validPayment());

      const res = await request(app)
        .post("/api/payments")
        .send(validPayment())
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it("should reject invalid data", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ appointment: "bad" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should reject missing amount", async () => {
      const body = validPayment();
      delete body.amount;
      const res = await request(app)
        .post("/api/payments")
        .send(body)
        .expect(400);

      expect(res.body.message).toContain("Amount is required");
    });
  });

  // ─── GET /api/payments/:id ────────────────────────────────────────

  describe("GET /api/payments/:id", () => {
    it("should fetch payment by ID", async () => {
      const createRes = await request(app).post("/api/payments").send(validPayment());
      const id = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/payments/${id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(id);
    });

    it("should return 404 for non-existent payment", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/payments/${fakeId}`)
        .expect(404);

      expect(res.body.message).toContain("Payment not found");
    });

    it("should return 400 for invalid ID format", async () => {
      await request(app)
        .get("/api/payments/not-valid-id")
        .expect(400);
    });
  });

  // ─── GET /api/payments/appointment/:appointmentId ─────────────────

  describe("GET /api/payments/appointment/:appointmentId", () => {
    it("should fetch payment by appointment ID", async () => {
      await request(app).post("/api/payments").send(validPayment());

      const res = await request(app)
        .get(`/api/payments/appointment/${appointment._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(75);
    });

    it("should return 404 when no payment for appointment", async () => {
      const fakeApptId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/payments/appointment/${fakeApptId}`)
        .expect(404);

      expect(res.body.message).toContain("Payment not found");
    });
  });

  // ─── PATCH /api/payments/:id/verify ───────────────────────────────

  describe("PATCH /api/payments/:id/verify", () => {
    it("should verify a pending payment", async () => {
      const createRes = await request(app).post("/api/payments").send(validPayment());
      const id = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/payments/${id}/verify`)
        .expect(200);

      expect(res.body.data.status).toBe("verified");
      expect(res.body.data.transactionRef).toBeDefined();
      expect(res.body.data.verifiedAt).toBeDefined();
    });

    it("should reject verifying an already verified payment", async () => {
      const createRes = await request(app).post("/api/payments").send(validPayment());
      const id = createRes.body.data._id;

      await request(app).patch(`/api/payments/${id}/verify`);

      const res = await request(app)
        .patch(`/api/payments/${id}/verify`)
        .expect(400);

      expect(res.body.message).toContain("not in pending");
    });

    it("should return 400 for invalid ID format", async () => {
      await request(app)
        .patch("/api/payments/bad-id/verify")
        .expect(400);
    });
  });

  // ─── PATCH /api/payments/:id/fail ─────────────────────────────────

  describe("PATCH /api/payments/:id/fail", () => {
    it("should fail a pending payment", async () => {
      const createRes = await request(app).post("/api/payments").send(validPayment());
      const id = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/payments/${id}/fail`)
        .expect(200);

      expect(res.body.data.status).toBe("failed");
    });

    it("should reject failing a verified payment", async () => {
      const createRes = await request(app).post("/api/payments").send(validPayment());
      const id = createRes.body.data._id;

      await request(app).patch(`/api/payments/${id}/verify`);

      const res = await request(app)
        .patch(`/api/payments/${id}/fail`)
        .expect(400);

      expect(res.body.message).toContain("not in pending");
    });
  });

  // ─── Full Lifecycle ───────────────────────────────────────────────

  describe("Full Lifecycle", () => {
    it("should complete: create → verify", async () => {
      const createRes = await request(app).post("/api/payments").send(validPayment());
      expect(createRes.body.data.status).toBe("pending");

      const verifyRes = await request(app)
        .patch(`/api/payments/${createRes.body.data._id}/verify`);
      expect(verifyRes.body.data.status).toBe("verified");
    });

    it("should complete: create → fail", async () => {
      const createRes = await request(app).post("/api/payments").send(validPayment());
      expect(createRes.body.data.status).toBe("pending");

      const failRes = await request(app)
        .patch(`/api/payments/${createRes.body.data._id}/fail`);
      expect(failRes.body.data.status).toBe("failed");
    });
  });
});
