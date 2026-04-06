/**
 * Document Service
 * Business logic for patient document management
 */

const PatientDocument = require('../models/PatientDocument');
const Patient = require('../models/Patient');
const cloudinary = require('../config/cloudinary');
const { publishPatientEvent } = require('../publishers/patientPublisher');

/**
 * Upload document for patient
 */
const uploadDocument = async (patientId, userId, fileData, metadata) => {
  const {
    fileUrl,
    publicId,
    fileName,
    fileSize,
    mimeType,
    format
  } = fileData;

  const {
    title,
    description,
    documentType,
    documentDate,
    tags
  } = metadata;

  const document = await PatientDocument.create({
    patientId,
    userId,
    title: title || fileName,
    description,
    documentType: documentType || 'other',
    fileUrl,
    publicId,
    fileName,
    fileSize,
    mimeType,
    format,
    documentDate: documentDate || new Date(),
    tags: tags || []
  });

  // Update patient document count
  const docsCount = await PatientDocument.countForPatient(patientId);
  await Patient.findOneAndUpdate(
    { patientId },
    { $set: { documentsCount: docsCount } }
  );

  // Publish event
  await publishPatientEvent('patient.document.uploaded', {
    patientId,
    documentId: document._id.toString(),
    documentType: document.documentType,
    fileName: document.fileName
  });

  return document;
};

/**
 * Get all documents for a patient
 */
const getPatientDocuments = async (patientId, options = {}) => {
  const {
    documentType,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const filter = {
    patientId,
    isDeleted: false
  };

  if (documentType) {
    filter.documentType = documentType;
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [documents, total] = await Promise.all([
    PatientDocument.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    PatientDocument.countDocuments(filter)
  ]);

  return {
    documents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single document by ID
 */
const getDocumentById = async (documentId, patientId) => {
  return PatientDocument.findOne({
    _id: documentId,
    patientId,
    isDeleted: false
  });
};

/**
 * Update document metadata
 */
const updateDocument = async (documentId, patientId, updateData) => {
  const { title, description, documentType, documentDate, tags } = updateData;

  const update = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (documentType !== undefined) update.documentType = documentType;
  if (documentDate !== undefined) update.documentDate = documentDate;
  if (tags !== undefined) update.tags = tags;

  return PatientDocument.findOneAndUpdate(
    {
      _id: documentId,
      patientId,
      isDeleted: false
    },
    { $set: update },
    { new: true }
  );
};

/**
 * Delete document (soft delete + Cloudinary cleanup)
 */
const deleteDocument = async (documentId, patientId) => {
  const document = await PatientDocument.findOne({
    _id: documentId,
    patientId,
    isDeleted: false
  });

  if (!document) {
    return null;
  }

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(document.publicId);
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
    // Continue with soft delete even if Cloudinary fails
  }

  // Soft delete
  document.isDeleted = true;
  await document.save();

  // Update patient document count
  const docsCount = await PatientDocument.countForPatient(patientId);
  await Patient.findOneAndUpdate(
    { patientId },
    { $set: { documentsCount: docsCount } }
  );

  // Publish event
  await publishPatientEvent('patient.document.deleted', {
    patientId,
    documentId: document._id.toString()
  });

  return document;
};

/**
 * Share document with doctor
 */
const shareWithDoctor = async (documentId, patientId, doctorId) => {
  const document = await PatientDocument.findOneAndUpdate(
    {
      _id: documentId,
      patientId,
      isDeleted: false
    },
    {
      $set: { isSharedWithDoctor: true },
      $addToSet: { sharedWithDoctors: doctorId }
    },
    { new: true }
  );

  if (document) {
    await publishPatientEvent('patient.document.shared', {
      patientId,
      documentId: document._id.toString(),
      doctorId
    });
  }

  return document;
};

/**
 * Get documents shared with a specific doctor
 */
const getSharedDocuments = async (doctorId, patientId) => {
  return PatientDocument.find({
    patientId,
    sharedWithDoctors: doctorId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};

module.exports = {
  uploadDocument,
  getPatientDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareWithDoctor,
  getSharedDocuments
};
