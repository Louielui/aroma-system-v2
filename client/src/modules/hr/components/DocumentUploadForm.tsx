/**
 * File intent: render the Phase 2 document submission form for employee self-upload and HR-assisted upload.
 * Design reminder for this file: keep submission practical, local-first, and centered on Google Drive link handling, inline validation, and clear form grouping without backend integration.
 */

import { useMemo, useState } from "react";
import {
  createDefaultEmployeeDocumentFormValues,
  deriveGoogleDriveFileName,
  isGoogleDriveUrl,
  parseEmployeeDocumentInput,
  type EmployeeDocumentFormValues,
} from "@/modules/hr/hr.validation";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDriveLink = useMemo(() => isGoogleDriveUrl(values.file_url || ""), [values.file_url]);
  const suggestedFileName = useMemo(() => {
    if (!values.file_url.trim()) {
      return "";
    }

    return deriveGoogleDriveFileName(values.file_url, values.document_label);
  }, [values.document_label, values.file_url]);

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
      <fieldset disabled={isSubmitting} style={{ border: "none", margin: 0, padding: 0, display: "grid", gap: "1rem" }}>
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
              <p style={helperStyle}>Leave blank to auto-fill a Google Drive based display name.</p>
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
          <legend style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.75rem" }}>Drive Link and Dates</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.875rem" }}>
            <label style={{ ...fieldLabelStyle, gridColumn: "1 / -1" }}>
              <span>
                Google Drive Link <strong>(required)</strong>
              </span>
              <input
                style={inputStyle}
                value={values.file_url}
                onChange={(event) => updateField("file_url", event.target.value)}
                placeholder="https://drive.google.com/... or https://docs.google.com/..."
              />
              <p style={helperStyle}>Paste a Google Drive or Google Docs link. Full upload or OAuth flow is not part of this phase.</p>
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          onClick={() => {
            setValues({
              ...createDefaultEmployeeDocumentFormValues(employee.id),
              uploaded_by_type: values.uploaded_by_type,
            });
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

      <p style={helperStyle}>This phase stores a document record and Google Drive link only. It does not upload files or connect to a backend.</p>

      {error ? <p style={errorStyle}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#166534", fontWeight: 600 }}>{success}</p> : null}
    </form>
  );
}
