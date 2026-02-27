const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    // Visit Info
    visitDate: {
      type: Date,
      default: Date.now, // safe default — won't break doctor-module code that omits this field
    },
    visitType: {
      type: String,
      enum: ["consultation", "follow-up", "emergency"],
      default: "consultation",
    },

    // Diagnosis
    chiefComplaint: { type: String, trim: true, default: "" },
    symptoms: [String],
    diagnosis: { type: String, trim: true, default: "" },
    secondaryDiagnosis: [String],
    icdCode: { type: String, trim: true },
    notes: { type: String, trim: true, default: "" },
    treatmentPlan: { type: String, trim: true },
    followUpDate: Date,

    // Vitals
    vitals: {
      bloodPressure: { type: String, default: "" }, // "120/80"
      heartRate: { type: Number, default: null },
      temperature: { type: Number, default: null }, // Celsius
      oxygenSaturation: { type: Number, default: null }, // % (unified name)
      weight: { type: Number, default: null },
      height: { type: Number, default: null },
    },

    // Prescriptions embedded in record
    prescriptions: [
      {
        medicine: { type: String, trim: true },
        dosage: { type: String, trim: true },
        frequency: { type: String, trim: true },
        duration: { type: String, trim: true },
        instructions: { type: String, trim: true },
      },
    ],
    // Reference to standalone Prescription document
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },

    // Uploaded PDFs/scans (Cloudinary)
    attachments: [
      {
        fileUrl: String,
        publicId: String,
        fileName: String,
        mimeType: String,
      },
    ],

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient patient history queries sorted by most recent
medicalRecordSchema.index({ patientId: 1, visitDate: -1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);