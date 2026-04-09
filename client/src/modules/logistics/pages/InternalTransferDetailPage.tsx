/**
 * File intent: render the Logistics Internal Transfer detail page for the Phase 4C receiving lifecycle.
 * Design reminder for this file: keep execution controls explicit, preserve the separation from Stores demand records, and expose only Logistics-owned lifecycle actions.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { inventoryRepository } from "@/modules/inventory/inventory.repository";
import { internalTransferRepository } from "@/modules/logistics/internal-transfers.repository";
import type { InternalTransfer, InternalTransferUpsert } from "@/modules/logistics/internal-transfers.types";
import {
  canManageInternalTransferHeader,
  canManageInternalTransferPicking,
  canManageInternalTransferReceiving,
  getNextInternalTransferStatuses,
  isInternalTransferDispatchLocked,
  isInternalTransferReceivingLocked,
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

function sumLineValues(
  internalTransfer: InternalTransfer,
  field: "requested_quantity" | "picked_quantity" | "received_quantity",
) {
  return internalTransfer.line_items.reduce((total, lineItem) => total + lineItem[field], 0);
}

function hasDiscrepancy(lineItem: InternalTransfer["line_items"][number]) {
  return lineItem.received_quantity !== lineItem.picked_quantity;
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
    case "received":
      return "Complete Receiving";
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
  const [inventoryTransactionGroupId, setInventoryTransactionGroupId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

      const relatedInventoryGroup = await inventoryRepository.getTransactionGroupBySource("logistics", record.id);

      if (!isMounted) {
        return;
      }

      setInternalTransfer(record);
      setInventoryTransactionGroupId(relatedInventoryGroup?.id ?? "");
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
      const relatedInventoryGroup = await inventoryRepository.getTransactionGroupBySource("logistics", updated.id);
      setInternalTransfer(updated);
      setInventoryTransactionGroupId(relatedInventoryGroup?.id ?? "");
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

  function updateReceivedQuantity(lineId: string, nextValue: string) {
    if (!internalTransfer) {
      return;
    }

    setInternalTransfer({
      ...internalTransfer,
      line_items: internalTransfer.line_items.map((lineItem) => {
        if (lineItem.id !== lineId) {
          return lineItem;
        }

        const receivedQuantity = nextValue === "" ? 0 : Number(nextValue);
        const discrepancyNotes =
          receivedQuantity !== lineItem.picked_quantity && receivedQuantity >= 0
            ? lineItem.discrepancy_notes || "Received quantity differs from picked quantity."
            : "";

        return {
          ...lineItem,
          received_quantity: receivedQuantity,
          discrepancy_notes: discrepancyNotes,
        };
      }),
    });
  }

  async function handleSaveProgress() {
    if (!internalTransfer) {
      return;
    }

    try {
      setError("");
      setIsSaving(true);
      const updated = await internalTransferRepository.update(internalTransfer.id, toUpsertPayload(internalTransfer));
      setInternalTransfer(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save transfer progress.");
    } finally {
      setIsSaving(false);
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
  const canEditPicking = canManageInternalTransferPicking(internalTransfer.logistics_status);
  const canEditReceiving = canManageInternalTransferReceiving(internalTransfer.logistics_status);
  const isDispatchLocked = isInternalTransferDispatchLocked(internalTransfer.logistics_status);
  const isReceivingLocked = isInternalTransferReceivingLocked(internalTransfer.logistics_status);
  const linkedStoresRequest = internalTransfer.source_store_replenishment_request_number;
  const discrepancyCount = internalTransfer.line_items.filter(hasDiscrepancy).length;

  return (
    <section>
      <header>
        <p>Logistics</p>
        <h1>{internalTransfer.transfer_order_number}</h1>
        <p>
          Internal Transfer execution now covers picking, dispatch, in-transit, and receiving progress within Logistics
          only.
        </p>
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
            <th>Received at</th>
            <td>{internalTransfer.received_at || "—"}</td>
          </tr>
          <tr>
            <th>Linked Stores request</th>
            <td>{linkedStoresRequest || "—"}</td>
          </tr>
          <tr>
            <th>Inventory posting</th>
            <td>
              {inventoryTransactionGroupId ? (
                <Link href={`/inventory/transaction-groups/${inventoryTransactionGroupId}`}>
                  View transaction group {inventoryTransactionGroupId}
                </Link>
              ) : internalTransfer.logistics_status === "received" ? (
                "Inventory posting not found"
              ) : (
                "Inventory posting will appear after receipt posting is completed"
              )}
            </td>
          </tr>
          <tr>
            <th>Exception summary</th>
            <td>{internalTransfer.exception_notes || "—"}</td>
          </tr>
          <tr>
            <th>Notes</th>
            <td>{internalTransfer.notes || "—"}</td>
          </tr>
        </tbody>
      </table>

      <section>
        <h2>Execution Summary</h2>
        <p>
          {inventoryTransactionGroupId ? (
            <>
              This receipt has an Inventory posting group. <Link href={`/inventory/transaction-groups/${inventoryTransactionGroupId}`}>Review Inventory posting details</Link>
            </>
          ) : (
            "No Inventory posting group is linked yet."
          )}
        </p>
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
            <tr>
              <th>Discrepancy lines</th>
              <td>{discrepancyCount}</td>
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
              <th>Discrepancy</th>
              <th>Line Notes</th>
            </tr>
          </thead>
          <tbody>
            {internalTransfer.line_items.map((lineItem) => {
              const discrepancy = hasDiscrepancy(lineItem);

              return (
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
                  <td>
                    {canEditReceiving ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={String(lineItem.picked_quantity)}
                        value={String(lineItem.received_quantity)}
                        onChange={(event) => updateReceivedQuantity(lineItem.id, event.target.value)}
                      />
                    ) : (
                      <span>
                        {lineItem.received_quantity}
                        {isReceivingLocked ? " (locked)" : ""}
                      </span>
                    )}
                  </td>
                  <td>{discrepancy ? lineItem.discrepancy_notes || "Discrepancy detected" : "—"}</td>
                  <td>{lineItem.line_notes || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {canEditPicking || canEditReceiving ? (
          <p>
            <button type="button" onClick={handleSaveProgress} disabled={isSaving}>
              {isSaving ? "Saving Progress..." : canEditReceiving ? "Save Receiving Progress" : "Save Picking Progress"}
            </button>
          </p>
        ) : null}
      </section>

      <section>
        <h2>Lifecycle / Status Flow</h2>
        <p>
          Phase 4C completes the Logistics execution object by adding receiving and discrepancy visibility without
          changing Stores data, updating inventory, or merging execution state back into other modules.
        </p>
        <p>
          Receiving is allowed only after a transfer has moved into transit. While in transit, received quantities can
          be recorded per line as long as they stay between 0 and the picked quantity. Once the transfer reaches the
          received state, both picked and received quantities become read-only.
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
          <p>No further lifecycle transition is available for this transfer order in Phase 4C.</p>
        )}
      </section>
    </section>
  );
}
