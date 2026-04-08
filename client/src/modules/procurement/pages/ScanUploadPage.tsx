/**
 * File intent: Procurement > Scan / Upload route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { procurementItems } from "@/app/navigation";

export default function ScanUploadPage() {
  return (
    <ModulePage
      moduleName="Procurement"
      pageName="Scan / Upload"
      description="Phase 1 route placeholder for the Procurement Scan / Upload module."
      links={procurementItems}
    />
  );
}
