const { generateAndUploadPrescriptionPdf } = require("../services/prescriptionPdfService");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

/**
 * POST /api/doctor/prescriptions/generate
 * Generates a PDF prescription, uploads to Cloudinary, saves record, returns URL.
 *
 * Body: { medicalRecordId, patientId, appointmentId, medicines, notes }
 */
const generatePrescriptionPdf = async (req, res) => {
  try {
    const { medicalRecordId, patientId, appointmentId, medicines, notes } = req.body;

    if (!patientId || !medicines?.length) {
      return res.status(400).json({ message: "patientId and at least one medicine are required" });
    }

    const doctor = await Doctor.findOne({ userId: req.user.userId, isDeleted: false });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    let appointmentDate = null;
    if (appointmentId) {
      const appt = await Appointment.findById(appointmentId);
      if (appt) appointmentDate = new Date(appt.date).toLocaleDateString("en-GB");
    }

    // Generate PDF and upload to Cloudinary
    const { fileUrl, publicId } = await generateAndUploadPrescriptionPdf({
      doctor,
      patient,
      prescription: { medicines, notes },
      appointmentDate,
    });

    // Save prescription record directly to DB
    const prescription = await Prescription.create({
      medicalRecordId: medicalRecordId || null,
      doctorId: doctor._id,
      patientId,
      medicines,
      notes: notes || "",
      fileUrl,
      publicId,
    });

    res.status(201).json({
      message: "Prescription generated and saved",
      prescriptionId: prescription._id,
      fileUrl,
    });
  } catch (err) {
    console.error("Prescription PDF error:", err);
    res.status(500).json({ message: "Failed to generate prescription PDF", detail: err.message });
  }
};

module.exports = { generatePrescriptionPdf };