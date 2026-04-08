/*
 * File intent: validate and convert Stores / Branch Operations form values for par levels, stock takes, and replenishment requests.
 * Design reminder for this file: keep the workflow structural, preserve Stores ownership of demand intent, and keep replenishment requests separate from Logistics and Internal Transfer.
 */

import { z } from "zod";
import type {
  StoreParLevel,
  StoreParLevelFormValues,
  StoreParLevelUpsert,
  StoreReplenishmentRequest,
  StoreReplenishmentRequestCreateInput,
  StoreReplenishmentRequestFormLineValues,
  StoreReplenishmentRequestFormValues,
  StoreReplenishmentRequestUpdateInput,
  StoreStockTake,
  StoreStockTakeCreateInput,
  StoreStockTakeFormLineValues,
  StoreStockTakeFormValues,
} from "@/modules/stores/stores.types";

const numericString = z
  .string()
  .trim()
  .min(1, "This field is required")
  .refine((value) => !Number.isNaN(Number(value)), "Must be a number")
  .refine((value) => Number(value) >= 0, "Cannot be negative");

const optionalNumericString = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Number(value)), "Must be a number")
  .refine((value) => value === "" || Number(value) >= 0, "Cannot be negative");

export const storeParLevelFormSchema = z.object({
  store_location_id: z.string().trim().min(1, "Store location is required"),
  raw_ingredient_id: z.string().trim().min(1, "Raw ingredient is required"),
  item_name: z.string().trim().min(1, "Item name is required"),
  category: z.string().trim().min(1, "Category is required"),
  base_unit: z.string().trim().min(1, "Base unit is required"),
  par_quantity: numericString,
  reorder_trigger_quantity: optionalNumericString,
  is_active: z.boolean(),
  notes: z.string(),
});

const storeStockTakeLineSchema = z.object({
  store_par_level_id: z.string().trim().min(1, "Missing Store Par Level id"),
  raw_ingredient_id: z.string().trim().min(1, "Missing Raw Ingredient id"),
  item_name: z.string().trim().min(1, "Item name is required"),
  category: z.string().trim().min(1, "Category is required"),
  base_unit: z.string().trim().min(1, "Base unit is required"),
  par_quantity_snapshot: z.number().nullable(),
  counted_quantity: numericString,
  line_notes: z.string(),
});

export const storeStockTakeFormSchema = z.object({
  store_location_id: z.string().trim().min(1, "Store location is required"),
  stock_take_date: z.string().trim().min(1, "Stock take date is required"),
  counted_by_user_id: z.string(),
  notes: z.string(),
  status: z.enum(["draft", "submitted", "finalized"]),
  lines: z.array(storeStockTakeLineSchema).min(1, "At least one line is required"),
});

const storeReplenishmentRequestLineSchema = z.object({
  id: z.string(),
  source_store_stock_take_line_id: z.string(),
  source_store_par_level_id: z.string(),
  raw_ingredient_id: z.string().trim().min(1, "Missing Raw Ingredient id"),
  item_name: z.string().trim().min(1, "Item name is required"),
  category: z.string().trim().min(1, "Category is required"),
  base_unit: z.string().trim().min(1, "Base unit is required"),
  par_quantity_snapshot: z.number().nullable(),
  counted_quantity_snapshot: z.number().nullable(),
  shortage_quantity_snapshot: z.number().min(0, "Shortage quantity cannot be negative"),
  requested_quantity: numericString,
  line_notes: z.string(),
});

export const storeReplenishmentRequestFormSchema = z.object({
  store_location_id: z.string().trim().min(1, "Store location is required"),
  request_date: z.string().trim().min(1, "Request date is required"),
  requested_by_user_id: z.string(),
  source_store_stock_take_id: z.string(),
  notes: z.string(),
  status: z.enum(["draft", "submitted"]),
  lines: z
    .array(storeReplenishmentRequestLineSchema)
    .min(1, "At least one replenishment line is required")
    .refine(
      (lines) => lines.some((line) => Number(line.requested_quantity) > 0),
      "At least one requested quantity must be greater than zero",
    ),
});

export function createDefaultStoreParLevelFormValues(): StoreParLevelFormValues {
  return {
    store_location_id: "",
    raw_ingredient_id: "",
    item_name: "",
    category: "",
    base_unit: "",
    par_quantity: "",
    reorder_trigger_quantity: "",
    is_active: true,
    notes: "",
  };
}

