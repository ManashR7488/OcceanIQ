import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file"
    );
  }
};

// Validate on module load
try {
  validateCloudinaryConfig();
  console.log("✅ Cloudinary configuration validated successfully");
} catch (error) {
  console.error("❌ Cloudinary configuration error:", error.message);
}

// Constants
const CLOUDINARY_FOLDER_OTOLITHS = "occeaniq/otoliths";
const CLOUDINARY_FOLDER_COMMUNITY = "occeaniq/community";

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer memory storage
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with secure_url, public_id, etc.
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || CLOUDINARY_FOLDER_OTOLITHS,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" }, // Automatic optimization
        ],
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw error;
  }
};

/**
 * Generate thumbnail URL with transformations
 * @param {String} publicId - Cloudinary public ID
 * @param {Number} width - Thumbnail width (default 200)
 * @param {Number} height - Thumbnail height (default 200)
 * @returns {String} Transformed image URL
 */
const generateThumbnailUrl = (publicId, width = 200, height = 200) => {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width,
        height,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
};

/**
 * Generate multiple transformation URLs for different sizes
 * @param {String} publicId - Cloudinary public ID
 * @returns {Object} Object with thumbnail, medium, large, and original URLs
 */
const generateTransformationUrls = (publicId) => {
  return {
    thumbnail: cloudinary.url(publicId, {
      transformation: [
        {
          width: 200,
          height: 200,
          crop: "fill",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    }),
    medium: cloudinary.url(publicId, {
      transformation: [
        {
          width: 800,
          height: 800,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    }),
    large: cloudinary.url(publicId, {
      transformation: [
        {
          width: 1600,
          height: 1600,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    }),
    original: cloudinary.url(publicId, {
      transformation: [],
    }),
  };
};

export default cloudinary;

export {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateThumbnailUrl,
  generateTransformationUrls,
  CLOUDINARY_FOLDER_OTOLITHS,
  CLOUDINARY_FOLDER_COMMUNITY,
};
