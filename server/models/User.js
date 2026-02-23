const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["patient", "doctor", "responder", "admin"], required: true },
    fullName: { type: String, trim: true },

    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },

    passwordHash: { type: String, required: true },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    refreshTokenHash: { type: String },
    lastLoginAt: { type: Date },

    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "REJECTED", "SUSPENDED"],
      default: "ACTIVE"
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
