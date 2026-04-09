/**
 * File intent: render a reusable document list for the HR employee document compliance module.
 * Design reminder for this file: keep the component read-focused, visually grouped by document status, and flexible enough to support both employee views and the HR review queue.
 */

import { useMemo, useState } from "react";
import ExpiryIndicator from "@/modules/hr/components/ExpiryIndicator";
import {
  buildGoogleDriveOpenUrl,
  deriveDocumentDisplayStatus,
} from "@/modules/hr/hr.validation";
import { hrDocumentStatusLabels, hrDocumentTypeLabels, type EmployeeDocument } from "@/modules/hr/hr.types";

type DocumentListProps = {
  documents: EmployeeDocument[];
  emptyMessage?: string;
  renderActions?: (document: EmployeeDocument) => React.ReactNode;
  showEmployeeProfileId?: boolean;
  onPreviewDocument?: (document: EmployeeDocument) => void;
};

const statusOrder: Array<ReturnType<typeof deriveDocumentDisplayStatus>> = [
  "pending_review",
  "expiring",
  "expired",
  "valid",
  "rejected",
];

const statusSectionStyles: Record<string, React.CSSProperties> = {
  pending_review: {
    background: "#fff7ed",
    border: "1px solid #fdba74",
  },
  expiring: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
  },
  expired: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
  },
  valid: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
  },
  rejected: {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
  },
};

const badgeStyles: Record<string, React.CSSProperties> = {
  pending_review: {
    background: "#ffedd5",
    color: "#9a3412",
    border: "1px solid #fdba74",
  },
  expiring: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  expired: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
  },
  valid: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
  },
  rejected: {
    background: "#e2e8f0",
    color: "#334155",
    border: "1px solid #cbd5e1",
  },
};

function DocumentStatusBadge({ status }: { status: ReturnType<typeof deriveDocumentDisplayStatus> }) {
  return (
    <span
      style={{
        ...badgeStyles[status],
        display: "inline-flex",
        alignItems: "center",
        padding: "0.3rem 0.65rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {hrDocumentStatusLabels[status]}
    </span>
  );
}

export default function DocumentList({
  documents,
  emptyMessage = "No document records found.",
  renderActions,
  showEmployeeProfileId = false,
  onPreviewDocument,
}: DocumentListProps) {
  const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({});

  const groupedDocuments = useMemo(() => {
    return statusOrder
      .map((status) => ({
        status,
        items: documents.filter((document) => deriveDocumentDisplayStatus(document) === status),
      }))
      .filter((entry) => entry.items.length > 0);
  }, [documents]);

  if (documents.length === 0) {
    return (
      <section
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: "1rem",
          padding: "1rem",
          background: "#f8fafc",
        }}
      >
        <p style={{ margin: 0, color: "#475569" }}>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {groupedDocuments.map(({ status, items }) => {
        const isExpanded = expandedStatuses[status] ?? true;

        return (
          <section
            key={status}
            style={{
              ...statusSectionStyles[status],
              borderRadius: "1rem",
              padding: "1rem",
              display: "grid",
              gap: "0.875rem",
            }}
          >
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <DocumentStatusBadge status={status} />
                <strong>{items.length} document{items.length > 1 ? "s" : ""}</strong>
              </div>
              <button
                type="button"
                onClick={() => setExpandedStatuses((current) => ({ ...current, [status]: !isExpanded }))}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  borderRadius: "0.75rem",
                  padding: "0.5rem 0.875rem",
                  fontWeight: 600,
                }}
              >
                {isExpanded ? "Collapse" : "Expand"}
              </button>
            </header>

            {isExpanded ? (
              <div style={{ display: "grid", gap: "0.875rem" }}>
                {items.map((document) => {
                  const derivedStatus = deriveDocumentDisplayStatus(document);
                  const openUrl = buildGoogleDriveOpenUrl(document.file_url);

                  return (
                    <article
                      key={document.id}
                      style={{
                        border: "1px solid rgba(148, 163, 184, 0.35)",
                        borderRadius: "1rem",
                        background: "#ffffff",
                        padding: "1rem",
                        display: "grid",
                        gap: "0.875rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ display: "grid", gap: "0.25rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "1rem" }}>{document.file_name || document.document_label}</strong>
                            <DocumentStatusBadge status={derivedStatus} />
                          </div>
                          <span style={{ color: "#475569" }}>{document.document_label}</span>
                          <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{hrDocumentTypeLabels[document.document_type]}</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
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
                              padding: "0.65rem 0.9rem",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            Open file
                          </a>
                          {onPreviewDocument ? (
                            <button
                              type="button"
                              onClick={() => onPreviewDocument(document)}
                              style={{
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#0f172a",
                                borderRadius: "0.75rem",
                                padding: "0.65rem 0.9rem",
                                fontWeight: 600,
                              }}
                            >
                              Preview
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "0.875rem",
                        }}
                      >
                        {showEmployeeProfileId ? (
                          <div>
                            <p style={{ margin: "0 0 0.25rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              Employee Profile
                            </p>
                            <p style={{ margin: 0 }}>{document.employee_profile_id}</p>
                          </div>
                        ) : null}
                        <div>
                          <p style={{ margin: "0 0 0.25rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Expiry Date
                          </p>
                          <p style={{ margin: "0 0 0.2rem" }}>{document.expiry_date || "No expiry date"}</p>
                          <ExpiryIndicator expiryDate={document.expiry_date} />
                        </div>
                        <div>
                          <p style={{ margin: "0 0 0.25rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Document Number
                          </p>
                          <p style={{ margin: 0 }}>{document.document_number || "—"}</p>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 0.25rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Uploaded By
                          </p>
                          <p style={{ margin: 0 }}>{document.uploaded_by_type}</p>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 0.25rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Reviewed By
                          </p>
                          <p style={{ margin: 0 }}>{document.reviewed_by_user_id || "—"}</p>
                        </div>
                      </div>

                      {document.review_notes ? (
                        <div
                          style={{
                            borderRadius: "0.875rem",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            padding: "0.875rem",
                          }}
                        >
                          <p style={{ margin: "0 0 0.25rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Review Notes
                          </p>
                          <p style={{ margin: 0 }}>{document.review_notes}</p>
                        </div>
                      ) : null}

                      {renderActions ? (
                        <div
                          style={{
                            borderTop: "1px solid #e2e8f0",
                            paddingTop: "0.875rem",
                          }}
                        >
                          {renderActions(document)}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
