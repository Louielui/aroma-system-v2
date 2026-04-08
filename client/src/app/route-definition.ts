/**
 * File intent: provide shared route typing for the Aroma System V2 architecture-first routing system.
 * Design reminder for this file: keep routing contracts explicit and presentation-neutral.
 */

import type { ReactNode } from "react";

export type AppRouteComponent = (props: Record<string, unknown>) => ReactNode;

export type AppRouteDefinition = {
  path: string;
  component: AppRouteComponent;
  requirePeopleManager?: boolean;
};
