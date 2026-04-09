/**
 * File intent: provide a frontend-only Google Identity Services and Google Drive Picker integration layer for the HR document upload flow.
 * Design reminder for this file: keep the integration isolated to HR, rely on configurable placeholder env values, and fail safely back to manual link entry when Google values are missing.
 */

import { getGoogleDriveIntegrationStatus, getGoogleDriveRuntimeConfig } from "@/modules/hr/googleDriveConfig";

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export const HR_SUPPORTED_GOOGLE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation",
] as const;

export type SupportedGoogleMimeType = (typeof HR_SUPPORTED_GOOGLE_MIME_TYPES)[number];

export type GoogleDriveSelectedFile = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  storageProvider: "google_drive";
};

export type GooglePickerDocument = {
  id?: string;
  name?: string;
  mimeType?: string;
  url?: string;
};

export type GooglePickerResponse = {
  action?: string;
  docs?: GooglePickerDocument[];
};

const GIS_SCRIPT_ID = "google-identity-services-client";
const PICKER_SCRIPT_ID = "google-picker-api";
const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const PICKER_SCRIPT_SRC = "https://apis.google.com/js/api.js";

let gisScriptPromise: Promise<void> | null = null;
let pickerScriptPromise: Promise<void> | null = null;
let pickerApiLoadPromise: Promise<void> | null = null;

function getGoogleNamespace() {
  return window.google;
}

function getGooglePickerNamespace() {
  return getGoogleNamespace()?.picker;
}

function getGoogleOAuthNamespace() {
  return getGoogleNamespace()?.accounts?.oauth2;
}

function loadScript(id: string, src: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Drive integration requires a browser environment."));
  }

  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === "true") {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export function ensureGoogleIdentityScript() {
  if (!gisScriptPromise) {
    gisScriptPromise = loadScript(GIS_SCRIPT_ID, GIS_SCRIPT_SRC);
  }

  return gisScriptPromise;
}

export function ensureGooglePickerScript() {
  if (!pickerScriptPromise) {
    pickerScriptPromise = loadScript(PICKER_SCRIPT_ID, PICKER_SCRIPT_SRC);
  }

  return pickerScriptPromise;
}

export async function ensureGooglePickerApiLoaded() {
  await ensureGooglePickerScript();

  if (!pickerApiLoadPromise) {
    pickerApiLoadPromise = new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined" || !window.gapi?.load) {
        reject(new Error("Google API client did not initialize correctly."));
        return;
      }

      window.gapi.load("picker", {
        callback: () => resolve(),
        onerror: () => reject(new Error("Google Picker failed to load.")),
      });
    });
  }

  return pickerApiLoadPromise;
}

export async function ensureGoogleDriveFrontendReady() {
  const status = getGoogleDriveIntegrationStatus();
  if (!status.isConfigured) {
    throw new Error(
      "Google Drive integration is not configured. Add VITE_GOOGLE_OAUTH_CLIENT_ID, VITE_GOOGLE_API_KEY, and VITE_GOOGLE_CLOUD_APP_ID before using the picker.",
    );
  }

  await Promise.all([ensureGoogleIdentityScript(), ensureGooglePickerApiLoaded()]);

  if (!getGoogleOAuthNamespace()) {
    throw new Error("Google Identity Services is unavailable in the browser.");
  }

  if (!getGooglePickerNamespace()) {
    throw new Error("Google Picker is unavailable in the browser.");
  }

  return {
    ...getGoogleDriveRuntimeConfig(),
    pickerScope: GOOGLE_DRIVE_SCOPE,
  };
}

export function isSupportedHrDocumentMimeType(mimeType: string) {
  return HR_SUPPORTED_GOOGLE_MIME_TYPES.includes(mimeType as SupportedGoogleMimeType);
}

export function getSupportedHrDocumentMimeTypeLabel() {
  return "PDF, JPG, PNG, WEBP, Google Docs, Google Sheets, or Google Slides";
}

export function buildGoogleDriveFileOpenUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function buildGoogleDrivePickerDocsView() {
  const picker = getGooglePickerNamespace();
  if (!picker?.DocsView) {
    throw new Error("Google Picker DocsView is unavailable.");
  }

  return new picker.DocsView()
    .setIncludeFolders(false)
    .setSelectFolderEnabled(false)
    .setMimeTypes(HR_SUPPORTED_GOOGLE_MIME_TYPES.join(","));
}

export function buildGoogleDrivePickerUploadView() {
  const picker = getGooglePickerNamespace();
  if (!picker?.DocsUploadView) {
    return null;
  }

  return new picker.DocsUploadView();
}

export async function requestGoogleDriveAccessToken() {
  const config = await ensureGoogleDriveFrontendReady();
  const oauth2 = getGoogleOAuthNamespace();

  return new Promise<string>((resolve, reject) => {
    if (!oauth2?.initTokenClient) {
      reject(new Error("Google authorization could not be initialized."));
      return;
    }

    const tokenClient = oauth2.initTokenClient({
      client_id: config.oauthClientId,
      scope: config.pickerScope,
      callback: (response: google.accounts.oauth2.TokenResponse) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || "Google authorization was not completed."));
          return;
        }

        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

export async function openGoogleDrivePicker() {
  const config = await ensureGoogleDriveFrontendReady();
  const accessToken = await requestGoogleDriveAccessToken();
  const picker = getGooglePickerNamespace();

  return new Promise<GoogleDriveSelectedFile>((resolve, reject) => {
    if (!picker?.PickerBuilder || !picker?.Action) {
      reject(new Error("Google Picker is unavailable in the browser."));
      return;
    }

    const docsView = buildGoogleDrivePickerDocsView();
    const uploadView = buildGoogleDrivePickerUploadView();

    const handlePickerResponse = (data: unknown) => {
      const response = data as GooglePickerResponse;
      const action = response.action;

      if (action === picker.Action.CANCEL) {
        reject(new Error("Google Drive selection was cancelled."));
        return;
      }

      if (action !== picker.Action.PICKED) {
        reject(new Error("Google Drive did not return a selected file."));
        return;
      }

      const file = response.docs?.[0];
      if (!file?.id || !file.name || !file.mimeType) {
        reject(new Error("Google Drive returned an incomplete file record."));
        return;
      }

      if (!isSupportedHrDocumentMimeType(file.mimeType)) {
        reject(new Error(`Unsupported document type. Allowed types: ${getSupportedHrDocumentMimeTypeLabel()}.`));
        return;
      }

      resolve({
        id: file.id,
        name: file.name,
        url: file.url || buildGoogleDriveFileOpenUrl(file.id),
        mimeType: file.mimeType,
        storageProvider: "google_drive",
      });
    };

    const builder = new picker.PickerBuilder()
      .setAppId(config.appId)
      .setDeveloperKey(config.apiKey)
      .setOAuthToken(accessToken)
      .setCallback(handlePickerResponse)
      .addView(docsView)
      .setTitle("Select or upload an HR compliance document");

    if (uploadView) {
      builder.addView(uploadView);
    }

    const pickerInstance = builder.build();
    pickerInstance.setVisible(true);
  });
}
