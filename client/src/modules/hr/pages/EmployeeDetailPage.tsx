/**
 * File intent: render the HR employee compliance detail page.
 * Design reminder for this file: keep the page focused on employee profile, compliance visibility, and document workflow entry points without introducing cross-module behavior.
 */

import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import ComplianceStatusBadge from "@/modules/hr/components/ComplianceStatusBadge";
import { hrRepository } from "@/modules/hr/hr.repository";
import type { EmployeeWithCompliance } from "@/modules/hr/hr.types";

export default function EmployeeDetailPage() {
  const match = useRoute("/hr/employees/:employeeId");
  const employeeId = match?.[1]?.employeeId ?? "";
  const [record, setRecord] = useState<EmployeeWithCompliance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadEmployee() {
      try {
        const data = await hrRepository.getEmployeeWithComplianceById(employeeId);

        if (!data) {
          throw new Error("Employee compliance profile not found.");
        }

        if (isMounted) {
          setRecord(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load employee compliance profile.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadEmployee();

    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  if (isLoading) {
    return <p>Loading employee profile...</p>;
  }

  if (error || !record) {
    return (
      <section>
        <p>{error || "Employee profile not found."}</p>
        <Link href="/hr/employees">Back to employee list</Link>
      </section>
    );
  }

  return (
    <section>
      <header>
        <p>HR</p>
        <h1>{record.employee.full_name}</h1>
        <p>
          Employee document compliance detail with a simple MVP summary for active review, expiry visibility, and pending actions.
        </p>
        <p>
          <Link href="/hr/employees">Back to employee list</Link>{" "}
          <Link href={`/hr/employees/${record.employee.id}/documents`}>Open documents</Link>{" "}
          <Link href="/hr/review">Open HR review queue</Link>
        </p>
      </header>

      <table>
        <tbody>
          <tr>
            <th>Employee Profile ID</th>
            <td>{record.employee.id}</td>
          </tr>
          <tr>
            <th>Person ID</th>
            <td>{record.employee.person_id}</td>
          </tr>
          <tr>
            <th>Employee ID</th>
            <td>{record.employee.employee_id}</td>
          </tr>
          <tr>
            <th>Full Name</th>
            <td>{record.employee.full_name}</td>
          </tr>
          <tr>
            <th>Role</th>
            <td>{record.employee.role}</td>
          </tr>
          <tr>
            <th>Department</th>
            <td>{record.employee.department}</td>
          </tr>
          <tr>
            <th>Employment Status</th>
            <td>{record.employee.employment_status}</td>
          </tr>
          <tr>
            <th>Compliance Status</th>
            <td>
              <ComplianceStatusBadge status={record.compliance_status} />
            </td>
          </tr>
          <tr>
            <th>Pending Review Documents</th>
            <td>{record.pending_review_count}</td>
          </tr>
          <tr>
            <th>Expiring Documents</th>
            <td>{record.expiring_count}</td>
          </tr>
          <tr>
            <th>Expired Documents</th>
            <td>{record.expired_count}</td>
          </tr>
          <tr>
            <th>Total Documents</th>
            <td>{record.documents.length}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
