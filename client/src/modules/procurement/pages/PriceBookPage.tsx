/**
 * File intent: Procurement > Price Book route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { procurementItems } from "@/app/navigation";

export default function PriceBookPage() {
  return (
    <ModulePage
      moduleName="Procurement"
      pageName="Price Book"
      description="Phase 1 route placeholder for the Procurement Price Book module."
      links={procurementItems}
    />
  );
}
