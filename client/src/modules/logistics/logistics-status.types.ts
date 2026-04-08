/**
 * File intent: define shared logistics status and tracking primitives for Logistics execution flows.
 * Design reminder for this file: share only operational status and tracking concerns, and keep Internal Transfer execution owned by Logistics in clearly phased lifecycle steps.
 */

export type LogisticsFlowType = "internal_transfer" | "external_pickup" | "grocery_order_fulfillment";

export type SharedLogisticsStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "picking"
  | "dispatched"
  | "in_transit"
  | "received"
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
  "dispatched",
  "in_transit",
  "received",
  "completed",
  "cancelled",
  "exception",
];

export const sharedLogisticsStatusLabels: Record<SharedLogisticsStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  picking: "Picking",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  received: "Received",
  completed: "Completed",
  cancelled: "Cancelled",
  exception: "Exception",
};

export function getNextInternalTransferStatuses(status: SharedLogisticsStatus): SharedLogisticsStatus[] {
  switch (status) {
    case "draft":
      return ["picking"];
    case "picking":
      return ["dispatched"];
    case "dispatched":
      return ["in_transit"];
    case "in_transit":
      return ["received"];
    case "pending_review":
    case "approved":
    case "received":
    case "completed":
    case "cancelled":
    case "exception":
    default:
      return [];
  }
}

export function canEditInternalTransferStatus(status: SharedLogisticsStatus) {
  return ["draft", "picking", "in_transit"].includes(status);
}

export function canManageInternalTransferHeader(status: SharedLogisticsStatus) {
  return status === "draft";
}

export function canManageInternalTransferPicking(status: SharedLogisticsStatus) {
  return status === "picking";
}

export function canManageInternalTransferReceiving(status: SharedLogisticsStatus) {
  return status === "in_transit";
}

export function isInternalTransferDispatchLocked(status: SharedLogisticsStatus) {
  return ["dispatched", "in_transit", "received", "completed", "cancelled", "exception"].includes(status);
}

export function isInternalTransferReceivingLocked(status: SharedLogisticsStatus) {
  return ["received", "completed", "cancelled", "exception"].includes(status);
}
