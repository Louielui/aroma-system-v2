/**
 * File intent: provide a local-first repository for the HR employee document and compliance MVP.
 * Design reminder for this file: keep HR compliance independent from Stores, Logistics, and Inventory; no external storage or backend integration yet.
 */

import {
  buildEmployeeComplianceSummary,
  deriveDocumentDisplayStatus,
  parseEmployeeDocumentInput,
} from "@/modules/hr/hr.validation";
import type {
  EmployeeDocument,
  EmployeeDocumentFilters,
  EmployeeDocumentInput,
  EmployeeDocumentReviewInput,
  EmployeeProfile,
  EmployeeWithCompliance,
  HrRepositorySnapshot,
} from "@/modules/hr/hr.types";

const STORAGE_KEY = "aroma-system-v2.hr.compliance";

const seedEmployees: EmployeeProfile[] = [
  {
    id: "employee-profile-ava-chen",
    person_id: "person-ava-chen",
    employee_id: "EMP-1001",
    full_name: "Ava Chen",
    role: "HR Manager",
    department: "HR",
    employment_status: "active",
  },
  {
    id: "employee-profile-liam-foster",
    person_id: "person-liam-foster",
    employee_id: "EMP-1002",
    full_name: "Liam Foster",
    role: "Kitchen Manager",
    department: "Central Kitchen",
    employment_status: "active",
  },
  {
    id: "employee-profile-maya-singh",
    person_id: "person-maya-singh",
    employee_id: "EMP-1003",
    full_name: "Maya Singh",
    role: "Prep Staff",
    department: "Stores",
    employment_status: "inactive",
  },
  {
    id: "employee-profile-noah-brooks",
    person_id: "person-noah-brooks",
    employee_id: "EMP-1004",
    full_name: "Noah Brooks",
    role: "Line Cook",
    department: "Central Kitchen",
    employment_status: "active",
  },
];

const seedDocuments: EmployeeDocument[] = [
  {
    id: "employee-document-ava-passport",
    employee_profile_id: "employee-profile-ava-chen",
    document_type: "passport",
    document_label: "Canadian Passport",
    file_name: "ava-chen-passport.pdf",
    document_number: "P-8892331",
    issue_date: "2022-02-01",
    expiry_date: "2028-02-01",
    status: "valid",
    file_url: "https://drive.google.com/file/d/ava-passport/view",
    uploaded_by_type: "employee",
    reviewed_by_user_id: "person-ava-chen",
    reviewed_at: "2026-03-05T09:00:00.000Z",
    review_notes: "Verified against onboarding file.",
    created_at: "2026-03-01T10:15:00.000Z",
    updated_at: "2026-03-05T09:00:00.000Z",
  },
  {
    id: "employee-document-liam-work-permit",
    employee_profile_id: "employee-profile-liam-foster",
    document_type: "work_permit",
    document_label: "Open Work Permit",
    file_name: "liam-foster-work-permit.pdf",
    document_number: "WP-771199",
    issue_date: "2024-01-15",
    expiry_date: "2026-04-24",
    status: "valid",
    file_url: "https://drive.google.com/file/d/liam-work-permit/view",
    uploaded_by_type: "employee",
    reviewed_by_user_id: "person-ava-chen",
    reviewed_at: "2026-02-11T13:45:00.000Z",
    review_notes: "Permit copy is readable and complete.",
    created_at: "2026-02-10T08:30:00.000Z",
    updated_at: "2026-02-11T13:45:00.000Z",
  },
  {
    id: "employee-document-liam-food-safety",
    employee_profile_id: "employee-profile-liam-foster",
    document_type: "food_safety",
    document_label: "Food Safety Certificate",
    file_name: "liam-foster-food-safety-certificate.pdf",
    document_number: "FS-443210",
    issue_date: "2024-05-20",
    expiry_date: "2026-05-12",
    status: "pending_review",
    file_url: "https://drive.google.com/file/d/liam-food-safety/view",
    uploaded_by_type: "employee",
    created_at: "2026-04-06T15:20:00.000Z",
    updated_at: "2026-04-06T15:20:00.000Z",
  },
  {
    id: "employee-document-maya-passport",
    employee_profile_id: "employee-profile-maya-singh",
    document_type: "passport",
    document_label: "Indian Passport",
    file_name: "maya-singh-passport.pdf",
    document_number: "I-5542987",
    issue_date: "2018-09-10",
    expiry_date: "2026-03-01",
    status: "valid",
    file_url: "https://drive.google.com/file/d/maya-passport/view",
    uploaded_by_type: "hr",
    reviewed_by_user_id: "person-ava-chen",
    reviewed_at: "2025-11-15T10:00:00.000Z",
    review_notes: "Legacy record migrated to HR compliance list.",
    created_at: "2025-11-15T10:00:00.000Z",
    updated_at: "2025-11-15T10:00:00.000Z",
  },
  {
    id: "employee-document-maya-work-permit",
    employee_profile_id: "employee-profile-maya-singh",
    document_type: "work_permit",
    document_label: "Work Permit Renewal",
    file_name: "maya-singh-work-permit-renewal.pdf",
    expiry_date: "2026-08-15",
    status: "rejected",
    file_url: "https://drive.google.com/file/d/maya-work-permit/view",
    uploaded_by_type: "employee",
    reviewed_by_user_id: "person-ava-chen",
    reviewed_at: "2026-04-02T12:00:00.000Z",
    review_notes: "Upload is missing the signature page. Please submit a complete copy.",
    created_at: "2026-04-01T11:10:00.000Z",
    updated_at: "2026-04-02T12:00:00.000Z",
  },
];

