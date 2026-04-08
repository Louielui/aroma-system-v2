/*
 * File intent: define the Logistics Internal Transfer domain model and related form types for Phase 3 handoff.
 * Design reminder for this file: keep Internal Transfer separate from Stores demand records while allowing explicit linkage back to the originating Stores replenishment request.
 */

import type {
  LogisticsExceptionCode,
  SharedLogisticsStatus,
  SharedLogisticsTrackingRow,
} from "@/modules/logistics/logistics-status.types";

export type InternalTransferPriority = "normal" | "urgent" | "scheduled";

export type InternalTransferLineItem = {
  id: string;
  raw_ingredient_id: string;
  item_name: string;
  base_unit: string;
  requested_quantity: number;
  picked_quantity: number;
  received_quantity: number;
  shortage_notes: string;
  discrepancy_notes: string;
  line_notes: string;
  source_store_replenishment_request_line_id?: string | null;
};

export type InternalTransfer = {
  id: string;
  transfer_order_number: string;
  request_date: string;
  source_location_id: string;
  destination_location_id: string;
  requested_by_user_id: string;
  approved_by_user_id: string;
  scheduled_dispatch_date: string;
  logistics_status: SharedLogisticsStatus;
  priority: InternalTransferPriority;
  notes: string;
  line_items: InternalTransferLineItem[];
  assigned_to_user_id: string;
  picked_at: string;
  dispatched_at: string;
  received_at: string;
  completed_at: string;
  exception_code: LogisticsExceptionCode;
  exception_notes: string;
  source_store_replenishment_request_id?: string | null;
  source_store_replenishment_request_number?: string | null;
  created_at: string;
  updated_at: string;
};

export type InternalTransferUpsert = Omit<
  InternalTransfer,
  | "id"
  | "transfer_order_number"
  | "picked_at"
  | "dispatched_at"
  | "received_at"
  | "completed_at"
  | "created_at"
  | "updated_at"
>;

export type InternalTransferFormLineValues = {
  raw_ingredient_id: string;
  requested_quantity: string;
  picked_quantity: string;
  received_quantity: string;
  shortage_notes: string;
  discrepancy_notes: string;
  line_notes: string;
};

export type InternalTransferFormValues = {
  request_date: string;
  source_location_id: string;
  destination_location_id: string;
  requested_by_user_id: string;
  scheduled_dispatch_date: string;
  priority: InternalTransferPriority;
  assigned_to_user_id: string;
  notes: string;
  line_items: InternalTransferFormLineValues[];
};

export type InternalTransferTrackingRow = SharedLogisticsTrackingRow & {
  internal_transfer_id: string;
};
