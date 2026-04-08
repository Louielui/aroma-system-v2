/**
 * File intent: provide Inventory ledger reads and receipt-triggered posting for stock balance consequences.
 * Design reminder for this file: keep Inventory as the owner of ledger and balance state while recording Logistics receipt outcomes without mutating Logistics business data.
 */

import type { InternalTransfer, InternalTransferLineItem } from "@/modules/logistics/internal-transfers.types";
import type {
  InventoryBalance,
  InventoryLocation,
  InventoryPostingResult,
  InventorySourceModule,
  InventoryTransaction,
  InventoryTransactionGroup,
  InventoryTransactionReasonCode,
} from "@/modules/inventory/inventory.types";

const STORAGE_KEY = "aroma-system-v2.inventory.snapshot";

type InventorySnapshot = {
  locations: InventoryLocation[];
  balances: InventoryBalance[];
  transactionGroups: InventoryTransactionGroup[];
  transactions: InventoryTransaction[];
};

const seedInventorySnapshot: InventorySnapshot = {
  locations: [
    {
      id: "inventory-location-ck-main-store",
      code: "CK-MAIN-STORE",
      name: "Central Kitchen",
      location_type: "central_kitchen",
      parent_location_id: null,
      notes: "Primary stock-holding location aligned to the Central Kitchen operating location.",
      is_active: true,
      created_at: new Date("2026-01-02T08:00:00.000Z").toISOString(),
      updated_at: new Date("2026-01-02T08:00:00.000Z").toISOString(),
    },
    {
      id: "inventory-location-store-downtown",
      code: "STORE-DOWNTOWN",
      name: "St Mary",
      location_type: "store",
      parent_location_id: null,
      notes: "Branch-level stock room aligned to the St Mary operating location.",
      is_active: true,
      created_at: new Date("2026-01-02T08:10:00.000Z").toISOString(),
      updated_at: new Date("2026-01-02T08:10:00.000Z").toISOString(),
    },
    {
      id: "inventory-location-store-harbor",
      code: "STORE-HARBOR",
      name: "Forks",
      location_type: "store",
      parent_location_id: null,
      notes: "Branch-level stock room aligned to the Forks operating location.",
      is_active: true,
      created_at: new Date("2026-01-02T08:20:00.000Z").toISOString(),
      updated_at: new Date("2026-01-02T08:20:00.000Z").toISOString(),
    },
  ],
  balances: [
    {
      id: "inventory-balance-ck-chicken-breast",
      location_id: "inventory-location-ck-main-store",
      raw_ingredient_id: "raw-ingredient-chicken-breast",
      item_name: "Chicken Breast",
      base_unit: "kg",
      on_hand_quantity: 18,
      last_transaction_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
      created_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
      updated_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
    },
    {
      id: "inventory-balance-ck-yellow-onion",
      location_id: "inventory-location-ck-main-store",
      raw_ingredient_id: "raw-ingredient-yellow-onion",
      item_name: "Yellow Onion",
      base_unit: "kg",
      on_hand_quantity: 40,
      last_transaction_at: new Date("2026-01-04T10:00:00.000Z").toISOString(),
      created_at: new Date("2026-01-04T10:00:00.000Z").toISOString(),
      updated_at: new Date("2026-01-04T10:00:00.000Z").toISOString(),
    },
    {
      id: "inventory-balance-downtown-chicken-breast",
      location_id: "inventory-location-store-downtown",
      raw_ingredient_id: "raw-ingredient-chicken-breast",
      item_name: "Chicken Breast",
      base_unit: "kg",
      on_hand_quantity: 0,
      last_transaction_at: null,
      created_at: new Date("2026-01-05T10:00:00.000Z").toISOString(),
      updated_at: new Date("2026-01-05T10:00:00.000Z").toISOString(),
    },
  ],
  transactionGroups: [
    {
      id: "inventory-transaction-group-opening-load",
      source_module: "inventory",
      source_document_type: "opening_balance",
      source_document_id: "opening-balance-seed-2026-01",
      posting_status: "posted",
      notes: "Foundation seed data for Inventory module initialization.",
      occurred_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
      posted_at: new Date("2026-01-03T10:05:00.000Z").toISOString(),
      created_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
      updated_at: new Date("2026-01-03T10:05:00.000Z").toISOString(),
    },
  ],
  transactions: [
    {
      id: "inventory-transaction-opening-chicken-breast",
      transaction_group_id: "inventory-transaction-group-opening-load",
      transaction_type: "opening_balance",
      reason_code: "initial_load",
      raw_ingredient_id: "raw-ingredient-chicken-breast",
      item_name: "Chicken Breast",
      base_unit: "kg",
      location_id: "inventory-location-ck-main-store",
      quantity_delta: 18,
      balance_after: 18,
      source_module: "inventory",
      source_document_type: "opening_balance",
      source_document_id: "opening-balance-seed-2026-01",
      source_line_id: "line-chicken-breast",
      occurred_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
      posted_at: new Date("2026-01-03T10:05:00.000Z").toISOString(),
      posted_by_user_id: "system-seed",
      notes: "Initial opening balance for Inventory foundation.",
      created_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
      updated_at: new Date("2026-01-03T10:05:00.000Z").toISOString(),
    },
    {
      id: "inventory-transaction-opening-yellow-onion",
      transaction_group_id: "inventory-transaction-group-opening-load",
      transaction_type: "opening_balance",
      reason_code: "initial_load",
      raw_ingredient_id: "raw-ingredient-yellow-onion",
      item_name: "Yellow Onion",
      base_unit: "kg",
      location_id: "inventory-location-ck-main-store",
      quantity_delta: 40,
      balance_after: 40,
      source_module: "inventory",
      source_document_type: "opening_balance",
      source_document_id: "opening-balance-seed-2026-01",
      source_line_id: "line-yellow-onion",
      occurred_at: new Date("2026-01-04T10:00:00.000Z").toISOString(),
      posted_at: new Date("2026-01-04T10:05:00.000Z").toISOString(),
      posted_by_user_id: "system-seed",
      notes: "Initial opening balance for Inventory foundation.",
      created_at: new Date("2026-01-04T10:00:00.000Z").toISOString(),
      updated_at: new Date("2026-01-04T10:05:00.000Z").toISOString(),
    },
  ],
};

