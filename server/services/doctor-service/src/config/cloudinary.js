const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

/**
 * Initialize Cloudinary configuration
 */
const initCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  logger.info('Cloudinary configured', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  });
};

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64String - Base64 encoded image with data URI prefix
 * @param {Object} options - Upload options
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadBase64Image = async (base64String, options = {}) => {
  const {
    folder = 'careline360/doctors',
    maxSizeMB = 2,
    transformation = [{ width: 512, height: 512, crop: 'fill', quality: 'auto' }],
  } = options;

  // Validate base64 format
  const regex = /^data:(.+);base64,(.+)$/;
  const match = base64String.match(regex);

  if (!match) {
    throw new Error('Invalid base64 image format');
  }

  const mimeType = match[1];
  const base64Data = match[2];

  // Validate MIME type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error(`Invalid image type: ${mimeType}. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Check file size
  const fileSizeBytes = Buffer.from(base64Data, 'base64').length;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  if (fileSizeMB > maxSizeMB) {
    throw new Error(`File size ${fileSizeMB.toFixed(2)}MB exceeds limit of ${maxSizeMB}MB`);
  }

  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      transformation,
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error('Cloudinary upload failed:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>}
 */
const deleteCloudinaryFile = async (publicId) => {
  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    logger.error('Cloudinary delete failed:', error);
    return false;
  }
};

module.exports = {
  initCloudinary,
  uploadBase64Image,
  deleteCloudinaryFile,
};
