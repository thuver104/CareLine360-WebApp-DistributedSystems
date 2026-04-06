/**
 * Patient Model
 * Stores patient profile information
 * References userId from auth-service (stored as String, not ObjectId)
 */

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    // Reference to auth-service user (stored as String for cross-service compatibility)
    userId: { 
      type: String, 
      required: true, 
      unique: true,
      index: true
    },
    
    // Unique patient identifier (P + timestamp)
    patientId: { 
      type: String, 
      required: true, 
      unique: true,
      index: true
    },
    
    // Basic Info
    fullName: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    avatarUrl: { 
      type: String, 
      default: '' 
    },
    
    // Demographics
    dob: { 
      type: Date 
    },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other', ''],
      default: ''
    },
    nic: { 
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    
    // Address
    address: {
      district: { type: String, default: '', trim: true },
      city: { type: String, default: '', trim: true },
      line1: { type: String, default: '', trim: true },
      postalCode: { type: String, default: '', trim: true }
    },
    
    // Emergency Contact
    emergencyContact: {
      name: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
      relationship: { type: String, default: '', trim: true }
    },
    
    // Medical Info
    bloodGroup: { 
      type: String, 
      match: /^(A|B|AB|O)[+-]$/i 
    },
    allergies: [{ 
      type: String, 
      trim: true 
    }],
    chronicConditions: [{ 
      type: String, 
      trim: true 
    }],
    heightCm: { 
      type: Number, 
      min: 30, 
      max: 250 
    },
    weightKg: { 
      type: Number, 
      min: 2, 
      max: 300 
    },
    
    // Profile Strength (calculated)
    profileStrength: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    
    // Document count (for profile strength calculation)
    documentsCount: {
      type: Number,
      default: 0
    },
    
    // Soft delete
    isDeleted: { 
      type: Boolean, 
      default: false,
      index: true
    },
    
    // Audit fields
    lastLoginAt: Date,
    createdBy: String,
    updatedBy: String
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for common queries
patientSchema.index({ fullName: 'text' });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ isDeleted: 1, createdAt: -1 });

// Virtual for age calculation
patientSchema.virtual('age').get(function() {
  if (!this.dob) return null;
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for BMI calculation
patientSchema.virtual('bmi').get(function() {
  if (!this.heightCm || !this.weightKg) return null;
  const heightM = this.heightCm / 100;
  return Math.round((this.weightKg / (heightM * heightM)) * 10) / 10;
});

// Pre-save hook to generate patientId
patientSchema.pre('save', function(next) {
  if (!this.patientId) {
    this.patientId = 'P' + Date.now();
  }
  next();
});

// Static method to generate patientId
patientSchema.statics.generatePatientId = function() {
  return 'P' + Date.now();
};

// Instance method to check if profile is complete
patientSchema.methods.isProfileComplete = function() {
  return this.profileStrength >= 80;
};

module.exports = mongoose.model('Patient', patientSchema);
