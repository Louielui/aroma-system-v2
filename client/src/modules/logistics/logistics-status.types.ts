/**
 * File intent: define shared logistics status and tracking primitives for Logistics execution flows.
 * Design reminder for this file: share only operational status and tracking concerns, not business-intent records.
 */

export type LogisticsFlowType = "internal_transfer" | "external_pickup" | "grocery_order_fulfillment";

export type SharedLogisticsStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "picking"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "exception";

export type LogisticsExceptionCode =
  | ""
  | "short_qty"
  | "missing_item"
  | "damaged_item"
  | "pickup_delay"
  | "delivery_delay"
  | "destination_closed"
  | "order_change"
  | "other";

export type SharedLogisticsTrackingRow = {
  tracking_reference: string;
  origin_flow_type: LogisticsFlowType;
  source_label: string;
  destination_label: string;
  scheduled_date: string;
  assigned_to_user_id: string;
  logistics_status: SharedLogisticsStatus;
  has_exception: boolean;
};

export const sharedLogisticsStatusOptions: SharedLogisticsStatus[] = [
  "draft",
  "pending_review",
  "approved",
  "picking",
  "in_transit",
  "completed",
  "cancelled",
  "exception",
];

export const sharedLogisticsStatusLabels: Record<SharedLogisticsStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  picking: "Picking",
  in_transit: "In Transit",
  completed: "Completed",
  cancelled: "Cancelled",
  exception: "Exception",
};

export function getNextInternalTransferStatuses(status: SharedLogisticsStatus): SharedLogisticsStatus[] {
  switch (status) {
    case "draft":
      return ["pending_review", "cancelled"];
    case "pending_review":
      return ["approved", "cancelled", "exception"];
    case "approved":
      return ["picking", "cancelled", "exception"];
    case "picking":
      return ["in_transit", "exception"];
    case "in_transit":
      return ["completed", "exception"];
    case "completed":
    case "cancelled":
    case "exception":
    default:
      return [];
  }
}

export function canEditInternalTransferStatus(status: SharedLogisticsStatus) {
  return ["draft", "pending_review", "approved", "picking", "in_transit"].includes(status);
}

export function canManageInternalTransferHeader(status: SharedLogisticsStatus) {
  return ["draft", "pending_review", "approved"].includes(status);
}

export function canManageInternalTransferFulfillment(status: SharedLogisticsStatus) {
  return ["approved", "picking", "in_transit"].includes(status);
}
