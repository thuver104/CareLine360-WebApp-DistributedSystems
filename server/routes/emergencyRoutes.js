const express = require('express');
const router = express.Router();
const {
    createEmergency,
    getAllEmergencies,
    getEmergencyById,
    updateStatus,
    getNearestHospital,
} = require('../controllers/emergencyController');
const { validateEmergency, validateStatusUpdate } = require('../validators/emergencyValidator');

router.post('/', validateEmergency, createEmergency);
router.get('/', getAllEmergencies);
router.get('/:id', getEmergencyById);
router.patch('/:id/status', validateStatusUpdate, updateStatus);
router.get('/:id/nearest-hospital', getNearestHospital);

module.exports = router;
