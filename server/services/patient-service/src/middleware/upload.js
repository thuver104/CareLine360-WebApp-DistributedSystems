/**
 * File Upload Middleware
 * Handles image and document uploads to Cloudinary
 */

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ===== Image Upload (Avatars) =====
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'careline360/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 512, height: 512, crop: 'fill' },
      { quality: 'auto' }
    ]
  })
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// ===== Document Upload (PDFs, Images) =====
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';

    return {
      folder: 'careline360/documents',
      resource_type: isImage ? 'image' : 'raw',
      allowed_formats: isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      // Only transform images, not PDFs
      ...(isImage && {
        transformation: [
          { quality: 'auto:good' },
          { flags: 'preserve_transparency' }
        ]
      })
    };
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only images and PDFs are allowed'));
    }
    cb(null, true);
  }
});

// ===== Medical Record Attachment Upload =====
const attachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'careline360/medical-attachments',
    resource_type: 'auto'
  })
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/dicom' // Medical imaging
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

module.exports = {
  imageUpload,
  documentUpload,
  attachmentUpload
};
