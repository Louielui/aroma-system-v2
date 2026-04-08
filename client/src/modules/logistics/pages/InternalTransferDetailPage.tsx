/**
 * File intent: render the Logistics Internal Transfer detail page for the Phase 4B dispatch and in-transit lifecycle.
 * Design reminder for this file: keep execution controls explicit, preserve the separation from Stores demand records, and expose only Logistics-owned lifecycle actions.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { internalTransferRepository } from "@/modules/logistics/internal-transfers.repository";
import type { InternalTransfer, InternalTransferUpsert } from "@/modules/logistics/internal-transfers.types";
import {
  canManageInternalTransferFulfillment,
  canManageInternalTransferHeader,
  getNextInternalTransferStatuses,
  isInternalTransferDispatchLocked,
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

function sumLineValues(internalTransfer: InternalTransfer, field: "requested_quantity" | "picked_quantity") {
  return internalTransfer.line_items.reduce((total, lineItem) => total + lineItem[field], 0);
}

function toUpsertPayload(internalTransfer: InternalTransfer): InternalTransferUpsert {
  return {
    request_date: internalTransfer.request_date,
    source_location_id: internalTransfer.source_location_id,
    destination_location_id: internalTransfer.destination_location_id,
    requested_by_user_id: internalTransfer.requested_by_user_id,
    approved_by_user_id: internalTransfer.approved_by_user_id,
    scheduled_dispatch_date: internalTransfer.scheduled_dispatch_date,
    logistics_status: internalTransfer.logistics_status,
    priority: internalTransfer.priority,
    notes: internalTransfer.notes,
    line_items: internalTransfer.line_items.map((lineItem) => ({
      ...lineItem,
      picked_quantity: lineItem.picked_quantity ?? 0,
      received_quantity: lineItem.received_quantity ?? 0,
      shortage_notes: lineItem.shortage_notes ?? "",
      discrepancy_notes: lineItem.discrepancy_notes ?? "",
      line_notes: lineItem.line_notes ?? "",
    })),
    assigned_to_user_id: internalTransfer.assigned_to_user_id,
    exception_code: internalTransfer.exception_code,
    exception_notes: internalTransfer.exception_notes,
    dispatched_by_user_id: internalTransfer.dispatched_by_user_id ?? "",
    source_store_replenishment_request_id: internalTransfer.source_store_replenishment_request_id ?? null,
    source_store_replenishment_request_number: internalTransfer.source_store_replenishment_request_number ?? null,
  };
}

function getTransitionButtonLabel(status: InternalTransfer["logistics_status"]) {
  switch (status) {
    case "picking":
      return "Start Picking";
    case "dispatched":
      return "Dispatch Transfer";
    case "in_transit":
      return "Mark In Transit";
    default:
      return `Move to ${sharedLogisticsStatusLabels[status]}`;
  }
}

export default function InternalTransferDetailPage() {
  const [matches, params] = useRoute<{ transferOrderId: string }>("/logistics/transfer-orders/:transferOrderId");
  const { currentUser, isAllowedLocation } = useAccessControl();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [internalTransfer, setInternalTransfer] = useState<InternalTransfer | null>(null);
  const [isSavingPicking, setIsSavingPicking] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      setIsTransitioning(true);
      const updated = await internalTransferRepository.transitionStatus(
        internalTransfer.id,
        nextStatus,
        currentUser?.id ?? "",
      );
      setInternalTransfer(updated);
    } catch (transitionError) {
      setError(transitionError instanceof Error ? transitionError.message : "Unable to update transfer status.");
    } finally {
      setIsTransitioning(false);
    }
  }

  function updatePickedQuantity(lineId: string, nextValue: string) {
    if (!internalTransfer) {
      return;
    }

    setInternalTransfer({
      ...internalTransfer,
      line_items: internalTransfer.line_items.map((lineItem) =>
        lineItem.id === lineId
          ? {
              ...lineItem,
              picked_quantity: nextValue === "" ? 0 : Number(nextValue),
            }
          : lineItem,
      ),
    });
  }

  async function handleSavePickingProgress() {
    if (!internalTransfer) {
      return;
    }

    try {
      setError("");
      setIsSavingPicking(true);
      const updated = await internalTransferRepository.update(internalTransfer.id, toUpsertPayload(internalTransfer));
      setInternalTransfer(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save picking progress.");
    } finally {
      setIsSavingPicking(false);
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
  const canEditPicking = canManageInternalTransferFulfillment(internalTransfer.logistics_status);
  const isDispatchLocked = isInternalTransferDispatchLocked(internalTransfer.logistics_status);
  const linkedStoresRequest = internalTransfer.source_store_replenishment_request_number;

  return (
    <section>
      <header>
        <p>Logistics</p>
        <h1>{internalTransfer.transfer_order_number}</h1>
        <p>Internal Transfer execution now covers picking, dispatch, and in-transit progress within Logistics only.</p>
      </header>

      <p>
        <Link href="/logistics/transfer-orders">Back to Transfer Orders</Link>{" "}
        {(canManageInternalTransferHeader(internalTransfer.logistics_status) || canEditPicking) ? (
          <Link href={`/logistics/transfer-orders/${internalTransfer.id}/edit`}>Edit Transfer Order</Link>
        ) : null}
      </p>

      {error ? <p>{error}</p> : null}

      <table>
        <tbody>
          <tr>
            <th>Status</th>
            <td>
              <strong>{sharedLogisticsStatusLabels[internalTransfer.logistics_status]}</strong>
            </td>
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
            <th>Picking started at</th>
            <td>{internalTransfer.picked_at || "—"}</td>
          </tr>
          <tr>
            <th>Dispatched at</th>
            <td>{internalTransfer.dispatched_at || "—"}</td>
          </tr>
          <tr>
            <th>Dispatched by</th>
            <td>{internalTransfer.dispatched_by_user_id || "—"}</td>
          </tr>
          <tr>
            <th>Linked Stores request</th>
            <td>{linkedStoresRequest || "—"}</td>
          </tr>
          <tr>
            <th>Notes</th>
            <td>{internalTransfer.notes || "—"}</td>
          </tr>
        </tbody>
      </table>

      <section>
        <h2>Picking Progress Summary</h2>
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
              <th>Line Notes</th>
            </tr>
          </thead>
          <tbody>
            {internalTransfer.line_items.map((lineItem) => (
              <tr key={lineItem.id}>
                <td>{lineItem.item_name}</td>
                <td>{lineItem.base_unit}</td>
                <td>{lineItem.requested_quantity}</td>
                <td>
                  {canEditPicking ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={String(lineItem.requested_quantity)}
                      value={String(lineItem.picked_quantity)}
                      onChange={(event) => updatePickedQuantity(lineItem.id, event.target.value)}
                    />
                  ) : (
                    <span>
                      {lineItem.picked_quantity}
                      {isDispatchLocked ? " (locked)" : ""}
                    </span>
                  )}
                </td>
                <td>{lineItem.line_notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {canEditPicking ? (
          <p>
            <button type="button" onClick={handleSavePickingProgress} disabled={isSavingPicking}>
              {isSavingPicking ? "Saving Picking Progress..." : "Save Picking Progress"}
            </button>
          </p>
        ) : null}
      </section>

      <section>
        <h2>Lifecycle / Status Flow</h2>
        <p>
          Phase 4B extends the Logistics execution object from picking into dispatch and in-transit handling without
          changing Stores data or mirroring execution state back into Stores.
        </p>
        <p>
          Dispatch is allowed only after picking has started and at least one line has a picked quantity greater than 0.
          Once dispatched, picked quantities become read-only. Receiving, discrepancy handling, and inventory integration
          remain intentionally out of scope.
        </p>
        {nextStatuses.length > 0 ? (
          <p>
            {nextStatuses.map((status) => (
              <button key={status} type="button" onClick={() => handleTransition(status)} disabled={isTransitioning}>
                {isTransitioning ? "Updating..." : getTransitionButtonLabel(status)}
              </button>
            ))}
          </p>
        ) : (
          <p>No further lifecycle transition is available for this transfer order in Phase 4B.</p>
        )}
      </section>
    </section>
  );
}