export function storeParLevelToFormValues(parLevel: StoreParLevel): StoreParLevelFormValues {
  return {
    store_location_id: parLevel.store_location_id,
    raw_ingredient_id: parLevel.raw_ingredient_id,
    item_name: parLevel.item_name,
    category: parLevel.category,
    base_unit: parLevel.base_unit,
    par_quantity: parLevel.par_quantity === null || parLevel.par_quantity === undefined ? "" : String(parLevel.par_quantity),
    reorder_trigger_quantity:
      parLevel.reorder_trigger_quantity === null || parLevel.reorder_trigger_quantity === undefined
        ? ""
        : String(parLevel.reorder_trigger_quantity),
    is_active: parLevel.is_active,
    notes: parLevel.notes,
  };
}

export function parseStoreParLevelFormValues(values: StoreParLevelFormValues): StoreParLevelUpsert {
  const parsed = storeParLevelFormSchema.parse(values);

  return {
    store_location_id: parsed.store_location_id,
    raw_ingredient_id: parsed.raw_ingredient_id,
    item_name: parsed.item_name,
    category: parsed.category,
    base_unit: parsed.base_unit,
    par_quantity: Number(parsed.par_quantity),
    reorder_trigger_quantity: parsed.reorder_trigger_quantity === "" ? null : Number(parsed.reorder_trigger_quantity),
    is_active: parsed.is_active,
    notes: parsed.notes,
  };
}

export function createStoreStockTakeFormValues(
  parLevels: StoreParLevel[],
  options?: Partial<StoreStockTake>,
): StoreStockTakeFormValues {
  return {
    store_location_id: options?.store_location_id ?? parLevels[0]?.store_location_id ?? "",
    stock_take_date: options?.stock_take_date ?? new Date().toISOString().slice(0, 10),
    counted_by_user_id: options?.counted_by_user_id ?? "",
    notes: options?.notes ?? "",
    status: options?.status ?? "draft",
    lines:
      options?.lines?.map((line): StoreStockTakeFormLineValues => ({
        store_par_level_id: line.store_par_level_id,
        raw_ingredient_id: line.raw_ingredient_id,
        item_name: line.item_name,
        category: line.category,
        base_unit: line.base_unit,
        par_quantity_snapshot: line.par_quantity_snapshot,
        counted_quantity: String(line.counted_quantity),
        line_notes: line.line_notes,
      })) ??
      parLevels.map((parLevel): StoreStockTakeFormLineValues => ({
        store_par_level_id: parLevel.id,
        raw_ingredient_id: parLevel.raw_ingredient_id,
        item_name: parLevel.item_name,
        category: parLevel.category,
        base_unit: parLevel.base_unit,
        par_quantity_snapshot: parLevel.par_quantity,
        counted_quantity: "0",
        line_notes: "",
      })),
  };
}

export function parseStoreStockTakeFormValues(values: StoreStockTakeFormValues): StoreStockTakeCreateInput {
  const parsed = storeStockTakeFormSchema.parse(values);

  return {
    store_location_id: parsed.store_location_id,
    stock_take_date: parsed.stock_take_date,
    counted_by_user_id: parsed.counted_by_user_id.trim() === "" ? null : parsed.counted_by_user_id,
    notes: parsed.notes,
    status: parsed.status,
    lines: parsed.lines.map((line) => ({
      store_par_level_id: line.store_par_level_id,
      raw_ingredient_id: line.raw_ingredient_id,
      item_name: line.item_name,
      category: line.category,
      base_unit: line.base_unit,
      par_quantity_snapshot: line.par_quantity_snapshot,
      counted_quantity: Number(line.counted_quantity),
      line_notes: line.line_notes,
    })),
  };
}

