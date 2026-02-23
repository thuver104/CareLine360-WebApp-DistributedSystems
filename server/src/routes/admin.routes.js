const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    toggleUserStatus,
    getStats,
} = require('../controllers/admin.controller');

router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/stats', getStats);

module.exports = router;
