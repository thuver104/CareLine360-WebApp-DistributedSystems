const express = require('express');
const router = express.Router();
const {
    createEmergency,
    getAllEmergencies,
    getEmergencyById,
    updateStatus,
    getNearestHospital,
} = require('../controllers/emergency.controller');
const { validateEmergency, validateStatusUpdate } = require('../validators/emergency.validator');

router.post('/', validateEmergency, createEmergency);
router.get('/', getAllEmergencies);
router.get('/:id', getEmergencyById);
router.patch('/:id/status', validateStatusUpdate, updateStatus);
router.get('/:id/nearest-hospital', getNearestHospital);

module.exports = router;
