const mongoose = require("mongoose");

jest.mock("../../../models/Payment");

const Payment = require("../../../models/Payment");
const paymentService = require("../../../services/paymentService");

describe("Payment Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createPayment ─────────────────────────────────────────────────

  describe("createPayment", () => {
    it("should create a payment when none exists", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        appointment: new mongoose.Types.ObjectId(),
        patient: new mongoose.Types.ObjectId(),
        amount: 50,
        status: "pending",
        populate: jest.fn().mockReturnThis(),
      };

      Payment.findOne.mockResolvedValue(null);
      Payment.create.mockResolvedValue(mockPayment);

      const result = await paymentService.createPayment({
        appointment: mockPayment.appointment,
        patient: mockPayment.patient,
        amount: 50,
      });

      expect(result.amount).toBe(50);
      expect(result.status).toBe("pending");
      expect(Payment.create).toHaveBeenCalled();
    });

    it("should throw 409 if payment already exists", async () => {
      Payment.findOne.mockResolvedValue({ _id: "existing" });

      await expect(
        paymentService.createPayment({ appointment: new mongoose.Types.ObjectId() })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("already exists"),
      });
    });

    it("should call populate after creation", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        amount: 100,
        status: "pending",
        populate: jest.fn().mockReturnThis(),
      };

      Payment.findOne.mockResolvedValue(null);
      Payment.create.mockResolvedValue(mockPayment);

      await paymentService.createPayment({
        appointment: new mongoose.Types.ObjectId(),
        patient: new mongoose.Types.ObjectId(),
        amount: 100,
      });

      expect(mockPayment.populate).toHaveBeenCalledWith("appointment patient");
    });
  });

  // ─── getPaymentById ─────────────────────────────────────────────────

  describe("getPaymentById", () => {
    it("should return a populated payment when found", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        amount: 75,
        status: "pending",
        appointment: { _id: "appt1" },
        patient: { fullName: "Alice" },
      };

      Payment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await paymentService.getPaymentById(mockPayment._id);

      expect(result).toEqual(mockPayment);
      expect(result.amount).toBe(75);
    });

    it("should throw 404 when payment not found", async () => {
      Payment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        paymentService.getPaymentById(new mongoose.Types.ObjectId())
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Payment not found",
      });
    });
  });

  // ─── getPaymentByAppointment ────────────────────────────────────────

  describe("getPaymentByAppointment", () => {
    it("should return payment for a given appointment", async () => {
      const appointmentId = new mongoose.Types.ObjectId();
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        appointment: appointmentId,
        amount: 60,
      };

      Payment.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await paymentService.getPaymentByAppointment(appointmentId);

      expect(result.appointment).toEqual(appointmentId);
    });

    it("should throw 404 when no payment found for appointment", async () => {
      Payment.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        paymentService.getPaymentByAppointment(new mongoose.Types.ObjectId())
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Payment not found for this appointment",
      });
    });
  });

  // ─── verifyPayment ──────────────────────────────────────────────────

  describe("verifyPayment", () => {
    it("should verify a pending payment", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      Payment.findById.mockResolvedValue(mockPayment);

      const result = await paymentService.verifyPayment(mockPayment._id);
      expect(result.status).toBe("verified");
      expect(result.transactionRef).toBeDefined();
      expect(result.transactionRef).toMatch(/^TXN-/);
      expect(result.verifiedAt).toBeDefined();
    });

    it("should reject verifying non-pending payment", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        status: "verified",
      };

      Payment.findById.mockResolvedValue(mockPayment);

      await expect(
        paymentService.verifyPayment(mockPayment._id)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("not in pending"),
      });
    });

    it("should throw 404 when payment not found", async () => {
      Payment.findById.mockResolvedValue(null);

      await expect(
        paymentService.verifyPayment(new mongoose.Types.ObjectId())
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Payment not found",
      });
    });

    it("should call save and populate after verification", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      Payment.findById.mockResolvedValue(mockPayment);

      await paymentService.verifyPayment(mockPayment._id);

      expect(mockPayment.save).toHaveBeenCalled();
      expect(mockPayment.populate).toHaveBeenCalledWith("appointment patient");
    });

    it("should reject verifying a failed payment", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        status: "failed",
      };

      Payment.findById.mockResolvedValue(mockPayment);

      await expect(
        paymentService.verifyPayment(mockPayment._id)
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // ─── failPayment ────────────────────────────────────────────────────

  describe("failPayment", () => {
    it("should fail a pending payment", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      Payment.findById.mockResolvedValue(mockPayment);

      const result = await paymentService.failPayment(mockPayment._id);
      expect(result.status).toBe("failed");
    });

    it("should throw 404 when payment not found", async () => {
      Payment.findById.mockResolvedValue(null);

      await expect(
        paymentService.failPayment(new mongoose.Types.ObjectId())
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Payment not found",
      });
    });

    it("should reject failing a non-pending payment", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        status: "verified",
      };

      Payment.findById.mockResolvedValue(mockPayment);

      await expect(
        paymentService.failPayment(mockPayment._id)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("not in pending"),
      });
    });

    it("should call save and populate after failing", async () => {
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      Payment.findById.mockResolvedValue(mockPayment);

      await paymentService.failPayment(mockPayment._id);

      expect(mockPayment.save).toHaveBeenCalled();
      expect(mockPayment.populate).toHaveBeenCalledWith("appointment patient");
    });
  });
});
