const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const request = require("supertest");

const User = require("../../models/User");
const Appointment = require("../../models/Appointment");
const ChatMessage = require("../../models/ChatMessage");
const chatRoutes = require("../../routes/chatRoutes");
const errorHandler = require("../../middleware/errorHandler");

let mongoServer;
let app;
let patient, doctor, appointment;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());
  app.use("/api/chat", chatRoutes);
  app.use(errorHandler);

  patient = await User.create({ name: "Test Patient", email: "patient@chat.com", role: "patient" });
  doctor = await User.create({ name: "Test Doctor", email: "doctor@chat.com", role: "doctor", specialization: "General" });
  appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    date: new Date("2026-04-01"),
    time: "10:00",
    consultationType: "video",
    status: "confirmed",
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await ChatMessage.deleteMany({});
});

describe("Chat API", () => {
  describe("POST /api/chat", () => {
    it("should send a message", async () => {
      const res = await request(app)
        .post("/api/chat")
        .send({
          appointment: appointment._id.toString(),
          sender: patient._id.toString(),
          message: "Hello doctor",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("Hello doctor");
    });
  });

  describe("GET /api/chat/:appointmentId", () => {
    it("should get messages for an appointment", async () => {
      await request(app).post("/api/chat").send({
        appointment: appointment._id.toString(),
        sender: patient._id.toString(),
        message: "Message 1",
      });
      await request(app).post("/api/chat").send({
        appointment: appointment._id.toString(),
        sender: doctor._id.toString(),
        message: "Message 2",
      });

      const res = await request(app)
        .get(`/api/chat/${appointment._id}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
    });

    it("should support ?since parameter for polling", async () => {
      const msg1 = await request(app).post("/api/chat").send({
        appointment: appointment._id.toString(),
        sender: patient._id.toString(),
        message: "First",
      });

      // Wait a small amount to ensure timestamps differ
      await new Promise((r) => setTimeout(r, 50));

      await request(app).post("/api/chat").send({
        appointment: appointment._id.toString(),
        sender: doctor._id.toString(),
        message: "Second",
      });

      const since = msg1.body.data.createdAt;
      const res = await request(app)
        .get(`/api/chat/${appointment._id}?since=${since}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].message).toBe("Second");
    });
  });

  describe("PATCH /api/chat/:appointmentId/read", () => {
    it("should mark messages as read", async () => {
      await request(app).post("/api/chat").send({
        appointment: appointment._id.toString(),
        sender: doctor._id.toString(),
        message: "Please check your results",
      });

      const res = await request(app)
        .patch(`/api/chat/${appointment._id}/read`)
        .send({ userId: patient._id.toString() })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
