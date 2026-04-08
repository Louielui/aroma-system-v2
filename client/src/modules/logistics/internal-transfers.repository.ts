/**
 * File intent: provide an API-ready repository abstraction for the Logistics Internal Transfer flow.
 * Design reminder for this file: keep Internal Transfer execution separate from Stores demand records and extend lifecycle rules in explicit Logistics-owned phases only.
 */

import type {
  InternalTransfer,
  InternalTransferTrackingRow,
  InternalTransferUpsert,
} from "@/modules/logistics/internal-transfers.types";
import {
  canEditInternalTransferStatus,
  getNextInternalTransferStatuses,
  isInternalTransferDispatchLocked,
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
    logistics_status: "draft",
    priority: "normal",
    notes: "Draft internal transfer prepared for picking handoff.",
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
    dispatched_by_user_id: "",
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
    approved_by_user_id: "",
    scheduled_dispatch_date: "2026-04-08",
    logistics_status: "picking",
    priority: "urgent",
    notes: "Picking has started for the urgent Forks transfer.",
    line_items: [
      {
        id: "raw-ingredient-yellow-onion-1",
        raw_ingredient_id: "raw-ingredient-yellow-onion",
        item_name: "Yellow Onion",
        base_unit: "kg",
        requested_quantity: 12,
        picked_quantity: 10,
        received_quantity: 0,
        shortage_notes: "",
        discrepancy_notes: "",
        line_notes: "Rush pick for evening prep.",
      },
    ],
    assigned_to_user_id: "person-inventory-staff-maya",
    picked_at: new Date("2026-04-08T11:00:00.000Z").toISOString(),
    dispatched_at: "",
    dispatched_by_user_id: "",
    received_at: "",
    completed_at: "",
    exception_code: "",
    exception_notes: "",
    created_at: new Date("2026-04-08T09:00:00.000Z").toISOString(),
    updated_at: new Date("2026-04-08T11:00:00.000Z").toISOString(),
  },
  {
    id: "internal-transfer-downtown-003",
    transfer_order_number: "TO-1003",
    request_date: "2026-04-08",
    source_location_id: "Central Kitchen",
    destination_location_id: "Downtown",
    requested_by_user_id: "person-kitchen-manager-noah",
    approved_by_user_id: "",
    scheduled_dispatch_date: "2026-04-08",
    logistics_status: "dispatched",
    priority: "scheduled",
    notes: "Picked quantities are locked after dispatch for transport handoff.",
    line_items: [
      {
        id: "raw-ingredient-rice-1",
        raw_ingredient_id: "raw-ingredient-rice",
        item_name: "Rice",
        base_unit: "kg",
        requested_quantity: 20,
        picked_quantity: 18,
        received_quantity: 0,
        shortage_notes: "",
        discrepancy_notes: "",
        line_notes: "Dispatch with dry goods pallet.",
      },
    ],
    assigned_to_user_id: "person-inventory-staff-maya",
    picked_at: new Date("2026-04-08T10:15:00.000Z").toISOString(),
    dispatched_at: new Date("2026-04-08T10:45:00.000Z").toISOString(),
    dispatched_by_user_id: "person-logistics-lead-ava",
    received_at: "",
    completed_at: "",
    exception_code: "",
    exception_notes: "",
    created_at: new Date("2026-04-08T09:30:00.000Z").toISOString(),
    updated_at: new Date("2026-04-08T10:45:00.000Z").toISOString(),
  },
];

