/**
 * Document Routes
 * API endpoints for document upload and management
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { documentUpload } = require('../middleware/upload');
const { validateUpdateDocument } = require('../validators/documentValidator');
const {
  uploadDocument,
  getMyDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument
} = require('../controllers/documentController');

// All routes require patient role
router.use(authMiddleware);
router.use(roleMiddleware(['patient']));

// POST /api/v1/patient/documents - Upload document
router.post(
  '/',
  documentUpload.single('file'),
  uploadDocument
);

// GET /api/v1/patient/documents - Get all my documents
router.get('/', getMyDocuments);

// GET /api/v1/patient/documents/:id - Get single document
router.get('/:id', getDocument);

// PATCH /api/v1/patient/documents/:id - Update document metadata
router.patch(
  '/:id',
  validateUpdateDocument,
  updateDocument
);

// DELETE /api/v1/patient/documents/:id - Delete document
router.delete('/:id', deleteDocument);

// POST /api/v1/patient/documents/:id/share - Share with doctor
router.post('/:id/share', shareDocument);

module.exports = router;
