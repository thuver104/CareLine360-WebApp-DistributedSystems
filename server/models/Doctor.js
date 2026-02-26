const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "09:30"
    isBooked: { type: Boolean, default: false },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
  },
  { _id: true }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    doctorId: { type: String, required: true, unique: true }, // e.g. DOC-000001

    fullName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: "" },

    specialization: { type: String, trim: true, default: "" },
    qualifications: [{ type: String, trim: true }], // ["MBBS", "MD"]
    experience: { type: Number, default: 0 }, // years
    bio: { type: String, trim: true, default: "" },

    licenseNumber: { type: String, trim: true, default: "" },
    licenseDocUrl: { type: String, default: "" }, // uploaded to Cloudinary

    phone: { type: String, trim: true, default: "" },
    consultationFee: { type: Number, default: 0 },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },

    availabilitySlots: [availabilitySlotSchema],

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);