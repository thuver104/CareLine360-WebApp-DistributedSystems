const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    patientId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },

    avatarUrl: { type: String, default: "" },

    dob: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    address: {
      district: { type: String, default: "" },
      city: { type: String, default: "" },
      line1: { type: String, default: "" },
    },
    nic: String,

    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relationship: { type: String, default: "" },
    },

    bloodGroup: { type: String, match: /^(A|B|AB|O)[+-]$/i },
    allergies: [String],
    chronicConditions: [String],
    heightCm: { type: Number, min: 30, max: 250 },
    weightKg: { type: Number, min: 2, max: 300 },

    profileStrength: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
