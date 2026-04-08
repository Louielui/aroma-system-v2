/**
 * File intent: provide the Logistics > Pick List placeholder page for the Phase 1 module shell.
 * Design reminder for this file: structure only, no business logic, no styling work, and no inventory integration yet.
 */

import { logisticsItems } from "@/app/navigation";
import ModulePage from "@/components/architecture/ModulePage";

export default function PickListPage() {
  return (
    <ModulePage
      moduleName="Logistics"
      pageName="Pick List"
      description="Phase 1 placeholder page for the Logistics module shell. No picking workflow is implemented yet."
      links={logisticsItems}
    />
  );
}
