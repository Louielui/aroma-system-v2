/**
 * File intent: define the shared application shell for Phase 1 system architecture.
 * Design reminder for this file: emphasize clean layout boundaries and module separation, not visual styling.
 */

import type { ReactNode } from "react";
import AppSidebar from "@/components/navigation/AppSidebar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div>
      <aside>
        <AppSidebar />
      </aside>

      <main>{children}</main>
    </div>
  );
}