let memoryInventorySnapshot = cloneSnapshot(seedInventorySnapshot);

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneSnapshot(snapshot: InventorySnapshot): InventorySnapshot {
  return {
    locations: snapshot.locations.map((location) => ({ ...location })),
    balances: snapshot.balances.map((balance) => ({ ...balance })),
    transactionGroups: snapshot.transactionGroups.map((group) => ({ ...group })),
    transactions: snapshot.transactions.map((transaction) => ({ ...transaction })),
  };
}

function normalizeSnapshot(input: Partial<InventorySnapshot> | null | undefined): InventorySnapshot {
  if (!input) {
    return cloneSnapshot(seedInventorySnapshot);
  }

  return {
    locations: Array.isArray(input.locations)
      ? input.locations.map((location) => ({ ...location }))
      : cloneSnapshot(seedInventorySnapshot).locations,
    balances: Array.isArray(input.balances)
      ? input.balances.map((balance) => ({ ...balance }))
      : cloneSnapshot(seedInventorySnapshot).balances,
    transactionGroups: Array.isArray(input.transactionGroups)
      ? input.transactionGroups.map((group) => ({ ...group }))
      : cloneSnapshot(seedInventorySnapshot).transactionGroups,
    transactions: Array.isArray(input.transactions)
      ? input.transactions.map((transaction) => ({ ...transaction }))
      : cloneSnapshot(seedInventorySnapshot).transactions,
  };
}

function readInventorySnapshot(): InventorySnapshot {
  if (!canUseBrowserStorage()) {
    return cloneSnapshot(memoryInventorySnapshot);
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (!existing) {
    writeInventorySnapshot(seedInventorySnapshot);
    return cloneSnapshot(seedInventorySnapshot);
  }

  try {
    return normalizeSnapshot(JSON.parse(existing) as Partial<InventorySnapshot>);
  } catch {
    writeInventorySnapshot(seedInventorySnapshot);
    return cloneSnapshot(seedInventorySnapshot);
  }
}

function writeInventorySnapshot(snapshot: InventorySnapshot) {
  const normalized = normalizeSnapshot(snapshot);
  memoryInventorySnapshot = cloneSnapshot(normalized);

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
}

function normalizeLookupKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "") || "value";
}

