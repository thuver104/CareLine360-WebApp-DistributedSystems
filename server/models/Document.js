const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null },

    title: { type: String, trim: true, default: "" },
    category: {
      type: String,
      enum: ["lab_report", "prescription", "scan", "discharge", "other"],
      default: "other",
    },

    fileName: { type: String, default: "" },
    fileUrl: { type: String, required: true }, // secure_url
    publicId: { type: String, required: true }, // public_id (with folder)
    mimeType: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },

    // ✅ store what Cloudinary actually used (don’t guess)
    resourceType: { type: String, enum: ["raw", "image", "video", "auto"], default: "auto" },
    format: { type: String, default: "" },
    version: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
