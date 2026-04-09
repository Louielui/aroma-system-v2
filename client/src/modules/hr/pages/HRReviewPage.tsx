/**
 * File intent: render the HR review queue page for employee document compliance.
 * Design reminder for this file: keep the flow local-first, operationally clear, and limited to reviewing pending documents without backend integration or notifications.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import DocumentList from "@/modules/hr/components/DocumentList";
import DocumentPreviewPanel from "@/modules/hr/components/DocumentPreviewPanel";
import { hrRepository } from "@/modules/hr/hr.repository";
import {
  createDefaultEmployeeDocumentReviewValues,
  parseEmployeeDocumentReview,
  type EmployeeDocumentReviewFormValues,
} from "@/modules/hr/hr.validation";
import type { EmployeeDocument } from "@/modules/hr/hr.types";

const DEFAULT_REVIEWER_ID = "person-ava-chen";

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "1rem",
  padding: "1rem",
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d0d7de",
  borderRadius: "0.75rem",
  padding: "0.75rem 0.875rem",
  background: "#ffffff",
};

export default function HRReviewPage() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [formValues, setFormValues] = useState<Record<string, EmployeeDocumentReviewFormValues>>({});
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  useEffect(() => {
    void loadPendingReviewDocuments();
  }, []);

  async function loadPendingReviewDocuments(preferredDocumentId?: string) {
    try {
      setError("");
      const data = await hrRepository.listPendingReviewDocuments();
      setDocuments(data);
      setSelectedDocumentId(preferredDocumentId ?? data[0]?.id ?? null);
      setFormValues((current) => {
        const next = { ...current };

        data.forEach((document) => {
          if (!next[document.id]) {
            next[document.id] = {
              ...createDefaultEmployeeDocumentReviewValues(),
              reviewed_by_user_id: DEFAULT_REVIEWER_ID,
            };
          }
        });

        return next;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load pending review documents.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateFormValue(documentId: string, key: keyof EmployeeDocumentReviewFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [documentId]: {
        ...(current[documentId] ?? { ...createDefaultEmployeeDocumentReviewValues(), reviewed_by_user_id: DEFAULT_REVIEWER_ID }),
        [key]: value,
      },
    }));
  }

  async function handleReview(document: EmployeeDocument) {
    const currentValues = formValues[document.id] ?? {
      ...createDefaultEmployeeDocumentReviewValues(),
      reviewed_by_user_id: DEFAULT_REVIEWER_ID,
    };

    try {
      setError("");
      setSuccess("");
      setActiveDocumentId(document.id);
      const parsed = parseEmployeeDocumentReview(currentValues);
      await hrRepository.reviewEmployeeDocument(document.id, parsed);
      setSuccess(`Reviewed document: ${document.document_label}`);
      await loadPendingReviewDocuments(selectedDocumentId === document.id ? undefined : selectedDocumentId ?? undefined);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review document.");
    } finally {
      setActiveDocumentId(null);
    }
  }

  const selectedDocument = useMemo(() => {
    return documents.find((document) => document.id === selectedDocumentId) ?? documents[0] ?? null;
  }, [documents, selectedDocumentId]);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header style={{ ...cardStyle, display: "grid", gap: "0.875rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>HR</p>
            <h1 style={{ margin: "0 0 0.35rem" }}>Document Review Queue</h1>
            <p style={{ margin: 0, color: "#475569", maxWidth: "60rem" }}>
              This queue lets HR inspect Google Drive linked records, approve or reject pending submissions, and capture review notes without triggering notifications.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/hr/employees">Employee Compliance</Link>
            <Link href="/hr/review">Document Review</Link>
          </div>
        </div>
      </header>

      {isLoading ? (
        <section style={cardStyle}>
          <p style={{ margin: 0, color: "#475569" }}>Loading review queue...</p>
        </section>
      ) : null}

      {error ? (
        <section style={{ ...cardStyle, borderColor: "#fca5a5", background: "#fef2f2" }}>
          <p style={{ margin: 0, color: "#991b1b", fontWeight: 600 }}>{error}</p>
        </section>
      ) : null}

      {success ? (
        <section style={{ ...cardStyle, borderColor: "#86efac", background: "#f0fdf4" }}>
          <p style={{ margin: 0, color: "#166534", fontWeight: 600 }}>{success}</p>
        </section>
      ) : null}

      {!isLoading ? (
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.95fr)", gap: "1rem", alignItems: "start" }}>
          <div style={{ ...cardStyle, display: "grid", gap: "1rem" }}>
            <div>
              <h2 style={{ margin: "0 0 0.35rem" }}>Pending Documents</h2>
              <p style={{ margin: 0, color: "#475569" }}>
                Reviewers can inspect each pending record, open the shared file, preview supported Google Drive documents, and save an approval or rejection decision.
              </p>
            </div>
            <DocumentList
              documents={documents}
              showEmployeeProfileId
              emptyMessage="No documents are waiting for HR review."
              onPreviewDocument={(document) => setSelectedDocumentId(document.id)}
              renderActions={(document) => {
                const currentValues = formValues[document.id] ?? {
                  ...createDefaultEmployeeDocumentReviewValues(),
                  reviewed_by_user_id: DEFAULT_REVIEWER_ID,
                };

                return (
                  <div style={{ display: "grid", gap: "0.75rem", minWidth: "16rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                      <label style={{ display: "grid", gap: "0.35rem" }}>
                        <span style={{ fontWeight: 600 }}>Decision</span>
                        <select
                          style={inputStyle}
                          value={currentValues.decision}
                          onChange={(event) => updateFormValue(document.id, "decision", event.target.value)}
                        >
                          <option value="approve">Approve</option>
                          <option value="reject">Reject</option>
                        </select>
                      </label>
                      <label style={{ display: "grid", gap: "0.35rem" }}>
                        <span style={{ fontWeight: 600 }}>Reviewer User ID</span>
                        <input
                          style={inputStyle}
                          value={currentValues.reviewed_by_user_id}
                          onChange={(event) => updateFormValue(document.id, "reviewed_by_user_id", event.target.value)}
                        />
                      </label>
                    </div>
                    <label style={{ display: "grid", gap: "0.35rem" }}>
                      <span style={{ fontWeight: 600 }}>Review Notes</span>
                      <textarea
                        style={{ ...inputStyle, minHeight: "6.5rem", resize: "vertical" }}
                        value={currentValues.review_notes}
                        onChange={(event) => updateFormValue(document.id, "review_notes", event.target.value)}
                        rows={4}
                        placeholder="Add review details or reason for rejection."
                      />
                    </label>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={activeDocumentId === document.id}
                        onClick={() => void handleReview(document)}
                        style={{
                          border: "1px solid #0f172a",
                          background: "#0f172a",
                          color: "#ffffff",
                          borderRadius: "0.75rem",
                          padding: "0.75rem 1rem",
                          fontWeight: 600,
                        }}
                      >
                        {activeDocumentId === document.id ? "Saving..." : currentValues.decision === "reject" ? "Reject document" : "Approve document"}
                      </button>
                      <button
                        type="button"
                        disabled={activeDocumentId === document.id}
                        onClick={() => setSelectedDocumentId(document.id)}
                        style={{
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0f172a",
                          borderRadius: "0.75rem",
                          padding: "0.75rem 1rem",
                          fontWeight: 600,
                        }}
                      >
                        Focus preview
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          </div>

          <DocumentPreviewPanel document={selectedDocument} title="Review preview" />
        </section>
      ) : null}
    </section>
  );
}
