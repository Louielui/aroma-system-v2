/**
 * File intent: render the Phase 3A document submission form with Google Drive Picker as the primary path and manual Google Drive link fallback.
 * Design reminder for this file: keep submission practical, local-first, and centered on clear source selection, inline validation, and safe fallback behavior without backend integration.
 */

import { useMemo, useState } from "react";
import { getSupportedHrDocumentMimeTypeLabel } from "@/modules/hr/google-drive";
import {
  createDefaultEmployeeDocumentFormValues,
  deriveGoogleDriveFileName,
  isGoogleDriveUrl,
  parseEmployeeDocumentInput,
  type EmployeeDocumentFormValues,
} from "@/modules/hr/hr.validation";
import { HR_GOOGLE_DRIVE_ENV_KEYS } from "@/modules/hr/googleDriveConfig";
import { getHrGoogleDriveIntegrationStatus, selectGoogleDriveDocument } from "@/modules/hr/services/googleDriveService";
import type { EmployeeDocument, EmployeeProfile, UploadedByType } from "@/modules/hr/hr.types";
import { hrDocumentTypeLabels } from "@/modules/hr/hr.types";

type DocumentUploadFormProps = {
  employee: EmployeeProfile;
  defaultUploadedByType?: UploadedByType;
  onSubmit: (input: ReturnType<typeof parseEmployeeDocumentInput>) => Promise<EmployeeDocument>;
  onSubmitted?: (document: EmployeeDocument) => void;
};

type FormErrors = Partial<Record<keyof EmployeeDocumentFormValues, string>>;

const fieldLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.375rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d0d7de",
  borderRadius: "0.75rem",
  padding: "0.75rem 0.875rem",
  background: "#ffffff",
};

const helperStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.875rem",
  color: "#475569",
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.875rem",
  color: "#b91c1c",
  fontWeight: 600,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "1rem",
  padding: "1rem",
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

function formatZodError(error: unknown): FormErrors {
  if (!(error instanceof Error) || !("issues" in error)) {
    return {};
  }

  const issues = (error as { issues?: Array<{ path?: Array<string | number>; message?: string }> }).issues ?? [];
  return issues.reduce<FormErrors>((accumulator, issue) => {
    const key = issue.path?.[0];
    if (typeof key === "string" && !(key in accumulator) && issue.message) {
      accumulator[key as keyof EmployeeDocumentFormValues] = issue.message;
    }
    return accumulator;
  }, {});
}

