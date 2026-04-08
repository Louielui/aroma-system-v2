/*
 * File intent: render the Stores / Branch Operations replenishment request review form for Phase 2C.
 * Design reminder for this file: keep review and approval inside the Stores demand workflow only, without conversion, Internal Transfer creation, or Logistics execution linkage.
 */

import type {
  StoreReplenishmentRequestReviewFormLineValues,
  StoreReplenishmentRequestReviewFormValues,
} from "@/modules/stores/stores.types";
import { useEffect, useMemo, useState } from "react";

type StoreReplenishmentRequestReviewFormProps = {
  defaultValues: StoreReplenishmentRequestReviewFormValues;
  approveLabel?: string;
  rejectLabel?: string;
  onApprove: (values: StoreReplenishmentRequestReviewFormValues) => Promise<void> | void;
  onReject: (values: StoreReplenishmentRequestReviewFormValues) => Promise<void> | void;
};

function cloneLines(lines: StoreReplenishmentRequestReviewFormLineValues[]) {
  return lines.map((line) => ({ ...line }));
}

function cloneValues(values: StoreReplenishmentRequestReviewFormValues): StoreReplenishmentRequestReviewFormValues {
  return {
    review_notes: values.review_notes,
    lines: cloneLines(values.lines),
  };
}

export default function StoreReplenishmentRequestReviewForm({
  defaultValues,
  approveLabel = "Approve Store Replenishment Request",
  rejectLabel = "Reject Store Replenishment Request",
  onApprove,
  onReject,
}: StoreReplenishmentRequestReviewFormProps) {
  const [values, setValues] = useState<StoreReplenishmentRequestReviewFormValues>(() => cloneValues(defaultValues));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(cloneValues(defaultValues));
  }, [defaultValues]);

  const requestedTotal = useMemo(
    () => values.lines.reduce((total, line) => total + line.requested_quantity, 0),
    [values.lines],
  );

  const approvedTotal = useMemo(
    () => values.lines.reduce((total, line) => total + (line.approved_quantity.trim() === "" ? 0 : Number(line.approved_quantity)), 0),
    [values.lines],
  );

  async function runAction(action: "approve" | "reject") {
    setIsSubmitting(true);

    try {
      if (action === "approve") {
        await onApprove(values);
        return;
      }

      await onReject(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void runAction("approve");
      }}
    >
      <table>
        <caption>Review requested quantities before approval or rejection.</caption>
        <thead>
          <tr>
            <th>Item</th>
            <th>Base Unit</th>
            <th>Requested Quantity</th>
            <th>Approved Quantity</th>
            <th>Line Notes</th>
          </tr>
        </thead>
        <tbody>
          {values.lines.map((line, index) => (
            <tr key={line.id}>
              <td>{line.item_name}</td>
              <td>{line.base_unit}</td>
              <td>{line.requested_quantity}</td>
              <td>
                <label>
                  <span className="sr-only">Approved quantity for {line.item_name}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.approved_quantity}
                    onChange={(event) => {
                      const nextLines = cloneLines(values.lines);
                      nextLines[index] = {
                        ...nextLines[index],
                        approved_quantity: event.target.value,
                      };
                      setValues((current) => ({ ...current, lines: nextLines }));
                    }}
                  />
                </label>
              </td>
              <td>{line.line_notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <strong>Total requested:</strong> {requestedTotal}
      </p>
      <p>
        <strong>Total approved:</strong> {approvedTotal}
      </p>

      <p>
        <label>
          <span>Review notes</span>
          <textarea
            value={values.review_notes}
            onChange={(event) => {
              setValues((current) => ({ ...current, review_notes: event.target.value }));
            }}
            rows={4}
          />
        </label>
      </p>

      <p>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving review..." : approveLabel}
        </button>{" "}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            void runAction("reject");
          }}
        >
          {isSubmitting ? "Saving review..." : rejectLabel}
        </button>
      </p>
    </form>
  );
}
