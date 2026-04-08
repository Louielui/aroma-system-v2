/**
 * File intent: provide the Phase 1 sidebar structure for Aroma System V2.
 * Design reminder for this file: navigation structure only, no styling work, no visual exploration.
 */

import { sidebarSections } from "@/app/navigation";
import { Link, useLocation } from "wouter";

export default function AppSidebar() {
  const [location] = useLocation();

  return (
    <nav aria-label="Primary sidebar navigation">
      <div>
        <p>Aroma System V2</p>
        <p>Phase 1 architecture shell</p>
      </div>

      {sidebarSections.map((section) => (
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
