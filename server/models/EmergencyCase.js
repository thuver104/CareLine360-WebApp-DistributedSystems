const mongoose = require('mongoose');

const emergencyCaseSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'DISPATCHED', 'ARRIVED', 'RESOLVED'],
            default: 'PENDING',
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        responderName: {
            type: String,
        },
        triggeredAt: {
            type: Date,
            default: Date.now,
        },
        resolvedAt: {
            type: Date,
        },
        responseTime: {
            type: Number, // in minutes
        },
    },
    {
        timestamps: true,
    }
);

const EmergencyCase = mongoose.model('EmergencyCase', emergencyCaseSchema);
module.exports = EmergencyCase;
