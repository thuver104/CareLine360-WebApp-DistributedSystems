const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Upload a base64 data-URI image to Cloudinary.
 *
 * @param {string} base64String  - Full data URI, e.g. "data:image/jpeg;base64,..."
 * @param {object} options
 * @param {string} options.folder          - Cloudinary folder path
 * @param {number} [options.maxSizeMB=2]   - Max allowed file size in MB
 * @param {Array}  [options.transformation] - Cloudinary transformation array
 * @returns {{ url: string, publicId: string }}
 */
const uploadBase64Image = (base64String, options = {}) => {
  return new Promise((resolve, reject) => {
    const { folder = "careline360", maxSizeMB = 2, transformation = [] } = options;

    // Validate it is a proper data URI
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return reject(new Error("Invalid base64 image format"));

    const mimeType = matches[1];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(mimeType)) {
      return reject(new Error("Only image files allowed (jpeg, png, webp, gif)"));
    }

    // Check size (base64 string length * 0.75 ≈ bytes)
    const sizeBytes = (matches[2].length * 3) / 4;
    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return reject(new Error(`Image too large. Max size is ${maxSizeMB}MB`));
    }

    const buffer = Buffer.from(matches[2], "base64");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation,
      },
      (error, result) => {
        if (error) return reject(new Error(error.message || "Cloudinary upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary by its public_id.
 *
 * @param {string} publicId     - The Cloudinary public_id of the asset
 * @param {string} resourceType - "image" | "video" | "raw" (default: "image")
 * @returns {object} Cloudinary deletion result
 */
const deleteCloudinaryFile = async (publicId, resourceType = "image") => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
    return null; // Non-fatal — don't crash the request if cleanup fails
  }
};

module.exports = { uploadBase64Image, deleteCloudinaryFile };
