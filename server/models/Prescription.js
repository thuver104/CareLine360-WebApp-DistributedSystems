const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    medicalRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalRecord",
      default: null,   // optional — prescriptions can exist without a linked record
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // Cloudinary PDF URL
    fileUrl: { type: String, default: "" },
    publicId: { type: String, default: "" },

    medicines: [
      {
        medicine: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],

    notes: { type: String, default: "" },
    sentToPatient: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);