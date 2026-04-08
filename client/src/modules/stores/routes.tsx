/*
 * File intent: define Stores / Branch Operations routes for Store Par Level, Store Stock Take, and replenishment requests.
 * Design reminder for this file: keep Stores as a separate top-level module and keep replenishment requests limited to Stores-side demand capture, editing, and submission only.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { storesItems } from "@/app/navigation";
import StoreParLevelDetailPage from "@/modules/stores/pages/StoreParLevelDetailPage";
import StoreParLevelFormPage from "@/modules/stores/pages/StoreParLevelFormPage";
import StoreParLevelsPage from "@/modules/stores/pages/StoreParLevelsPage";
import StoreReplenishmentRequestDetailPage from "@/modules/stores/pages/StoreReplenishmentRequestDetailPage";
import StoreReplenishmentRequestFormPage from "@/modules/stores/pages/StoreReplenishmentRequestFormPage";
import StoreReplenishmentRequestsPage from "@/modules/stores/pages/StoreReplenishmentRequestsPage";
import StoreStockTakeDetailPage from "@/modules/stores/pages/StoreStockTakeDetailPage";
import StoreStockTakeFormPage from "@/modules/stores/pages/StoreStockTakeFormPage";
import StoreStockTakesPage from "@/modules/stores/pages/StoreStockTakesPage";

function StoresEntryPage() {
  return <RouteRedirect to={storesItems[0].path} />;
}

function CreateStoreParLevelRoutePage() {
  return <StoreParLevelFormPage mode="create" />;
}

function EditStoreParLevelRoutePage() {
  return <StoreParLevelFormPage mode="edit" />;
}

function CreateStoreReplenishmentRequestRoutePage() {
  return <StoreReplenishmentRequestFormPage mode="create" />;
}

function EditStoreReplenishmentRequestRoutePage() {
  return <StoreReplenishmentRequestFormPage mode="edit" />;
}

export const storesRoutes: AppRouteDefinition[] = [
  { path: "/stores", component: StoresEntryPage },
  { path: "/stores/par-levels", component: StoreParLevelsPage },
  { path: "/stores/par-levels/new", component: CreateStoreParLevelRoutePage },
  { path: "/stores/par-levels/:storeParLevelId/edit", component: EditStoreParLevelRoutePage },
  { path: "/stores/par-levels/:storeParLevelId", component: StoreParLevelDetailPage },
  { path: "/stores/stock-takes", component: StoreStockTakesPage },
  { path: "/stores/stock-takes/new", component: StoreStockTakeFormPage },
  { path: "/stores/stock-takes/:storeStockTakeId", component: StoreStockTakeDetailPage },
  { path: "/stores/replenishment-requests", component: StoreReplenishmentRequestsPage },
  { path: "/stores/replenishment-requests/new", component: CreateStoreReplenishmentRequestRoutePage },
  {
    path: "/stores/replenishment-requests/:storeReplenishmentRequestId/edit",
    component: EditStoreReplenishmentRequestRoutePage,
  },
  {
    path: "/stores/replenishment-requests/:storeReplenishmentRequestId",
    component: StoreReplenishmentRequestDetailPage,
  },
];
