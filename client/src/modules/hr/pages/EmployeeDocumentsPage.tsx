/**
 * File intent: render the HR employee documents page for the Phase 2 compliance experience.
 * Design reminder for this file: keep the page focused on document visibility, Google Drive based submission UX, and local-first preview/review entry points without backend integration.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import ComplianceStatusBadge from "@/modules/hr/components/ComplianceStatusBadge";
import DocumentList from "@/modules/hr/components/DocumentList";
import DocumentPreviewPanel from "@/modules/hr/components/DocumentPreviewPanel";
import DocumentUploadForm from "@/modules/hr/components/DocumentUploadForm";
import { hrRepository } from "@/modules/hr/hr.repository";
import type { EmployeeDocument, EmployeeWithCompliance } from "@/modules/hr/hr.types";

const pageSectionStyle: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "1rem",
  padding: "1rem",
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

export default function EmployeeDocumentsPage() {
  const match = useRoute("/hr/employees/:employeeId/documents");
  const employeeId = match?.[1]?.employeeId ?? "";
  const [record, setRecord] = useState<EmployeeWithCompliance | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadEmployeeDocuments() {
      try {
        const data = await hrRepository.getEmployeeWithComplianceById(employeeId);

        if (!data) {
          throw new Error("Employee compliance record not found.");
        }

        if (isMounted) {
          setRecord(data);
          setDocuments(data.documents);
          setSelectedDocumentId((current) => current ?? data.documents[0]?.id ?? null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load employee documents.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEmployeeDocuments();

    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  async function refreshRecord(preferredDocumentId?: string) {
    const data = await hrRepository.getEmployeeWithComplianceById(employeeId);
    if (data) {
      setRecord(data);
      setDocuments(data.documents);
      setSelectedDocumentId(preferredDocumentId ?? data.documents[0]?.id ?? null);
    }
  }

  const selectedDocument = useMemo(() => {
    return documents.find((document) => document.id === selectedDocumentId) ?? documents[0] ?? null;
  }, [documents, selectedDocumentId]);

  if (isLoading) {
    return <p>Loading employee documents...</p>;
  }

  if (error || !record) {
    return (
      <section>
        <p>{error || "Employee documents not found."}</p>
        <Link href="/hr/employees">Back to employee list</Link>
      </section>
    );
  }

  return (
    <section style={pageSectionStyle}>
      <header style={{ ...cardStyle, display: "grid", gap: "0.875rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>HR</p>
            <h1 style={{ margin: "0 0 0.35rem" }}>{record.employee.full_name} Documents</h1>
            <p style={{ margin: 0, color: "#475569", maxWidth: "60rem" }}>
              Employees can submit document records with Google Drive links, while HR can review pending submissions and use the preview panel to inspect shared files.
            </p>
          </div>
          <ComplianceStatusBadge status={record.compliance_status} showHint />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/hr/employees">Back to employee list</Link>
          <Link href={`/hr/employees/${record.employee.id}`}>View employee detail</Link>
          <Link href="/hr/review">Open document review</Link>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <article style={cardStyle}>
          <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee ID</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{record.employee.employee_id}</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role / Department</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{record.employee.role}</p>
          <p style={{ margin: "0.2rem 0 0", color: "#475569" }}>{record.employee.department}</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Employment Status</p>
          <p style={{ margin: 0, fontWeight: 700, textTransform: "capitalize" }}>{record.employee.employment_status}</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Document Summary</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{record.documents.length} total documents</p>
          <p style={{ margin: "0.2rem 0 0", color: "#475569" }}>
            {record.pending_review_count} pending review · {record.expiring_count} expiring · {record.expired_count} expired
          </p>
        </article>
      </section>

      <section style={{ ...cardStyle, display: "grid", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem" }}>Submit Document</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            This Phase 2 flow creates a local document record, validates Google Drive link format, and resets the form after a successful submission. No external upload integration is performed.
          </p>
        </div>
        <DocumentUploadForm
          employee={record.employee}
          defaultUploadedByType="employee"
          onSubmit={(input) => hrRepository.submitEmployeeDocument(input)}
          onSubmitted={(document) => {
            void refreshRecord(document.id);
          }}
        />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.95fr)", gap: "1rem", alignItems: "start" }}>
        <div style={{ ...cardStyle, display: "grid", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.35rem" }}>Document Records</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Documents are grouped by current display status so HR and employees can quickly scan pending, expiring, expired, valid, and rejected records.
            </p>
          </div>
          <DocumentList
            documents={documents}
            emptyMessage="No document records have been submitted for this employee yet."
            onPreviewDocument={(document) => setSelectedDocumentId(document.id)}
          />
        </div>

        <DocumentPreviewPanel document={selectedDocument} title="Selected file preview" />
      </section>
    </section>
  );
}