export function createStoreReplenishmentRequestFormValues(
  stockTake: StoreStockTake,
  options?: Partial<StoreReplenishmentRequest>,
): StoreReplenishmentRequestFormValues {
  return {
    store_location_id: options?.store_location_id ?? stockTake.store_location_id,
    request_date: options?.request_date ?? new Date().toISOString().slice(0, 10),
    requested_by_user_id: options?.requested_by_user_id ?? "",
    source_store_stock_take_id: options?.source_store_stock_take_id ?? stockTake.id,
    notes: options?.notes ?? "",
    status: options?.status ?? "draft",
    lines:
      options?.lines?.map((line): StoreReplenishmentRequestFormLineValues => ({
        id: line.id,
        source_store_stock_take_line_id: line.source_store_stock_take_line_id ?? "",
        source_store_par_level_id: line.source_store_par_level_id ?? "",
        raw_ingredient_id: line.raw_ingredient_id,
        item_name: line.item_name,
        category: line.category,
        base_unit: line.base_unit,
        par_quantity_snapshot: line.par_quantity_snapshot,
        counted_quantity_snapshot: line.counted_quantity_snapshot,
        shortage_quantity_snapshot: line.shortage_quantity_snapshot,
        requested_quantity: String(line.requested_quantity),
        line_notes: line.line_notes,
      })) ??
      stockTake.lines
        .filter((line) => line.shortage_quantity > 0)
        .map((line): StoreReplenishmentRequestFormLineValues => ({
          id: "",
          source_store_stock_take_line_id: line.id,
          source_store_par_level_id: line.store_par_level_id,
          raw_ingredient_id: line.raw_ingredient_id,
          item_name: line.item_name,
          category: line.category,
          base_unit: line.base_unit,
          par_quantity_snapshot: line.par_quantity_snapshot,
          counted_quantity_snapshot: line.counted_quantity,
          shortage_quantity_snapshot: line.shortage_quantity,
          requested_quantity: String(line.shortage_quantity),
          line_notes: line.line_notes,
        })),
  };
}

export function storeReplenishmentRequestToFormValues(
  request: StoreReplenishmentRequest,
): StoreReplenishmentRequestFormValues {
  return {
    store_location_id: request.store_location_id,
    request_date: request.request_date,
    requested_by_user_id: request.requested_by_user_id ?? "",
    source_store_stock_take_id: request.source_store_stock_take_id ?? "",
    notes: request.notes,
    status: request.status,
    lines: request.lines.map((line) => ({
      id: line.id,
      source_store_stock_take_line_id: line.source_store_stock_take_line_id ?? "",
      source_store_par_level_id: line.source_store_par_level_id ?? "",
      raw_ingredient_id: line.raw_ingredient_id,
      item_name: line.item_name,
      category: line.category,
      base_unit: line.base_unit,
      par_quantity_snapshot: line.par_quantity_snapshot,
      counted_quantity_snapshot: line.counted_quantity_snapshot,
      shortage_quantity_snapshot: line.shortage_quantity_snapshot,
      requested_quantity: String(line.requested_quantity),
      line_notes: line.line_notes,
    })),
  };
}

function parseStoreReplenishmentRequestFormValues(
  values: StoreReplenishmentRequestFormValues,
): StoreReplenishmentRequestUpdateInput {
  const parsed = storeReplenishmentRequestFormSchema.parse(values);

  return {
    store_location_id: parsed.store_location_id,
    request_date: parsed.request_date,
    requested_by_user_id: parsed.requested_by_user_id.trim() === "" ? null : parsed.requested_by_user_id,
    source_store_stock_take_id: parsed.source_store_stock_take_id.trim() === "" ? null : parsed.source_store_stock_take_id,
    notes: parsed.notes,
    status: parsed.status,
    lines: parsed.lines
      .map((line) => ({
        id: line.id.trim() === "" ? null : line.id,
        source_store_stock_take_line_id:
          line.source_store_stock_take_line_id.trim() === "" ? null : line.source_store_stock_take_line_id,
        source_store_par_level_id: line.source_store_par_level_id.trim() === "" ? null : line.source_store_par_level_id,
        raw_ingredient_id: line.raw_ingredient_id,
        item_name: line.item_name,
        category: line.category,
        base_unit: line.base_unit,
        par_quantity_snapshot: line.par_quantity_snapshot,
        counted_quantity_snapshot: line.counted_quantity_snapshot,
        shortage_quantity_snapshot: line.shortage_quantity_snapshot,
        requested_quantity: Number(line.requested_quantity),
        line_notes: line.line_notes,
      }))
      .filter((line) => line.requested_quantity > 0),
  };
}

export function parseStoreReplenishmentRequestCreateFormValues(
  values: StoreReplenishmentRequestFormValues,
): StoreReplenishmentRequestCreateInput {
  const parsed = parseStoreReplenishmentRequestFormValues({ ...values, status: "draft" });

  return {
    ...parsed,
    status: "draft",
  };
}

export function parseStoreReplenishmentRequestUpdateFormValues(
  values: StoreReplenishmentRequestFormValues,
): StoreReplenishmentRequestUpdateInput {
  return parseStoreReplenishmentRequestFormValues(values);
}
