const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const validateRequest = require("../../../middleware/validateRequest");
const {
  createPaymentRules,
  paymentIdRules,
} = require("../../../validators/paymentValidator");

const createApp = (method, path, rules) => {
  const app = express();
  app.use(express.json());
  if (method === "post") {
    app.post(path, ...rules, validateRequest, (req, res) => res.json({ success: true }));
  } else if (method === "get") {
    app.get(path, ...rules, validateRequest, (req, res) => res.json({ success: true }));
  } else if (method === "patch") {
    app.patch(path, ...rules, validateRequest, (req, res) => res.json({ success: true }));
  }
  return app;
};

describe("Payment Validators", () => {
  // ─── createPaymentRules ───────────────────────────────────────────

  describe("createPaymentRules", () => {
    const app = createApp("post", "/", createPaymentRules);

    const validBody = () => ({
      appointment: new mongoose.Types.ObjectId().toString(),
      patient: new mongoose.Types.ObjectId().toString(),
      amount: 50,
    });

    it("should pass with all valid fields", async () => {
      const res = await request(app).post("/").send(validBody()).expect(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail when appointment is missing", async () => {
      const body = validBody();
      delete body.appointment;
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Appointment ID is required");
    });

    it("should fail when appointment is not a valid MongoId", async () => {
      const body = { ...validBody(), appointment: "not-a-mongo-id" };
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Invalid appointment ID");
    });

    it("should fail when patient is missing", async () => {
      const body = validBody();
      delete body.patient;
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Patient ID is required");
    });

    it("should fail when patient is not a valid MongoId", async () => {
      const body = { ...validBody(), patient: "bad-id" };
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Invalid patient ID");
    });

    it("should fail when amount is missing", async () => {
      const body = validBody();
      delete body.amount;
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Amount is required");
    });

    it("should fail when amount is negative", async () => {
      const body = { ...validBody(), amount: -10 };
      const res = await request(app).post("/").send(body).expect(400);
      expect(res.body.message).toContain("Amount must be positive");
    });

    it("should pass with optional currency and method", async () => {
      const body = { ...validBody(), currency: "GBP", method: "bank_transfer" };
      const res = await request(app).post("/").send(body).expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── paymentIdRules ───────────────────────────────────────────────

  describe("paymentIdRules", () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const app = createApp("get", "/:id", paymentIdRules);

    it("should pass with valid MongoId", async () => {
      const res = await request(app).get(`/${validId}`).expect(200);
      expect(res.body.success).toBe(true);
    });

    it("should fail with invalid ID", async () => {
      const res = await request(app).get("/not-valid").expect(400);
      expect(res.body.message).toContain("Invalid payment ID");
    });
  });
});
