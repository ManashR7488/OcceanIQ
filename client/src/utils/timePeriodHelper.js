/**
 * Utility functions for working with time periods in the dashboard
 */

/**
 * Calculate the date range based on a time period object
 * @param {Object} timePeriod - The time period object from context
 * @param {string} timePeriod.label - Display label (e.g., "Last 30 Days")
 * @param {number|null} timePeriod.value - Numeric value (e.g., 30)
 * @param {string|null} timePeriod.unit - Unit of time ("days", "months", "year", or null)
 * @returns {Object} Object with startDate and endDate
 */
export const getDateRange = (timePeriod) => {
  if (!timePeriod || !timePeriod.value) {
    // "All Time" selected - return null for startDate
    return { startDate: null, endDate: new Date() };
  }

  const endDate = new Date();
  const startDate = new Date();

  switch (timePeriod.unit) {
    case 'days':
      startDate.setDate(startDate.getDate() - timePeriod.value);
      break;
    case 'months':
      startDate.setMonth(startDate.getMonth() - timePeriod.value);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - timePeriod.value);
      break;
    default:
      console.warn('Unknown time period unit:', timePeriod.unit);
  }

  return { startDate, endDate };
};

/**
 * Format date range for API query parameters
 * @param {Object} timePeriod - The time period object from context
 * @returns {Object} Object with formatted startDate and endDate strings (ISO format)
 */
export const getDateRangeForAPI = (timePeriod) => {
  const { startDate, endDate } = getDateRange(timePeriod);
  
  // For "All Time", omit startDate entirely instead of sending null
  const result = {
    endDate: endDate.toISOString(),
  };
  
  if (startDate) {
    result.startDate = startDate.toISOString();
  }
  
  return result;
};

/**
 * Filter an array of data objects based on a date field and time period
 * @param {Array} data - Array of data objects
 * @param {string} dateField - Name of the date field in the objects
 * @param {Object} timePeriod - The time period object from context
 * @returns {Array} Filtered array
 */
export const filterDataByTimePeriod = (data, dateField, timePeriod) => {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  const { startDate } = getDateRange(timePeriod);
  
  if (!startDate) {
    // "All Time" selected - return all data
    return data;
  }

  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startDate;
  });
};

/**
 * Get the number of days in the current time period
 * Useful for determining chart granularity
 * @param {Object} timePeriod - The time period object from context
 * @returns {number|null} Number of days, or null for "All Time"
 */
export const getDaysInPeriod = (timePeriod) => {
  if (!timePeriod || !timePeriod.value) {
    return null; // All Time
  }

  switch (timePeriod.unit) {
    case 'days':
      return timePeriod.value;
    case 'months':
      return timePeriod.value * 30; // Approximate
    case 'year':
      return timePeriod.value * 365; // Approximate
    default:
      return null;
  }
};
