/**
 * File intent: HR > Onboarding route placeholder for Phase 1 architecture.
 * Design reminder for this file: routing placeholder only, no styling work.
 */

import ModulePage from "@/components/architecture/ModulePage";
import { hrItems } from "@/app/navigation";

export default function OnboardingPage() {
  return (
    <ModulePage
      moduleName="HR"
      pageName="Onboarding"
      description="Phase 1 route placeholder for the HR Onboarding module."
      links={hrItems}
    />
  );
}
