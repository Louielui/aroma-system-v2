/**
 * File intent: provide the current-user access context for role-based visibility, route guards, and location scoping.
 * Design reminder for this file: derive access only from existing People fields and keep the implementation simple and API-ready.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildAccessContext, getStoredCurrentUserId, storeCurrentUserId, type AccessContext } from "@/app/access-control";
import { peopleRepository } from "@/modules/hr/people.repository";
import type { Person } from "@/modules/hr/people.types";

type AccessControlContextValue = AccessContext & {
  isLoading: boolean;
  setCurrentUserId: (userId: string) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
};

const AccessControlContext = createContext<AccessControlContextValue | null>(null);

async function resolveInitialCurrentUser(): Promise<Person | null> {
  const storedUserId = getStoredCurrentUserId();
  const people = await peopleRepository.list();

  if (storedUserId) {
    const matchedUser = people.find((person) => person.id === storedUserId) ?? null;

    if (matchedUser) {
      return matchedUser;
    }
  }

  const fallbackUser = people.find((person) => person.active_status === "active") ?? null;

  if (fallbackUser) {
    storeCurrentUserId(fallbackUser.id);
  }

  return fallbackUser;
}

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const user = await resolveInitialCurrentUser();

        if (isMounted) {
          setCurrentUser(user);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function setCurrentUserId(userId: string) {
    const user = await peopleRepository.getById(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    storeCurrentUserId(user.id);
    setCurrentUser(user);
  }

  async function refreshCurrentUser() {
    const storedUserId = getStoredCurrentUserId();

    if (!storedUserId) {
      setCurrentUser(await resolveInitialCurrentUser());
      return;
    }

    const user = await peopleRepository.getById(storedUserId);

    if (!user) {
      setCurrentUser(await resolveInitialCurrentUser());
      return;
    }

    setCurrentUser(user);
  }

  const value = useMemo(() => {
    const accessContext = buildAccessContext(currentUser);

    return {
      ...accessContext,
      isLoading,
      setCurrentUserId,
      refreshCurrentUser,
    };
  }, [currentUser, isLoading]);

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);

  if (!context) {
    throw new Error("useAccessControl must be used within AccessControlProvider.");
  }

  return context;
}
