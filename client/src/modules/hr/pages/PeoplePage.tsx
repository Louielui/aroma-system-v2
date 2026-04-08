/**
 * File intent: HR > People / User Management route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { hrItems } from "@/app/navigation";

export default function PeoplePage() {
  return (
    <ModulePage
      moduleName="HR"
      pageName="People / User Management"
      description="Phase 1 route placeholder for the HR People / User Management module."
      links={hrItems}
    />
  );
}
