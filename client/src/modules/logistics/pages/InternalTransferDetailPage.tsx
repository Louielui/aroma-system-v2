/**
 * File intent: render the Logistics Internal Transfer detail page with the refined lifecycle and line-level fulfillment handling for Phase 2B.
 * Design reminder for this file: keep lifecycle handling explicit and limited to the Internal Transfer flow.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { internalTransferRepository } from "@/modules/logistics/internal-transfers.repository";
import type { InternalTransfer } from "@/modules/logistics/internal-transfers.types";
import {
  canManageInternalTransferFulfillment,
  canManageInternalTransferHeader,
  getNextInternalTransferStatuses,
  sharedLogisticsStatusLabels,
} from "@/modules/logistics/logistics-status.types";

function canViewInternalTransfer(
  internalTransfer: InternalTransfer,
  isAllowedLocation: (locationId: string | null | undefined) => boolean,
) {
  return (
    isAllowedLocation(internalTransfer.source_location_id) ||
    isAllowedLocation(internalTransfer.destination_location_id)
  );
}

function sumLineValues(internalTransfer: InternalTransfer, field: "requested_quantity" | "picked_quantity" | "received_quantity") {
  return internalTransfer.line_items.reduce((total, lineItem) => total + lineItem[field], 0);
}

export default function InternalTransferDetailPage() {
  const [matches, params] = useRoute<{ transferOrderId: string }>("/logistics/transfer-orders/:transferOrderId");
  const { currentUser, isAllowedLocation } = useAccessControl();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [internalTransfer, setInternalTransfer] = useState<InternalTransfer | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInternalTransfer() {
      if (!matches || !params?.transferOrderId) {
        if (isMounted) {
          setError("Transfer order not found.");
          setIsLoading(false);
        }
        return;
      }

      const record = await internalTransferRepository.getById(params.transferOrderId);

      if (!isMounted) {
        return;
      }

      if (!record) {
        setError("Transfer order not found.");
        setIsLoading(false);
        return;
      }

      if (!canViewInternalTransfer(record, isAllowedLocation)) {
        setError("You do not have access to this transfer order.");
        setIsLoading(false);
        return;
      }

      setInternalTransfer(record);
      setIsLoading(false);
    }

    loadInternalTransfer();

    return () => {
      isMounted = false;
    };
  }, [isAllowedLocation, matches, params?.transferOrderId]);

  async function handleTransition(nextStatus: InternalTransfer["logistics_status"]) {
    if (!internalTransfer) {
      return;
    }

    try {
      setError("");
      const updated = await internalTransferRepository.transitionStatus(
        internalTransfer.id,
        nextStatus,
        currentUser?.id ?? "",
      );
      setInternalTransfer(updated);
    } catch (transitionError) {
      setError(transitionError instanceof Error ? transitionError.message : "Unable to update transfer status.");
    }
  }

  const nextStatuses = useMemo(
    () => (internalTransfer ? getNextInternalTransferStatuses(internalTransfer.logistics_status) : []),
    [internalTransfer],
  );

  if (isLoading) {
    return <p>Loading transfer order...</p>;
  }

  if (error && !internalTransfer) {
    return (
      <section>
        <p>{error || "Transfer order not found."}</p>
        <p>
          <Link href="/logistics/transfer-orders">Back to Transfer Orders</Link>
        </p>
      </section>
    );
  }

  if (!internalTransfer) {
    return (
      <section>
        <p>Transfer order not found.</p>
        <p>
          <Link href="/logistics/transfer-orders">Back to Transfer Orders</Link>
        </p>
      </section>
    );
  }

  const requestedTotal = sumLineValues(internalTransfer, "requested_quantity");
  const pickedTotal = sumLineValues(internalTransfer, "picked_quantity");
  const receivedTotal = sumLineValues(internalTransfer, "received_quantity");
  const hasPartialFulfillment = pickedTotal < requestedTotal || receivedTotal < pickedTotal;
  const hasLineDiscrepancy = internalTransfer.line_items.some(
    (lineItem) => Boolean(lineItem.shortage_notes.trim()) || Boolean(lineItem.discrepancy_notes.trim()),
  );

  return (
    <section>
      <header>
        <p>Logistics</p>
        <h1>{internalTransfer.transfer_order_number}</h1>
        <p>Internal Transfer detail page with refined picking, transit, and receiving controls for Phase 2B.</p>
      </header>

      <p>
        <Link href="/logistics/transfer-orders">Back to Transfer Orders</Link>{" "}
        {(canManageInternalTransferHeader(internalTransfer.logistics_status) ||
          canManageInternalTransferFulfillment(internalTransfer.logistics_status)) ? (
          <Link href={`/logistics/transfer-orders/${internalTransfer.id}/edit`}>Edit Transfer Order</Link>
        ) : null}
      </p>

      {error ? <p>{error}</p> : null}

      <table>
        <tbody>
          <tr>
            <th>Status</th>
            <td>{sharedLogisticsStatusLabels[internalTransfer.logistics_status]}</td>
          </tr>
          <tr>
            <th>Source</th>
            <td>{internalTransfer.source_location_id}</td>
          </tr>
          <tr>
            <th>Destination</th>
            <td>{internalTransfer.destination_location_id}</td>
          </tr>
          <tr>
            <th>Requested by</th>
            <td>{internalTransfer.requested_by_user_id}</td>
          </tr>
          <tr>
            <th>Approved by</th>
            <td>{internalTransfer.approved_by_user_id || "—"}</td>
          </tr>
          <tr>
            <th>Assigned to</th>
            <td>{internalTransfer.assigned_to_user_id || "—"}</td>
          </tr>
          <tr>
            <th>Scheduled dispatch</th>
            <td>{internalTransfer.scheduled_dispatch_date}</td>
          </tr>
          <tr>
            <th>Priority</th>
            <td>{internalTransfer.priority}</td>
          </tr>
          <tr>
            <th>Picked at</th>
            <td>{internalTransfer.picked_at || "—"}</td>
          </tr>
          <tr>
            <th>Dispatched at</th>
            <td>{internalTransfer.dispatched_at || "—"}</td>
          </tr>
          <tr>
            <th>Received at</th>
            <td>{internalTransfer.received_at || "—"}</td>
          </tr>
          <tr>
            <th>Completed at</th>
            <td>{internalTransfer.completed_at || "—"}</td>
          </tr>
          <tr>
            <th>Partial fulfillment</th>
            <td>{hasPartialFulfillment ? "Yes" : "No"}</td>
          </tr>
          <tr>
            <th>Line discrepancies</th>
            <td>{hasLineDiscrepancy ? "Yes" : "No"}</td>
          </tr>
          <tr>
            <th>Notes</th>
            <td>{internalTransfer.notes || "—"}</td>
          </tr>
        </tbody>
      </table>

      <section>
        <h2>Fulfillment Summary</h2>
        <table>
          <tbody>
            <tr>
              <th>Total requested</th>
              <td>{requestedTotal}</td>
            </tr>
            <tr>
              <th>Total picked</th>
              <td>{pickedTotal}</td>
            </tr>
            <tr>
              <th>Total received</th>
              <td>{receivedTotal}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Line Items</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Base Unit</th>
              <th>Requested</th>
              <th>Picked</th>
              <th>Received</th>
              <th>Shortage Notes</th>
              <th>Discrepancy Notes</th>
              <th>Line Notes</th>
            </tr>
          </thead>
          <tbody>
            {internalTransfer.line_items.map((lineItem) => (
              <tr key={lineItem.id}>
                <td>{lineItem.item_name}</td>
                <td>{lineItem.base_unit}</td>
                <td>{lineItem.requested_quantity}</td>
                <td>{lineItem.picked_quantity}</td>
                <td>{lineItem.received_quantity}</td>
                <td>{lineItem.shortage_notes || "—"}</td>
                <td>{lineItem.discrepancy_notes || "—"}</td>
                <td>{lineItem.line_notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Lifecycle / Status Flow</h2>
        <p>
          The refined Phase 2B lifecycle remains draft → pending review → approved → picking → in transit → completed,
          but the transition rules are now stricter. A transfer must be assigned before picking, must have at least one picked
          quantity before moving to in transit, and must have recorded received quantities before completion.
        </p>
        <p>
          Partial fulfillment is supported. If picked quantity is less than requested quantity, shortage notes should be recorded.
          If received quantity is less than picked quantity, discrepancy notes should be recorded.
        </p>
        {nextStatuses.length > 0 ? (
          <p>
            {nextStatuses.map((status) => (
              <button key={status} type="button" onClick={() => handleTransition(status)}>
                Move to {sharedLogisticsStatusLabels[status]}
              </button>
            ))}
          </p>
        ) : (
          <p>No further lifecycle transition is available for this transfer order.</p>
        )}
      </section>
    </section>
  );
}
