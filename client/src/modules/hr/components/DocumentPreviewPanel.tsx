/**
 * File intent: render a lightweight document preview panel for Google Drive based document records.
 * Design reminder for this file: keep preview behavior frontend-only, practical, and optional, with a clear fallback to opening the file in a new tab.
 */

import {
  buildGoogleDriveOpenUrl,
  buildGoogleDrivePreviewUrl,
  isGoogleDriveUrl,
} from "@/modules/hr/hr.validation";
import type { EmployeeDocument } from "@/modules/hr/hr.types";

type DocumentPreviewPanelProps = {
  document: EmployeeDocument | null;
  title?: string;
};

export default function DocumentPreviewPanel({
  document,
  title = "Document preview",
}: DocumentPreviewPanelProps) {
  if (!document) {
    return (
      <section
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: "1rem",
          padding: "1rem",
          background: "#f8fafc",
        }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ marginBottom: 0, color: "#475569" }}>
          Select a document with a file link to preview it here.
        </p>
      </section>
    );
  }

  if (!document.file_url) {
    return (
      <section
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: "1rem",
          padding: "1rem",
          background: "#f8fafc",
        }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ marginBottom: 0, color: "#475569" }}>
          This document does not have a file link yet.
        </p>
      </section>
    );
  }

  const canPreview = isGoogleDriveUrl(document.file_url);
  const previewUrl = canPreview ? buildGoogleDrivePreviewUrl(document.file_url) : document.file_url;
  const openUrl = buildGoogleDriveOpenUrl(document.file_url);

  return (
    <section
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "1rem",
        padding: "1rem",
        background: "#ffffff",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        display: "grid",
        gap: "0.875rem",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: "0 0 0.25rem" }}>{title}</h3>
          <p style={{ margin: 0, fontWeight: 600 }}>{document.file_name || document.document_label}</p>
          <p style={{ margin: "0.25rem 0 0", color: "#475569" }}>{document.document_label}</p>
        </div>
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #0f172a",
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Open file
        </a>
      </header>

      {canPreview ? (
        <iframe
          title={`${document.document_label} preview`}
          src={previewUrl}
          style={{
            width: "100%",
            minHeight: "32rem",
            border: "1px solid #e2e8f0",
            borderRadius: "0.875rem",
            background: "#f8fafc",
          }}
        />
      ) : (
        <div
          style={{
            border: "1px dashed #cbd5e1",
            borderRadius: "0.875rem",
            padding: "1rem",
            background: "#f8fafc",
          }}
        >
          <p style={{ margin: 0, color: "#475569" }}>
            Inline preview is only available for supported Google Drive or Google Docs links in this phase. You can still use the open file button.
          </p>
        </div>
      )}
    </section>
  );
}
