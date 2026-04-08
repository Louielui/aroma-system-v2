/*
 * File intent: define the approved Stores / Branch Operations domain models for par levels, stock takes, and Phase 2A replenishment requests.
 * Design reminder for this file: keep Stores records separate from Logistics and Internal Transfer, and limit Phase 2A replenishment requests to demand capture plus read-only viewing.
 */

export type StoreParLevelStatus = "active" | "inactive";
export type StoreStockTakeStatus = "draft" | "submitted" | "finalized";
export type StoreReplenishmentRequestStatus = "draft";

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

export type StoreReplenishmentRequestLine = {
  id: string;
  source_store_stock_take_line_id: string | null;
  source_store_par_level_id: string | null;
  raw_ingredient_id: string;
  item_name: string;
  category: string;
  base_unit: string;
  par_quantity_snapshot: number | null;
  counted_quantity_snapshot: number | null;
  shortage_quantity_snapshot: number;
  requested_quantity: number;
  line_notes: string;
};

export type StoreReplenishmentRequest = {
  id: string;
  request_number: string;
  store_location_id: string;
  request_date: string;
  status: StoreReplenishmentRequestStatus;
  source_store_stock_take_id: string | null;
  requested_by_user_id: string | null;
  notes: string;
  lines: StoreReplenishmentRequestLine[];
  created_at: string;
  updated_at: string;
};

export type StoreReplenishmentRequestEntryLine = {
  source_store_stock_take_line_id: string | null;
  source_store_par_level_id: string | null;
  raw_ingredient_id: string;
  item_name: string;
  category: string;
  base_unit: string;
  par_quantity_snapshot: number | null;
  counted_quantity_snapshot: number | null;
  shortage_quantity_snapshot: number;
  requested_quantity: number;
  line_notes: string;
};

export type StoreReplenishmentRequestCreateInput = {
  store_location_id: string;
  request_date: string;
  requested_by_user_id: string | null;
  source_store_stock_take_id: string | null;
  notes: string;
  status: StoreReplenishmentRequestStatus;
  lines: StoreReplenishmentRequestEntryLine[];
};

export type StoreReplenishmentRequestFormLineValues = {
  source_store_stock_take_line_id: string;
  source_store_par_level_id: string;
  raw_ingredient_id: string;
  item_name: string;
  category: string;
  base_unit: string;
  par_quantity_snapshot: number | null;
  counted_quantity_snapshot: number | null;
  shortage_quantity_snapshot: number;
  requested_quantity: string;
  line_notes: string;
};

export type StoreReplenishmentRequestFormValues = {
  store_location_id: string;
  request_date: string;
  requested_by_user_id: string;
  source_store_stock_take_id: string;
  notes: string;
  status: StoreReplenishmentRequestStatus;
  lines: StoreReplenishmentRequestFormLineValues[];
};

export type StoreReplenishmentRequestSummary = {
  total_line_count: number;
  shortage_line_count: number;
  total_shortage_quantity: number;
  total_requested_quantity: number;
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

export function summarizeStoreReplenishmentRequest(
  lines: StoreReplenishmentRequestLine[],
): StoreReplenishmentRequestSummary {
  return lines.reduce<StoreReplenishmentRequestSummary>(
    (summary, line) => ({
      total_line_count: summary.total_line_count + 1,
      shortage_line_count: summary.shortage_line_count + (line.shortage_quantity_snapshot > 0 ? 1 : 0),
      total_shortage_quantity: summary.total_shortage_quantity + line.shortage_quantity_snapshot,
      total_requested_quantity: summary.total_requested_quantity + line.requested_quantity,
    }),
    {
      total_line_count: 0,
      shortage_line_count: 0,
      total_shortage_quantity: 0,
      total_requested_quantity: 0,
    },
  );
}
