const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    contact: { type: String, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Hospital || mongoose.model("Hospital", hospitalSchema);
