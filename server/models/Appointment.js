const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        consultationType: {
            type: String,
            enum: ["video", "in-person", "phone"],
            default: "in-person",
        },
        symptoms: {
            type: String,
        },
        notes: {
            type: String,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low",
        },
        reminderSent: {
            type: Boolean,
            default: false,
        },
        rescheduleHistory: [
            {
                previousDate: Date,
                previousTime: String,
                rescheduledAt: Date,
            },
        ],
        cancellationReason: {
            type: String,
        },
        meetingUrl: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
