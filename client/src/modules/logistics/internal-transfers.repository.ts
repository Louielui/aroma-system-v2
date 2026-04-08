/**
 * File intent: provide an API-ready repository abstraction for the Logistics Internal Transfer flow in Phase 2B.
 * Design reminder for this file: keep Internal Transfer separate from other logistics flows while enabling shared tracking output.
 */

import type {
  InternalTransfer,
  InternalTransferTrackingRow,
  InternalTransferUpsert,
} from "@/modules/logistics/internal-transfers.types";
import {
  canEditInternalTransferStatus,
  getNextInternalTransferStatuses,
} from "@/modules/logistics/logistics-status.types";
import type { SharedLogisticsStatus } from "@/modules/logistics/logistics-status.types";

const STORAGE_KEY = "aroma-system-v2.logistics.internal-transfers";

const seedInternalTransfers: InternalTransfer[] = [
  {
    id: "internal-transfer-stmary-001",
    transfer_order_number: "TO-1001",
    request_date: "2026-04-08",
    source_location_id: "Central Kitchen",
    destination_location_id: "St Mary",
    requested_by_user_id: "person-kitchen-manager-noah",
    approved_by_user_id: "",
    scheduled_dispatch_date: "2026-04-09",
    logistics_status: "pending_review",
    priority: "normal",
    notes: "Initial controlled internal transfer for Logistics refinement.",
    line_items: [
      {
        id: "raw-ingredient-chicken-breast-1",
        raw_ingredient_id: "raw-ingredient-chicken-breast",
        item_name: "Chicken Breast",
        base_unit: "kg",
        requested_quantity: 8,
        picked_quantity: 0,
        received_quantity: 0,
        shortage_notes: "",
        discrepancy_notes: "",
        line_notes: "Allocate to St Mary prep plan.",
      },
    ],
    assigned_to_user_id: "person-inventory-staff-maya",
    picked_at: "",
    dispatched_at: "",
    received_at: "",
    completed_at: "",
    exception_code: "",
    exception_notes: "",
    created_at: new Date("2026-04-08T08:00:00.000Z").toISOString(),
    updated_at: new Date("2026-04-08T08:00:00.000Z").toISOString(),
  },
  {
    id: "internal-transfer-forks-002",
    transfer_order_number: "TO-1002",
    request_date: "2026-04-08",
    source_location_id: "Central Kitchen",
    destination_location_id: "Forks",
    requested_by_user_id: "person-kitchen-manager-noah",
    approved_by_user_id: "person-admin-julia",
    scheduled_dispatch_date: "2026-04-08",
    logistics_status: "in_transit",
    priority: "urgent",
    notes: "Urgent stock support for the Forks location.",
    line_items: [
      {
        id: "raw-ingredient-yellow-onion-1",
        raw_ingredient_id: "raw-ingredient-yellow-onion",
        item_name: "Yellow Onion",
        base_unit: "kg",
        requested_quantity: 12,
        picked_quantity: 10,
        received_quantity: 0,
        shortage_notes: "2 kg short at picking due to prep holdback.",
        discrepancy_notes: "",
        line_notes: "Rush dispatch.",
      },
    ],
    assigned_to_user_id: "person-inventory-staff-maya",
    picked_at: new Date("2026-04-08T11:00:00.000Z").toISOString(),
    dispatched_at: new Date("2026-04-08T12:00:00.000Z").toISOString(),
    received_at: "",
    completed_at: "",
    exception_code: "",
    exception_notes: "",
    created_at: new Date("2026-04-08T09:00:00.000Z").toISOString(),
    updated_at: new Date("2026-04-08T12:00:00.000Z").toISOString(),
  },
];

let memoryInternalTransfers = [...seedInternalTransfers];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeLineItems(input: InternalTransfer["line_items"]) {
  return input.map((lineItem) => ({
    ...lineItem,
    picked_quantity: Number.isFinite(lineItem.picked_quantity) ? lineItem.picked_quantity : 0,
    received_quantity: Number.isFinite(lineItem.received_quantity) ? lineItem.received_quantity : 0,
    shortage_notes: lineItem.shortage_notes ?? "",
    discrepancy_notes: lineItem.discrepancy_notes ?? "",
    line_notes: lineItem.line_notes ?? "",
  }));
}

