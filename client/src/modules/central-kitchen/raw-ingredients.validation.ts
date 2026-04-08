/**
 * File intent: provide basic validation and form conversion for the approved MVP Raw Ingredient model.
 * Design reminder for this file: enforce exact field names and base-unit stock handling without redesigning the model.
 */

import { z } from "zod";
import type {
  RawIngredient,
  RawIngredientFormValues,
  RawIngredientUpsert,
} from "@/modules/central-kitchen/raw-ingredients.types";

const optionalText = z.string().trim().max(200).optional().or(z.literal(""));
const optionalLongText = z.string().trim().max(2000).optional().or(z.literal(""));

const numericString = (label: string, allowZero = true) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (!Number.isNaN(Number(value)) &&
          (allowZero ? Number(value) >= 0 : Number(value) > 0)),
      `${label} must be ${allowZero ? "0 or greater" : "greater than 0"}`,
    );

export const rawIngredientFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  short_name: z.string().trim().max(100).optional().or(z.literal("")),
  category: z.string().trim().min(1, "Category is required").max(100),
  description: optionalLongText,
  status: z.string().trim().min(1, "Status is required").max(50),
  location_id: z.string().trim().min(1, "Location ID is required").max(100),
  preferred_supplier_id: z.string().trim().max(100).optional().or(z.literal("")),
  supplier_item_name: optionalText,
  supplier_item_code: optionalText,
  base_unit: z.string().trim().min(1, "Base unit is required").max(50),
  purchase_unit: z.string().trim().min(1, "Purchase unit is required").max(50),
  purchase_pack_size: numericString("Purchase pack size", false),
  unit_conversion_ratio: numericString("Unit conversion ratio", false),
  current_stock: numericString("Current stock"),
  par_level: numericString("Par level"),
  reorder_point: numericString("Reorder point"),
  reorder_quantity: numericString("Reorder quantity"),
  minimum_order_quantity: numericString("Minimum order quantity"),
  is_prep_input: z.boolean(),
  is_active: z.boolean(),
  notes: optionalLongText,
});

function parseNullableNumber(value: string) {
  return value === "" ? null : Number(value);
}

export function createDefaultRawIngredientFormValues(): RawIngredientFormValues {
  return {
    name: "",
    short_name: "",
    category: "",
    description: "",
    status: "active",
    location_id: "",
    preferred_supplier_id: "",
    supplier_item_name: "",
    supplier_item_code: "",
    base_unit: "",
    purchase_unit: "",
    purchase_pack_size: "",
    unit_conversion_ratio: "",
    current_stock: "",
    par_level: "",
    reorder_point: "",
    reorder_quantity: "",
    minimum_order_quantity: "",
    is_prep_input: true,
    is_active: true,
    notes: "",
  };
}

export function rawIngredientToFormValues(rawIngredient: RawIngredient): RawIngredientFormValues {
  return {
    name: rawIngredient.name,
    short_name: rawIngredient.short_name,
    category: rawIngredient.category,
    description: rawIngredient.description,
    status: rawIngredient.status,
    location_id: rawIngredient.location_id,
    preferred_supplier_id: rawIngredient.preferred_supplier_id,
    supplier_item_name: rawIngredient.supplier_item_name,
    supplier_item_code: rawIngredient.supplier_item_code,
    base_unit: rawIngredient.base_unit,
    purchase_unit: rawIngredient.purchase_unit,
    purchase_pack_size: rawIngredient.purchase_pack_size === null ? "" : String(rawIngredient.purchase_pack_size),
    unit_conversion_ratio: rawIngredient.unit_conversion_ratio === null ? "" : String(rawIngredient.unit_conversion_ratio),
    current_stock: rawIngredient.current_stock === null ? "" : String(rawIngredient.current_stock),
    par_level: rawIngredient.par_level === null ? "" : String(rawIngredient.par_level),
    reorder_point: rawIngredient.reorder_point === null ? "" : String(rawIngredient.reorder_point),
    reorder_quantity: rawIngredient.reorder_quantity === null ? "" : String(rawIngredient.reorder_quantity),
    minimum_order_quantity: rawIngredient.minimum_order_quantity === null ? "" : String(rawIngredient.minimum_order_quantity),
    is_prep_input: rawIngredient.is_prep_input,
    is_active: rawIngredient.is_active,
    notes: rawIngredient.notes,
  };
}

export function parseRawIngredientFormValues(values: RawIngredientFormValues): RawIngredientUpsert {
  const validated = rawIngredientFormSchema.parse(values);

  return {
    name: validated.name,
    short_name: validated.short_name ?? "",
    category: validated.category,
    description: validated.description ?? "",
    status: validated.status,
    location_id: validated.location_id,
    preferred_supplier_id: validated.preferred_supplier_id ?? "",
    supplier_item_name: validated.supplier_item_name ?? "",
    supplier_item_code: validated.supplier_item_code ?? "",
    base_unit: validated.base_unit,
    purchase_unit: validated.purchase_unit,
    purchase_pack_size: parseNullableNumber(validated.purchase_pack_size),
    unit_conversion_ratio: parseNullableNumber(validated.unit_conversion_ratio),
    current_stock: parseNullableNumber(validated.current_stock),
    par_level: parseNullableNumber(validated.par_level),
    reorder_point: parseNullableNumber(validated.reorder_point),
    reorder_quantity: parseNullableNumber(validated.reorder_quantity),
    minimum_order_quantity: parseNullableNumber(validated.minimum_order_quantity),
    is_prep_input: validated.is_prep_input,
    is_active: validated.is_active,
    notes: validated.notes ?? "",
  };
}
