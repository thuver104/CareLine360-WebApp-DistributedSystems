const EmergencyCase = require('../models/EmergencyCase');
const hospitals = require('../utils/hospitals');
const { calculateDistance } = require('../utils/distance');

class EmergencyService {
    async createEmergency(data) {
        return await EmergencyCase.create(data);
    }

    async getAllEmergencies() {
        return await EmergencyCase.find().populate('patient', 'name phone email').sort({ createdAt: -1 });
    }

    async getEmergencyById(id) {
        return await EmergencyCase.findById(id).populate('patient', 'name phone email');
    }

    async updateStatus(id, { status, responderName }) {
        const emergency = await EmergencyCase.findById(id);
        if (!emergency) throw new Error('Emergency case not found');

        const updateData = { status };
        if (responderName) updateData.responderName = responderName;

        if (status === 'RESOLVED') {
            const resolvedAt = new Date();
            const diffMs = resolvedAt - emergency.triggeredAt;
            updateData.resolvedAt = resolvedAt;
            updateData.responseTime = Math.round(diffMs / 1000 / 60);
        }

        return await EmergencyCase.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: false }
        );
    }

    async getNearestHospital(id) {
        const emergency = await EmergencyCase.findById(id);
        if (!emergency) throw new Error('Emergency case not found');

        const { latitude, longitude } = emergency;
        let nearest = null;
        let minDistance = Infinity;

        hospitals.forEach((hospital) => {
            const dist = calculateDistance(latitude, longitude, hospital.lat, hospital.lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = { ...hospital, distance: parseFloat(dist.toFixed(2)) };
            }
        });

        return nearest;
    }
}

module.exports = new EmergencyService();
