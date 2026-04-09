/**
 * File intent: render the HR employee document and compliance list page for the Phase 2 experience.
 * Design reminder for this file: keep the page read-focused, make compliance visibility immediate, and route into employee detail and document views without cross-module behavior.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import ComplianceStatusBadge from "@/modules/hr/components/ComplianceStatusBadge";
import { hrRepository } from "@/modules/hr/hr.repository";
import type { EmployeeWithCompliance } from "@/modules/hr/hr.types";

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "1rem",
  padding: "1rem",
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<EmployeeWithCompliance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadEmployees() {
      try {
        const data = await hrRepository.listEmployeesWithCompliance();

        if (isMounted) {
          setEmployees(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load employee compliance records.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboard = useMemo(() => {
    return employees.reduce(
      (summary, entry) => {
        summary.totalEmployees += 1;
        summary.pendingReview += entry.pending_review_count;
        summary.expiring += entry.expiring_count;
        summary.expired += entry.expired_count;
        return summary;
      },
      {
        totalEmployees: 0,
        pendingReview: 0,
        expiring: 0,
        expired: 0,
      },
    );
  }, [employees]);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header style={{ ...cardStyle, display: "grid", gap: "0.875rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>HR</p>
            <h1 style={{ margin: "0 0 0.35rem" }}>Employee Compliance</h1>
            <p style={{ margin: 0, color: "#475569", maxWidth: "60rem" }}>
              This workspace keeps employee document records, expiry visibility, and HR review actions inside the HR module only, with a lightweight Google Drive link workflow.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/hr/employees">Employee Compliance</Link>
            <Link href="/hr/review">Document Review</Link>
          </div>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <article style={cardStyle}>
          <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Employees</p>
          <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>{dashboard.totalEmployees}</p>
          <p style={{ margin: "0.35rem 0 0", color: "#475569" }}>Employees tracked in the HR compliance module.</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending Review</p>
          <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#9a3412" }}>{dashboard.pendingReview}</p>
          <p style={{ margin: "0.35rem 0 0", color: "#475569" }}>Documents waiting for an HR approval or rejection decision.</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expiring Documents</p>
          <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#92400e" }}>{dashboard.expiring}</p>
          <p style={{ margin: "0.35rem 0 0", color: "#475569" }}>Documents that reach expiry within the next 30 days.</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: "0 0 0.35rem", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expired Documents</p>
          <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#991b1b" }}>{dashboard.expired}</p>
          <p style={{ margin: "0.35rem 0 0", color: "#475569" }}>Documents that already passed their expiry date.</p>
        </article>
      </section>

      {isLoading ? (
        <section style={cardStyle}>
          <p style={{ margin: 0, color: "#475569" }}>Loading employee compliance records...</p>
        </section>
      ) : null}

      {error ? (
        <section style={{ ...cardStyle, borderColor: "#fca5a5", background: "#fef2f2" }}>
          <p style={{ margin: 0, color: "#991b1b", fontWeight: 600 }}>{error}</p>
        </section>
      ) : null}

      {!isLoading && !error ? (
        employees.length > 0 ? (
          <section style={{ ...cardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Employee ID</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Full Name</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Role</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Department</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Employment Status</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Compliance</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Pending Review</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Expiring</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Expired</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((entry) => (
                  <tr key={entry.employee.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.9rem 0.5rem", fontWeight: 600 }}>{entry.employee.employee_id}</td>
                    <td style={{ padding: "0.9rem 0.5rem" }}>{entry.employee.full_name}</td>
                    <td style={{ padding: "0.9rem 0.5rem" }}>{entry.employee.role}</td>
                    <td style={{ padding: "0.9rem 0.5rem" }}>{entry.employee.department}</td>
                    <td style={{ padding: "0.9rem 0.5rem", textTransform: "capitalize" }}>{entry.employee.employment_status}</td>
                    <td style={{ padding: "0.9rem 0.5rem" }}>
                      <ComplianceStatusBadge status={entry.compliance_status} />
                    </td>
                    <td style={{ padding: "0.9rem 0.5rem" }}>{entry.pending_review_count}</td>
                    <td style={{ padding: "0.9rem 0.5rem" }}>{entry.expiring_count}</td>
                    <td style={{ padding: "0.9rem 0.5rem" }}>{entry.expired_count}</td>
                    <td style={{ padding: "0.9rem 0.5rem" }}>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <Link href={`/hr/employees/${entry.employee.id}`}>View profile</Link>
                        <Link href={`/hr/employees/${entry.employee.id}/documents`}>Documents</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section style={{ ...cardStyle, borderStyle: "dashed" }}>
            <h2 style={{ marginTop: 0 }}>No employee compliance records yet</h2>
            <p style={{ marginBottom: 0, color: "#475569" }}>
              Once employee profiles and documents are available, this page will show compliance summaries, expiring items, and direct links into each employee document workspace.
            </p>
          </section>
        )
      ) : null}
    </section>
  );
}
