/**
 * File intent: define HR module routes for the structural module architecture.
 * Design reminder for this file: route ownership stays inside HR, people management remains separate from onboarding, and compliance pages stay local to the HR module.
 */

import RouteRedirect from "@/app/RouteRedirect";
import type { AppRouteDefinition } from "@/app/route-definition";
import { hrItems } from "@/app/navigation";
import EmployeeDetailPage from "@/modules/hr/pages/EmployeeDetailPage";
import EmployeeDocumentsPage from "@/modules/hr/pages/EmployeeDocumentsPage";
import EmployeeListPage from "@/modules/hr/pages/EmployeeListPage";
import HRReviewPage from "@/modules/hr/pages/HRReviewPage";
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
  { path: "/hr/employees", component: EmployeeListPage },
  { path: "/hr/employees/:employeeId", component: EmployeeDetailPage },
  { path: "/hr/employees/:employeeId/documents", component: EmployeeDocumentsPage },
  { path: "/hr/review", component: HRReviewPage, requirePeopleManager: true },
];
