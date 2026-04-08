/**
 * File intent: block unauthorized module and page access using the current MVP access-control rules.
 * Design reminder for this file: keep route protection structural and derived from existing People fields only.
 */

import { sidebarSections } from "@/app/navigation";
import RouteRedirect from "@/app/RouteRedirect";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type { ReactNode } from "react";

type AccessGuardProps = {
  path: string;
  children: ReactNode;
  requirePeopleManager?: boolean;
};

function getFirstAccessiblePath(canAccessPath: (path: string) => boolean) {
  for (const section of sidebarSections) {
    const firstAccessibleItem = section.items.find((item) => canAccessPath(item.path));

    if (firstAccessibleItem) {
      return firstAccessibleItem.path;
    }
  }

  return "/404";
}

export default function AccessGuard({ path, children, requirePeopleManager = false }: AccessGuardProps) {
  const { isLoading, canAccessPath, canManagePeople } = useAccessControl();

  if (isLoading) {
    return <p>Loading access rules...</p>;
  }

  const isAuthorizedForPath = canAccessPath(path);
  const isAuthorizedForPage = requirePeopleManager ? isAuthorizedForPath && canManagePeople : isAuthorizedForPath;

  if (!isAuthorizedForPage) {
    return <RouteRedirect to={getFirstAccessiblePath(canAccessPath)} />;
  }

  return <>{children}</>;
}
