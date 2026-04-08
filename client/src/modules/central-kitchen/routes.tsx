/**
 * File intent: define Central Kitchen module routes for Phase 1 system architecture.
 * Design reminder for this file: module boundaries and route ownership only, no styling concerns.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { centralKitchenItems } from "@/app/navigation";
import PrepListPage from "@/modules/central-kitchen/pages/PrepListPage";
import PrepStockTakePage from "@/modules/central-kitchen/pages/PrepStockTakePage";
import RawIngredientsPage from "@/modules/central-kitchen/pages/RawIngredientsPage";

function CentralKitchenEntryPage() {
  return <RouteRedirect to={centralKitchenItems[0].path} />;
}

export const centralKitchenRoutes: AppRouteDefinition[] = [
  { path: "/central-kitchen", component: CentralKitchenEntryPage },
  { path: "/central-kitchen/raw-ingredients", component: RawIngredientsPage },
  { path: "/central-kitchen/prep-stock-take", component: PrepStockTakePage },
  { path: "/central-kitchen/prep-list", component: PrepListPage },
];
