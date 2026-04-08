/**
 * File intent: define the passive Inventory foundation domain model for locations, balances, and ledger transactions.
 * Design reminder for this file: keep Inventory independent from Stores demand and Logistics execution while preparing a dedicated stock ledger model without enabling any live posting.
 */

export type InventoryLocationType =
  | "warehouse"
  | "central_kitchen"
  | "store"
  | "prep_area"
  | "transit_hub"
  | "other";

export type InventorySourceModule =
  | "inventory"
  | "procurement"
  | "stores"
  | "logistics"
  | "central_kitchen"
  | "system";

export type InventoryTransactionType =
  | "opening_balance"
  | "transfer_out"
  | "transfer_in"
  | "transfer_variance_loss"
  | "transfer_variance_gain"
  | "stock_adjustment"
  | "goods_receipt"
  | "production_issue"
  | "production_output"
  | "manual_correction";

export type InventoryTransactionReasonCode =
  | "initial_load"
  | "internal_transfer_dispatch"
  | "internal_transfer_receipt"
  | "internal_transfer_short_receipt"
  | "internal_transfer_damage"
  | "stock_take_adjustment"
  | "manual_adjustment"
  | "procurement_receipt"
  | "production_consumption"
  | "production_output"
  | "data_fix"
  | "other";

export type InventoryTransactionGroupStatus = "draft" | "posted" | "void";

export type InventoryLocation = {
  id: string;
  code: string;
  name: string;
  location_type: InventoryLocationType;
  parent_location_id: string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryBalance = {
  id: string;
  location_id: string;
  raw_ingredient_id: string;
  item_name: string;
  base_unit: string;
  on_hand_quantity: number;
  last_transaction_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryTransactionGroup = {
  id: string;
  source_module: InventorySourceModule;
  source_document_type: string;
  source_document_id: string;
  posting_status: InventoryTransactionGroupStatus;
  notes: string;
  occurred_at: string;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryTransaction = {
  id: string;
  transaction_group_id: string | null;
  transaction_type: InventoryTransactionType;
  reason_code: InventoryTransactionReasonCode;
  raw_ingredient_id: string;
  item_name: string;
  base_unit: string;
  location_id: string;
  quantity_delta: number;
  balance_after: number | null;
  source_module: InventorySourceModule;
  source_document_type: string;
  source_document_id: string;
  source_line_id: string | null;
  occurred_at: string;
  posted_at: string | null;
  posted_by_user_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type InventoryLocationUpsert = Omit<InventoryLocation, "id" | "created_at" | "updated_at">;

export type InventoryBalanceUpsert = Omit<InventoryBalance, "id" | "created_at" | "updated_at">;

export type InventoryTransactionGroupUpsert = Omit<
  InventoryTransactionGroup,
  "id" | "created_at" | "updated_at"
>;

export type InventoryTransactionUpsert = Omit<InventoryTransaction, "id" | "created_at" | "updated_at">;

export const inventoryTransactionTypeOptions: InventoryTransactionType[] = [
  "opening_balance",
  "transfer_out",
  "transfer_in",
  "transfer_variance_loss",
  "transfer_variance_gain",
  "stock_adjustment",
  "goods_receipt",
  "production_issue",
  "production_output",
  "manual_correction",
];

export const inventoryTransactionReasonCodeOptions: InventoryTransactionReasonCode[] = [
  "initial_load",
  "internal_transfer_dispatch",
  "internal_transfer_receipt",
  "internal_transfer_short_receipt",
  "internal_transfer_damage",
  "stock_take_adjustment",
  "manual_adjustment",
  "procurement_receipt",
  "production_consumption",
  "production_output",
  "data_fix",
  "other",
];

export const inventoryLocationTypeOptions: InventoryLocationType[] = [
  "warehouse",
  "central_kitchen",
  "store",
  "prep_area",
  "transit_hub",
  "other",
];
