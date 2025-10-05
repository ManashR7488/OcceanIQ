/**
 * Statistical utility functions for correlation analysis
 */

/**
 * Validate and clean numeric array
 * @param {Array} array - Input array
 * @returns {Object} - {cleanedArray, removedCount}
 */
export function validateNumericArray(array) {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }

  const cleaned = [];
  let removedCount = 0;

  for (const value of array) {
    if (value !== null && value !== undefined && !isNaN(Number(value)) && isFinite(Number(value))) {
      cleaned.push(Number(value));
    } else {
      removedCount++;
    }
  }

  return { cleanedArray: cleaned, removedCount };
}

/**
 * Calculate mean of an array
 * @param {Array<number>} array - Numeric array
 * @returns {number} - Mean value
 */
function calculateMean(array) {
  if (array.length === 0) return 0;
  const sum = array.reduce((acc, val) => acc + val, 0);
  return sum / array.length;
}

/**
 * Calculate standard deviation
 * @param {Array<number>} array - Numeric array
 * @param {number} mean - Pre-calculated mean (optional)
 * @returns {number} - Standard deviation
 */
function calculateStdDev(array, mean = null) {
  if (array.length === 0) return 0;
  const avg = mean !== null ? mean : calculateMean(array);
  const squareDiffs = array.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateMean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate Pearson correlation coefficient
 * @param {Array<number>} xArray - First variable
 * @param {Array<number>} yArray - Second variable
 * @returns {Object} - {correlation, pValue, n}
 */
export function calculatePearsonCorrelation(xArray, yArray) {
  // Validate inputs
  if (!Array.isArray(xArray) || !Array.isArray(yArray)) {
    throw new Error('Both inputs must be arrays');
  }

  if (xArray.length !== yArray.length) {
    throw new Error('Arrays must have the same length');
  }

  if (xArray.length < 2) {
    throw new Error('Arrays must have at least 2 values');
  }

  // Clean arrays
  const { cleanedArray: cleanX } = validateNumericArray(xArray);
  const { cleanedArray: cleanY } = validateNumericArray(yArray);

  if (cleanX.length !== cleanY.length) {
    throw new Error('Arrays must have matching valid numeric values');
  }

  const n = cleanX.length;
  if (n < 2) {
    throw new Error('Need at least 2 valid numeric pairs');
  }

  // Calculate means
  const meanX = calculateMean(cleanX);
  const meanY = calculateMean(cleanY);

  // Calculate covariance and standard deviations
  let covariance = 0;
  let sumSquaresX = 0;
  let sumSquaresY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = cleanX[i] - meanX;
    const diffY = cleanY[i] - meanY;
    covariance += diffX * diffY;
    sumSquaresX += diffX * diffX;
    sumSquaresY += diffY * diffY;
  }

  // Check for zero variance
  if (sumSquaresX === 0 || sumSquaresY === 0) {
    return { correlation: 0, pValue: 1, n };
  }

  // Calculate correlation coefficient
  const correlation = covariance / Math.sqrt(sumSquaresX * sumSquaresY);

  // Calculate approximate p-value using t-distribution approximation
  const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
  const pValue = correlation === 0 ? 1 : (Math.abs(t) > 2 ? 0.05 : 0.5); // Simplified p-value indicator

  return {
    correlation: isNaN(correlation) ? 0 : correlation,
    pValue,
    n
  };
}

/**
 * Convert array values to ranks (for Spearman correlation)
 * @param {Array<number>} array - Numeric array
 * @returns {Array<number>} - Ranked array
 */
function convertToRanks(array) {
  const sorted = array
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);

  const ranks = new Array(array.length);
  let i = 0;

  while (i < sorted.length) {
    let j = i;
    // Find ties
    while (j < sorted.length && sorted[j].value === sorted[i].value) {
      j++;
    }

    // Assign average rank to ties
    const avgRank = (i + j + 1) / 2;
    for (let k = i; k < j; k++) {
      ranks[sorted[k].index] = avgRank;
    }

    i = j;
  }

  return ranks;
}

/**
 * Align two arrays pairwise, removing rows where either value is invalid
 * @param {Array} xArray - First array
 * @param {Array} yArray - Second array
 * @returns {Object} - {xAligned, yAligned}
 */
