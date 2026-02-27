const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const validateRequest = require("../../../middleware/validateRequest");
const {
  createAppointmentRules,
  updateAppointmentRules,
  statusTransitionRules,
  rescheduleRules,
  cancelRules,
} = require("../../../validators/appointmentValidator");

const createApp = (method, path, rules) => {
  const app = express();
  app.use(express.json());
  if (method === "post") {
    app.post(path, ...rules, validateRequest, (req, res) => res.json({ success: true }));
  } else if (method === "put") {
    app.put(path, ...rules, validateRequest, (req, res) => res.json({ success: true }));
  } else if (method === "patch") {
    app.patch(path, ...rules, validateRequest, (req, res) => res.json({ success: true }));
  }
  return app;
};

describe("Appointment Validators", () => {
  // ─── createAppointmentRules ───────────────────────────────────────

  describe("createAppointmentRules", () => {
    const app = createApp("post", "/", createAppointmentRules);

    const validBody = () => ({
      doctor: new mongoose.Types.ObjectId().toString(),
      date: "2026-04-01",
      time: "10:00",
      consultationType: "video",
    });

    it("should pass with all valid fields", async () => {
      const res = await request(app).post("/").send(validBody()).expect(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail when doctor is missing", async () => {
      const body = validBody();
      delete body.doctor;
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Doctor ID is required");
    });

    it("should fail when doctor is not a valid MongoId", async () => {
      const body = { ...validBody(), doctor: "not-a-mongo-id" };
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Invalid doctor ID");
    });

    it("should fail when date is invalid", async () => {
      const body = { ...validBody(), date: "not-a-date" };
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Invalid date format");
    });

    it("should fail when consultationType is invalid", async () => {
      const body = { ...validBody(), consultationType: "telepathy" };
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Invalid consultation type");
    });
  });

  // ─── updateAppointmentRules ───────────────────────────────────────

  describe("updateAppointmentRules", () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const app = createApp("put", "/:id", updateAppointmentRules);

    it("should pass with valid optional fields", async () => {
      const res = await request(app)
        .put(`/${validId}`)
        .send({ symptoms: "headache" })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail with invalid param ID", async () => {
      const res = await request(app)
        .put("/not-valid-id")
        .send({ symptoms: "headache" })
        .expect(400);
      expect(res.body.message).toContain("Invalid appointment ID");
    });

    it("should fail with invalid priority", async () => {
      const res = await request(app)
        .put(`/${validId}`)
        .send({ priority: "super-urgent" })
        .expect(400);
      expect(res.body.message).toContain("Invalid priority");
    });
  });

  // ─── statusTransitionRules ────────────────────────────────────────

  describe("statusTransitionRules", () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const app = createApp("patch", "/:id/status", statusTransitionRules);

    it("should pass with valid status", async () => {
      const res = await request(app)
        .patch(`/${validId}/status`)
        .send({ status: "confirmed" })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail when status is missing", async () => {
      const res = await request(app)
        .patch(`/${validId}/status`)
        .send({})
        .expect(400);
      expect(res.body.message).toContain("Status is required");
    });

    it("should fail with invalid status value", async () => {
      const res = await request(app)
        .patch(`/${validId}/status`)
        .send({ status: "unknown" })
        .expect(400);
      expect(res.body.message).toContain("Invalid status");
    });

    it("should fail with invalid param ID", async () => {
      const res = await request(app)
        .patch("/bad-id/status")
        .send({ status: "confirmed" })
        .expect(400);
      expect(res.body.message).toContain("Invalid appointment ID");
    });
  });

  // ─── rescheduleRules ──────────────────────────────────────────────

  describe("rescheduleRules", () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const app = createApp("patch", "/:id/reschedule", rescheduleRules);

    it("should pass with valid date and time", async () => {
      const res = await request(app)
        .patch(`/${validId}/reschedule`)
        .send({ date: "2026-05-01", time: "14:00" })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail when date is missing", async () => {
      const res = await request(app)
        .patch(`/${validId}/reschedule`)
        .send({ time: "14:00" })
        .expect(400);
      expect(res.body.message).toContain("New date is required");
    });

    it("should fail when time is missing", async () => {
      const res = await request(app)
        .patch(`/${validId}/reschedule`)
        .send({ date: "2026-05-01" })
        .expect(400);
      expect(res.body.message).toContain("New time is required");
    });

    it("should fail with invalid date format", async () => {
      const res = await request(app)
        .patch(`/${validId}/reschedule`)
        .send({ date: "not-a-date", time: "14:00" })
        .expect(400);
      expect(res.body.message).toContain("Invalid date format");
    });
  });

  // ─── cancelRules ──────────────────────────────────────────────────

  describe("cancelRules", () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const app = createApp("patch", "/:id/cancel", cancelRules);

    it("should pass with valid reason", async () => {
      const res = await request(app)
        .patch(`/${validId}/cancel`)
        .send({ reason: "Schedule conflict" })
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail when reason is missing", async () => {
      const res = await request(app)
        .patch(`/${validId}/cancel`)
        .send({})
        .expect(400);
      expect(res.body.message).toContain("Cancellation reason is required");
    });

    it("should fail when reason is empty string", async () => {
      const res = await request(app)
        .patch(`/${validId}/cancel`)
        .send({ reason: "" })
        .expect(400);
      expect(res.body.message).toContain("Cancellation reason is required");
    });

    it("should fail with invalid param ID", async () => {
      const res = await request(app)
        .patch("/bad-id/cancel")
        .send({ reason: "conflict" })
        .expect(400);
      expect(res.body.message).toContain("Invalid appointment ID");
    });
  });
});
