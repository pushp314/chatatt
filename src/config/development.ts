// Development configuration
// DO NOT COMMIT REAL CREDENTIALS HERE
export const DEV_CONFIG = {
    COMETCHAT_APP_ID: '275369409e15e5b7',
    COMETCHAT_AUTH_KEY: 'd14a3e00f382bdfe4acc889a5ea39018bd4ab401',
  COMETCHAT_REGION: 'in',
  API_BASE_URL: 'https://api-development.yourapp.com/api/v1',
} as const;

// You can also add other environments if needed
export const STAGING_CONFIG = {
  // Staging configuration
} as const;

export const PROD_CONFIG = {
  // Production configuration
} as const;