export function pairwiseAligned(xArray, yArray) {
  if (!Array.isArray(xArray) || !Array.isArray(yArray)) {
    throw new Error('Both inputs must be arrays');
  }

  if (xArray.length !== yArray.length) {
    throw new Error('Arrays must have the same length');
  }

  const xAligned = [];
  const yAligned = [];

  for (let i = 0; i < xArray.length; i++) {
    const x = xArray[i];
    const y = yArray[i];

    // Only include pairs where both values are valid numbers
    if (
      x !== null &&
      x !== undefined &&
      y !== null &&
      y !== undefined &&
      !isNaN(Number(x)) &&
      !isNaN(Number(y)) &&
      isFinite(Number(x)) &&
      isFinite(Number(y))
    ) {
      xAligned.push(Number(x));
      yAligned.push(Number(y));
    }
  }

  return { xAligned, yAligned };
}

/**
 * Calculate Spearman rank correlation coefficient
 * @param {Array<number>} xArray - First variable
 * @param {Array<number>} yArray - Second variable
 * @returns {Object} - {correlation, n}
 */
export function calculateSpearmanCorrelation(xArray, yArray) {
  // Validate inputs
  if (!Array.isArray(xArray) || !Array.isArray(yArray)) {
    throw new Error('Both inputs must be arrays');
  }

  if (xArray.length !== yArray.length) {
    throw new Error('Arrays must have the same length');
  }

  // Clean arrays
  const { cleanedArray: cleanX } = validateNumericArray(xArray);
  const { cleanedArray: cleanY } = validateNumericArray(yArray);

  if (cleanX.length < 2) {
    throw new Error('Need at least 2 valid numeric pairs');
  }

  // Convert to ranks
  const ranksX = convertToRanks(cleanX);
  const ranksY = convertToRanks(cleanY);

  // Apply Pearson correlation to ranks
  const { correlation } = calculatePearsonCorrelation(ranksX, ranksY);

  return {
    correlation,
    n: cleanX.length
  };
}

/**
 * Calculate correlation matrix for multiple variables
 * @param {Object} dataObject - Object with field names as keys and arrays as values
 * @param {string} method - Correlation method: 'pearson' or 'spearman' (default: 'pearson')
 * @returns {Object} - {matrix, fieldNames}
 */
export function calculateCorrelationMatrix(dataObject, method = 'pearson') {
  if (!dataObject || typeof dataObject !== 'object') {
    throw new Error('Input must be an object with field arrays');
  }

  const fieldNames = Object.keys(dataObject);
  const n = fieldNames.length;

  if (n < 2) {
    throw new Error('Need at least 2 fields for correlation matrix');
  }

  // Initialize matrix
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

  // Select correlation function based on method
  const correlationFunc = method === 'spearman' 
    ? calculateSpearmanCorrelation 
    : calculatePearsonCorrelation;

  // Calculate correlations
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1; // Self-correlation is always 1
      } else if (j > i) {
        // Calculate correlation for upper triangle with pairwise alignment
        const { xAligned, yAligned } = pairwiseAligned(
          dataObject[fieldNames[i]],
          dataObject[fieldNames[j]]
        );

        if (xAligned.length < 2) {
          console.warn(`Not enough valid pairs between ${fieldNames[i]} and ${fieldNames[j]}`);
          matrix[i][j] = 0;
          matrix[j][i] = 0;
          continue;
        }

        try {
          const { correlation } = correlationFunc(xAligned, yAligned);
          matrix[i][j] = correlation;
          matrix[j][i] = correlation; // Mirror to lower triangle
        } catch (error) {
          console.error(`Failed to calculate correlation between ${fieldNames[i]} and ${fieldNames[j]}:`, error.message);
          throw error; // Surface errors instead of silently setting to 0
        }
      }
    }
  }

  return { matrix, fieldNames };
}

/**
 * Calculate linear regression
 * @param {Array<number>} xArray - Independent variable
 * @param {Array<number>} yArray - Dependent variable
 * @returns {Object} - {slope, intercept, rSquared, predictedY}
 */