function buildBalanceKey(locationId: string, rawIngredientId: string) {
  return `${locationId}::${rawIngredientId}`;
}

function buildBalanceId(locationId: string, rawIngredientId: string) {
  return `inventory-balance-${toSlug(locationId)}-${toSlug(rawIngredientId)}`;
}

function buildTransactionGroupId(sourceModule: InventorySourceModule, sourceDocumentId: string) {
  return `inventory-transaction-group-${toSlug(sourceModule)}-${toSlug(sourceDocumentId)}`;
}

function buildTransactionId(sourceDocumentId: string, sourceLineId: string | null, transactionType: string) {
  return `inventory-transaction-${toSlug(sourceDocumentId)}-${toSlug(sourceLineId ?? transactionType)}-${toSlug(transactionType)}`;
}

function findLocationMapping(locations: InventoryLocation[], operationalLocationId: string) {
  const targetKey = normalizeLookupKey(operationalLocationId);

  return (
    locations.find((location) => {
      const candidates = [location.id, location.code, location.name].filter(Boolean).map(normalizeLookupKey);
      return candidates.includes(targetKey);
    }) ?? null
  );
}

function ensureBalanceRecord(
  balances: InventoryBalance[],
  balanceMap: Map<string, InventoryBalance>,
  locationId: string,
  lineItem: InternalTransferLineItem,
  timestamp: string,
) {
  const key = buildBalanceKey(locationId, lineItem.raw_ingredient_id);
  const existing = balanceMap.get(key);

  if (existing) {
    return existing;
  }

  const created: InventoryBalance = {
    id: buildBalanceId(locationId, lineItem.raw_ingredient_id),
    location_id: locationId,
    raw_ingredient_id: lineItem.raw_ingredient_id,
    item_name: lineItem.item_name,
    base_unit: lineItem.base_unit,
    on_hand_quantity: 0,
    last_transaction_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  balanceMap.set(key, created);
  balances.push(created);
  return created;
}

function inferVarianceReasonCode(lineItem: InternalTransferLineItem): InventoryTransactionReasonCode {
  if (lineItem.discrepancy_notes.trim().toLowerCase().includes("damage")) {
    return "internal_transfer_damage";
  }

  return "internal_transfer_short_receipt";
}

function validatePostingEligibility(
  snapshot: InventorySnapshot,
  internalTransfer: InternalTransfer,
  sourceLocation: InventoryLocation | null,
  destinationLocation: InventoryLocation | null,
) {
  if (internalTransfer.logistics_status !== "received") {
    throw new Error("Inventory posting is allowed only when the Internal Transfer status is received.");
  }

  const duplicateGroup = snapshot.transactionGroups.find(
    (group) =>
      group.source_module === "logistics" &&
      group.source_document_id === internalTransfer.id &&
      group.posting_status !== "void",
  );

  if (duplicateGroup) {
    throw new Error("Inventory posting already exists for this Internal Transfer.");
  }

  if (!sourceLocation || !destinationLocation) {
    throw new Error("Inventory location mapping is missing for the Internal Transfer source or destination.");
  }

  for (const lineItem of internalTransfer.line_items) {
    if (!Number.isFinite(lineItem.picked_quantity) || lineItem.picked_quantity < 0) {
      throw new Error(`Picked quantity is invalid for ${lineItem.item_name}.`);
    }

    if (!Number.isFinite(lineItem.received_quantity) || lineItem.received_quantity < 0) {
      throw new Error(`Received quantity is invalid for ${lineItem.item_name}.`);
    }

    if (lineItem.received_quantity > lineItem.picked_quantity) {
      throw new Error(`Received quantity cannot exceed picked quantity for ${lineItem.item_name}.`);
    }

    if (lineItem.received_quantity > 0 && lineItem.picked_quantity <= 0) {
      throw new Error(`Received quantity cannot be posted when picked quantity is 0 for ${lineItem.item_name}.`);
    }
  }
}

export interface InventoryRepository {
  listLocations(): Promise<InventoryLocation[]>;
  getLocationById(id: string): Promise<InventoryLocation | null>;
  listBalances(): Promise<InventoryBalance[]>;
  getBalanceById(id: string): Promise<InventoryBalance | null>;
  listTransactions(): Promise<InventoryTransaction[]>;
  getTransactionById(id: string): Promise<InventoryTransaction | null>;
  listTransactionGroups(): Promise<InventoryTransactionGroup[]>;
  getTransactionGroupById(id: string): Promise<InventoryTransactionGroup | null>;
  getTransactionGroupBySource(sourceModule: InventorySourceModule, sourceDocumentId: string): Promise<InventoryTransactionGroup | null>;
  postInternalTransferReceipt(internalTransfer: InternalTransfer, actorUserId?: string): Promise<InventoryPostingResult>;
}

class LocalInventoryRepository implements InventoryRepository {
  async listLocations() {
    return readInventorySnapshot().locations;
  }

  async getLocationById(id: string) {
    return readInventorySnapshot().locations.find((location) => location.id === id) ?? null;
  }

  async listBalances() {
    return readInventorySnapshot().balances;
  }

  async getBalanceById(id: string) {
    return readInventorySnapshot().balances.find((balance) => balance.id === id) ?? null;
  }

  async listTransactions() {
    return readInventorySnapshot().transactions;
  }

  async getTransactionById(id: string) {
    return readInventorySnapshot().transactions.find((transaction) => transaction.id === id) ?? null;
  }

  async listTransactionGroups() {
    return readInventorySnapshot().transactionGroups;
  }

  async getTransactionGroupById(id: string) {
    return readInventorySnapshot().transactionGroups.find((group) => group.id === id) ?? null;
  }

  async getTransactionGroupBySource(sourceModule: InventorySourceModule, sourceDocumentId: string) {
    return (
      readInventorySnapshot().transactionGroups.find(
        (group) => group.source_module === sourceModule && group.source_document_id === sourceDocumentId,
      ) ?? null
    );
  }

  async postInternalTransferReceipt(internalTransfer: InternalTransfer, actorUserId = "") {
    const snapshot = readInventorySnapshot();
    const sourceLocation = findLocationMapping(snapshot.locations, internalTransfer.source_location_id);
    const destinationLocation = findLocationMapping(snapshot.locations, internalTransfer.destination_location_id);

    validatePostingEligibility(snapshot, internalTransfer, sourceLocation, destinationLocation);

    const timestamp = new Date().toISOString();
    const occurredAt = internalTransfer.received_at || timestamp;
    const postedByUserId = actorUserId.trim() || null;
    const nextSnapshot = cloneSnapshot(snapshot);
    const balanceMap = new Map(
      nextSnapshot.balances.map((balance) => [buildBalanceKey(balance.location_id, balance.raw_ingredient_id), balance]),
    );
    const groupId = buildTransactionGroupId("logistics", internalTransfer.id);
    const createdTransactions: InventoryTransaction[] = [];
    const touchedBalanceKeys = new Set<string>();

    const transactionGroup: InventoryTransactionGroup = {
      id: groupId,
      source_module: "logistics",
      source_document_type: "internal_transfer",
      source_document_id: internalTransfer.id,
      posting_status: "posted",
      notes: `Posted from Internal Transfer receipt ${internalTransfer.transfer_order_number}.`,
      occurred_at: occurredAt,
      posted_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    };

    for (const lineItem of internalTransfer.line_items) {
      if (lineItem.picked_quantity <= 0 && lineItem.received_quantity <= 0) {
        continue;
      }

      const sourceBalance = ensureBalanceRecord(
        nextSnapshot.balances,
        balanceMap,
        sourceLocation!.id,
        lineItem,
        timestamp,
      );
      const destinationBalance = ensureBalanceRecord(
        nextSnapshot.balances,
        balanceMap,
        destinationLocation!.id,
        lineItem,
        timestamp,
      );

      if (lineItem.picked_quantity > 0) {
        sourceBalance.on_hand_quantity -= lineItem.picked_quantity;
        sourceBalance.last_transaction_at = occurredAt;
        sourceBalance.updated_at = timestamp;
        touchedBalanceKeys.add(buildBalanceKey(sourceBalance.location_id, sourceBalance.raw_ingredient_id));

        createdTransactions.push({
          id: buildTransactionId(internalTransfer.id, lineItem.id, "transfer_out"),
          transaction_group_id: groupId,
          transaction_type: "transfer_out",
          reason_code: "internal_transfer_receipt",
          raw_ingredient_id: lineItem.raw_ingredient_id,
          item_name: lineItem.item_name,
          base_unit: lineItem.base_unit,
          location_id: sourceLocation!.id,
          quantity_delta: -lineItem.picked_quantity,
          balance_after: sourceBalance.on_hand_quantity,
          source_module: "logistics",
          source_document_type: "internal_transfer",
          source_document_id: internalTransfer.id,
          source_line_id: lineItem.id,
          occurred_at: occurredAt,
          posted_at: timestamp,
          posted_by_user_id: postedByUserId,
          notes: `Transfer out from ${internalTransfer.source_location_id} to ${internalTransfer.destination_location_id}.`,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }

      if (lineItem.received_quantity > 0) {
        destinationBalance.on_hand_quantity += lineItem.received_quantity;
        destinationBalance.last_transaction_at = occurredAt;
        destinationBalance.updated_at = timestamp;
        touchedBalanceKeys.add(buildBalanceKey(destinationBalance.location_id, destinationBalance.raw_ingredient_id));

        createdTransactions.push({
          id: buildTransactionId(internalTransfer.id, lineItem.id, "transfer_in"),
          transaction_group_id: groupId,
          transaction_type: "transfer_in",
          reason_code: "internal_transfer_receipt",
          raw_ingredient_id: lineItem.raw_ingredient_id,
          item_name: lineItem.item_name,
          base_unit: lineItem.base_unit,
          location_id: destinationLocation!.id,
          quantity_delta: lineItem.received_quantity,
          balance_after: destinationBalance.on_hand_quantity,
          source_module: "logistics",
          source_document_type: "internal_transfer",
          source_document_id: internalTransfer.id,
          source_line_id: lineItem.id,
          occurred_at: occurredAt,
          posted_at: timestamp,
          posted_by_user_id: postedByUserId,
          notes: `Transfer received into ${internalTransfer.destination_location_id} from ${internalTransfer.source_location_id}.`,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }

      if (lineItem.picked_quantity > lineItem.received_quantity) {
        createdTransactions.push({
          id: buildTransactionId(internalTransfer.id, lineItem.id, "transfer_variance_loss"),
          transaction_group_id: groupId,
          transaction_type: "transfer_variance_loss",
          reason_code: inferVarianceReasonCode(lineItem),
          raw_ingredient_id: lineItem.raw_ingredient_id,
          item_name: lineItem.item_name,
          base_unit: lineItem.base_unit,
          location_id: sourceLocation!.id,
          quantity_delta: -(lineItem.picked_quantity - lineItem.received_quantity),
          balance_after: sourceBalance.on_hand_quantity,
          source_module: "logistics",
          source_document_type: "internal_transfer",
          source_document_id: internalTransfer.id,
          source_line_id: lineItem.id,
          occurred_at: occurredAt,
          posted_at: timestamp,
          posted_by_user_id: postedByUserId,
          notes:
            lineItem.discrepancy_notes.trim() ||
            `Transfer variance recorded for ${lineItem.item_name}: picked ${lineItem.picked_quantity}, received ${lineItem.received_quantity}.`,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }
    }

    nextSnapshot.transactionGroups = [transactionGroup, ...nextSnapshot.transactionGroups];
    nextSnapshot.transactions = [...createdTransactions, ...nextSnapshot.transactions];
    writeInventorySnapshot(nextSnapshot);

    const updatedBalances = nextSnapshot.balances.filter((balance) =>
      touchedBalanceKeys.has(buildBalanceKey(balance.location_id, balance.raw_ingredient_id)),
    );

    return {
      transaction_group: { ...transactionGroup },
      transactions: createdTransactions.map((transaction) => ({ ...transaction })),
      updated_balances: updatedBalances.map((balance) => ({ ...balance })),
    };
  }
}

export const inventoryRepository: InventoryRepository = new LocalInventoryRepository();
