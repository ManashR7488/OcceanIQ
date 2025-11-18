import {
  parseCSVBuffer,
  parseJSONBuffer,
  validateAndInsertSpecies,
  validateAndInsertObservations,
  validateAndInsertOceanographicData,
} from "../services/dataIngestion.service.js";

/**
 * Helper to parse uploaded file or request body data
 * @param {Object} req - Express request object
 * @returns {Promise<Array>} Parsed data array
 */
async function parseUpload(req) {
  // Check if file was uploaded via multer
  if (req.file) {
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const fileName = req.file.originalname.toLowerCase();

    // Determine file type and parse accordingly
    if (mimeType.includes("csv") || fileName.endsWith(".csv")) {
      return await parseCSVBuffer(fileBuffer);
    } else if (mimeType.includes("json") || fileName.endsWith(".json")) {
      return parseJSONBuffer(fileBuffer);
    } else if (fileName.endsWith(".txt")) {
      // Attempt CSV parsing for .txt files
      return await parseCSVBuffer(fileBuffer);
    } else {
      throw new Error("Invalid file type. Only CSV, JSON, and TXT files are supported");
    }
  }
  
  // Check for JSON body data
  if (req.body?.data) {
    let data = req.body.data;
    
    // Parse stringified JSON if needed
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        throw new Error("Invalid JSON string in data field");
      }
    }
    
    if (!Array.isArray(data)) {
      throw new Error("Data must be an array of objects");
    }
    
    return data;
  }
  
  throw new Error("No data provided. Please upload a file or provide data in the request body");
}

/**
 * Validate observation row for required fields
 * @param {Object} o - Observation object
 * @param {number} index - Row index
 * @returns {Object} Validation result { ok: boolean, reason?: string }
 */
function validateObservationRow(o, index) {
  // Check scientific name
  if (!o.scientificName && !o.scientific_name) {
    return { ok: false, reason: `Missing required field: scientificName at row ${index}` };
  }
  
  // Check observed date
  if (!o.observedDate && !o.observed_date) {
    return { ok: false, reason: `Missing required field: observedDate at row ${index}` };
  }
  
  // Check location (coordinates)
  const hasLonLat = (o.longitude !== undefined && o.latitude !== undefined);
  const hasLocationCoords = o["location.coordinates"] || o.location?.coordinates;
  
  if (!hasLonLat && !hasLocationCoords) {
    return { ok: false, reason: `Missing required field: location coordinates at row ${index}` };
  }
  
  // Validate coordinate ranges if present
  if (hasLonLat) {
    const lon = parseFloat(o.longitude);
    const lat = parseFloat(o.latitude);
    if (isNaN(lon) || isNaN(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return { ok: false, reason: `Invalid coordinates at row ${index}: longitude must be [-180, 180], latitude must be [-90, 90]` };
    }
  }
  
  return { ok: true };
}

/**
 * Validate oceanographic row for required fields and timestamp
 * @param {Object} o - Oceanographic object
 * @param {number} index - Row index
 * @returns {Object} Validation result { ok: boolean, reason?: string }
 */
function validateOceanographicRow(o, index) {
  const now = Date.now();
  
  // Check timestamp
  const timestampField = o.timestamp || o.time || o.date;
  if (!timestampField) {
    return { ok: false, reason: `Missing required field: timestamp at row ${index}` };
  }
  
  const ts = new Date(timestampField);
  if (isNaN(ts.getTime())) {
    return { ok: false, reason: `Invalid timestamp format at row ${index}` };
  }
  
  if (ts.getTime() > now) {
    return { ok: false, reason: `Future timestamp not allowed at row ${index}` };
  }
  
  // Check location (coordinates)
  const hasLonLat = (o.longitude !== undefined && o.latitude !== undefined);
  const hasLocationCoords = o["location.coordinates"] || o.location?.coordinates;
  
  if (!hasLonLat && !hasLocationCoords) {
    return { ok: false, reason: `Missing required field: location coordinates at row ${index}` };
  }
  
  // Validate coordinate ranges if present
  if (hasLonLat) {
    const lon = parseFloat(o.longitude);
    const lat = parseFloat(o.latitude);
    if (isNaN(lon) || isNaN(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return { ok: false, reason: `Invalid coordinates at row ${index}: longitude must be [-180, 180], latitude must be [-90, 90]` };
    }
  }
  
  // Check depth
  const hasDepth = o["depth.value"] !== undefined || o.depth?.value !== undefined;
  if (!hasDepth) {
    return { ok: false, reason: `Missing required field: depth.value at row ${index}` };
  }
  
  return { ok: true };
}

/**
 * Upload species data in bulk (CSV or JSON)
 * POST /api/data/species/upload
 */
export const uploadSpeciesData = async (req, res) => {
  try {
    // Parse upload using helper
    const parsedData = await parseUpload(req);

    // Validate data array
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return res.status(400).json({
        error: "No data to process",
        message: "The uploaded file or data is empty",
      });
    }

    // Log upload activity
    const userId = req.user?._id;
    console.log(
      `Species data upload initiated by user ${userId} - ${parsedData.length} records`
    );

    // Insert data using service
    const result = await validateAndInsertSpecies(parsedData);

    // Prepare response
    const response = {
      success: result.success,
      message: "Species data uploaded successfully",
      summary: {
        total: parsedData.length,
        inserted: result.inserted,
        failed: result.failed,
      },
    };

    // Include failed records if any
    if (result.errors.length > 0) {
      response.failedRecords = result.errors;
    }

    // Include warnings (duplicates) if any
    if (result.warnings && result.warnings.length > 0) {
      response.warnings = result.warnings;
      response.summary.duplicates = result.warnings.length;
    }

    // Log summary
    console.log(
      `Species data upload completed - Inserted: ${result.inserted}, Failed: ${result.failed}, Duplicates: ${result.warnings?.length || 0}`
    );

    // Determine status code based on results
    const anyInserted = result.inserted > 0;
    const allFailed = result.inserted === 0 && result.failed > 0;
    const status = anyInserted && result.failed === 0 ? 201 : anyInserted ? 207 : 400;

    return res.status(status).json(response);
  } catch (error) {
    console.error("Upload species data error:", error);
    return res.status(400).json({
      error: "Upload failed",
      message: error.message || "An error occurred during data upload",
    });
  }
};

/**
 * Upload observation data in bulk (CSV or JSON)
 * POST /api/data/observations/upload
 */
export const uploadObservationsData = async (req, res) => {
  try {
    // Parse upload using helper
    const parsedData = await parseUpload(req);

    // Validate data array
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return res.status(400).json({
        error: "No data to process",
        message: "The uploaded file or data is empty",
      });
    }

    // Log upload activity
    const userId = req.user?._id;
    console.log(
      `Observation data upload initiated by user ${userId} - ${parsedData.length} records`
    );

    // Pre-validate required fields
    const validRows = [];
    const preValidationErrors = [];

    for (const [i, row] of parsedData.entries()) {
      const validation = validateObservationRow(row, i);
      if (validation.ok) {
        validRows.push(row);
      } else {
        preValidationErrors.push({
          index: i,
          data: row,
          error: validation.reason,
        });
      }
    }

    // If no valid rows, return early
    if (validRows.length === 0) {
      return res.status(400).json({
        error: "No valid data to insert",
        message: "All records failed pre-validation",
        failedRecords: preValidationErrors,
      });
    }

    // Insert valid data using service
    const result = await validateAndInsertObservations(validRows);

    // Merge pre-validation errors with service errors
    const allErrors = [...preValidationErrors, ...result.errors];
    const totalFailed = allErrors.length;

    // Prepare response
    const response = {
      success: result.success && preValidationErrors.length === 0,
      message: "Observation data uploaded successfully",
      summary: {
        total: parsedData.length,
        inserted: result.inserted,
        failed: totalFailed,
      },
    };

    // Include failed records if any
    if (allErrors.length > 0) {
      response.failedRecords = allErrors;
    }

    // Include warnings (duplicates) if any
    if (result.warnings && result.warnings.length > 0) {
      response.warnings = result.warnings;
      response.summary.duplicates = result.warnings.length;
    }

    // Log summary
    console.log(
      `Observation data upload completed - Inserted: ${result.inserted}, Failed: ${totalFailed}, Duplicates: ${result.warnings?.length || 0}`
    );

    // Determine status code based on results
    const anyInserted = result.inserted > 0;
    const allFailed = result.inserted === 0 && totalFailed > 0;
    const status = anyInserted && totalFailed === 0 ? 201 : anyInserted ? 207 : 400;

    return res.status(status).json(response);
  } catch (error) {
    console.error("Upload observations data error:", error);
    return res.status(400).json({
      error: "Upload failed",
      message: error.message || "An error occurred during data upload",
    });
  }
};

