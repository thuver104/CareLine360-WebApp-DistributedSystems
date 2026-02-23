const EmergencyCase = require('../models/EmergencyCase');
const hospitals = require('../utils/hospitals');
const { calculateDistance } = require('../utils/distance');
const mongoose = require('mongoose');

class EmergencyService {
    async createEmergency(data) {
        return await EmergencyCase.create(data);
    }

    async getAllEmergencies() {
        return await EmergencyCase.aggregate([
            {
                $lookup: {
                    from: 'patients',
                    let: { patientId: '$patient' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ['$_id', '$$patientId'] },
                                        { $eq: ['$userId', '$$patientId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'patientDetail'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'patient',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            {
                $addFields: {
                    resolvedPatientProfile: { $arrayElemAt: ['$patientDetail', 0] },
                    resolvedUser: { $arrayElemAt: ['$userDetail', 0] }
                }
            },
            {
                $addFields: {
                    patient: {
                        _id: '$patient',
                        fullName: {
                            $ifNull: [
                                '$resolvedPatientProfile.fullName',
                                { $ifNull: ['$resolvedUser.fullName', 'Anonymous Patient'] }
                            ]
                        },
                        email: '$resolvedUser.email',
                        phone: { $ifNull: ['$resolvedPatientProfile.phone', '$resolvedUser.phone'] }
                    }
                }
            },
            {
                $project: {
                    patientDetail: 0,
                    userDetail: 0,
                    resolvedPatientProfile: 0,
                    resolvedUser: 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
    }

    async getEmergencyById(id) {
        const emergencies = await EmergencyCase.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'patients',
                    let: { patientId: '$patient' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ['$_id', '$$patientId'] },
                                        { $eq: ['$userId', '$$patientId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'patientDetail'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'patient',
                    foreignField: '_id',
                    as: 'userDetail'
                }
            },
            {
                $addFields: {
                    resolvedPatientProfile: { $arrayElemAt: ['$patientDetail', 0] },
                    resolvedUser: { $arrayElemAt: ['$userDetail', 0] }
                }
            },
            {
                $addFields: {
                    patient: {
                        _id: '$patient',
                        fullName: {
                            $ifNull: [
                                '$resolvedPatientProfile.fullName',
                                { $ifNull: ['$resolvedUser.fullName', 'Anonymous Patient'] }
                            ]
                        },
                        email: '$resolvedUser.email',
                        phone: { $ifNull: ['$resolvedPatientProfile.phone', '$resolvedUser.phone'] }
                    }
                }
            },
            {
                $project: {
                    patientDetail: 0,
                    userDetail: 0,
                    resolvedPatientProfile: 0,
                    resolvedUser: 0
                }
            }
        ]);
        return emergencies.length > 0 ? emergencies[0] : null;
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

        // Try to get hospitals from DB first
        const Hospital = require('../models/Hospital');
        let hospitalList = await Hospital.find({ isActive: true });

        // If no hospitals in DB, fallback to static list
        if (hospitalList.length === 0) {
            hospitalList = hospitals;
        }

        hospitalList.forEach((hospital) => {
            const dist = calculateDistance(latitude, longitude, hospital.lat, hospital.lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = {
                    name: hospital.name,
                    lat: hospital.lat,
                    lng: hospital.lng,
                    address: hospital.address,
                    contact: hospital.contact,
                    distance: parseFloat(dist.toFixed(2))
                };
            }
        });

        return nearest;
    }
}

module.exports = new EmergencyService();
