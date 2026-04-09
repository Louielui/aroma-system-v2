/**
 * File intent: define Inventory module routes for read-only overview, transaction history, and transaction-group audit drill-down.
 * Design reminder for this file: expose Inventory as a separate visibility and audit module without changing Stores demand ownership or Logistics execution ownership.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { inventoryItems } from "@/app/navigation";
import InventoryOverviewPage from "@/modules/inventory/pages/InventoryOverviewPage";
import InventoryTransactionGroupDetailPage from "@/modules/inventory/pages/InventoryTransactionGroupDetailPage";
import InventoryTransactionsPage from "@/modules/inventory/pages/InventoryTransactionsPage";

function InventoryEntryPage() {
  return <RouteRedirect to={inventoryItems[0].path} />;
}

export const inventoryRoutes: AppRouteDefinition[] = [
  { path: "/inventory", component: InventoryEntryPage },
  { path: "/inventory/overview", component: InventoryOverviewPage },
  { path: "/inventory/transactions", component: InventoryTransactionsPage },
  { path: "/inventory/transaction-groups/:transactionGroupId", component: InventoryTransactionGroupDetailPage },
];
