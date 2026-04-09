/**
 * File intent: centralize Google Drive placeholder configuration for the HR document integration flow.
 * Design reminder for this file: keep configuration frontend-only, explicit, and easy to replace with real values without touching unrelated modules.
 */

export const HR_GOOGLE_DRIVE_ENV_KEYS = {
  oauthClientId: "VITE_GOOGLE_OAUTH_CLIENT_ID",
  apiKey: "VITE_GOOGLE_API_KEY",
  appId: "VITE_GOOGLE_CLOUD_APP_ID",
} as const;

export const HR_GOOGLE_DRIVE_ENV_PLACEHOLDERS = {
  oauthClientId: "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com",
  apiKey: "YOUR_GOOGLE_API_KEY",
  appId: "YOUR_GOOGLE_CLOUD_APP_ID",
} as const;

export type GoogleDriveConfigField = keyof typeof HR_GOOGLE_DRIVE_ENV_KEYS;

export type GoogleDriveRuntimeConfig = {
  oauthClientId: string;
  apiKey: string;
  appId: string;
};

export type GoogleDriveIntegrationStatus = {
  isConfigured: boolean;
  missingKeys: GoogleDriveConfigField[];
  envKeys: typeof HR_GOOGLE_DRIVE_ENV_KEYS;
};

function normalizeConfigValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getGoogleDriveRuntimeConfig(): GoogleDriveRuntimeConfig {
  const oauthClientId = normalizeConfigValue(import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID);
  const apiKey = normalizeConfigValue(import.meta.env.VITE_GOOGLE_API_KEY);
  const appId = normalizeConfigValue(import.meta.env.VITE_GOOGLE_CLOUD_APP_ID ?? import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_NUMBER);

  return {
    oauthClientId,
    apiKey,
    appId,
  };
}

export function getGoogleDriveIntegrationStatus(): GoogleDriveIntegrationStatus {
  const config = getGoogleDriveRuntimeConfig();
  const missingKeys: GoogleDriveConfigField[] = [];

  if (!config.oauthClientId) {
    missingKeys.push("oauthClientId");
  }

  if (!config.apiKey) {
    missingKeys.push("apiKey");
  }

  if (!config.appId) {
    missingKeys.push("appId");
  }

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
    envKeys: HR_GOOGLE_DRIVE_ENV_KEYS,
  };
}
