import dotenv from "dotenv";
dotenv.config();

// Fishial.AI configuration for fish species identification
const fishialConfig = {
  enabled: !!process.env.FISHIAL_CLIENT_ID && !!process.env.FISHIAL_CLIENT_SECRET && 
           process.env.FISHIAL_CLIENT_ID !== "your_fishial_client_id_here" &&
           process.env.FISHIAL_CLIENT_SECRET !== "your_fishial_client_secret_here",
  clientId: process.env.FISHIAL_CLIENT_ID,
  clientSecret: process.env.FISHIAL_CLIENT_SECRET,
  apiBaseUrl: "https://api.fishial.ai/v1",
  authUrl: "https://api-users.fishial.ai/v1/auth/token",
  minConfidence: 0.4,
  tokenTTL: 600000, // 10 minutes in milliseconds
};

// FishBase configuration for species data enrichment
const fishbaseConfig = {
  enabled: true, // No authentication required
  apiBaseUrl: "https://fishbase.ropensci.org",
  timeout: 10000, // 10 seconds
};

// Fallback configuration
const fallbackEnabled = true;

// Get array of enabled providers in priority order
const getEnabledProviders = () => {
  const providers = [];
  
  if (fishialConfig.enabled) providers.push("fishial");
  if (fallbackEnabled) providers.push("fallback");
  
  return providers;
};

// Export configuration object
export const providerConfig = {
  fishial: fishialConfig,
  fishbase: fishbaseConfig,
  fallbackEnabled,
  providers: getEnabledProviders(),
};

// Validate provider configuration
export const validateProviderConfig = () => {
  const hasFishial = fishialConfig.enabled;
  
  if (!hasFishial) {
    console.warn("⚠️  Fishial.AI not configured.");
    console.warn("Species identification will use fallback method only.");
    console.warn("For best accuracy, configure FISHIAL_CLIENT_ID and FISHIAL_CLIENT_SECRET in .env file");
    return false;
  }
  
  return true;
};

// Get provider status for health checks
export const getProviderStatus = () => {
  const enabled = [];
  const disabled = [];
  
  if (fishialConfig.enabled) {
    enabled.push("Fishial.AI");
  } else {
    disabled.push("Fishial.AI");
  }
  
  if (fishbaseConfig.enabled) {
    enabled.push("FishBase");
  }
  
  enabled.push("Fallback (always available)");
  
  return {
    enabled,
    disabled,
    primaryProvider: "fishial",
    details: {
      fishial: {
        enabled: fishialConfig.enabled,
        apiBaseUrl: fishialConfig.enabled ? fishialConfig.apiBaseUrl : null,
      },
      fishbase: {
        enabled: fishbaseConfig.enabled,
        apiBaseUrl: fishbaseConfig.apiBaseUrl,
      },
      fallback: {
        enabled: true,
      },
    },
  };
};