export function calculateLinearRegression(xArray, yArray) {
  // Validate inputs
  if (!Array.isArray(xArray) || !Array.isArray(yArray)) {
    throw new Error('Both inputs must be arrays');
  }

  if (xArray.length !== yArray.length) {
    throw new Error('Arrays must have the same length');
  }

  // Clean arrays
  const { cleanedArray: cleanX } = validateNumericArray(xArray);
  const { cleanedArray: cleanY } = validateNumericArray(yArray);

  const n = cleanX.length;
  if (n < 2) {
    throw new Error('Need at least 2 valid data points');
  }

  // Calculate means
  const meanX = calculateMean(cleanX);
  const meanY = calculateMean(cleanY);

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const diffX = cleanX[i] - meanX;
    numerator += diffX * (cleanY[i] - meanY);
    denominator += diffX * diffX;
  }

  if (denominator === 0) {
    throw new Error('Cannot calculate regression: zero variance in x');
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate predicted values and R²
  const predictedY = cleanX.map(x => slope * x + intercept);

  let ssTotal = 0;
  let ssResidual = 0;

  for (let i = 0; i < n; i++) {
    ssTotal += Math.pow(cleanY[i] - meanY, 2);
    ssResidual += Math.pow(cleanY[i] - predictedY[i], 2);
  }

  const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);

  return {
    slope,
    intercept,
    rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp between 0 and 1
    predictedY
  };
}

/**
 * Calculate quartiles and identify outliers
 * @param {Array<number>} array - Numeric array
 * @returns {Object} - {min, q1, median, q3, max, outliers, iqr}
 */
export function calculateQuartiles(array) {
  // Clean and validate
  const { cleanedArray } = validateNumericArray(array);

  if (cleanedArray.length === 0) {
    throw new Error('Array is empty or contains no valid numbers');
  }

  // Sort array
  const sorted = [...cleanedArray].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate quartiles
  const getPercentile = (arr, p) => {
    const index = (p / 100) * (arr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return arr[lower];
    }

    return arr[lower] * (1 - weight) + arr[upper] * weight;
  };

  const q1 = getPercentile(sorted, 25);
  const median = getPercentile(sorted, 50);
  const q3 = getPercentile(sorted, 75);
  const min = sorted[0];
  const max = sorted[n - 1];

  // Calculate IQR and outliers
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = cleanedArray.filter(value => value < lowerBound || value > upperBound);

  return {
    min,
    q1,
    median,
    q3,
    max,
    iqr,
    outliers,
    lowerBound,
    upperBound
  };
}

/**
 * Normalize data to 0-1 range using min-max normalization
 * @param {Array<number>} array - Numeric array
 * @returns {Array<number>} - Normalized array
 */
export function normalizeData(array) {
  const { cleanedArray } = validateNumericArray(array);

  if (cleanedArray.length === 0) {
    return [];
  }

  const min = Math.min(...cleanedArray);
  const max = Math.max(...cleanedArray);

  if (min === max) {
    // All values are the same
    return cleanedArray.map(() => 0.5);
  }

  return cleanedArray.map(value => (value - min) / (max - min));
}

/**
 * Get interpretation of correlation strength
 * @param {number} correlation - Correlation coefficient
 * @returns {string} - Interpretation text
 */
export function interpretCorrelation(correlation) {
  const abs = Math.abs(correlation);
  const sign = correlation >= 0 ? 'Positive' : 'Negative';

  if (abs >= 0.9) return `Very Strong ${sign}`;
  if (abs >= 0.7) return `Strong ${sign}`;
  if (abs >= 0.5) return `Moderate ${sign}`;
  if (abs >= 0.3) return `Weak ${sign}`;
  return 'Very Weak / No Correlation';
}

/**
 * Get color for correlation value (for heatmap)
 * @param {number} correlation - Correlation coefficient (-1 to 1)
 * @returns {string} - Hex color code
 */
export function getCorrelationColor(correlation) {
  const abs = Math.abs(correlation);

  if (correlation < -0.7) return '#DC2626'; // Dark red
  if (correlation < -0.3) return '#FCA5A5'; // Light red
  if (correlation >= -0.3 && correlation <= 0.3) return '#E5E7EB'; // Gray
  if (correlation > 0.7) return '#1E40AF'; // Dark blue
  if (correlation > 0.3) return '#93C5FD'; // Light blue

  return '#E5E7EB'; // Default gray
}
