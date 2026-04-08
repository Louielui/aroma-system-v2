/**
 * File intent: define Central Kitchen module routes for the structural module architecture.
 * Design reminder for this file: module boundaries and route ownership only, no styling concerns.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { centralKitchenItems } from "@/app/navigation";
import PrepListPage from "@/modules/central-kitchen/pages/PrepListPage";
import PrepStockTakePage from "@/modules/central-kitchen/pages/PrepStockTakePage";
import RawIngredientDetailPage from "@/modules/central-kitchen/pages/RawIngredientDetailPage";
import RawIngredientFormPage from "@/modules/central-kitchen/pages/RawIngredientFormPage";
import RawIngredientsPage from "@/modules/central-kitchen/pages/RawIngredientsPage";

function CentralKitchenEntryPage() {
  return <RouteRedirect to={centralKitchenItems[0].path} />;
}

function CreateRawIngredientRoutePage() {
  return <RawIngredientFormPage mode="create" />;
}

function EditRawIngredientRoutePage() {
  return <RawIngredientFormPage mode="edit" />;
}

export const centralKitchenRoutes: AppRouteDefinition[] = [
  { path: "/central-kitchen", component: CentralKitchenEntryPage },
  { path: "/central-kitchen/raw-ingredients", component: RawIngredientsPage },
  { path: "/central-kitchen/raw-ingredients/new", component: CreateRawIngredientRoutePage },
  { path: "/central-kitchen/raw-ingredients/:rawIngredientId/edit", component: EditRawIngredientRoutePage },
  { path: "/central-kitchen/raw-ingredients/:rawIngredientId", component: RawIngredientDetailPage },
  { path: "/central-kitchen/prep-stock-take", component: PrepStockTakePage },
  { path: "/central-kitchen/prep-list", component: PrepListPage },
];
