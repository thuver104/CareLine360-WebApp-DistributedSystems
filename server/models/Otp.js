const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    purpose: { type: String, enum: ["EMAIL_VERIFY", "PASSWORD_RESET"], required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attemptsLeft: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// auto delete old OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
