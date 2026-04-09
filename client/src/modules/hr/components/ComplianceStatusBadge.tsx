/**
 * File intent: render a reusable employee-level compliance badge for HR compliance views.
 * Design reminder for this file: keep the badge compact, explicit, and visually clear enough to stand out inside list, detail, and dashboard contexts.
 */

import type { ComplianceStatus } from "@/modules/hr/hr.types";
import { complianceStatusLabels } from "@/modules/hr/hr.types";

type ComplianceStatusBadgeProps = {
  status: ComplianceStatus;
  showHint?: boolean;
};

const badgeConfig: Record<
  ComplianceStatus,
  {
    background: string;
    color: string;
    border: string;
    dot: string;
    hint: string;
  }
> = {
  compliant: {
    background: "#dcfce7",
    color: "#166534",
    border: "#86efac",
    dot: "#16a34a",
    hint: "All active documents look current.",
  },
  attention_required: {
    background: "#fef3c7",
    color: "#92400e",
    border: "#fcd34d",
    dot: "#d97706",
    hint: "Pending or expiring items need follow-up.",
  },
  non_compliant: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "#fca5a5",
    dot: "#dc2626",
    hint: "Expired items are affecting compliance.",
  },
};

export default function ComplianceStatusBadge({ status, showHint = false }: ComplianceStatusBadgeProps) {
  const config = badgeConfig[status];

  return (
    <span
      title={showHint ? config.hint : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: showHint ? "0.45rem 0.8rem" : "0.3rem 0.7rem",
        borderRadius: "999px",
        border: `1px solid ${config.border}`,
        backgroundColor: config.background,
        color: config.color,
        fontSize: "0.875rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "0.55rem",
          height: "0.55rem",
          borderRadius: "999px",
          background: config.dot,
          boxShadow: `0 0 0 2px ${config.background}`,
        }}
      />
      <span>{complianceStatusLabels[status]}</span>
      {showHint ? (
        <span style={{ opacity: 0.82, fontWeight: 600, fontSize: "0.8rem" }}>· {config.hint}</span>
      ) : null}
    </span>
  );
}
