/**
 * File intent: provide validation and derived status helpers for the HR employee document and compliance MVP.
 * Design reminder for this file: keep the rules explicit, local-first, and independent from storage, notifications, and other modules.
 */

import { z } from "zod";
import type {
  ComplianceStatus,
  EmployeeDocument,
  EmployeeDocumentInput,
  EmployeeProfile,
  EmployeeWithCompliance,
  ExpiryEvaluation,
  HrDocumentStatus,
} from "@/modules/hr/hr.types";

const documentTypeSchema = z.enum(["passport", "work_permit", "food_safety"]);
const uploadedByTypeSchema = z.enum(["employee", "hr"]);
const googleDriveUrlPattern = /^https:\/\/(drive|docs)\.google\.com\/.+/i;

export const employeeDocumentInputSchema = z.object({
  employee_profile_id: z.string().trim().min(1, "Employee profile is required"),
  document_type: documentTypeSchema,
  document_label: z.string().trim().min(1, "Document label is required").max(200),
  file_name: z.string().trim().max(200).optional().or(z.literal("")),
  document_number: z.string().trim().max(120).optional().or(z.literal("")),
  issue_date: z.string().trim().optional().or(z.literal("")),
  expiry_date: z.string().trim().optional().or(z.literal("")),
  file_url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .regex(googleDriveUrlPattern, "Enter a valid Google Drive or Google Docs link")
    .max(1000),
  uploaded_by_type: uploadedByTypeSchema,
});

export const employeeDocumentReviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reviewed_by_user_id: z.string().trim().min(1, "Reviewer is required"),
  review_notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type EmployeeDocumentFormValues = {
  employee_profile_id: string;
  document_type: EmployeeDocumentInput["document_type"];
  document_label: string;
  file_name: string;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  file_url: string;
  uploaded_by_type: EmployeeDocumentInput["uploaded_by_type"];
};

export type EmployeeDocumentReviewFormValues = {
  decision: "approve" | "reject";
  reviewed_by_user_id: string;
  review_notes: string;
};

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? undefined : trimmed;
}

function normalizeDateString(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return undefined;
  }

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    throw new Error("Enter a valid date in YYYY-MM-DD format.");
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

function differenceInDays(start: Date, end: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / millisecondsPerDay);
}

export function isGoogleDriveUrl(url: string) {
  return googleDriveUrlPattern.test(url.trim());
}

export function extractGoogleDriveFileId(url: string) {
  const trimmed = url.trim();

  const directFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (directFileMatch?.[1]) {
    return directFileMatch[1];
  }

  const openIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch?.[1]) {
    return openIdMatch[1];
  }

  const docsDocumentMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsDocumentMatch?.[1]) {
    return docsDocumentMatch[1];
  }

  const docsSpreadsheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (docsSpreadsheetMatch?.[1]) {
    return docsSpreadsheetMatch[1];
  }

  const docsPresentationMatch = trimmed.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (docsPresentationMatch?.[1]) {
    return docsPresentationMatch[1];
  }

  return null;
}

export function buildGoogleDriveOpenUrl(url: string) {
  return url.trim();
}

export function buildGoogleDrivePreviewUrl(url: string) {
  const fileId = extractGoogleDriveFileId(url);

  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  if (url.includes("/preview")) {
    return url.trim();
  }

  if (url.includes("/edit") || url.includes("/view")) {
    return url.replace(/\/(edit|view)(\?.*)?$/, "/preview");
  }

  return url.trim();
}

export function deriveGoogleDriveFileName(url: string, label?: string) {
  const fileId = extractGoogleDriveFileId(url);
  if (label?.trim()) {
    return label.trim();
  }

  if (!fileId) {
    return "Google Drive file";
  }

  return `Google Drive file ${fileId.slice(0, 8)}`;
}

