/**
 * File intent: define Logistics module routes for the structural module architecture.
 * Design reminder for this file: keep Internal Transfer as the only implemented Phase 2A flow while preserving shared Delivery Status.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { logisticsItems } from "@/app/navigation";
import DeliveryStatusPage from "@/modules/logistics/pages/DeliveryStatusPage";
import InternalTransferDetailPage from "@/modules/logistics/pages/InternalTransferDetailPage";
import InternalTransferFormPage from "@/modules/logistics/pages/InternalTransferFormPage";
import PickListPage from "@/modules/logistics/pages/PickListPage";
import TransferOrdersPage from "@/modules/logistics/pages/TransferOrdersPage";

function LogisticsEntryPage() {
  return <RouteRedirect to={logisticsItems[0].path} />;
}

function CreateInternalTransferRoutePage() {
  return <InternalTransferFormPage mode="create" />;
}

function EditInternalTransferRoutePage() {
  return <InternalTransferFormPage mode="edit" />;
}

export const logisticsRoutes: AppRouteDefinition[] = [
  { path: "/logistics", component: LogisticsEntryPage },
  { path: "/logistics/transfer-orders", component: TransferOrdersPage },
  { path: "/logistics/transfer-orders/new", component: CreateInternalTransferRoutePage },
  { path: "/logistics/transfer-orders/:transferOrderId/edit", component: EditInternalTransferRoutePage },
  { path: "/logistics/transfer-orders/:transferOrderId", component: InternalTransferDetailPage },
  { path: "/logistics/pick-list", component: PickListPage },
  { path: "/logistics/delivery-status", component: DeliveryStatusPage },
];
