/**
 * File handling utilities for CSV/JSON parsing and export
 */
import Papa from 'papaparse';

/**
 * Parse CSV file
 * @param {File} file - CSV file object
 * @returns {Promise<Object>} - {data, fields, errors}
 */
export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error('CSV file is empty or invalid'));
          return;
        }

        const fields = results.meta.fields || Object.keys(results.data[0] || {});

        resolve({
          data: results.data,
          fields,
          errors: results.errors
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Parse JSON file
 * @param {File} file - JSON file object
 * @returns {Promise<Object>} - {data, fields, errors}
 */
export function parseJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        let data = [];
        let fields = [];

        // Handle array of objects
        if (Array.isArray(jsonData)) {
          if (jsonData.length === 0) {
            reject(new Error('JSON array is empty'));
            return;
          }

          data = jsonData;
          fields = Object.keys(jsonData[0] || {});
        }
        // Handle object with arrays
        else if (typeof jsonData === 'object' && jsonData !== null) {
          fields = Object.keys(jsonData);

          // Check if all values are arrays
          const isValidStructure = fields.every(
            field => Array.isArray(jsonData[field])
          );

          if (!isValidStructure) {
            reject(new Error('JSON must be an array of objects or an object with array values'));
            return;
          }

          // Convert to array of objects
          const arrayLength = jsonData[fields[0]].length;
          data = Array(arrayLength).fill(null).map((_, index) => {
            const row = {};
            fields.forEach(field => {
              row[field] = jsonData[field][index];
            });
            return row;
          });
        } else {
          reject(new Error('Invalid JSON structure'));
          return;
        }

        if (fields.length === 0) {
          reject(new Error('No fields found in JSON'));
          return;
        }

        resolve({
          data,
          fields,
          errors: []
        });
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Detect numeric fields in parsed data
 * @param {Array<Object>} data - Parsed data array
 * @param {Array<string>} fields - Field names
 * @returns {Object} - {numericFields, nonNumericFields, fieldStats}
 */
export function detectNumericFields(data, fields) {
  const fieldStats = {};
  const numericFields = [];
  const nonNumericFields = [];

  const NUMERIC_THRESHOLD = 0.8; // 80% of values must be numeric

  fields.forEach(field => {
    let numericCount = 0;
    let nullCount = 0;
    let totalCount = 0;

    data.forEach(row => {
      totalCount++;
      const value = row[field];

      if (value === null || value === undefined || value === '') {
        nullCount++;
      } else if (!isNaN(Number(value)) && isFinite(Number(value))) {
        numericCount++;
      }
    });

    const nonNullCount = totalCount - nullCount;
    const numericPercentage = nonNullCount > 0 ? numericCount / nonNullCount : 0;

    fieldStats[field] = {
      count: totalCount,
      numericCount,
      nullCount,
      numericPercentage: numericPercentage * 100
    };

    if (numericPercentage >= NUMERIC_THRESHOLD) {
      numericFields.push(field);
    } else {
      nonNumericFields.push(field);
    }
  });

  return {
    numericFields,
    nonNumericFields,
    fieldStats
  };
}

/**
 * Export data to CSV file
 * @param {Array<Object>|Object} data - Data to export
 * @param {string} filename - Output filename
 */
export function exportToCSV(data, filename = 'export.csv') {
  try {
    const csv = Papa.unparse(data);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      throw new Error('Browser does not support file downloads');
    }
  } catch (error) {
    throw new Error(`Failed to export CSV: ${error.message}`);
  }
}

/**
 * Export data to JSON file
 * @param {Array<Object>|Object} data - Data to export
 * @param {string} filename - Output filename
 */
export function exportToJSON(data, filename = 'export.json') {
  try {
    const jsonString = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      throw new Error('Browser does not support file downloads');
    }
  } catch (error) {
    throw new Error(`Failed to export JSON: ${error.message}`);
  }
}

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {Object} - {valid, error}
 */
export function validateFileSize(file, maxSizeMB = 10) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size of ${maxSizeMB} MB`
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate file type
 * @param {File} file - File object
 * @param {Array<string>} allowedTypes - Allowed file extensions
 * @returns {Object} - {valid, error}
 */
export function validateFileType(file, allowedTypes = ['csv', 'json']) {
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop();

  if (!allowedTypes.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Parse file based on type
 * @param {File} file - File object
 * @returns {Promise<Object>} - {data, fields, errors}
 */
export async function parseFile(file) {
  const extension = file.name.toLowerCase().split('.').pop();

  if (extension === 'csv') {
    return await parseCSVFile(file);
  } else if (extension === 'json') {
    return await parseJSONFile(file);
  } else {
    throw new Error(`Unsupported file type: ${extension}`);
  }
}

/**
 * Get file info summary
 * @param {File} file - File object
 * @returns {Object} - File metadata
 */
export function getFileInfo(file) {
  return {
    name: file.name,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    type: file.type,
    lastModified: file.lastModified,
    lastModifiedDate: new Date(file.lastModified).toLocaleString()
  };
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
