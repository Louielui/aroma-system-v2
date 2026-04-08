/**
 * File intent: aggregate all Phase 1 application routes in one structural registry.
 * Design reminder for this file: keep routing ownership explicit and presentation-neutral.
 */

import type { AppRouteDefinition } from "@/app/route-definition";
import { centralKitchenRoutes } from "@/modules/central-kitchen/routes";
import { hrRoutes } from "@/modules/hr/routes";
import { logisticsRoutes } from "@/modules/logistics/routes";
import { procurementRoutes } from "@/modules/procurement/routes";

export const appRoutes: AppRouteDefinition[] = [
  ...procurementRoutes,
  ...centralKitchenRoutes,
  ...hrRoutes,
  ...logisticsRoutes,
];
