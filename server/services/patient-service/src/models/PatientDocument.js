/**
 * PatientDocument Model
 * Stores uploaded documents (lab reports, prescriptions, medical images)
 */

const mongoose = require('mongoose');

const patientDocumentSchema = new mongoose.Schema(
  {
    // Patient reference
    patientId: {
      type: String,
      required: true,
      index: true
    },
    
    // User who owns this document
    userId: {
      type: String,
      required: true,
      index: true
    },

    // Document Info
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    
    // Document Type
    documentType: {
      type: String,
      enum: [
        'lab_report',
        'prescription',
        'medical_image',
        'discharge_summary',
        'insurance',
        'identification',
        'vaccination',
        'allergy_report',
        'other'
      ],
      default: 'other'
    },

    // File Info (Cloudinary)
    fileUrl: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number, // bytes
      default: 0
    },
    mimeType: {
      type: String,
      required: true
    },
    format: {
      type: String // pdf, jpg, png, etc.
    },

    // Document Date (when the document was issued)
    documentDate: {
      type: Date,
      default: Date.now
    },

    // Associated records
    medicalRecordId: {
      type: String,
      default: null
    },
    appointmentId: {
      type: String,
      default: null
    },

    // Metadata
    tags: [{
      type: String,
      trim: true
    }],
    
    // Access control
    isSharedWithDoctor: {
      type: Boolean,
      default: false
    },
    sharedWithDoctors: [{
      type: String // Doctor IDs
    }],

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
patientDocumentSchema.index({ patientId: 1, documentType: 1 });
patientDocumentSchema.index({ patientId: 1, createdAt: -1 });
patientDocumentSchema.index({ isDeleted: 1, patientId: 1 });
patientDocumentSchema.index({ title: 'text', description: 'text' });

// Static to count documents for profile strength
patientDocumentSchema.statics.countForPatient = function(patientId) {
  return this.countDocuments({ patientId, isDeleted: false });
};

// Static to get documents by type
patientDocumentSchema.statics.getByType = function(patientId, documentType) {
  return this.find({ 
    patientId, 
    documentType, 
    isDeleted: false 
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('PatientDocument', patientDocumentSchema);
