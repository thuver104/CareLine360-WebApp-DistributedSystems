const Document = require("../models/Document");
const Patient = require("../models/Patient");
const cloudinary = require("../config/cloudinary");

// ✅ always open the secure_url we saved
const buildViewUrl = (doc) => doc.fileUrl;

const uploadMyDocument = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ✅ DEBUG (keep for now)
    console.log("UPLOAD req.file:", req.file);

    if (!req.file?.path) {
      return res.status(400).json({ message: "No document uploaded (req.file.path missing)" });
    }

    const { title = "", category = "other" } = req.body;

    const patient = await Patient.findOne({
      userId,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

    // ✅ take actual Cloudinary values if present (multer-storage-cloudinary usually provides them)
    const publicId = req.file.filename || req.file.public_id || "";
    const fileUrl = req.file.path || req.file.secure_url || "";
    const resourceType = req.file.resource_type || "auto";
    const format = req.file.format || "";
    const version = req.file.version || 0;

    if (!publicId || !fileUrl) {
      return res.status(500).json({
        message: "Cloudinary upload did not return publicId/fileUrl. Check multer-storage-cloudinary.",
      });
    }

    const doc = await Document.create({
      userId,
      patientId: patient?._id || null,

      title,
      category,

      fileName: req.file.originalname || "",
      fileUrl,
      publicId,
      mimeType: req.file.mimetype || "",
      fileSize: req.file.size || 0,

      resourceType,
      format,
      version,
    });

    return res.status(201).json({
      message: "Document uploaded",
      document: { ...doc.toObject(), viewUrl: buildViewUrl(doc) },
    });
  } catch (e) {
    console.error("UPLOAD DOC ERROR:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

const listMyDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const docs = await Document.find({ userId, isDeleted: false }).sort({ createdAt: -1 });

    return res.json({
      documents: docs.map((d) => ({
        ...d.toObject(),
        viewUrl: buildViewUrl(d),
      })),
    });
  } catch (e) {
    console.error("LIST DOC ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteMyDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const doc = await Document.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Document not found" });

    return res.json({ message: "Document deleted (hidden)" });
  } catch (e) {
    console.error("DELETE DOC ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteMyDocumentPermanent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // ✅ allow permanent delete even if already hidden
    const doc = await Document.findOne({ _id: id, userId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const rtype =
      doc.resourceType === "image" ? "image" :
      doc.resourceType === "video" ? "video" :
      "raw";

    const result = await cloudinary.uploader.destroy(doc.publicId, { resource_type: rtype });
    console.log("Cloudinary destroy result:", result);

    // mark deleted in DB
    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();

    return res.json({ message: "Document deleted permanently" });
  } catch (e) {
    console.error("PERMANENT DELETE ERROR:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

module.exports = {
  uploadMyDocument,
  listMyDocuments,
  deleteMyDocument,
  deleteMyDocumentPermanent,
};
