/**
 * File intent: define the approved Stores / Branch Operations Phase 1 domain models for Store Par Level and Store Stock Take.
 * Design reminder for this file: keep Stores records separate from Logistics and Internal Transfer, and focus only on demand intent plus shortage calculation inputs.
 */

export type StoreParLevelStatus = "active" | "inactive";
export type StoreStockTakeStatus = "draft" | "submitted" | "finalized";

export type StoreParLevel = {
  id: string;
  store_location_id: string;
  raw_ingredient_id: string;
  item_name: string;
  category: string;
  base_unit: string;
  par_quantity: number | null;
  reorder_trigger_quantity: number | null;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type StoreParLevelUpsert = Omit<StoreParLevel, "id" | "created_at" | "updated_at">;

export type StoreParLevelFormValues = {
  store_location_id: string;
  raw_ingredient_id: string;
  item_name: string;
  category: string;
  base_unit: string;
  par_quantity: string;
  reorder_trigger_quantity: string;
  is_active: boolean;
  notes: string;
};

export type StoreStockTakeLine = {
  id: string;
  store_par_level_id: string;
  raw_ingredient_id: string;
  item_name: string;
  category: string;
  base_unit: string;
  counted_quantity: number;
  par_quantity_snapshot: number | null;
  shortage_quantity: number;
  overage_quantity: number;
  line_notes: string;
};

export type StoreStockTake = {
  id: string;
  stock_take_number: string;
  store_location_id: string;
  stock_take_date: string;
  counted_by_user_id: string | null;
  status: StoreStockTakeStatus;
  notes: string;
  lines: StoreStockTakeLine[];
  created_at: string;
  updated_at: string;
};

export type StoreStockTakeEntryLine = {
  store_par_level_id: string;
  raw_ingredient_id: string;
  item_name: string;
  category: string;
  base_unit: string;
  par_quantity_snapshot: number | null;
  counted_quantity: number;
  line_notes: string;
};

export type StoreStockTakeCreateInput = {
  store_location_id: string;
  stock_take_date: string;
  counted_by_user_id: string | null;
  notes: string;
  status: StoreStockTakeStatus;
  lines: StoreStockTakeEntryLine[];
};

export type StoreStockTakeFormLineValues = {
  store_par_level_id: string;
  raw_ingredient_id: string;
  item_name: string;
  category: string;
  base_unit: string;
  par_quantity_snapshot: number | null;
  counted_quantity: string;
  line_notes: string;
};

export type StoreStockTakeFormValues = {
  store_location_id: string;
  stock_take_date: string;
  counted_by_user_id: string;
  notes: string;
  status: StoreStockTakeStatus;
  lines: StoreStockTakeFormLineValues[];
};

export type StoreStockTakeShortageSummary = {
  total_line_count: number;
  shortage_line_count: number;
  overage_line_count: number;
  exact_line_count: number;
  total_shortage_quantity: number;
  total_overage_quantity: number;
};

export function calculateShortageQuantity(parQuantity: number | null, countedQuantity: number) {
  if (parQuantity === null || parQuantity === undefined) {
    return 0;
  }

  return Math.max(parQuantity - countedQuantity, 0);
}

export function calculateOverageQuantity(parQuantity: number | null, countedQuantity: number) {
  if (parQuantity === null || parQuantity === undefined) {
    return 0;
  }

  return Math.max(countedQuantity - parQuantity, 0);
}

export function summarizeStoreStockTake(lines: StoreStockTakeLine[]): StoreStockTakeShortageSummary {
  return lines.reduce<StoreStockTakeShortageSummary>(
    (summary, line) => {
      const hasShortage = line.shortage_quantity > 0;
      const hasOverage = line.overage_quantity > 0;
      const isExact = !hasShortage && !hasOverage;

      return {
        total_line_count: summary.total_line_count + 1,
        shortage_line_count: summary.shortage_line_count + (hasShortage ? 1 : 0),
        overage_line_count: summary.overage_line_count + (hasOverage ? 1 : 0),
        exact_line_count: summary.exact_line_count + (isExact ? 1 : 0),
        total_shortage_quantity: summary.total_shortage_quantity + line.shortage_quantity,
        total_overage_quantity: summary.total_overage_quantity + line.overage_quantity,
      };
    },
    {
      total_line_count: 0,
      shortage_line_count: 0,
      overage_line_count: 0,
      exact_line_count: 0,
      total_shortage_quantity: 0,
      total_overage_quantity: 0,
    },
  );
}
