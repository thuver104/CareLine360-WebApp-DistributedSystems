const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    patientId: { type: String, required: true, unique: true }, // PAT-000001
    fullName: { type: String, required: true, trim: true },

    // optional fields (fill later)
    dob: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    address: {
      district: String,
      city: String,
      line1: String,
    },
    nic: String,

    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },

    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String],
    heightCm: Number,
    weightKg: Number,

    profileStrength: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
