/**
 * File intent: provide the Phase 1 sidebar structure for Aroma System V2.
 * Design reminder for this file: navigation structure only, no styling work, no visual exploration.
 */

import { getModuleKeyFromPath } from "@/app/access-control";
import { sidebarSections } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { Link, useLocation } from "wouter";

export default function AppSidebar() {
  const [location] = useLocation();
  const { isLoading, currentUser, canAccessModule, canAccessPath } = useAccessControl();

  const visibleSections = sidebarSections
    .map((section) => {
      const moduleKey = getModuleKeyFromPath(section.basePath);

      if (!moduleKey || !canAccessModule(moduleKey)) {
        return null;
      }

      return {
        ...section,
        items: section.items.filter((item) => canAccessPath(item.path)),
      };
    })
    .filter((section): section is NonNullable<typeof section> => Boolean(section && section.items.length > 0));

  return (
    <nav aria-label="Primary sidebar navigation">
      <div>
        <p>Aroma System V2</p>
        <p>Phase 1 architecture shell</p>
        <p>{isLoading ? "Loading user..." : currentUser ? `Current user: ${currentUser.name}` : "No active user"}</p>
      </div>

      {visibleSections.map((section) => (
        <section key={section.basePath} aria-labelledby={`${section.basePath}-heading`}>
          <h2 id={`${section.basePath}-heading`}>{section.title}</h2>
          <ul>
            {section.items.map((item) => {
              const isActive = location === item.path;

              return (
                <li key={item.path}>
                  <Link href={item.path} aria-current={isActive ? "page" : undefined}>
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
