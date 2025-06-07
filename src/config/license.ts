/**
 * License Configuration
 * 
 * Configure license server settings and behavior
 */

// Environment variables for Vite
const SERVER_URL = import.meta.env.REACT_APP_LICENSE_SERVER_URL || 'https://license-generator-smoky.vercel.app';
const NODE_ENV = import.meta.env.NODE_ENV || import.meta.env.VITE_APP_ENV || 'development';

export const LICENSE_CONFIG = {
  // License server URL - adjust this to match your license-generator server
  SERVER_URL,
  
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Periodic check interval (how often to validate license during operation)
  CHECK_INTERVAL: 10 * 60 * 1000, // 10 minutes in milliseconds
  
  // Timeout for license server requests
  REQUEST_TIMEOUT: 10000, // 10 seconds
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  
  // Development settings
  ENABLE_DEBUG_LOGS: NODE_ENV === 'development',
  
  // Fallback behavior when server is unreachable
  ALLOW_OFFLINE_MODE: true, // Enable offline mode to allow operation when license server is down
  OFFLINE_GRACE_PERIOD: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds (extended for better offline support)
};

export const LICENSE_ENDPOINTS = {
  CHECK_STATUS: '/api/licenses/:licenseKey/status',
  SUSPEND: '/api/licenses/:licenseKey/suspend',
  REACTIVATE: '/api/licenses/:licenseKey/reactivate',
  VALIDATE: '/api/licenses/:licenseKey/validate',
};

export default LICENSE_CONFIG; 