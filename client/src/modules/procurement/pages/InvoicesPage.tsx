/**
 * File intent: Procurement > Invoices route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { procurementItems } from "@/app/navigation";

export default function InvoicesPage() {
  return (
    <ModulePage
      moduleName="Procurement"
      pageName="Invoices"
      description="Phase 1 route placeholder for the Procurement Invoices module."
      links={procurementItems}
    />
  );
}
