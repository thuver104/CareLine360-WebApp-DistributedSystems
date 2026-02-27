const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// One rating per appointment
ratingSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);