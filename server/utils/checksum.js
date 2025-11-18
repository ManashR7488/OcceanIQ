import crypto from "crypto";

/**
 * Calculate MD5 checksum for a buffer (required by Fishial.AI API)
 * @param {Buffer} buffer - Image buffer
 * @returns {String} Base64-encoded MD5 digest
 */
export const calculateMD5Checksum = (buffer) => {
  const hash = crypto.createHash("md5");
  hash.update(buffer);
  return hash.digest("base64");
};

/**
 * Calculate file size in bytes
 * @param {Buffer} buffer - File buffer
 * @returns {Number} Size in bytes
 */
export const calculateFileSizeInBytes = (buffer) => {
  return buffer.length;
};

/**
 * Get image metadata including checksum and MIME type
 * @param {Buffer} buffer - Image buffer
 * @param {String} filename - Original filename
 * @returns {Object} Metadata object with filename, contentType, byteSize, checksum
 */
export const getImageMetadata = (buffer, filename) => {
  // Extract file extension
  const extension = filename.split(".").pop().toLowerCase();
  
  // Map extension to MIME type
  const mimeTypeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  
  const contentType = mimeTypeMap[extension] || "image/jpeg";
  
  // Calculate checksum and size
  const checksum = calculateMD5Checksum(buffer);
  const byteSize = calculateFileSizeInBytes(buffer);
  
  return {
    filename,
    contentType,
    byteSize,
    checksum,
  };
};
