const mongoose = require('mongoose');

/**
 * Appointment schema (local copy for doctor-service)
 * Note: This is a denormalized copy - the source of truth is appointment-service
 * Medical records and prescriptions reference appointments by appointmentId
 */
const appointmentSchema = new mongoose.Schema({
  // Cross-service reference (stored as String)
  appointmentId: {
    type: String,
    required: true,
    unique: true,
  },
  
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
  
  // Patient info (denormalized)
  patientName: {
    type: String,
  },
  patientEmail: {
    type: String,
  },
  patientPhone: {
    type: String,
  },
  patientAvatar: {
    type: String,
  },
  
  // Appointment details
  date: {
    type: String, // "YYYY-MM-DD"
    required: true,
  },
  startTime: {
    type: String, // "HH:MM"
    required: true,
  },
  endTime: {
    type: String, // "HH:MM"
    required: true,
  },
  
  // Type and status
  type: {
    type: String,
    enum: ['in-person', 'video', 'phone'],
    default: 'in-person',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
  },
  
  // Video call details (if applicable)
  meetingUrl: {
    type: String,
  },
  meetingId: {
    type: String,
  },
  
  // Notes
  notes: {
    type: String,
    trim: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
