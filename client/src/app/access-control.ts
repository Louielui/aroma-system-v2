/**
 * File intent: centralize simple permission and location-scope rules for the current MVP architecture.
 * Design reminder for this file: keep access logic structural, role-based, and derived from existing People fields only.
 */

import type { Person, PersonRole } from "@/modules/hr/people.types";

export type AppModuleKey = "procurement" | "central_kitchen" | "hr" | "logistics";

export type AccessContext = {
  currentUser: Person | null;
  canAccessModule: (moduleKey: AppModuleKey) => boolean;
  canAccessPath: (path: string) => boolean;
  canManagePeople: boolean;
  allowedLocations: string[];
  isAllowedLocation: (locationId: string | null | undefined) => boolean;
  filterByAllowedLocations: <T>(items: T[], getLocation: (item: T) => string | null | undefined) => T[];
};

const STORAGE_KEY = "aroma-system-v2.current-user-id";

const MODULE_ACCESS_BY_ROLE: Record<PersonRole, AppModuleKey[]> = {
  admin: ["procurement", "central_kitchen", "hr", "logistics"],
  hr: ["hr"],
  procurement_manager: ["procurement", "logistics"],
  kitchen_manager: ["central_kitchen", "logistics"],
  inventory_staff: ["procurement", "central_kitchen", "logistics"],
  prep_staff: ["central_kitchen", "logistics"],
};

function normalizeLocation(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function getModuleKeyFromPath(path: string): AppModuleKey | null {
  if (path.startsWith("/procurement")) {
    return "procurement";
  }

  if (path.startsWith("/central-kitchen")) {
    return "central_kitchen";
  }

  if (path.startsWith("/hr")) {
    return "hr";
  }

  if (path.startsWith("/logistics")) {
    return "logistics";
  }

  return null;
}

export function getAllowedModulesForRole(role: PersonRole): AppModuleKey[] {
  return MODULE_ACCESS_BY_ROLE[role] ?? [];
}

export function getStoredCurrentUserId() {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function storeCurrentUserId(userId: string) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, userId);
}

export function buildAccessContext(currentUser: Person | null): AccessContext {
  const allowedModules = currentUser ? getAllowedModulesForRole(currentUser.role) : [];
  const allowedLocations = currentUser?.allowed_locations ?? [];
  const normalizedAllowedLocations = allowedLocations.map(normalizeLocation);

  function canAccessModule(moduleKey: AppModuleKey) {
    if (!currentUser || currentUser.active_status !== "active") {
      return false;
    }

    return allowedModules.includes(moduleKey);
  }

  function canAccessPath(path: string) {
    const moduleKey = getModuleKeyFromPath(path);

    if (!moduleKey) {
      return true;
    }

    return canAccessModule(moduleKey);
  }

  function isAllowedLocation(locationId: string | null | undefined) {
    if (!currentUser || currentUser.active_status !== "active") {
      return false;
    }

    if (!locationId) {
      return true;
    }

    return normalizedAllowedLocations.includes(normalizeLocation(locationId));
  }

  function filterByAllowedLocations<T>(items: T[], getLocation: (item: T) => string | null | undefined) {
    return items.filter((item) => isAllowedLocation(getLocation(item)));
  }

  return {
    currentUser,
    canAccessModule,
    canAccessPath,
    canManagePeople: Boolean(currentUser && ["admin", "hr"].includes(currentUser.role) && currentUser.active_status === "active"),
    allowedLocations,
    isAllowedLocation,
    filterByAllowedLocations,
  };
}
