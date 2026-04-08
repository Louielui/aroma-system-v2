/**
 * File intent: define the approved MVP Raw Ingredient domain model and related form types.
 * Design reminder for this file: preserve the approved single-table field names exactly and keep the model API-ready.
 */

export type RawIngredient = {
  id: string;
  name: string;
  short_name: string;
  category: string;
  description: string;
  status: string;
  location_id: string;
  preferred_supplier_id: string;
  supplier_item_name: string;
  supplier_item_code: string;
  base_unit: string;
  purchase_unit: string;
  purchase_pack_size: number | null;
  unit_conversion_ratio: number | null;
  current_stock: number | null;
  par_level: number | null;
  reorder_point: number | null;
  reorder_quantity: number | null;
  minimum_order_quantity: number | null;
  is_prep_input: boolean;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type RawIngredientUpsert = Omit<RawIngredient, "id" | "created_at" | "updated_at">;

export type RawIngredientFormValues = {
  name: string;
  short_name: string;
  category: string;
  description: string;
  status: string;
  location_id: string;
  preferred_supplier_id: string;
  supplier_item_name: string;
  supplier_item_code: string;
  base_unit: string;
  purchase_unit: string;
  purchase_pack_size: string;
  unit_conversion_ratio: string;
  current_stock: string;
  par_level: string;
  reorder_point: string;
  reorder_quantity: string;
  minimum_order_quantity: string;
  is_prep_input: boolean;
  is_active: boolean;
  notes: string;
};