export default function DocumentUploadForm({
  employee,
  defaultUploadedByType = "employee",
  onSubmit,
  onSubmitted,
}: DocumentUploadFormProps) {
  const [values, setValues] = useState<EmployeeDocumentFormValues>({
    ...createDefaultEmployeeDocumentFormValues(employee.id),
    uploaded_by_type: defaultUploadedByType,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectingFromDrive, setIsSelectingFromDrive] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sourceMode, setSourceMode] = useState<"picker" | "manual">("picker");

  const integrationStatus = useMemo(() => getHrGoogleDriveIntegrationStatus(), []);
  const isDriveLink = useMemo(() => isGoogleDriveUrl(values.file_url || ""), [values.file_url]);
  const suggestedFileName = useMemo(() => {
    if (!values.file_url.trim()) {
      return "";
    }

    return deriveGoogleDriveFileName(values.file_url, values.document_label);
  }, [values.document_label, values.file_url]);

  const selectedDriveSummary = useMemo(() => {
    if (values.storage_provider !== "google_drive" || !values.google_drive_file_id) {
      return null;
    }

    return {
      fileName: values.file_name || values.document_label || "Google Drive file",
      mimeType: values.file_mime_type || "Unknown",
      fileId: values.google_drive_file_id,
    };
  }, [values.document_label, values.file_name, values.file_mime_type, values.google_drive_file_id, values.storage_provider]);

  function clearFieldError<Key extends keyof EmployeeDocumentFormValues>(key: Key) {
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      return {
        ...current,
        [key]: undefined,
      };
    });
  }

  function updateField<Key extends keyof EmployeeDocumentFormValues>(key: Key, value: EmployeeDocumentFormValues[Key]) {
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (key === "file_url") {
        const nextUrl = String(value ?? "");
        if (!current.file_name.trim() && nextUrl.trim()) {
          next.file_name = deriveGoogleDriveFileName(nextUrl, current.document_label);
        }
      }

      if (key === "document_label" && !current.file_name.trim() && current.file_url.trim()) {
        next.file_name = deriveGoogleDriveFileName(current.file_url, String(value ?? ""));
      }

      return next;
    });

    clearFieldError(key);
  }

  function activateManualMode() {
    setSourceMode("manual");
    setValues((current) => ({
      ...current,
      storage_provider: "manual",
      google_drive_file_id: "",
      file_mime_type: current.storage_provider === "google_drive" ? "" : current.file_mime_type,
    }));
    clearFieldError("storage_provider");
    clearFieldError("google_drive_file_id");
    clearFieldError("file_mime_type");
    setError("");
    setSuccess("");
  }

  async function handleSelectFromGoogleDrive() {
    setError("");
    setSuccess("");
    setErrors({});

    try {
      setIsSelectingFromDrive(true);
      const selectedFile = await selectGoogleDriveDocument();

      setValues((current) => ({
        ...current,
        storage_provider: "google_drive",
        file_url: selectedFile.url,
        file_name: selectedFile.name,
        file_mime_type: selectedFile.mimeType,
        google_drive_file_id: selectedFile.id,
        document_label: current.document_label.trim() || selectedFile.name,
      }));
      setSourceMode("picker");
      setSuccess(`Selected Google Drive file: ${selectedFile.name}`);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "Unable to select a file from Google Drive.");
    } finally {
      setIsSelectingFromDrive(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setErrors({});

    try {
      setIsSubmitting(true);
      const parsed = parseEmployeeDocumentInput(values);
      const created = await onSubmit(parsed);
      setValues({
        ...createDefaultEmployeeDocumentFormValues(employee.id),
        uploaded_by_type: values.uploaded_by_type,
      });
      setSourceMode("picker");
      setSuccess(`Document submitted for review: ${created.document_label}`);
      onSubmitted?.(created);
    } catch (submitError) {
      const nextErrors = formatZodError(submitError);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
      }
      setError(submitError instanceof Error ? submitError.message : "Unable to submit document.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
      <fieldset disabled={isSubmitting || isSelectingFromDrive} style={{ border: "none", margin: 0, padding: 0, display: "grid", gap: "1rem" }}>
        <div style={cardStyle}>
          <legend style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>Submission Context</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.875rem" }}>
            <div>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 600 }}>Employee</p>
              <p style={{ margin: 0 }}>{employee.full_name}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 600 }}>Employee ID</p>
              <p style={{ margin: 0 }}>{employee.employee_id}</p>
            </div>
            <label style={fieldLabelStyle}>
              <span>
                Uploaded By <strong>(required)</strong>
              </span>
              <select
                style={inputStyle}
                value={values.uploaded_by_type}
                onChange={(event) => updateField("uploaded_by_type", event.target.value as UploadedByType)}
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </select>
            </label>
          </div>
        </div>

        <div style={cardStyle}>
          <legend style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>Document Details</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.875rem" }}>
            <label style={fieldLabelStyle}>
              <span>
                Document Type <strong>(required)</strong>
              </span>
              <select
                style={inputStyle}
                value={values.document_type}
                onChange={(event) => updateField("document_type", event.target.value as EmployeeDocumentFormValues["document_type"])}
              >
                {Object.entries(hrDocumentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.document_type ? <p style={errorStyle}>{errors.document_type}</p> : null}
            </label>

            <label style={fieldLabelStyle}>
              <span>
                Document Label <strong>(required)</strong>
              </span>
              <input
                style={inputStyle}
                value={values.document_label}
                onChange={(event) => updateField("document_label", event.target.value)}
                placeholder="e.g. Passport renewal 2026"
              />
              {errors.document_label ? <p style={errorStyle}>{errors.document_label}</p> : null}
            </label>

            <label style={fieldLabelStyle}>
              <span>File Name (optional)</span>
              <input
                style={inputStyle}
                value={values.file_name}
                onChange={(event) => updateField("file_name", event.target.value)}
                placeholder="e.g. ava-chen-passport.pdf"
              />
              <p style={helperStyle}>Leave blank to auto-fill a display name from the selected Drive file or pasted link.</p>
              {suggestedFileName ? <p style={helperStyle}>Suggested name: {suggestedFileName}</p> : null}
              {errors.file_name ? <p style={errorStyle}>{errors.file_name}</p> : null}
            </label>

            <label style={fieldLabelStyle}>
              <span>Document Number (optional)</span>
              <input
                style={inputStyle}
                value={values.document_number}
                onChange={(event) => updateField("document_number", event.target.value)}
                placeholder="Optional"
              />
              {errors.document_number ? <p style={errorStyle}>{errors.document_number}</p> : null}
            </label>
          </div>
        </div>

        <div style={cardStyle}>
          <legend style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>Google Drive Source</legend>
          <div style={{ display: "grid", gap: "0.875rem" }}>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={isSubmitting || isSelectingFromDrive || !integrationStatus.isConfigured}
                onClick={handleSelectFromGoogleDrive}
                style={{
                  border: "1px solid #0f172a",
                  background: "#0f172a",
                  color: "#ffffff",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  fontWeight: 600,
                }}
              >
                {isSelectingFromDrive ? "Opening Google Drive..." : "Select from Google Drive"}
              </button>
              <button
                type="button"
                disabled={isSubmitting || isSelectingFromDrive}
                onClick={activateManualMode}
                style={{
                  border: "1px solid #cbd5e1",
                  background: sourceMode === "manual" ? "#eff6ff" : "#ffffff",
                  color: "#0f172a",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  fontWeight: 600,
                }}
              >
                Use manual Google Drive link
              </button>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: "999px",
                  padding: "0.35rem 0.65rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  background: sourceMode === "picker" ? "#dcfce7" : "#e2e8f0",
                  color: sourceMode === "picker" ? "#166534" : "#334155",
                }}
              >
                {sourceMode === "picker" ? "Picker-first flow" : "Manual fallback mode"}
              </span>
            </div>

            {integrationStatus.isConfigured ? (
              <p style={helperStyle}>
                The picker requests the minimum Google Drive scope and only allows supported document types: {getSupportedHrDocumentMimeTypeLabel()}.
              </p>
            ) : (
              <div
                style={{
                  borderRadius: "0.875rem",
                  border: "1px solid #fdba74",
                  background: "#fff7ed",
                  padding: "0.875rem",
                  display: "grid",
                  gap: "0.35rem",
                }}
              >
                <p style={{ ...helperStyle, color: "#9a3412", fontWeight: 700 }}>
                  Google Drive picker is disabled until placeholder configuration values are added.
                </p>
                <p style={{ ...helperStyle, color: "#9a3412" }}>
                  Add <strong>{HR_GOOGLE_DRIVE_ENV_KEYS.oauthClientId}</strong>, <strong>{HR_GOOGLE_DRIVE_ENV_KEYS.apiKey}</strong>, and <strong>{HR_GOOGLE_DRIVE_ENV_KEYS.appId}</strong> to the frontend environment settings, then reload the app.
                </p>
                <p style={{ ...helperStyle, color: "#9a3412" }}>
                  You can still continue with the manual Google Drive link fallback below.
                </p>
              </div>
            )}

            {selectedDriveSummary ? (
              <div
                style={{
                  borderRadius: "0.875rem",
                  border: "1px solid #86efac",
                  background: "#f0fdf4",
                  padding: "0.875rem",
                  display: "grid",
                  gap: "0.4rem",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: "#166534" }}>Selected Google Drive file</p>
                <p style={{ ...helperStyle, color: "#166534" }}>
                  <strong>Name:</strong> {selectedDriveSummary.fileName}
                </p>
                <p style={{ ...helperStyle, color: "#166534" }}>
                  <strong>MIME Type:</strong> {selectedDriveSummary.mimeType}
                </p>
                <p style={{ ...helperStyle, color: "#166534" }}>
                  <strong>Drive File ID:</strong> {selectedDriveSummary.fileId}
                </p>
              </div>
            ) : null}

            {errors.google_drive_file_id ? <p style={errorStyle}>{errors.google_drive_file_id}</p> : null}
            {errors.file_mime_type ? <p style={errorStyle}>{errors.file_mime_type}</p> : null}
          </div>
        </div>

        <div style={cardStyle}>
          <legend style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>Drive Link and Dates</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.875rem" }}>
            <label style={{ ...fieldLabelStyle, gridColumn: "1 / -1" }}>
              <span>
                Google Drive Link <strong>(required)</strong>
              </span>
              <input
                style={inputStyle}
                value={values.file_url}
                onChange={(event) => {
                  updateField("file_url", event.target.value);
                  setSourceMode("manual");
                  setValues((current) => ({
                    ...current,
                    storage_provider: "manual",
                    google_drive_file_id: "",
                  }));
                }}
                placeholder="https://drive.google.com/... or https://docs.google.com/..."
              />
              <p style={helperStyle}>
                Paste a Google Drive or Google Docs link if you want to bypass the picker. Manual fallback stays available even when picker credentials are missing.
              </p>
              {values.file_url.trim() ? (
                <p style={{ ...helperStyle, color: isDriveLink ? "#166534" : "#b91c1c", fontWeight: 600 }}>
                  {isDriveLink ? "Google Drive link format looks valid." : "This link must be a Google Drive or Google Docs URL."}
                </p>
              ) : null}
              {errors.file_url ? <p style={errorStyle}>{errors.file_url}</p> : null}
            </label>

            <label style={fieldLabelStyle}>
              <span>Issue Date (optional)</span>
              <input style={inputStyle} type="date" value={values.issue_date} onChange={(event) => updateField("issue_date", event.target.value)} />
              {errors.issue_date ? <p style={errorStyle}>{errors.issue_date}</p> : null}
            </label>

            <label style={fieldLabelStyle}>
              <span>Expiry Date (optional)</span>
              <input style={inputStyle} type="date" value={values.expiry_date} onChange={(event) => updateField("expiry_date", event.target.value)} />
              <p style={helperStyle}>Documents with an expiry within 30 days will be shown as expiring.</p>
              {errors.expiry_date ? <p style={errorStyle}>{errors.expiry_date}</p> : null}
            </label>
          </div>
        </div>
      </fieldset>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={isSubmitting || isSelectingFromDrive}
          style={{
            border: "1px solid #0f172a",
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            fontWeight: 600,
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit document for review"}
        </button>
        <button
          type="button"
          disabled={isSubmitting || isSelectingFromDrive}
          onClick={() => {
            setValues({
              ...createDefaultEmployeeDocumentFormValues(employee.id),
              uploaded_by_type: values.uploaded_by_type,
            });
            setSourceMode("picker");
            setErrors({});
            setError("");
            setSuccess("");
          }}
          style={{
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            fontWeight: 600,
          }}
        >
          Reset form
        </button>
      </div>

      <p style={helperStyle}>
        This phase stores a document record, Google Drive metadata, and the Drive link in the local HR repository. It does not add backend uploads, notifications, or scheduling.
      </p>

      {error ? <p style={errorStyle}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#166534", fontWeight: 600 }}>{success}</p> : null}
    </form>
  );
}
