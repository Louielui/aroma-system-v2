/**
 * File intent: Central Kitchen > Prep Stock Take route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { centralKitchenItems } from "@/app/navigation";

export default function PrepStockTakePage() {
  return (
    <ModulePage
      moduleName="Central Kitchen"
      pageName="Prep Stock Take"
      description="Phase 1 route placeholder for the Central Kitchen Prep Stock Take module."
      links={centralKitchenItems}
    />
  );
}