function normalizeInternalTransfer(input: InternalTransfer): InternalTransfer {
  return {
    ...input,
    line_items: normalizeLineItems(input.line_items),
    exception_code: input.exception_code ?? "",
    exception_notes: input.exception_notes ?? "",
  };
}

function readInternalTransfers(): InternalTransfer[] {
  if (!canUseBrowserStorage()) {
    return memoryInternalTransfers.map(normalizeInternalTransfer);
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedInternalTransfers));
    return [...seedInternalTransfers];
  }

  try {
    const parsed = JSON.parse(existing) as InternalTransfer[];
    return Array.isArray(parsed) ? parsed.map(normalizeInternalTransfer) : [...seedInternalTransfers];
  } catch {
    return [...seedInternalTransfers];
  }
}

function writeInternalTransfers(internalTransfers: InternalTransfer[]) {
  memoryInternalTransfers = internalTransfers.map(normalizeInternalTransfer);

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryInternalTransfers));
  }
}

function buildInternalTransferId(destinationLocationId: string) {
  const slug = destinationLocationId
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return `internal-transfer-${slug || "location"}-${Date.now()}`;
}

function buildTransferOrderNumber(existingTransfers: InternalTransfer[]) {
  return `TO-${String(1000 + existingTransfers.length + 1)}`;
}

function hasAnyPickedQuantity(internalTransfer: InternalTransfer) {
  return internalTransfer.line_items.some((lineItem) => lineItem.picked_quantity > 0);
}

function hasAnyReceivedQuantity(internalTransfer: InternalTransfer) {
  return internalTransfer.line_items.some((lineItem) => lineItem.received_quantity > 0);
}

function validateInternalTransferLineProgress(internalTransfer: InternalTransfer) {
  for (const lineItem of internalTransfer.line_items) {
    if (lineItem.picked_quantity > lineItem.requested_quantity) {
      throw new Error(`Picked quantity cannot exceed requested quantity for ${lineItem.item_name}.`);
    }

    if (lineItem.received_quantity > lineItem.picked_quantity) {
      throw new Error(`Received quantity cannot exceed picked quantity for ${lineItem.item_name}.`);
    }

    if (lineItem.picked_quantity < lineItem.requested_quantity && !lineItem.shortage_notes.trim()) {
      throw new Error(`Shortage notes are required when picked quantity is short for ${lineItem.item_name}.`);
    }

    if (lineItem.received_quantity < lineItem.picked_quantity && !lineItem.discrepancy_notes.trim()) {
      throw new Error(`Discrepancy notes are required when received quantity is short for ${lineItem.item_name}.`);
    }
  }
}

function validateTransitionRequirements(internalTransfer: InternalTransfer, nextStatus: SharedLogisticsStatus) {
  validateInternalTransferLineProgress(internalTransfer);

  if (nextStatus === "picking") {
    if (!internalTransfer.assigned_to_user_id.trim()) {
      throw new Error("Assigned to user ID is required before moving an Internal Transfer into picking.");
    }

    return;
  }

  if (nextStatus === "in_transit") {
    if (!hasAnyPickedQuantity(internalTransfer)) {
      throw new Error("At least one picked quantity is required before moving an Internal Transfer into transit.");
    }

    return;
  }

  if (nextStatus === "completed") {
    if (!hasAnyPickedQuantity(internalTransfer)) {
      throw new Error("Picked quantities must be recorded before completion.");
    }

    if (!hasAnyReceivedQuantity(internalTransfer)) {
      throw new Error("Received quantities must be recorded before completion.");
    }
  }
}

function applyStatusTransition(
  internalTransfer: InternalTransfer,
  nextStatus: SharedLogisticsStatus,
  actorUserId = "",
): InternalTransfer {
  validateTransitionRequirements(internalTransfer, nextStatus);

  const timestamp = new Date().toISOString();

  return {
    ...internalTransfer,
    logistics_status: nextStatus,
    approved_by_user_id:
      nextStatus === "approved" ? actorUserId || internalTransfer.approved_by_user_id : internalTransfer.approved_by_user_id,
    picked_at: nextStatus === "picking" && !internalTransfer.picked_at ? timestamp : internalTransfer.picked_at,
    dispatched_at: nextStatus === "in_transit" ? timestamp : internalTransfer.dispatched_at,
    received_at: nextStatus === "completed" ? timestamp : internalTransfer.received_at,
    completed_at: nextStatus === "completed" ? timestamp : internalTransfer.completed_at,
    updated_at: timestamp,
  };
}

