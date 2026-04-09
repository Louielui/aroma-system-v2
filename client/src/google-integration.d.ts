/**
 * File intent: declare minimal frontend types for Google Identity Services, Google Picker, and Vite env placeholders.
 * Design reminder for this file: keep the declarations narrow, frontend-only, and sufficient for HR Google Drive placeholder integration without introducing real credentials.
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_CLOUD_APP_ID?: string;
  readonly VITE_GOOGLE_CLOUD_PROJECT_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace google {
  namespace accounts.oauth2 {
    interface TokenResponse {
      access_token?: string;
      error?: string;
      error_description?: string;
    }

    interface TokenClientConfig {
      client_id: string;
      scope: string;
      callback: (response: TokenResponse) => void;
    }

    interface OverridableTokenClientConfig {
      prompt?: string;
    }

    interface TokenClient {
      requestAccessToken: (config?: OverridableTokenClientConfig) => void;
    }

    function initTokenClient(config: TokenClientConfig): TokenClient;
  }

  namespace picker {
    const Action: {
      PICKED: string;
      CANCEL: string;
    };

    class DocsView {
      setIncludeFolders(value: boolean): DocsView;
      setSelectFolderEnabled(value: boolean): DocsView;
      setMimeTypes(value: string): DocsView;
    }

    class DocsUploadView {}

    class Picker {
      setVisible(value: boolean): void;
    }

    class PickerBuilder {
      setAppId(value: string): PickerBuilder;
      setDeveloperKey(value: string): PickerBuilder;
      setOAuthToken(value: string): PickerBuilder;
      setCallback(callback: (data: unknown) => void): PickerBuilder;
      addView(view: DocsView | DocsUploadView): PickerBuilder;
      setTitle(value: string): PickerBuilder;
      build(): Picker;
    }
  }
}

interface Window {
  gapi?: {
    load: (
      library: string,
      options: {
        callback?: () => void;
        onerror?: () => void;
      },
    ) => void;
  };
  google?: typeof google;
}
