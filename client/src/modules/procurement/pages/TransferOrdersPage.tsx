/**
 * File intent: Procurement > Transfer Orders route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { procurementItems } from "@/app/navigation";

export default function TransferOrdersPage() {
  return (
    <ModulePage
      moduleName="Procurement"
      pageName="Transfer Orders"
      description="Phase 1 route placeholder for the Procurement Transfer Orders module."
      links={procurementItems}
    />
  );
}
