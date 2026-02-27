jest.mock("../../../services/paymentService");

const paymentService = require("../../../services/paymentService");
const controller = require("../../../controllers/paymentController");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Payment Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createPayment ────────────────────────────────────────────────

  describe("createPayment", () => {
    it("should create payment and return 201", async () => {
      const req = { body: { appointment: "appt1", patient: "p1", amount: 50 } };
      const res = mockRes();
      const next = jest.fn();

      const mockPayment = { _id: "pay1", amount: 50, status: "pending" };
      paymentService.createPayment.mockResolvedValue(mockPayment);

      await controller.createPayment(req, res, next);

      expect(paymentService.createPayment).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPayment });
    });

    it("should forward errors via next", async () => {
      const req = { body: {} };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      paymentService.createPayment.mockRejectedValue(error);

      await controller.createPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── getPaymentById ───────────────────────────────────────────────

  describe("getPaymentById", () => {
    it("should return payment by ID", async () => {
      const req = { params: { id: "pay1" } };
      const res = mockRes();
      const next = jest.fn();

      const mockPayment = { _id: "pay1", amount: 50 };
      paymentService.getPaymentById.mockResolvedValue(mockPayment);

      await controller.getPaymentById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPayment });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "bad" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("not found");

      paymentService.getPaymentById.mockRejectedValue(error);

      await controller.getPaymentById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── getPaymentByAppointment ──────────────────────────────────────

  describe("getPaymentByAppointment", () => {
    it("should return payment by appointment ID", async () => {
      const req = { params: { appointmentId: "appt1" } };
      const res = mockRes();
      const next = jest.fn();

      const mockPayment = { _id: "pay1", appointment: "appt1" };
      paymentService.getPaymentByAppointment.mockResolvedValue(mockPayment);

      await controller.getPaymentByAppointment(req, res, next);

      expect(paymentService.getPaymentByAppointment).toHaveBeenCalledWith("appt1");
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPayment });
    });

    it("should forward errors via next", async () => {
      const req = { params: { appointmentId: "bad" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("not found");

      paymentService.getPaymentByAppointment.mockRejectedValue(error);

      await controller.getPaymentByAppointment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── verifyPayment ────────────────────────────────────────────────

  describe("verifyPayment", () => {
    it("should verify payment and return result", async () => {
      const req = { params: { id: "pay1" } };
      const res = mockRes();
      const next = jest.fn();

      const mockPayment = { _id: "pay1", status: "verified" };
      paymentService.verifyPayment.mockResolvedValue(mockPayment);

      await controller.verifyPayment(req, res, next);

      expect(paymentService.verifyPayment).toHaveBeenCalledWith("pay1");
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPayment });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "pay1" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      paymentService.verifyPayment.mockRejectedValue(error);

      await controller.verifyPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── failPayment ─────────────────────────────────────────────────

  describe("failPayment", () => {
    it("should fail payment and return result", async () => {
      const req = { params: { id: "pay1" } };
      const res = mockRes();
      const next = jest.fn();

      const mockPayment = { _id: "pay1", status: "failed" };
      paymentService.failPayment.mockResolvedValue(mockPayment);

      await controller.failPayment(req, res, next);

      expect(paymentService.failPayment).toHaveBeenCalledWith("pay1");
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPayment });
    });

    it("should forward errors via next", async () => {
      const req = { params: { id: "pay1" } };
      const res = mockRes();
      const next = jest.fn();
      const error = new Error("fail");

      paymentService.failPayment.mockRejectedValue(error);

      await controller.failPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
