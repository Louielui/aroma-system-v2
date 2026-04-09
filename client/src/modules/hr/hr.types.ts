/**
 * File intent: define the HR employee document and compliance domain model.
 * Design reminder for this file: keep HR compliance independent from Stores, Logistics, and Inventory; prefer simple UI-ready and repository-ready shapes.
 */

export type EmploymentStatus = "active" | "inactive";

export type HrDocumentType = "passport" | "work_permit" | "food_safety";

export type HrDocumentStatus =
  | "pending_review"
  | "valid"
  | "expiring"
  | "expired"
  | "rejected";

export type UploadedByType = "employee" | "hr";

export type ComplianceStatus = "compliant" | "attention_required" | "non_compliant";

export type DocumentStorageProvider = "google_drive" | "manual";

export type EmployeeProfile = {
  id: string;
  person_id: string;
  employee_id: string;
  full_name: string;
  role: string;
  department: string;
  employment_status: EmploymentStatus;
};

export type EmployeeDocument = {
  id: string;
  employee_profile_id: string;
  document_type: HrDocumentType;
  document_label: string;
  file_name?: string;
  file_mime_type?: string;
  google_drive_file_id?: string;
  storage_provider?: DocumentStorageProvider;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  status: HrDocumentStatus;
  file_url: string;
  uploaded_by_type: UploadedByType;
  reviewed_by_user_id?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
};

export type EmployeeDocumentInput = {
  employee_profile_id: string;
  document_type: HrDocumentType;
  document_label: string;
  file_name?: string;
  file_mime_type?: string;
  google_drive_file_id?: string;
  storage_provider?: DocumentStorageProvider;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  file_url: string;
  uploaded_by_type: UploadedByType;
};

export type EmployeeDocumentReviewInput = {
  decision: "approve" | "reject";
  reviewed_by_user_id: string;
  review_notes?: string;
};

export type EmployeeDocumentFilters = {
  employee_profile_id?: string;
  status?: HrDocumentStatus | "all";
  document_type?: HrDocumentType | "all";
};

export type EmployeeWithCompliance = {
  employee: EmployeeProfile;
  documents: EmployeeDocument[];
  compliance_status: ComplianceStatus;
  pending_review_count: number;
  expired_count: number;
  expiring_count: number;
};

export type ExpiryEvaluation = {
  derived_status: Extract<HrDocumentStatus, "valid" | "expiring" | "expired">;
  days_to_expiry: number | null;
};

export type HrRepositorySnapshot = {
  employees: EmployeeProfile[];
  documents: EmployeeDocument[];
};

export const hrDocumentTypeLabels: Record<HrDocumentType, string> = {
  passport: "Passport",
  work_permit: "Work Permit",
  food_safety: "Food Safety",
};

export const hrDocumentStatusLabels: Record<HrDocumentStatus, string> = {
  pending_review: "Pending Review",
  valid: "Valid",
  expiring: "Expiring",
  expired: "Expired",
  rejected: "Rejected",
};

export const complianceStatusLabels: Record<ComplianceStatus, string> = {
  compliant: "Compliant",
  attention_required: "Attention Required",
  non_compliant: "Non-Compliant",
};

export const documentStorageProviderLabels: Record<DocumentStorageProvider, string> = {
  google_drive: "Google Drive",
  manual: "Manual Link",
};
