const mongoose = require('mongoose');

/**
 * Availability slot sub-schema
 */
const availabilitySlotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  startTime: { type: String, required: true }, // "HH:MM"
  endTime: { type: String, required: true }, // "HH:MM"
  isBooked: { type: Boolean, default: false },
  appointmentId: { type: String, default: null }, // String reference (cross-service)
}, { _id: true });

/**
 * Doctor schema
 * Note: userId is stored as String (not ObjectId) for database isolation
 */
const doctorSchema = new mongoose.Schema({
  // Reference to User in auth-service (stored as String for isolation)
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Auto-generated ID: "DOC-000001", "DOC-000002", etc.
  doctorId: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Basic Profile
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  avatarPublicId: {
    type: String,
    default: '',
  },
  
  // Professional Info
  specialization: {
    type: String,
    trim: true,
  },
  qualifications: [{
    type: String,
    trim: true,
  }],
  experience: {
    type: Number,
    default: 0,
  },
  bio: {
    type: String,
    trim: true,
    default: '',
  },
  
  // Licensing & Verification
  licenseNumber: {
    type: String,
    trim: true,
  },
  licenseDocUrl: {
    type: String,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  
  // Contact & Fees
  consultationFee: {
    type: Number,
    default: 0,
  },
  
  // Ratings (denormalized for query efficiency)
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  
  // Availability Management
  availabilitySlots: [availabilitySlotSchema],
  
  // Profile Strength (0-100)
  profileStrength: {
    type: Number,
    default: 0,
  },
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'],
    default: 'PENDING',
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
doctorSchema.index({ userId: 1 });
doctorSchema.index({ doctorId: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ status: 1 });
doctorSchema.index({ isDeleted: 1 });
doctorSchema.index({ rating: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
