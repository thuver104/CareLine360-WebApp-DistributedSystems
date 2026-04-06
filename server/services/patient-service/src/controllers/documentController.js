/**
 * Document Controller
 * HTTP handlers for document upload/management endpoints
 */

const documentService = require('../services/documentService');
const { validationResult } = require('express-validator');

/**
 * POST /api/v1/patient/documents
 * Upload a new document
 */
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.userId;
    const patientId = req.user.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const fileData = {
      fileUrl: req.file.path,
      publicId: req.file.filename,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      format: req.file.format || req.file.originalname.split('.').pop()
    };

    const metadata = {
      title: req.body.title,
      description: req.body.description,
      documentType: req.body.documentType,
      documentDate: req.body.documentDate,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    };

    const document = await documentService.uploadDocument(
      patientId,
      userId,
      fileData,
      metadata
    );

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('uploadDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/documents
 * Get all documents for current patient
 */
const getMyDocuments = async (req, res) => {
  try {
    const patientId = req.user.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const { documentType, page, limit, sortBy, sortOrder } = req.query;

    const result = await documentService.getPatientDocuments(patientId, {
      documentType,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder
    });

    return res.json({
      success: true,
      data: result.documents,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('getMyDocuments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      requestId: req.requestId
    });
  }
};

/**
 * GET /api/v1/patient/documents/:id
 * Get single document by ID
 */
const getDocument = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { id } = req.params;

    const document = await documentService.getDocumentById(id, patientId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    return res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('getDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      requestId: req.requestId
    });
  }
};

/**
 * PATCH /api/v1/patient/documents/:id
 * Update document metadata
 */
const updateDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const patientId = req.user.patientId;
    const { id } = req.params;

    const document = await documentService.updateDocument(id, patientId, req.body);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    return res.json({
      success: true,
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    console.error('updateDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update document',
      requestId: req.requestId
    });
  }
};

/**
 * DELETE /api/v1/patient/documents/:id
 * Delete a document
 */
const deleteDocument = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { id } = req.params;

    const document = await documentService.deleteDocument(id, patientId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    return res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('deleteDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      requestId: req.requestId
    });
  }
};

/**
 * POST /api/v1/patient/documents/:id/share
 * Share document with a doctor
 */
const shareDocument = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const { id } = req.params;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    const document = await documentService.shareWithDoctor(id, patientId, doctorId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    return res.json({
      success: true,
      message: 'Document shared successfully',
      data: document
    });
  } catch (error) {
    console.error('shareDocument error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to share document',
      requestId: req.requestId
    });
  }
};

module.exports = {
  uploadDocument,
  getMyDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument
};
