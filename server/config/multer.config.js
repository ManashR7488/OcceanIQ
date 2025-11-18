import multer from "multer";

// Use memory storage for processing before Cloudinary upload
const storage = multer.memoryStorage();

// File filter for images - accept only image files
const imageFileFilter = (req, file, cb) => {
  // Allowed image MIME types
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
  ];

  // Allowed file extensions
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".tiff", ".tif"];

  // Check MIME type
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Check file extension as fallback
    const fileExt = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));

    if (allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Only ${allowedExtensions.join(", ")} files are allowed.`
        ),
        false
      );
    }
  }
};

// File filter for sequence files - accept FASTA, CSV, TXT
const sequenceFileFilter = (req, file, cb) => {
  // Allowed sequence file MIME types
  const allowedMimeTypes = [
    "text/plain",
    "text/csv",
    "application/octet-stream",
  ];

  // Allowed file extensions
  const allowedExtensions = [".fasta", ".fa", ".fna", ".txt", ".csv"];

  // Check MIME type or extension
  const fileExt = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf("."));

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only sequence files (${allowedExtensions.join(", ")}) are allowed.`
      ),
      false
    );
  }
};

// File filter for data files - accept CSV, JSON, TXT
const dataFileFilter = (req, file, cb) => {
  // Allowed data file MIME types
  const allowedMimeTypes = [
    "text/csv",
    "application/csv",
    "application/json",
    "text/plain",
  ];

  // Allowed file extensions
  const allowedExtensions = [".csv", ".json", ".txt"];

  // Check MIME type or extension
  const fileExt = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf("."));

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only data files (${allowedExtensions.join(", ")}) are allowed.`
      ),
      false
    );
  }
};

// Configure multer for otolith images
const uploadOtolithMemory = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1, // Only 1 file at a time
  },
});

// Configure multer for eDNA sequence files
export const uploadSequenceMemory = multer({
  storage: storage,
  fileFilter: sequenceFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1, // Only 1 file at a time
  },
});

// Configure multer for data ingestion (CSV/JSON files)
export const uploadDataMemory = multer({
  storage: storage,
  fileFilter: dataFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size for bulk data
    files: 1, // Only 1 file at a time
  },
});

// Multer error handler middleware
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    const limitMB = req.multerLimitMB || 10; // Default to 10MB if not set
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          error: "File size exceeds limit",
          message: `File size must be less than ${limitMB}MB`,
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          error: "Unexpected file field",
          message: "Only one file is allowed",
        });
      default:
        return res.status(400).json({
          error: "File upload error",
          message: err.message,
        });
    }
  } else if (err) {
    // Handle custom file filter errors
    return res.status(400).json({
      error: "Invalid file",
      message: err.message || "An error occurred during file upload",
    });
  }

  // No error, proceed to next middleware
  next();
};

export default uploadOtolithMemory;
