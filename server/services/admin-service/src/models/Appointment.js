const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    consultationType: { type: String },
    date: { type: Date },
    time: { type: String },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
