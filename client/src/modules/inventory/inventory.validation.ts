/**
 * File intent: validate passive Inventory foundation records and provide safe seed helpers without enabling any stock posting workflows.
 * Design reminder for this file: keep Inventory isolated from Stores and Logistics mutations while validating ledger-ready entities only.
 */

import { z } from "zod";
import type {
  InventoryBalance,
  InventoryLocation,
  InventoryLocationType,
  InventoryTransaction,
  InventoryTransactionGroup,
  InventoryTransactionGroupStatus,
  InventoryTransactionReasonCode,
  InventoryTransactionType,
} from "@/modules/inventory/inventory.types";
import {
  inventoryLocationTypeOptions,
  inventoryTransactionReasonCodeOptions,
  inventoryTransactionTypeOptions,
} from "@/modules/inventory/inventory.types";

const optionalText = z.string().trim().max(2000).optional().or(z.literal(""));
const requiredText = (label: string, max = 200) => z.string().trim().min(1, `${label} is required`).max(max);
const isoDateString = (label: string) => z.string().trim().min(1, `${label} is required`);

const inventoryLocationTypeSchema = z.enum(inventoryLocationTypeOptions as [InventoryLocationType, ...InventoryLocationType[]]);
const inventoryTransactionTypeSchema = z.enum(
  inventoryTransactionTypeOptions as [InventoryTransactionType, ...InventoryTransactionType[]],
);
const inventoryTransactionReasonCodeSchema = z.enum(
  inventoryTransactionReasonCodeOptions as [InventoryTransactionReasonCode, ...InventoryTransactionReasonCode[]],
);
const inventoryTransactionGroupStatusSchema = z.enum([
  "draft",
  "posted",
  "void",
] as [InventoryTransactionGroupStatus, ...InventoryTransactionGroupStatus[]]);
const inventorySourceModuleSchema = z.enum(["inventory", "procurement", "stores", "logistics", "central_kitchen", "system"]);

export const inventoryLocationSchema = z.object({
  code: requiredText("Location code", 100),
  name: requiredText("Location name", 200),
  location_type: inventoryLocationTypeSchema,
  parent_location_id: z.string().trim().max(100).nullable(),
  notes: optionalText,
  is_active: z.boolean(),
});

export const inventoryBalanceSchema = z.object({
  location_id: requiredText("Location", 100),
  raw_ingredient_id: requiredText("Raw ingredient", 100),
  item_name: requiredText("Item name", 200),
  base_unit: requiredText("Base unit", 50),
  on_hand_quantity: z.number().finite(),
  last_transaction_at: z.string().trim().nullable(),
});

export const inventoryTransactionGroupSchema = z.object({
  source_module: inventorySourceModuleSchema,
  source_document_type: requiredText("Source document type", 100),
  source_document_id: requiredText("Source document ID", 100),
  posting_status: inventoryTransactionGroupStatusSchema,
  notes: optionalText,
  occurred_at: isoDateString("Occurred at"),
  posted_at: z.string().trim().nullable(),
});

export const inventoryTransactionSchema = z.object({
  transaction_group_id: z.string().trim().max(100).nullable(),
  transaction_type: inventoryTransactionTypeSchema,
  reason_code: inventoryTransactionReasonCodeSchema,
  raw_ingredient_id: requiredText("Raw ingredient", 100),
  item_name: requiredText("Item name", 200),
  base_unit: requiredText("Base unit", 50),
  location_id: requiredText("Location", 100),
  quantity_delta: z.number().finite(),
  balance_after: z.number().finite().nullable(),
  source_module: inventorySourceModuleSchema,
  source_document_type: requiredText("Source document type", 100),
  source_document_id: requiredText("Source document ID", 100),
  source_line_id: z.string().trim().max(100).nullable(),
  occurred_at: isoDateString("Occurred at"),
  posted_at: z.string().trim().nullable(),
  posted_by_user_id: z.string().trim().max(100).nullable(),
  notes: optionalText,
});

export function createDefaultInventoryLocationValues(): Omit<InventoryLocation, "id" | "created_at" | "updated_at"> {
  return {
    code: "",
    name: "",
    location_type: "store",
    parent_location_id: null,
    notes: "",
    is_active: true,
  };
}

export function createDefaultInventoryBalanceValues(): Omit<InventoryBalance, "id" | "created_at" | "updated_at"> {
  return {
    location_id: "",
    raw_ingredient_id: "",
    item_name: "",
    base_unit: "",
    on_hand_quantity: 0,
    last_transaction_at: null,
  };
}

export function createDefaultInventoryTransactionGroupValues(): Omit<
  InventoryTransactionGroup,
  "id" | "created_at" | "updated_at"
> {
  return {
    source_module: "inventory",
    source_document_type: "manual",
    source_document_id: "",
    posting_status: "draft",
    notes: "",
    occurred_at: new Date().toISOString(),
    posted_at: null,
  };
}

export function createDefaultInventoryTransactionValues(): Omit<
  InventoryTransaction,
  "id" | "created_at" | "updated_at"
> {
  return {
    transaction_group_id: null,
    transaction_type: "opening_balance",
    reason_code: "initial_load",
    raw_ingredient_id: "",
    item_name: "",
    base_unit: "",
    location_id: "",
    quantity_delta: 0,
    balance_after: null,
    source_module: "inventory",
    source_document_type: "manual",
    source_document_id: "",
    source_line_id: null,
    occurred_at: new Date().toISOString(),
    posted_at: null,
    posted_by_user_id: null,
    notes: "",
  };
}