let memoryInternalTransfers = [...seedInternalTransfers];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeLineItems(input: InternalTransfer["line_items"]) {
  return input.map((lineItem) => ({
    ...lineItem,
    requested_quantity: Number.isFinite(lineItem.requested_quantity) ? lineItem.requested_quantity : 0,
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
    assigned_to_user_id: input.assigned_to_user_id ?? "",
    line_items: normalizeLineItems(input.line_items),
    dispatched_by_user_id: input.dispatched_by_user_id ?? "",
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

function validateInternalTransferLineProgress(internalTransfer: InternalTransfer) {
  if (!internalTransfer.line_items.length) {
    throw new Error("At least one Internal Transfer line is required.");
  }

  for (const lineItem of internalTransfer.line_items) {
    if (!Number.isFinite(lineItem.requested_quantity) || lineItem.requested_quantity <= 0) {
      throw new Error(`Requested quantity must be greater than 0 for ${lineItem.item_name}.`);
    }

    if (!Number.isFinite(lineItem.picked_quantity)) {
      throw new Error(`Picked quantity must be a valid number for ${lineItem.item_name}.`);
    }

    if (lineItem.picked_quantity < 0) {
      throw new Error(`Picked quantity cannot be negative for ${lineItem.item_name}.`);
    }

    if (lineItem.picked_quantity > lineItem.requested_quantity) {
      throw new Error(`Picked quantity cannot exceed requested quantity for ${lineItem.item_name}.`);
    }
  }
}

function hasAnyPickedQuantity(internalTransfer: InternalTransfer) {
  return internalTransfer.line_items.some((lineItem) => lineItem.picked_quantity > 0);
}

function validateTransitionRequirements(internalTransfer: InternalTransfer, nextStatus: SharedLogisticsStatus) {
  validateInternalTransferLineProgress(internalTransfer);

  if (nextStatus === "picking") {
    if (!internalTransfer.assigned_to_user_id.trim()) {
      throw new Error("Assigned to user ID is required before starting picking.");
    }

    if (internalTransfer.line_items.length < 1) {
      throw new Error("At least one line item is required before starting picking.");
    }
  }

  if (nextStatus === "dispatched") {
    if (!hasAnyPickedQuantity(internalTransfer)) {
      throw new Error("At least one line must have picked quantity greater than 0 before dispatch.");
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
      nextStatus === "picking" ? actorUserId || internalTransfer.approved_by_user_id : internalTransfer.approved_by_user_id,
    picked_at: nextStatus === "picking" && !internalTransfer.picked_at ? timestamp : internalTransfer.picked_at,
    dispatched_at:
      nextStatus === "dispatched" && !internalTransfer.dispatched_at ? timestamp : internalTransfer.dispatched_at,
    dispatched_by_user_id:
      nextStatus === "dispatched"
        ? actorUserId || internalTransfer.dispatched_by_user_id || ""
        : internalTransfer.dispatched_by_user_id || "",
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
    const internalTransfers = readInternalTransfers();
    const timestamp = new Date().toISOString();
    const normalizedInput = normalizeInternalTransfer({
      ...input,
      id: "new",
      transfer_order_number: "new",
      picked_at: "",
      dispatched_at: "",
      dispatched_by_user_id: input.dispatched_by_user_id ?? "",
      received_at: "",
      completed_at: "",
      created_at: timestamp,
      updated_at: timestamp,
    });

    validateInternalTransferLineProgress(normalizedInput);

    if (normalizedInput.logistics_status === "picking") {
      validateTransitionRequirements(normalizedInput, "picking");
    }

    if (normalizedInput.logistics_status === "dispatched") {
      validateTransitionRequirements(normalizedInput, "dispatched");
    }

    if (normalizedInput.logistics_status === "in_transit" && !normalizedInput.dispatched_at) {
      throw new Error("Internal Transfer cannot start in transit without being dispatched first.");
    }

    const internalTransfer: InternalTransfer = {
      ...normalizedInput,
      id: buildInternalTransferId(input.destination_location_id),
      transfer_order_number: buildTransferOrderNumber(internalTransfers),
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

    if (isInternalTransferDispatchLocked(existing.logistics_status)) {
      throw new Error("Picked quantities are locked after dispatch.");
    }

    const updated: InternalTransfer = normalizeInternalTransfer({
      ...existing,
      ...input,
      id: existing.id,
      transfer_order_number: existing.transfer_order_number,
      logistics_status: input.logistics_status ?? existing.logistics_status,
      picked_at: existing.picked_at,
      dispatched_at: existing.dispatched_at,
      dispatched_by_user_id: existing.dispatched_by_user_id ?? "",
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
      has_exception: Boolean(internalTransfer.exception_code || internalTransfer.exception_notes),
    }));
  }
}

export const internalTransferRepository: InternalTransferRepository = new LocalInternalTransferRepository();
