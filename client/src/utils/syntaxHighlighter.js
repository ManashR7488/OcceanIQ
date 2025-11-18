/**
 * Syntax highlighting utility for JSON code
 * Provides functions for highlighting, formatting, and validating JSON
 */

/**
 * Highlight JSON with color-coded syntax
 * @param {string} jsonString - JSON string to highlight
 * @returns {string} HTML string with syntax highlighting
 */
export const highlightJson = (jsonString) => {
  if (!jsonString) return '';

  let highlighted = jsonString;

  // Escape HTML to prevent XSS
  highlighted = highlighted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Highlight different JSON elements with color spans
  highlighted = highlighted
    // Keys (property names)
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")\s*:/g, '<span class="text-blue-400">$1</span>:')
    // String values
    .replace(/:\s*("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")/g, ': <span class="text-green-400">$1</span>')
    // Numbers
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="text-orange-400">$1</span>')
    // Booleans
    .replace(/:\s*(true|false)/g, ': <span class="text-purple-400">$1</span>')
    // Null
    .replace(/:\s*(null)/g, ': <span class="text-gray-400">$1</span>')
    // Brackets and braces
    .replace(/([{}[\],])/g, '<span class="text-gray-300">$1</span>');

  return highlighted;
};

/**
 * Format JSON with indentation
 * @param {Object|string} jsonObject - JavaScript object or JSON string
 * @param {number} indent - Number of spaces for indentation
 * @returns {string} Formatted JSON string
 */
export const formatJson = (jsonObject, indent = 2) => {
  try {
    if (typeof jsonObject === 'string') {
      jsonObject = JSON.parse(jsonObject);
    }
    return JSON.stringify(jsonObject, null, indent);
  } catch (error) {
    return jsonObject.toString();
  }
};

/**
 * Validate if string is valid JSON
 * @param {string} jsonString - String to validate
 * @returns {boolean} True if valid JSON
 */
export const isValidJson = (jsonString) => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
export const copyToClipboard = async (text) => {
  try {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (err) {
      document.body.removeChild(textarea);
      return false;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Parse and pretty-print JSON with error handling
 * @param {string} jsonString - JSON string to parse
 * @returns {Object} Object with parsed data or error
 */
export const parseJsonSafely = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
