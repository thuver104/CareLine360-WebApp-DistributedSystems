const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const docStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "careline360/documents",
    resource_type: "auto",
    public_id: undefined,
  }),
});

const allowed = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const documentUpload = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(new Error("Only PDF, images, DOC, DOCX allowed"));
    }
    cb(null, true);
  },
});

module.exports = { documentUpload };
