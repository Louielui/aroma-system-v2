/**
 * File intent: provide a reusable structural page wrapper for Phase 1 module pages.
 * Design reminder for this file: prioritize architecture clarity and route visibility, not appearance.
 */

import type { SidebarItem } from "@/app/navigation";
import { Link } from "wouter";

type ModulePageProps = {
  moduleName: string;
  pageName: string;
  description: string;
  links?: SidebarItem[];
};

export default function ModulePage({
  moduleName,
  pageName,
  description,
  links = [],
}: ModulePageProps) {
  return (
    <section>
      <header>
        <p>{moduleName}</p>
        <h1>{pageName}</h1>
        <p>{description}</p>
      </header>

      {links.length > 0 ? (
        <div>
          <h2>Available routes</h2>
          <ul>
            {links.map((link) => (
              <li key={link.path}>
                <Link href={link.path}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
