const User = require('../models/User');
const EmergencyCase = require('../models/EmergencyCase');

class AdminService {
    async getAllUsers() {
        return await User.find().sort({ createdAt: -1 });
    }

    async toggleUserStatus(id) {
        const user = await User.findById(id);
        if (!user) throw new Error('User not found');

        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        return await User.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true, runValidators: false }
        );
    }

    async getStats() {
        const totalUsers = await User.countDocuments();
        const totalPatients = await User.countDocuments({ role: 'patient' });
        const totalDoctors = await User.countDocuments({ role: 'doctor' });
        const totalResponders = await User.countDocuments({ role: 'responder' });

        const totalEmergencies = await EmergencyCase.countDocuments();
        const resolvedEmergencies = await EmergencyCase.countDocuments({ status: 'RESOLVED' });

        const avgResponseTimeResult = await EmergencyCase.aggregate([
            { $match: { status: 'RESOLVED', responseTime: { $exists: true } } },
            { $group: { _id: null, avgTime: { $avg: '$responseTime' } } },
        ]);

        const avgResponseTime = avgResponseTimeResult.length > 0 ? Math.round(avgResponseTimeResult[0].avgTime) : 0;

        const statusBreakdown = await EmergencyCase.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const emergencyStatusBreakdown = {
            PENDING: 0,
            DISPATCHED: 0,
            ARRIVED: 0,
            RESOLVED: 0,
        };

        statusBreakdown.forEach((item) => {
            if (emergencyStatusBreakdown.hasOwnProperty(item._id)) {
                emergencyStatusBreakdown[item._id] = item.count;
            }
        });

        return {
            totalUsers,
            totalPatients,
            totalDoctors,
            totalResponders,
            totalEmergencies,
            resolvedEmergencies,
            avgResponseTime,
            emergencyStatusBreakdown,
        };
    }
}

module.exports = new AdminService();
