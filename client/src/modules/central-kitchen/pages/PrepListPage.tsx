/**
 * File intent: Central Kitchen > Prep List route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { centralKitchenItems } from "@/app/navigation";

export default function PrepListPage() {
  return (
    <ModulePage
      moduleName="Central Kitchen"
      pageName="Prep List"
      description="Phase 1 route placeholder for the Central Kitchen Prep List module."
      links={centralKitchenItems}
    />
  );
}