/**
 * Upload oceanographic data in bulk (CSV or JSON)
 * POST /api/data/oceanographic/upload
 */
export const uploadOceanographicData = async (req, res) => {
  try {
    // Parse uploaded data using shared helper
    const parsedData = await parseUpload(req);

    // Validate data array
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return res.status(400).json({
        error: "No data to process",
        message: "The uploaded file or data is empty",
      });
    }

    // Log upload activity
    const userId = req.user?._id;
    console.log(
      `Oceanographic data upload initiated by user ${userId} - ${parsedData.length} records`
    );

    // Pre-validate each record
    const validRows = [];
    const preValidationErrors = [];

    for (let i = 0; i < parsedData.length; i++) {
      const validationResult = validateOceanographicRow(parsedData[i], i);
      if (validationResult.ok) {
        validRows.push(parsedData[i]);
      } else {
        preValidationErrors.push({
          index: i,
          data: parsedData[i],
          error: validationResult.reason,
        });
      }
    }

    // If no valid rows, return early
    if (validRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All records failed pre-validation",
        summary: {
          total: parsedData.length,
          inserted: 0,
          failed: parsedData.length,
        },
        failedRecords: preValidationErrors,
      });
    }

    // Insert valid rows using service
    const result = await validateAndInsertOceanographicData(validRows);

    // Merge pre-validation errors with service errors
    const allErrors = [...preValidationErrors, ...result.errors];
    const totalFailed = allErrors.length;

    // Prepare response
    const response = {
      success: result.success,
      message: "Oceanographic data uploaded successfully",
      summary: {
        total: parsedData.length,
        inserted: result.inserted,
        failed: totalFailed,
      },
    };

    // Include failed records if any
    if (allErrors.length > 0) {
      response.failedRecords = allErrors;
    }

    // Include warnings if any duplicates
    if (result.warnings && result.warnings.length > 0) {
      response.warnings = result.warnings;
    }

    // Determine status code based on results
    const anyInserted = result.inserted > 0;
    const status = anyInserted && totalFailed === 0 ? 201 : anyInserted ? 207 : 400;

    // Log summary
    console.log(
      `Oceanographic data upload completed - Inserted: ${result.inserted}, Failed: ${totalFailed} (Pre-validation: ${preValidationErrors.length}, Service: ${result.errors.length})`
    );

    return res.status(status).json(response);
  } catch (error) {
    console.error("Upload oceanographic data error:", error);
    return res.status(500).json({
      error: "Upload failed",
      message: error.message || "An error occurred during data upload",
      details: error.toString(),
    });
  }
};
