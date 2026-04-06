const mongoose = require('mongoose');

/**
 * Rating schema for doctor reviews
 * Note: patientId stored as String for database isolation
 */
const ratingSchema = new mongoose.Schema({
  // Reference to Doctor
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  
  // Reference to Patient (String for cross-service isolation)
  patientId: {
    type: String,
    required: true,
  },
  
  // Reference to Appointment (String for cross-service isolation)
  appointmentId: {
    type: String,
    required: true,
    unique: true, // Only one rating per appointment
  },
  
  // Rating details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    trim: true,
    default: '',
  },
  
  // Patient info (denormalized for display without cross-service call)
  patientName: {
    type: String,
    trim: true,
  },
  patientAvatar: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
ratingSchema.index({ doctorId: 1 });
ratingSchema.index({ patientId: 1 });
ratingSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