let memorySnapshot: HrRepositorySnapshot = {
  employees: [...seedEmployees],
  documents: [...seedDocuments],
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneSnapshot(snapshot: HrRepositorySnapshot): HrRepositorySnapshot {
  return {
    employees: snapshot.employees.map((employee) => ({ ...employee })),
    documents: snapshot.documents.map((document) => ({ ...document })),
  };
}

function getSeedSnapshot(): HrRepositorySnapshot {
  return {
    employees: [...seedEmployees],
    documents: [...seedDocuments],
  };
}

function normalizeStoredSnapshot(snapshot: HrRepositorySnapshot): HrRepositorySnapshot {
  return {
    employees: snapshot.employees.map((employee) => ({ ...employee })),
    documents: snapshot.documents.map((document) => ({
      ...document,
      file_name: document.file_name ?? document.document_label,
    })),
  };
}

function readSnapshot(): HrRepositorySnapshot {
  if (!canUseBrowserStorage()) {
    return cloneSnapshot(memorySnapshot);
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const seeded = getSeedSnapshot();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    memorySnapshot = cloneSnapshot(seeded);
    return cloneSnapshot(seeded);
  }

  try {
    const parsed = JSON.parse(existing) as HrRepositorySnapshot;
    if (!parsed || !Array.isArray(parsed.employees) || !Array.isArray(parsed.documents)) {
      return cloneSnapshot(getSeedSnapshot());
    }

    const normalized = normalizeStoredSnapshot(parsed);
    memorySnapshot = cloneSnapshot(normalized);
    return cloneSnapshot(normalized);
  } catch {
    return cloneSnapshot(getSeedSnapshot());
  }
}

function writeSnapshot(snapshot: HrRepositorySnapshot) {
  const normalized = normalizeStoredSnapshot(snapshot);
  memorySnapshot = cloneSnapshot(normalized);

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
}

function buildId(prefix: string, label: string) {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return `${prefix}-${slug || Date.now()}-${Date.now()}`;
}

function getEmployeeDocuments(snapshot: HrRepositorySnapshot, employeeProfileId: string) {
  return snapshot.documents
    .filter((document) => document.employee_profile_id === employeeProfileId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

function matchesDocumentFilters(document: EmployeeDocument, filters?: EmployeeDocumentFilters) {
  if (!filters) {
    return true;
  }

  if (filters.employee_profile_id && document.employee_profile_id !== filters.employee_profile_id) {
    return false;
  }

  if (filters.status && filters.status !== "all") {
    const derivedStatus = deriveDocumentDisplayStatus(document);
    if (derivedStatus !== filters.status) {
      return false;
    }
  }

  if (filters.document_type && filters.document_type !== "all" && document.document_type !== filters.document_type) {
    return false;
  }

  return true;
}

export interface HrRepository {
  listEmployeeProfiles(): Promise<EmployeeProfile[]>;
  getEmployeeProfileById(id: string): Promise<EmployeeProfile | null>;
  listEmployeesWithCompliance(): Promise<EmployeeWithCompliance[]>;
  getEmployeeWithComplianceById(id: string): Promise<EmployeeWithCompliance | null>;
  listEmployeeDocuments(filters?: EmployeeDocumentFilters): Promise<EmployeeDocument[]>;
  getEmployeeDocumentById(id: string): Promise<EmployeeDocument | null>;
  submitEmployeeDocument(input: EmployeeDocumentInput): Promise<EmployeeDocument>;
  reviewEmployeeDocument(id: string, input: EmployeeDocumentReviewInput): Promise<EmployeeDocument>;
  listPendingReviewDocuments(): Promise<EmployeeDocument[]>;
}

class LocalHrRepository implements HrRepository {
  async listEmployeeProfiles() {
    return readSnapshot().employees.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }

  async getEmployeeProfileById(id: string) {
    return readSnapshot().employees.find((employee) => employee.id === id) ?? null;
  }

  async listEmployeesWithCompliance() {
    const snapshot = readSnapshot();

    return snapshot.employees
      .map((employee) => buildEmployeeComplianceSummary(employee, getEmployeeDocuments(snapshot, employee.id)))
      .sort((a, b) => a.employee.full_name.localeCompare(b.employee.full_name));
  }

  async getEmployeeWithComplianceById(id: string) {
    const snapshot = readSnapshot();
    const employee = snapshot.employees.find((entry) => entry.id === id);

    if (!employee) {
      return null;
    }

    return buildEmployeeComplianceSummary(employee, getEmployeeDocuments(snapshot, id));
  }

  async listEmployeeDocuments(filters?: EmployeeDocumentFilters) {
    return readSnapshot().documents
      .filter((document) => matchesDocumentFilters(document, filters))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async getEmployeeDocumentById(id: string) {
    return readSnapshot().documents.find((document) => document.id === id) ?? null;
  }

  async submitEmployeeDocument(input: EmployeeDocumentInput) {
    const parsedInput = parseEmployeeDocumentInput({
      employee_profile_id: input.employee_profile_id,
      document_type: input.document_type,
      document_label: input.document_label,
      file_name: input.file_name ?? "",
      document_number: input.document_number ?? "",
      issue_date: input.issue_date ?? "",
      expiry_date: input.expiry_date ?? "",
      file_url: input.file_url,
      uploaded_by_type: input.uploaded_by_type,
    });

    const snapshot = readSnapshot();
    const employee = snapshot.employees.find((entry) => entry.id === parsedInput.employee_profile_id);

    if (!employee) {
      throw new Error("Employee profile not found.");
    }

    const now = new Date().toISOString();

    const document: EmployeeDocument = {
      id: buildId("employee-document", `${employee.employee_id}-${parsedInput.document_type}`),
      employee_profile_id: parsedInput.employee_profile_id,
      document_type: parsedInput.document_type,
      document_label: parsedInput.document_label,
      file_name: parsedInput.file_name,
      document_number: parsedInput.document_number,
      issue_date: parsedInput.issue_date,
      expiry_date: parsedInput.expiry_date,
      status: "pending_review",
      file_url: parsedInput.file_url,
      uploaded_by_type: parsedInput.uploaded_by_type,
      created_at: now,
      updated_at: now,
    };

    const nextSnapshot: HrRepositorySnapshot = {
      ...snapshot,
      documents: [document, ...snapshot.documents],
    };

    writeSnapshot(nextSnapshot);
    return document;
  }

  async reviewEmployeeDocument(id: string, input: EmployeeDocumentReviewInput) {
    const snapshot = readSnapshot();
    const existing = snapshot.documents.find((document) => document.id === id);

    if (!existing) {
      throw new Error("Document not found.");
    }

    if (existing.status !== "pending_review") {
      throw new Error("Only documents pending review can be reviewed.");
    }

    const now = new Date().toISOString();
    const reviewed: EmployeeDocument = {
      ...existing,
      status: input.decision === "approve" ? deriveDocumentDisplayStatus({ ...existing, status: "valid" }) : "rejected",
      reviewed_by_user_id: input.reviewed_by_user_id,
      reviewed_at: now,
      review_notes: input.review_notes,
      updated_at: now,
    };

    const nextSnapshot: HrRepositorySnapshot = {
      ...snapshot,
      documents: snapshot.documents.map((document) => (document.id === id ? reviewed : document)),
    };

    writeSnapshot(nextSnapshot);
    return reviewed;
  }

  async listPendingReviewDocuments() {
    return readSnapshot().documents
      .filter((document) => document.status === "pending_review")
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

export const hrRepository: HrRepository = new LocalHrRepository();
