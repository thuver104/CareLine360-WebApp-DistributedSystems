const mongoose = require('mongoose');

/**
 * Reschedule history sub-schema
 */
const rescheduleHistorySchema = new mongoose.Schema({
  previousDate: { type: Date, required: true },
  previousTime: { type: String, required: true },
  rescheduledAt: { type: Date, default: Date.now },
  rescheduledBy: { type: String }, // userId of who rescheduled
}, { _id: false });

/**
 * Appointment schema
 * Note: patient and doctor are stored as String IDs (not ObjectId)
 * for database isolation in microservices architecture
 */
const appointmentSchema = new mongoose.Schema({
  // Auto-generated appointment ID: "APT-000001"
  appointmentId: {
    type: String,
    unique: true,
  },
  
  // Patient reference (String for cross-service isolation)
  patientId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Doctor reference (String for cross-service isolation)
  doctorId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Denormalized snapshot fields (for query optimization)
  patientName: {
    type: String,
    trim: true,
  },
  doctorName: {
    type: String,
    trim: true,
  },
  specialization: {
    type: String,
    trim: true,
  },
  
  // Appointment scheduling
  date: {
    type: Date,
    required: true,
    index: true,
  },
  time: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: {
    type: String,
    trim: true,
  },
  
  // Consultation type
  consultationType: {
    type: String,
    enum: ['in-person', 'video', 'phone', 'physical'],
    required: true,
    default: 'in-person',
  },
  
  // Patient info
  symptoms: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  
  // Status lifecycle
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
    index: true,
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'low',
  },
  
  // Reschedule tracking
  rescheduleHistory: [rescheduleHistorySchema],
  rescheduleCount: {
    type: Number,
    default: 0,
  },
  
  // Cancellation
  cancellationReason: {
    type: String,
    trim: true,
  },
  cancelledBy: {
    type: String,
  },
  cancelledAt: {
    type: Date,
  },
  
  // Reminder tracking
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderSentAt: {
    type: Date,
  },
  meetingReminderSent: {
    type: Boolean,
    default: false,
  },
  
  // Video meeting
  meetingUrl: {
    type: String,
  },
  meetingId: {
    type: String,
  },
  
  // Completion
  completedAt: {
    type: Date,
  },
  completionNotes: {
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

// Pre-save hook to generate appointment ID
appointmentSchema.pre('save', async function(next) {
  if (!this.appointmentId) {
    // Generate unique ID
    const Counter = require('./Counter');
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'appointmentId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.appointmentId = `APT-${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

// Generate meeting URL for video appointments
appointmentSchema.methods.generateMeetingUrl = function() {
  if (this.consultationType === 'video' && !this.meetingUrl) {
    const jitsiDomain = process.env.JITSI_DOMAIN || 'meet.jit.si';
    const prefix = process.env.JITSI_PREFIX || 'CareLine360';
    this.meetingUrl = `https://${jitsiDomain}/${prefix}-${this.appointmentId}`;
    this.meetingId = `${prefix}-${this.appointmentId}`;
  }
  return this.meetingUrl;
};

// Indexes for common queries
appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 }); // Double-booking check
appointmentSchema.index({ status: 1, date: 1 }); // Reminder queries
appointmentSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
