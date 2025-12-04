import axios from "axios";

/**
 * n8n Taxonomy Webhook Integration Service
 * 
 * This service handles communication with the external n8n webhook
 * for species taxonomy identification and data enrichment.
 */

/**
 * Validates the n8n webhook response structure
 * @param {Object} data - Response data from n8n webhook
 * @returns {boolean} - True if response is valid, false otherwise
 */
export const validateN8nResponse = (data) => {
  if (!data) return false;
  
  // Check required fields
  const requiredFields = ["scientificName", "taxonomicHierarchy"];
  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`Missing required field in n8n response: ${field}`);
      return false;
    }
  }
  
  // Validate taxonomicHierarchy structure
  if (typeof data.taxonomicHierarchy !== "object") {
    console.error("taxonomicHierarchy must be an object");
    return false;
  }
  
  return true;
};

/**
 * Calls the n8n taxonomy webhook with retry logic
 * @param {string} input - Species name or Cloudinary image URL
 * @returns {Promise<Object>} - Parsed taxonomy data from n8n
 * @throws {Error} - If webhook is not configured, times out, or returns invalid data
 */
export const callN8nTaxonomyWebhook = async (input) => {
  // Validate webhook URL is configured
  const webhookUrl = process.env.N8N_TAXONOMY_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error(
      "N8N_TAXONOMY_WEBHOOK_URL is not configured. Please add it to your .env file."
    );
  }

  // Get timeout from environment or use default (60 seconds)
  const timeout = parseInt(process.env.N8N_TAXONOMY_TIMEOUT) || 60000;

  // Retry configuration
  const maxRetries = 2;
  const retryDelays = [1000, 2000]; // 1s, 2s exponential backoff

  let lastError = null;

  // Retry loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[n8n Taxonomy] Calling webhook (attempt ${attempt + 1}/${maxRetries + 1}):`,
        { input: input.substring(0, 100) } // Log first 100 chars
      );

      const response = await axios({
        method: "POST",
        url: webhookUrl,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          input: input,
        },
        timeout: timeout,
      });

    //   console.log(response)

      // Validate response structure
      if (!validateN8nResponse(response.data)) {
        throw new Error("Invalid taxonomy data structure from n8n webhook");
      }

      console.log(
        "[n8n Taxonomy] Successfully received data:",
        response.data.scientificName
      );

      return response.data;
    } catch (error) {
      lastError = error;

      // Handle timeout errors
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        console.error(
          `[n8n Taxonomy] Timeout on attempt ${attempt + 1}:`,
          error.message
        );
        if (attempt === maxRetries) {
          throw new Error(
            `n8n webhook timeout after ${timeout}ms. The identification process is taking too long. Please try again or increase N8N_TAXONOMY_TIMEOUT.`
          );
        }
      }
      // Handle network errors
      else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        console.error(
          `[n8n Taxonomy] Network error on attempt ${attempt + 1}:`,
          error.message
        );
        if (attempt === maxRetries) {
          throw new Error(
            "n8n webhook unreachable. Please check that your n8n instance is running and the webhook URL is correct."
          );
        }
      }
      // Handle HTTP errors from n8n
      else if (error.response) {
        console.error(
          `[n8n Taxonomy] HTTP error ${error.response.status}:`,
          error.response.data
        );
        throw new Error(
          `n8n webhook returned error: ${error.response.status} - ${
            error.response.data?.message || "Unknown error"
          }`
        );
      }
      // Handle validation errors (don't retry)
      else if (error.message.includes("Invalid taxonomy data")) {
        throw error;
      }
      // Other errors
      else {
        console.error(
          `[n8n Taxonomy] Unexpected error on attempt ${attempt + 1}:`,
          error.message
        );
        if (attempt === maxRetries) {
          throw new Error(
            `n8n webhook failed: ${error.message || "Unknown error"}`
          );
        }
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        const delay = retryDelays[attempt];
        console.log(`[n8n Taxonomy] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("n8n webhook failed after all retry attempts");
};

export default {
  callN8nTaxonomyWebhook,
  validateN8nResponse,
};
