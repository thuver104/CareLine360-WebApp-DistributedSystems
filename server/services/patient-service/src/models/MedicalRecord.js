/**
 * MedicalRecord Model
 * Stores patient medical history, diagnoses, and visit records
 */

const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    // Patient reference (String ID for cross-service compatibility)
    patientId: {
      type: String,
      required: true,
      index: true
    },
    
    // Doctor reference (String ID for cross-service compatibility)
    doctorId: {
      type: String,
      required: true,
      index: true
    },
    
    // Appointment reference (optional)
    appointmentId: {
      type: String,
      default: null
    },
    
    // Snapshot data for display (avoids cross-service queries)
    doctorSnapshot: {
      name: String,
      specialization: String
    },
    
    patientSnapshot: {
      name: String,
      patientId: String
    },

    // Visit Info
    visitDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    visitType: {
      type: String,
      enum: ['consultation', 'follow-up', 'emergency', 'routine', 'specialist'],
      default: 'consultation'
    },

    // Diagnosis
    chiefComplaint: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    symptoms: [{
      type: String,
      trim: true
    }],
    diagnosis: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    secondaryDiagnosis: [{
      type: String,
      trim: true
    }],
    icdCode: { 
      type: String, 
      trim: true 
    },
    notes: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    treatmentPlan: { 
      type: String, 
      trim: true 
    },
    followUpDate: Date,

    // Vitals
    vitals: {
      bloodPressure: { type: String, default: '' }, // "120/80"
      heartRate: { type: Number, default: null },
      temperature: { type: Number, default: null }, // Celsius
      oxygenSaturation: { type: Number, default: null }, // %
      weight: { type: Number, default: null },
      height: { type: Number, default: null },
      respiratoryRate: { type: Number, default: null }
    },

    // Prescriptions embedded in record
    prescriptions: [
      {
        medicine: { type: String, trim: true },
        dosage: { type: String, trim: true },
        frequency: { type: String, trim: true },
        duration: { type: String, trim: true },
        instructions: { type: String, trim: true }
      }
    ],
    
    // Reference to standalone Prescription document
    prescriptionId: {
      type: String,
      default: null
    },

    // Uploaded PDFs/scans (Cloudinary)
    attachments: [
      {
        fileUrl: String,
        publicId: String,
        fileName: String,
        mimeType: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    // Status
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'completed'
    },

    isDeleted: { 
      type: Boolean, 
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

// Compound index for efficient patient history queries
medicalRecordSchema.index({ patientId: 1, visitDate: -1 });
medicalRecordSchema.index({ doctorId: 1, visitDate: -1 });
medicalRecordSchema.index({ isDeleted: 1, visitDate: -1 });

// Static method to get patient's medical history
medicalRecordSchema.statics.getPatientHistory = function(patientId, options = {}) {
  const { limit = 50, skip = 0, startDate, endDate } = options;
  
  const query = { patientId, isDeleted: false };
  
  if (startDate || endDate) {
    query.visitDate = {};
    if (startDate) query.visitDate.$gte = new Date(startDate);
    if (endDate) query.visitDate.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ visitDate: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
