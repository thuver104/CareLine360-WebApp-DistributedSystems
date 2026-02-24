// const mongoose = require("mongoose");

// const medicalHistorySchema = new mongoose.Schema(
//   {
//     // 🔗 Link to appointment (VERY IMPORTANT)
//     appointmentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Appointment",
//       required: true,
//       unique: true, // one medical history per appointment
//       index: true,
//     },

//     // 🔗 Patient (User ID, same as Appointment.patient)
//     patient: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     // 🔗 Doctor (User ID, same as Appointment.doctor)
//     doctor: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // 📋 Clinical Data
//     complaints: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     diagnosis: [
//       {
//         type: String,
//         trim: true,
//       }
//     ],

//     notes: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     treatmentPlan: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     vitals: {
//       bloodPressure: { type: String, default: "" },
//       pulse: { type: String, default: "" },
//       temperature: { type: String, default: "" },
//       weightKg: { type: Number },
//       heightCm: { type: Number },
//       spo2: { type: String, default: "" },
//     },

//     followUpDate: {
//       type: Date,
//       default: null,
//     },

//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// // Useful indexes
// medicalHistorySchema.index({ patient: 1, createdAt: -1 });
// medicalHistorySchema.index({ doctor: 1 });

// module.exports = mongoose.model("MedicalHistory", medicalHistorySchema);






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

    visitDate: {
      type: Date,
      required: true,
    },

    visitType: {
      type: String,
      enum: ["consultation", "follow-up", "emergency"],
      default: "consultation",
    },

    chiefComplaint: {
      type: String,
      trim: true,
    },

    symptoms: [String],

    diagnosis: {
      type: String,
      trim: true,
    },

    secondaryDiagnosis: [String],

    icdCode: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    treatmentPlan: {
      type: String,
      trim: true,
    },

    followUpDate: Date,

    vitals: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      weight: Number,
      height: Number,
      oxygenSat: Number,
    },

    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },

    attachments: [
      {
        type: String,
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ patientId: 1, visitDate: -1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);