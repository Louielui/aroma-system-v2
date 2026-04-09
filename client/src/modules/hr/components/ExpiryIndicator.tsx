/**
 * File intent: render read-only expiry timing information for the HR employee document compliance module.
 * Design reminder for this file: keep expiry messaging explicit, compact, and derived from validation helpers rather than introducing side effects.
 */

import { evaluateDocumentExpiry } from "@/modules/hr/hr.validation";

type ExpiryIndicatorProps = {
  expiryDate?: string;
};

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  fontSize: "0.875rem",
  fontWeight: 600,
};

export default function ExpiryIndicator({ expiryDate }: ExpiryIndicatorProps) {
  const evaluation = evaluateDocumentExpiry(expiryDate);

  if (!expiryDate || evaluation.days_to_expiry === null) {
    return <span style={{ ...baseStyle, color: "#64748b", fontWeight: 500 }}>No expiry date</span>;
  }

  if (evaluation.derived_status === "expired") {
    return (
      <span style={{ ...baseStyle, color: "#991b1b" }}>
        <span aria-hidden="true">●</span>
        <span>{Math.abs(evaluation.days_to_expiry)} days overdue</span>
      </span>
    );
  }

  if (evaluation.derived_status === "expiring") {
    return (
      <span style={{ ...baseStyle, color: "#92400e" }}>
        <span aria-hidden="true">●</span>
        <span>{evaluation.days_to_expiry} days left</span>
      </span>
    );
  }

  return (
    <span style={{ ...baseStyle, color: "#166534", fontWeight: 500 }}>
      <span aria-hidden="true">●</span>
      <span>{evaluation.days_to_expiry} days left</span>
    </span>
  );
}
