const mongoose = require("mongoose");

// Mock the models and email service before requiring the service
jest.mock("../../../models/Appointment");
jest.mock("../../../models/User");
jest.mock("../../../services/emailService", () => ({
  sendAppointmentCreated: jest.fn(),
  sendAppointmentConfirmed: jest.fn(),
  sendAppointmentRescheduled: jest.fn(),
  sendAppointmentCancelled: jest.fn(),
}));

const Appointment = require("../../../models/Appointment");
const emailService = require("../../../services/emailService");
const appointmentService = require("../../../services/appointmentService");

describe("Appointment Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createAppointment ──────────────────────────────────────────────

  describe("createAppointment", () => {
    const mockPopulatedAppointment = {
      _id: new mongoose.Types.ObjectId(),
      patient: { fullName: "Alice", email: "alice@test.com" },
      doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
      date: new Date("2026-03-01"),
      time: "10:00",
      status: "pending",
      consultationType: "video",
    };

    it("should create an appointment when no double booking exists", async () => {
      Appointment.findOne.mockResolvedValue(null);
      Appointment.create.mockResolvedValue(mockPopulatedAppointment);
      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedAppointment),
      });

      const result = await appointmentService.createAppointment({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        date: "2026-03-01",
        time: "10:00",
        consultationType: "video",
      });

      expect(result).toBeDefined();
      expect(Appointment.create).toHaveBeenCalled();
    });

    it("should throw 409 when double booking detected", async () => {
      Appointment.findOne.mockResolvedValue({ _id: "existing" });

      await expect(
        appointmentService.createAppointment({
          doctor: new mongoose.Types.ObjectId(),
          date: "2026-03-01",
          time: "10:00",
        })
      ).rejects.toMatchObject({
        message: expect.stringContaining("already has an appointment"),
        statusCode: 409,
      });
    });

    it("should call email notification after creation", async () => {
      Appointment.findOne.mockResolvedValue(null);
      Appointment.create.mockResolvedValue(mockPopulatedAppointment);
      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedAppointment),
      });

      await appointmentService.createAppointment({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        date: "2026-03-01",
        time: "10:00",
        consultationType: "video",
      });

      expect(emailService.sendAppointmentCreated).toHaveBeenCalledWith(
        mockPopulatedAppointment,
        mockPopulatedAppointment.patient,
        mockPopulatedAppointment.doctor
      );
    });

    it("should handle email failure gracefully", async () => {
      Appointment.findOne.mockResolvedValue(null);
      Appointment.create.mockResolvedValue(mockPopulatedAppointment);
      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedAppointment),
      });
      emailService.sendAppointmentCreated.mockRejectedValue(new Error("SMTP down"));

      const result = await appointmentService.createAppointment({
        patient: new mongoose.Types.ObjectId(),
        doctor: new mongoose.Types.ObjectId(),
        date: "2026-03-01",
        time: "10:00",
        consultationType: "video",
      });

      expect(result).toBeDefined();
    });
  });

  // ─── getAppointments ────────────────────────────────────────────────

  describe("getAppointments", () => {
    const mockChain = (appointments, total) => {
      Appointment.countDocuments.mockResolvedValue(total);
      Appointment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(appointments),
            }),
          }),
        }),
      });
    };

    it("should return appointments with default pagination", async () => {
      mockChain([{ _id: "a1" }], 1);

      const result = await appointmentService.getAppointments();

      expect(result.appointments).toHaveLength(1);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      });
    });

    it("should filter by single status", async () => {
      mockChain([], 0);

      await appointmentService.getAppointments({ status: "confirmed" });

      expect(Appointment.find).toHaveBeenCalled();
    });

    it("should filter by multiple statuses (comma-separated)", async () => {
      mockChain([], 0);

      await appointmentService.getAppointments({ status: "pending,confirmed" });

      expect(Appointment.find).toHaveBeenCalled();
    });

    it("should filter by doctor", async () => {
      const doctorId = new mongoose.Types.ObjectId();
      mockChain([], 0);

      await appointmentService.getAppointments({ doctor: doctorId });

      expect(Appointment.find).toHaveBeenCalled();
    });

    it("should filter by patient", async () => {
      const patientId = new mongoose.Types.ObjectId();
      mockChain([], 0);

      await appointmentService.getAppointments({ patient: patientId });

      expect(Appointment.find).toHaveBeenCalled();
    });

    it("should filter by date range", async () => {
      mockChain([], 0);

      await appointmentService.getAppointments({
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
      });

      expect(Appointment.find).toHaveBeenCalled();
    });

    it("should apply custom pagination", async () => {
      mockChain([{ _id: "a1" }], 25);

      const result = await appointmentService.getAppointments({ page: 2, limit: 5 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.pages).toBe(5);
    });

    it("should return empty results when no matches", async () => {
      mockChain([], 0);

      const result = await appointmentService.getAppointments({ status: "completed" });

      expect(result.appointments).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ─── getAppointmentById ─────────────────────────────────────────────

  describe("getAppointmentById", () => {
    it("should return populated appointment when found", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        patient: { fullName: "Alice" },
        doctor: { fullName: "Dr. Sarah" },
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      const result = await appointmentService.getAppointmentById(mockAppt._id);

      expect(result).toEqual(mockAppt);
    });

    it("should throw 404 when appointment not found", async () => {
      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        appointmentService.getAppointmentById(new mongoose.Types.ObjectId())
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Appointment not found",
      });
    });
  });

  // ─── updateAppointment ──────────────────────────────────────────────

  describe("updateAppointment", () => {
    it("should update a pending appointment", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        doctor: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      Appointment.findById.mockResolvedValue(mockAppt);

      const result = await appointmentService.updateAppointment(mockAppt._id, {
        symptoms: "Updated symptoms",
      });

      expect(mockAppt.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should throw 404 when appointment not found", async () => {
      Appointment.findById.mockResolvedValue(null);

      await expect(
        appointmentService.updateAppointment(new mongoose.Types.ObjectId(), {})
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Appointment not found",
      });
    });

    it("should throw 400 when appointment is not pending", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
      };
      Appointment.findById.mockResolvedValue(mockAppt);

      await expect(
        appointmentService.updateAppointment(mockAppt._id, { symptoms: "x" })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("pending"),
      });
    });

    it("should throw 409 on double booking when date/time changes", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        doctor: new mongoose.Types.ObjectId(),
        save: jest.fn(),
        populate: jest.fn().mockReturnThis(),
      };

      Appointment.findById.mockResolvedValue(mockAppt);
      Appointment.findOne.mockResolvedValue({ _id: "existing" });

      await expect(
        appointmentService.updateAppointment(mockAppt._id, {
          date: "2026-04-01",
          time: "14:00",
        })
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("should skip double-booking check when only non-date fields change", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        doctor: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      Appointment.findById.mockResolvedValue(mockAppt);

      await appointmentService.updateAppointment(mockAppt._id, {
        symptoms: "Updated",
      });

      expect(Appointment.findOne).not.toHaveBeenCalled();
      expect(mockAppt.save).toHaveBeenCalled();
    });
  });

  // ─── deleteAppointment ──────────────────────────────────────────────

  describe("deleteAppointment", () => {
    it("should delete a pending appointment", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        deleteOne: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockResolvedValue(mockAppt);

      const result = await appointmentService.deleteAppointment(mockAppt._id);

      expect(mockAppt.deleteOne).toHaveBeenCalled();
      expect(result.message).toBe("Appointment deleted");
    });

    it("should throw 404 when appointment not found", async () => {
      Appointment.findById.mockResolvedValue(null);

      await expect(
        appointmentService.deleteAppointment(new mongoose.Types.ObjectId())
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Appointment not found",
      });
    });

    it("should reject deleting non-pending appointments", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
      };

      Appointment.findById.mockResolvedValue(mockAppt);

      await expect(
        appointmentService.deleteAppointment(mockAppt._id)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("pending"),
      });
    });
  });

  // ─── transitionStatus ───────────────────────────────────────────────

  describe("transitionStatus", () => {
    it("should allow pending -> confirmed", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      const result = await appointmentService.transitionStatus(mockAppt._id, "confirmed");
      expect(result.status).toBe("confirmed");
    });

    it("should allow pending -> cancelled", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      const result = await appointmentService.transitionStatus(mockAppt._id, "cancelled");
      expect(result.status).toBe("cancelled");
    });

    it("should allow confirmed -> completed", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      const result = await appointmentService.transitionStatus(mockAppt._id, "completed");
      expect(result.status).toBe("completed");
    });

    it("should allow confirmed -> cancelled", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      const result = await appointmentService.transitionStatus(mockAppt._id, "cancelled");
      expect(result.status).toBe("cancelled");
    });

    it("should reject invalid transitions", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "completed",
        save: jest.fn(),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      await expect(
        appointmentService.transitionStatus(mockAppt._id, "confirmed")
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should throw 404 when appointment not found", async () => {
      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        appointmentService.transitionStatus(new mongoose.Types.ObjectId(), "confirmed")
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should call email only on confirmed transition", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      await appointmentService.transitionStatus(mockAppt._id, "confirmed");
      expect(emailService.sendAppointmentConfirmed).toHaveBeenCalled();

      jest.clearAllMocks();

      const mockAppt2 = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt2),
      });

      await appointmentService.transitionStatus(mockAppt2._id, "cancelled");
      expect(emailService.sendAppointmentConfirmed).not.toHaveBeenCalled();
    });
  });

  // ─── rescheduleAppointment ──────────────────────────────────────────

  describe("rescheduleAppointment", () => {
    it("should reschedule a confirmed appointment", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
        date: new Date("2026-03-01"),
        time: "10:00",
        doctor: { _id: new mongoose.Types.ObjectId() },
        patient: { fullName: "Alice", email: "alice@test.com" },
        rescheduleHistory: [],
        reminderSent: true,
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });
      Appointment.findOne.mockResolvedValue(null);

      const result = await appointmentService.rescheduleAppointment(
        mockAppt._id,
        "2026-04-01",
        "14:00"
      );

      expect(result.date).toEqual(new Date("2026-04-01"));
      expect(result.time).toBe("14:00");
      expect(result.reminderSent).toBe(false);
    });

    it("should throw 404 when appointment not found", async () => {
      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        appointmentService.rescheduleAppointment(new mongoose.Types.ObjectId(), "2026-04-01", "14:00")
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 400 when appointment is not confirmed", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      await expect(
        appointmentService.rescheduleAppointment(mockAppt._id, "2026-04-01", "14:00")
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("confirmed"),
      });
    });

    it("should throw 409 on double booking", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
        doctor: { _id: new mongoose.Types.ObjectId() },
        patient: { fullName: "Alice", email: "alice@test.com" },
        rescheduleHistory: [],
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });
      Appointment.findOne.mockResolvedValue({ _id: "existing" });

      await expect(
        appointmentService.rescheduleAppointment(mockAppt._id, "2026-04-01", "14:00")
      ).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("should push to rescheduleHistory", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
        date: new Date("2026-03-01"),
        time: "10:00",
        doctor: { _id: new mongoose.Types.ObjectId() },
        patient: { fullName: "Alice", email: "alice@test.com" },
        rescheduleHistory: [],
        reminderSent: false,
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });
      Appointment.findOne.mockResolvedValue(null);

      await appointmentService.rescheduleAppointment(mockAppt._id, "2026-04-01", "14:00");

      expect(mockAppt.rescheduleHistory).toHaveLength(1);
      expect(mockAppt.rescheduleHistory[0].previousDate).toEqual(new Date("2026-03-01"));
      expect(mockAppt.rescheduleHistory[0].previousTime).toBe("10:00");
    });

    it("should call email notification after reschedule", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
        date: new Date("2026-03-01"),
        time: "10:00",
        doctor: { _id: new mongoose.Types.ObjectId() },
        patient: { fullName: "Alice", email: "alice@test.com" },
        rescheduleHistory: [],
        reminderSent: false,
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });
      Appointment.findOne.mockResolvedValue(null);

      await appointmentService.rescheduleAppointment(mockAppt._id, "2026-04-01", "14:00");

      expect(emailService.sendAppointmentRescheduled).toHaveBeenCalled();
    });
  });

  // ─── cancelAppointment ──────────────────────────────────────────────

  describe("cancelAppointment", () => {
    it("should cancel a pending appointment", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      const result = await appointmentService.cancelAppointment(mockAppt._id, "No longer needed");

      expect(result.status).toBe("cancelled");
      expect(result.cancellationReason).toBe("No longer needed");
    });

    it("should cancel a confirmed appointment", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "confirmed",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      const result = await appointmentService.cancelAppointment(mockAppt._id, "Emergency");

      expect(result.status).toBe("cancelled");
    });

    it("should throw 404 when appointment not found", async () => {
      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        appointmentService.cancelAppointment(new mongoose.Types.ObjectId(), "reason")
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 400 when appointment is completed", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "completed",
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      await expect(
        appointmentService.cancelAppointment(mockAppt._id, "reason")
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should throw 400 when appointment is already cancelled", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "cancelled",
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      await expect(
        appointmentService.cancelAppointment(mockAppt._id, "reason")
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should call email notification after cancellation", async () => {
      const mockAppt = {
        _id: new mongoose.Types.ObjectId(),
        status: "pending",
        patient: { fullName: "Alice", email: "alice@test.com" },
        doctor: { fullName: "Dr. Sarah", email: "sarah@test.com" },
        save: jest.fn().mockResolvedValue(true),
      };

      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAppt),
      });

      await appointmentService.cancelAppointment(mockAppt._id, "Changed plans");

      expect(emailService.sendAppointmentCancelled).toHaveBeenCalled();
    });
  });
});