export interface InternalTransferRepository {
  list(): Promise<InternalTransfer[]>;
  getById(id: string): Promise<InternalTransfer | null>;
  create(input: InternalTransferUpsert): Promise<InternalTransfer>;
  update(id: string, input: InternalTransferUpsert): Promise<InternalTransfer>;
  transitionStatus(id: string, nextStatus: SharedLogisticsStatus, actorUserId?: string): Promise<InternalTransfer>;
  listTrackingRows(): Promise<InternalTransferTrackingRow[]>;
}

class LocalInternalTransferRepository implements InternalTransferRepository {
  async list() {
    return readInternalTransfers();
  }

  async getById(id: string) {
    return readInternalTransfers().find((internalTransfer) => internalTransfer.id === id) ?? null;
  }

  async create(input: InternalTransferUpsert) {
    validateInternalTransferLineProgress({
      ...input,
      id: "new",
      transfer_order_number: "new",
      picked_at: "",
      dispatched_at: "",
      received_at: "",
      completed_at: "",
      created_at: "",
      updated_at: "",
    });

    const internalTransfers = readInternalTransfers();
    const timestamp = new Date().toISOString();
    const internalTransfer: InternalTransfer = {
      id: buildInternalTransferId(input.destination_location_id),
      transfer_order_number: buildTransferOrderNumber(internalTransfers),
      ...input,
      line_items: normalizeLineItems(input.line_items),
      picked_at: "",
      dispatched_at: "",
      received_at: "",
      completed_at: "",
      created_at: timestamp,
      updated_at: timestamp,
    };

    const next = [internalTransfer, ...internalTransfers];
    writeInternalTransfers(next);
    return internalTransfer;
  }

  async update(id: string, input: InternalTransferUpsert) {
    const internalTransfers = readInternalTransfers();
    const existing = internalTransfers.find((internalTransfer) => internalTransfer.id === id);

    if (!existing) {
      throw new Error("Internal transfer not found");
    }

    if (!canEditInternalTransferStatus(existing.logistics_status)) {
      throw new Error("This Internal Transfer cannot be edited in its current lifecycle state.");
    }

    const updated: InternalTransfer = normalizeInternalTransfer({
      ...existing,
      ...input,
      id: existing.id,
      transfer_order_number: existing.transfer_order_number,
      picked_at: existing.picked_at,
      dispatched_at: existing.dispatched_at,
      received_at: existing.received_at,
      completed_at: existing.completed_at,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    });

    validateInternalTransferLineProgress(updated);

    writeInternalTransfers(
      internalTransfers.map((internalTransfer) => (internalTransfer.id === id ? updated : internalTransfer)),
    );

    return updated;
  }

  async transitionStatus(id: string, nextStatus: SharedLogisticsStatus, actorUserId = "") {
    const internalTransfers = readInternalTransfers();
    const existing = internalTransfers.find((internalTransfer) => internalTransfer.id === id);

    if (!existing) {
      throw new Error("Internal transfer not found");
    }

    if (!getNextInternalTransferStatuses(existing.logistics_status).includes(nextStatus)) {
      throw new Error(`Cannot move Internal Transfer from ${existing.logistics_status} to ${nextStatus}.`);
    }

    const updated = applyStatusTransition(existing, nextStatus, actorUserId);

    writeInternalTransfers(
      internalTransfers.map((internalTransfer) => (internalTransfer.id === id ? updated : internalTransfer)),
    );

    return updated;
  }

  async listTrackingRows() {
    return readInternalTransfers().map((internalTransfer) => ({
      internal_transfer_id: internalTransfer.id,
      tracking_reference: internalTransfer.transfer_order_number,
      origin_flow_type: "internal_transfer" as const,
      source_label: internalTransfer.source_location_id,
      destination_label: internalTransfer.destination_location_id,
      scheduled_date: internalTransfer.scheduled_dispatch_date,
      assigned_to_user_id: internalTransfer.assigned_to_user_id,
      logistics_status: internalTransfer.logistics_status,
      has_exception: Boolean(
        internalTransfer.exception_code ||
          internalTransfer.exception_notes ||
          internalTransfer.line_items.some(
            (lineItem) => Boolean(lineItem.shortage_notes.trim()) || Boolean(lineItem.discrepancy_notes.trim()),
          ),
      ),
    }));
  }
}

export const internalTransferRepository: InternalTransferRepository = new LocalInternalTransferRepository();
