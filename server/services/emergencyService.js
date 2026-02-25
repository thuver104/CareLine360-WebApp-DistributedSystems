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
        const emergency = await EmergencyCase.findById(id).populate('patient', 'fullName email phone');
        if (!emergency) throw new Error('Emergency case not found');

        const updateData = { status };
        if (responderName) updateData.responderName = responderName;

        if (status === 'RESOLVED') {
            const resolvedAt = new Date();
            const diffMs = resolvedAt - emergency.triggeredAt;
            updateData.resolvedAt = resolvedAt;
            updateData.responseTime = Math.round(diffMs / 1000 / 60);
        }

        const updatedEmergency = await EmergencyCase.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: false }
        ).populate('patient', 'fullName email phone');

        // Send email notification to patient about status change
        if (updatedEmergency.patient?.email) {
            try {
                const statusMessages = {
                    'PENDING': {
                        title: '🚨 Emergency Alert Received',
                        message: 'Your emergency request has been received and is being processed.',
                        color: '#ffc107',
                        icon: '⏳'
                    },
                    'DISPATCHED': {
                        title: '🚑 Help is On The Way!',
                        message: 'Emergency responders have been dispatched to your location.',
                        color: '#17a2b8',
                        icon: '🚑'
                    },
                    'ARRIVED': {
                        title: '🏥 Help Has Arrived',
                        message: 'Emergency responders have arrived at your location.',
                        color: '#28a745',
                        icon: '✅'
                    },
                    'RESOLVED': {
                        title: '✅ Emergency Case Resolved',
                        message: 'Your emergency case has been successfully resolved.',
                        color: '#28a745',
                        icon: '🎉'
                    }
                };

                const statusInfo = statusMessages[status] || {
                    title: 'Emergency Status Updated',
                    message: `Your emergency status has been updated to: ${status}`,
                    color: '#6c757d',
                    icon: '📝'
                };

                const emergencyDate = new Date(updatedEmergency.triggeredAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const emergencyEmailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #dc3545; margin: 0;">🏥 CareLine360 Emergency</h1>
                                <h2 style="color: ${statusInfo.color}; margin: 10px 0;">${statusInfo.icon} ${statusInfo.title}</h2>
                            </div>
                            
                            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${updatedEmergency.patient?.fullName || 'Patient'},</p>
                            
                            <div style="background-color: ${status === 'RESOLVED' ? '#d4edda' : status === 'ARRIVED' ? '#d1ecf1' : status === 'DISPATCHED' ? '#cce5ff' : '#fff3cd'}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <h3 style="color: ${statusInfo.color === '#ffc107' ? '#856404' : statusInfo.color}; margin-top: 0;">${statusInfo.icon} Status Update</h3>
                                <p style="font-size: 16px; color: ${statusInfo.color === '#ffc107' ? '#856404' : statusInfo.color}; line-height: 1.6; margin: 0; font-weight: bold;">${statusInfo.message}</p>
                            </div>
                            
                            <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="color: #2c5aa0; margin-top: 0;">📋 Emergency Details</h3>
                                <p style="margin: 5px 0;"><strong>Emergency ID:</strong> ${updatedEmergency._id}</p>
                                <p style="margin: 5px 0;"><strong>Triggered At:</strong> ${emergencyDate}</p>
                                <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="background-color: ${statusInfo.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${status}</span></p>
                                ${updatedEmergency.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${updatedEmergency.description}</p>` : ''}
                                ${responderName ? `<p style="margin: 5px 0;"><strong>Responder:</strong> ${responderName}</p>` : ''}
                                ${updatedEmergency.responseTime ? `<p style="margin: 5px 0;"><strong>Response Time:</strong> ${updatedEmergency.responseTime} minutes</p>` : ''}
                            </div>
                            
                            ${status === 'DISPATCHED' ? `
                                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Important:</strong> Please stay calm and remain in a safe location. Help is on the way. If this is a life-threatening emergency, call your local emergency number immediately.</p>
                                </div>
                            ` : ''}
                            
                            ${status === 'RESOLVED' ? `
                                <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 14px; color: #155724;"><strong>Thank you</strong> for using CareLine360. We hope you're feeling better. If you need further assistance, please don't hesitate to contact us again.</p>
                                </div>
                            ` : ''}
                            
                            <p style="font-size: 16px; color: #333; margin-top: 20px;">For any questions or if you need immediate assistance, please contact our emergency hotline.</p>
                            
                            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                                <p style="font-size: 14px; color: #6c757d; margin: 0;">Stay safe and take care,<br><strong>CareLine360 Emergency Team</strong></p>
                            </div>
                        </div>
                    </div>
                `;

                await sendEmail({
                    to: updatedEmergency.patient.email,
                    subject: `${statusInfo.icon} Emergency Status Update - ${status}`,
                    html: emergencyEmailHtml
                });

            } catch (emailError) {
                console.error('Failed to send emergency status email:', emailError);
                // Don't fail the main operation if email fails
            }
        }

        return updatedEmergency;
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
