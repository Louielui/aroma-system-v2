/**
 * File intent: define HR module routes for Phase 1 system architecture.
 * Design reminder for this file: module boundaries and route ownership only, no styling concerns.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { hrItems } from "@/app/navigation";
import OnboardingPage from "@/modules/hr/pages/OnboardingPage";
import PeoplePage from "@/modules/hr/pages/PeoplePage";

function HrEntryPage() {
  return <RouteRedirect to={hrItems[0].path} />;
}

export const hrRoutes: AppRouteDefinition[] = [
  { path: "/hr", component: HrEntryPage },
  { path: "/hr/people", component: PeoplePage },
  { path: "/hr/onboarding", component: OnboardingPage },
];
