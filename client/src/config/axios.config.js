import axios from "axios";
import { apiCache } from "../utils/cacheManager";

const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "https://occean-iq.vercel.app/api",
  headers: {
    "Content-Type": "application/json",
  },
    withCredentials: true,
});

export const axiosInstance2 = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000" : "https://occean-iq.vercel.app",
  headers: {
    "Content-Type": "application/json",
  },
    withCredentials: true,
});

// Request interceptor - Check cache before making GET requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Only cache GET requests
    if (config.method === 'get') {
      const cacheKey = apiCache.generateKey(config.url, config.params);
      
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey);
        
        // Return cached response wrapped in a resolved promise
        // This prevents the actual request from being made
        return Promise.reject({
          isCache: true,
          data: cachedData,
          config
        });
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Cache successful GET responses and handle cache hits
axiosInstance.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get') {
      const cacheKey = apiCache.generateKey(response.config.url, response.config.params);
      apiCache.set(cacheKey, response.data);
    }
    
    return response;
  },
  (error) => {
    // Handle cache hits (from request interceptor)
    if (error.isCache) {
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: 'OK (Cached)',
        headers: {},
        config: error.config,
        fromCache: true
      });
    }
    
    // On network error, try to return cached data as fallback
    if (error.message === 'Network Error' && error.config?.method === 'get') {
      const cacheKey = apiCache.generateKey(error.config.url, error.config.params);
      
      if (apiCache.has(cacheKey)) {
        console.warn('Network error - serving stale cache for:', error.config.url);
        return Promise.resolve({
          data: apiCache.get(cacheKey),
          status: 200,
          statusText: 'OK (Stale Cache)',
          headers: {},
          config: error.config,
          fromCache: true,
          stale: true
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
