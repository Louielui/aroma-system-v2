/**
 * File intent: provide the HR module's Google Drive service for GIS token acquisition and Google Picker file selection.
 * Design reminder for this file: keep the flow frontend-only, fail safely to manual link fallback, and isolate Google-specific orchestration from the upload form UI.
 */

import {
  buildGoogleDriveFileOpenUrl,
  buildGoogleDrivePickerDocsView,
  buildGoogleDrivePickerUploadView,
  ensureGoogleDriveFrontendReady,
  getSupportedHrDocumentMimeTypeLabel,
  isSupportedHrDocumentMimeType,
  requestGoogleDriveAccessToken,
  type GoogleDriveSelectedFile,
  type GooglePickerResponse,
} from "@/modules/hr/google-drive";
import { getGoogleDriveIntegrationStatus, getGoogleDriveRuntimeConfig } from "@/modules/hr/googleDriveConfig";

export type GoogleDrivePickerResult = GoogleDriveSelectedFile;

export function getHrGoogleDriveIntegrationStatus() {
  return getGoogleDriveIntegrationStatus();
}

export async function requestAccessToken() {
  return requestGoogleDriveAccessToken();
}

export async function openDrivePicker(accessToken: string): Promise<GoogleDrivePickerResult> {
  await ensureGoogleDriveFrontendReady();

  const config = getGoogleDriveRuntimeConfig();
  const picker = window.google?.picker;

  return new Promise<GoogleDrivePickerResult>((resolve, reject) => {
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

    builder.build().setVisible(true);
  });
}

export async function selectGoogleDriveDocument() {
  const accessToken = await requestAccessToken();
  return openDrivePicker(accessToken);
}
