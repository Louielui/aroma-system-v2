/**
 * File intent: define Inventory module routes for the passive Phase 5A foundation structure.
 * Design reminder for this file: expose Inventory as a separate read-only module without changing Stores demand ownership or Logistics execution ownership.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { inventoryItems } from "@/app/navigation";
import InventoryOverviewPage from "@/modules/inventory/pages/InventoryOverviewPage";

function InventoryEntryPage() {
  return <RouteRedirect to={inventoryItems[0].path} />;
}

export const inventoryRoutes: AppRouteDefinition[] = [
  { path: "/inventory", component: InventoryEntryPage },
  { path: "/inventory/overview", component: InventoryOverviewPage },
];