export function createDefaultEmployeeDocumentFormValues(employeeProfileId = ""): EmployeeDocumentFormValues {
  return {
    employee_profile_id: employeeProfileId,
    document_type: "passport",
    document_label: "",
    file_name: "",
    document_number: "",
    issue_date: "",
    expiry_date: "",
    file_url: "",
    uploaded_by_type: "employee",
  };
}

export function createDefaultEmployeeDocumentReviewValues(): EmployeeDocumentReviewFormValues {
  return {
    decision: "approve",
    reviewed_by_user_id: "",
    review_notes: "",
  };
}

export function parseEmployeeDocumentInput(values: EmployeeDocumentFormValues): EmployeeDocumentInput {
  const validated = employeeDocumentInputSchema.parse(values);

  return {
    employee_profile_id: validated.employee_profile_id,
    document_type: validated.document_type,
    document_label: validated.document_label,
    file_name: normalizeOptionalString(validated.file_name) ?? deriveGoogleDriveFileName(validated.file_url, validated.document_label),
    document_number: normalizeOptionalString(validated.document_number),
    issue_date: normalizeDateString(validated.issue_date),
    expiry_date: normalizeDateString(validated.expiry_date),
    file_url: validated.file_url,
    uploaded_by_type: validated.uploaded_by_type,
  };
}

export function parseEmployeeDocumentReview(values: EmployeeDocumentReviewFormValues) {
  const validated = employeeDocumentReviewSchema.parse(values);

  return {
    decision: validated.decision,
    reviewed_by_user_id: validated.reviewed_by_user_id,
    review_notes: normalizeOptionalString(validated.review_notes),
  };
}

export function evaluateDocumentExpiry(expiryDate?: string, today = new Date()): ExpiryEvaluation {
  if (!expiryDate) {
    return {
      derived_status: "valid",
      days_to_expiry: null,
    };
  }

  const expiry = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) {
    return {
      derived_status: "valid",
      days_to_expiry: null,
    };
  }

  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  const daysToExpiry = differenceInDays(normalizedToday, expiry);

  if (daysToExpiry < 0) {
    return {
      derived_status: "expired",
      days_to_expiry: daysToExpiry,
    };
  }

  if (daysToExpiry <= 30) {
    return {
      derived_status: "expiring",
      days_to_expiry: daysToExpiry,
    };
  }

  return {
    derived_status: "valid",
    days_to_expiry: daysToExpiry,
  };
}

export function deriveDocumentDisplayStatus(document: EmployeeDocument, today = new Date()): HrDocumentStatus {
  if (document.status === "pending_review" || document.status === "rejected") {
    return document.status;
  }

  return evaluateDocumentExpiry(document.expiry_date, today).derived_status;
}

export function deriveEmployeeComplianceStatus(documents: EmployeeDocument[], today = new Date()): ComplianceStatus {
  const relevantDocuments = documents.filter((document) => document.status !== "rejected");

  if (relevantDocuments.length === 0) {
    return "attention_required";
  }

  const derivedStatuses = relevantDocuments.map((document) => deriveDocumentDisplayStatus(document, today));

  if (derivedStatuses.some((status) => status === "expired")) {
    return "non_compliant";
  }

  if (derivedStatuses.some((status) => status === "pending_review" || status === "expiring")) {
    return "attention_required";
  }

  return "compliant";
}

export function buildEmployeeComplianceSummary(
  employee: EmployeeProfile,
  documents: EmployeeDocument[],
  today = new Date(),
): EmployeeWithCompliance {
  const expiredCount = documents.filter((document) => deriveDocumentDisplayStatus(document, today) === "expired").length;
  const expiringCount = documents.filter((document) => deriveDocumentDisplayStatus(document, today) === "expiring").length;
  const pendingReviewCount = documents.filter((document) => document.status === "pending_review").length;

  return {
    employee,
    documents,
    compliance_status: deriveEmployeeComplianceStatus(documents, today),
    pending_review_count: pendingReviewCount,
    expired_count: expiredCount,
    expiring_count: expiringCount,
  };
}
