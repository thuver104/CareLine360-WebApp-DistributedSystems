const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        doctorId: { type: String, required: true, unique: true },
        fullName: { type: String, required: true, trim: true },
        avatarUrl: { type: String, default: "" },
        specialization: { type: String, default: "" },
        qualifications: [String],
        experience: { type: Number, default: 0 },
        bio: { type: String, default: "" },
        licenseNumber: { type: String, default: "" },
        licenseDocUrl: { type: String, default: "" },
        phone: { type: String, default: "" },
        consultationFee: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        totalRatings: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false },
        availabilitySlots: [
            {
                day: String,
                startTime: String,
                endTime: String,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
