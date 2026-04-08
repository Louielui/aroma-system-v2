/**
 * File intent: Central Kitchen > Raw Ingredients route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { centralKitchenItems } from "@/app/navigation";

export default function RawIngredientsPage() {
  return (
    <ModulePage
      moduleName="Central Kitchen"
      pageName="Raw Ingredients"
      description="Phase 1 route placeholder for the Central Kitchen Raw Ingredients module."
      links={centralKitchenItems}
    />
  );
}
