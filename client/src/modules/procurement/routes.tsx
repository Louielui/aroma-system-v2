/**
 * File intent: define Procurement module routes for Phase 1 system architecture.
 * Design reminder for this file: module boundaries and route ownership only, no styling concerns.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { procurementItems } from "@/app/navigation";
import InvoicesPage from "@/modules/procurement/pages/InvoicesPage";
import PriceBookPage from "@/modules/procurement/pages/PriceBookPage";
import ScanUploadPage from "@/modules/procurement/pages/ScanUploadPage";
import SuppliersPage from "@/modules/procurement/pages/SuppliersPage";
import TransferOrdersPage from "@/modules/procurement/pages/TransferOrdersPage";

function ProcurementEntryPage() {
  return <RouteRedirect to={procurementItems[0].path} />;
}

export const procurementRoutes: AppRouteDefinition[] = [
  { path: "/procurement", component: ProcurementEntryPage },
  { path: "/procurement/suppliers", component: SuppliersPage },
  { path: "/procurement/scan-upload", component: ScanUploadPage },
  { path: "/procurement/invoices", component: InvoicesPage },
  { path: "/procurement/price-book", component: PriceBookPage },
  { path: "/procurement/transfer-orders", component: TransferOrdersPage },
];
