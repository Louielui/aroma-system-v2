/**
 * File intent: validate and convert Prep Stock Take form values into repository update entries.
 * Design reminder for this file: keep the workflow simple, schema-preserving, and focused on current_stock updates only.
 */

import { z } from "zod";
import type { RawIngredient } from "@/modules/central-kitchen/raw-ingredients.types";
import type {
  PrepStockTakeFormValues,
  PrepStockTakeLine,
  PrepStockTakeSaveEntry,
} from "@/modules/central-kitchen/prep-stock-take.types";

const prepStockTakeLineSchema = z.object({
  id: z.string().min(1, "Missing raw ingredient id"),
  name: z.string(),
  category: z.string(),
  base_unit: z.string().min(1, "Base unit is required"),
  current_stock: z.number().nullable(),
  counted_quantity: z
    .string()
    .trim()
    .min(1, "Counted quantity is required")
    .refine((value) => !Number.isNaN(Number(value)), "Counted quantity must be a number")
    .refine((value) => Number(value) >= 0, "Counted quantity cannot be negative"),
});

export const prepStockTakeFormSchema = z.object({
  lines: z.array(prepStockTakeLineSchema),
});

export function createPrepStockTakeFormValues(rawIngredients: RawIngredient[]): PrepStockTakeFormValues {
  return {
    lines: rawIngredients.map((rawIngredient): PrepStockTakeLine => ({
      id: rawIngredient.id,
      name: rawIngredient.name,
      category: rawIngredient.category,
      base_unit: rawIngredient.base_unit,
      current_stock: rawIngredient.current_stock,
      counted_quantity:
        rawIngredient.current_stock === null || rawIngredient.current_stock === undefined
          ? ""
          : String(rawIngredient.current_stock),
    })),
  };
}

export function parsePrepStockTakeFormValues(values: PrepStockTakeFormValues): PrepStockTakeSaveEntry[] {
  const parsed = prepStockTakeFormSchema.parse(values);

  return parsed.lines.map((line) => ({
    id: line.id,
    counted_quantity: Number(line.counted_quantity),
  }));
}
