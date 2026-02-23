const express = require('express');
const router = express.Router();
const {
    getAllHospitals,
    createHospital,
    deleteHospital
} = require('../controllers/hospitalController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Public or Protected? 
// Admin only for management, but maybe public/patient for viewing
router.get('/', getAllHospitals);

// Only admins can add/delete
router.post('/', authMiddleware, roleMiddleware(['admin']), createHospital);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteHospital);

module.exports = router;
