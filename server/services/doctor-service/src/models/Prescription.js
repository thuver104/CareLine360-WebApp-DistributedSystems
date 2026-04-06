const mongoose = require('mongoose');

/**
 * Prescription item sub-schema
 */
const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  duration: { type: String },
  quantity: { type: Number },
  instructions: { type: String },
}, { _id: false });

/**
 * Prescription schema
 * Standalone prescriptions with PDF generation support
 */
const prescriptionSchema = new mongoose.Schema({
  // Auto-generated prescription number
  prescriptionNumber: {
    type: String,
    unique: true,
  },
  
  // Doctor reference (local)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  
  // Patient reference (cross-service)
  patientId: {
    type: String,
    required: true,
  },
  
  // Link to medical record (if applicable)
  medicalRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord',
  },
  
  // Appointment reference (cross-service)
  appointmentId: {
    type: String,
  },
  
  // Patient info (denormalized)
  patientName: {
    type: String,
  },
  patientAge: {
    type: Number,
  },
  patientGender: {
    type: String,
  },
  
  // Prescription details
  diagnosis: {
    type: String,
    trim: true,
  },
  medications: [medicationSchema],
  
  // Additional notes
  notes: {
    type: String,
    trim: true,
  },
  advice: {
    type: String,
    trim: true,
  },
  
  // PDF file
  fileUrl: {
    type: String,
  },
  filePublicId: {
    type: String,
  },
  
  // Status
  sentToPatient: {
    type: Boolean,
    default: false,
  },
  sentAt: {
    type: Date,
  },
  
  // Validity
  validUntil: {
    type: Date,
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Pre-save hook to generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionNumber) {
    const Counter = require('./Counter');
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'prescriptionNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.prescriptionNumber = `RX-${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

// Indexes
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 }, { unique: true });
prescriptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
