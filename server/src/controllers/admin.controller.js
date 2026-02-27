const adminService = require('../services/admin.service');

const getAllUsers = async (req, res, next) => {
    try {
        const { page, limit, search, role } = req.query;
        const result = await adminService.getAllUsers({ page, limit, search, role });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await adminService.toggleUserStatus(req.params.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

const getStats = async (req, res, next) => {
    try {
        const stats = await adminService.getStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    toggleUserStatus,
    getStats,
};
