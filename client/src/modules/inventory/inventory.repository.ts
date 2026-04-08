/**
 * File intent: provide a passive Inventory foundation repository with read-only seed data for locations, balances, and ledger records.
 * Design reminder for this file: keep Inventory isolated from Stores and Logistics mutations while exposing inventory-owned read models only.
 */

import type {
  InventoryBalance,
  InventoryLocation,
  InventoryTransaction,
  InventoryTransactionGroup,
} from "@/modules/inventory/inventory.types";

const seedInventoryLocations: InventoryLocation[] = [
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
];

const seedInventoryBalances: InventoryBalance[] = [
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
];

const seedInventoryTransactionGroups: InventoryTransactionGroup[] = [
  {
    id: "inventory-transaction-group-opening-load",
    source_module: "inventory",
    source_document_type: "opening_balance",
    source_document_id: "opening-balance-seed-2026-01",
    posting_status: "posted",
    notes: "Foundation seed data for passive Inventory module initialization.",
    occurred_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
    posted_at: new Date("2026-01-03T10:05:00.000Z").toISOString(),
    created_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
    updated_at: new Date("2026-01-03T10:05:00.000Z").toISOString(),
  },
];

const seedInventoryTransactions: InventoryTransaction[] = [
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
    notes: "Initial passive opening balance for Inventory foundation.",
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
    notes: "Initial passive opening balance for Inventory foundation.",
    created_at: new Date("2026-01-04T10:00:00.000Z").toISOString(),
    updated_at: new Date("2026-01-04T10:05:00.000Z").toISOString(),
  },
];

export interface InventoryRepository {
  listLocations(): Promise<InventoryLocation[]>;
  getLocationById(id: string): Promise<InventoryLocation | null>;
  listBalances(): Promise<InventoryBalance[]>;
  getBalanceById(id: string): Promise<InventoryBalance | null>;
  listTransactions(): Promise<InventoryTransaction[]>;
  getTransactionById(id: string): Promise<InventoryTransaction | null>;
  listTransactionGroups(): Promise<InventoryTransactionGroup[]>;
  getTransactionGroupById(id: string): Promise<InventoryTransactionGroup | null>;
}

class LocalInventoryRepository implements InventoryRepository {
  async listLocations() {
    return [...seedInventoryLocations];
  }

  async getLocationById(id: string) {
    return seedInventoryLocations.find((location) => location.id === id) ?? null;
  }

  async listBalances() {
    return [...seedInventoryBalances];
  }

  async getBalanceById(id: string) {
    return seedInventoryBalances.find((balance) => balance.id === id) ?? null;
  }

  async listTransactions() {
    return [...seedInventoryTransactions];
  }

  async getTransactionById(id: string) {
    return seedInventoryTransactions.find((transaction) => transaction.id === id) ?? null;
  }

  async listTransactionGroups() {
    return [...seedInventoryTransactionGroups];
  }

  async getTransactionGroupById(id: string) {
    return seedInventoryTransactionGroups.find((group) => group.id === id) ?? null;
  }
}

export const inventoryRepository: InventoryRepository = new LocalInventoryRepository();
