/**
 * File intent: define HR module routes for the structural module architecture.
 * Design reminder for this file: module boundaries and route ownership only, no styling concerns.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { hrItems } from "@/app/navigation";
import OnboardingPage from "@/modules/hr/pages/OnboardingPage";
import PeoplePage from "@/modules/hr/pages/PeoplePage";
import PersonDetailPage from "@/modules/hr/pages/PersonDetailPage";
import PersonFormPage from "@/modules/hr/pages/PersonFormPage";

function HrEntryPage() {
  return <RouteRedirect to={hrItems[0].path} />;
}

function CreatePersonRoutePage() {
  return <PersonFormPage mode="create" />;
}

function EditPersonRoutePage() {
  return <PersonFormPage mode="edit" />;
}

export const hrRoutes: AppRouteDefinition[] = [
  { path: "/hr", component: HrEntryPage },
  { path: "/hr/people", component: PeoplePage },
  { path: "/hr/people/new", component: CreatePersonRoutePage, requirePeopleManager: true },
  { path: "/hr/people/:personId/edit", component: EditPersonRoutePage, requirePeopleManager: true },
  { path: "/hr/people/:personId", component: PersonDetailPage },
  { path: "/hr/onboarding", component: OnboardingPage },
];
