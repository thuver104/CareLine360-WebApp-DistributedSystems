const mongoose = require('mongoose');

/**
 * Vitals sub-schema
 */
const vitalsSchema = new mongoose.Schema({
  bloodPressure: { type: String },
  heartRate: { type: Number },
  temperature: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  oxygenSaturation: { type: Number },
  respiratoryRate: { type: Number },
}, { _id: false });

/**
 * Prescription item sub-schema
 */
const prescriptionItemSchema = new mongoose.Schema({
  medication: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  duration: { type: String },
  instructions: { type: String },
}, { _id: false });

/**
 * Medical Record schema
 * Created by doctors during/after appointments
 */
const medicalRecordSchema = new mongoose.Schema({
  // Doctor reference (local)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  
  // Patient reference (cross-service, stored as String)
  patientId: {
    type: String,
    required: true,
  },
  
  // Appointment reference (cross-service, stored as String)
  appointmentId: {
    type: String,
  },
  
  // Visit details
  visitDate: {
    type: Date,
    default: Date.now,
  },
  visitType: {
    type: String,
    enum: ['initial', 'follow-up', 'emergency', 'routine'],
    default: 'routine',
  },
  
  // Medical information
  chiefComplaint: {
    type: String,
    trim: true,
  },
  symptoms: [{
    type: String,
    trim: true,
  }],
  diagnosis: {
    type: String,
    trim: true,
  },
  diagnosisCode: {
    type: String, // ICD-10 code
  },
  
  // Clinical details
  vitals: vitalsSchema,
  physicalExam: {
    type: String,
    trim: true,
  },
  
  // Prescriptions (embedded)
  prescriptions: [prescriptionItemSchema],
  
  // Additional notes
  notes: {
    type: String,
    trim: true,
  },
  treatmentPlan: {
    type: String,
    trim: true,
  },
  
  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: {
    type: Date,
  },
  
  // Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
medicalRecordSchema.index({ doctorId: 1 });
medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ appointmentId: 1 });
medicalRecordSchema.index({ visitDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
