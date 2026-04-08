/**
 * File intent: provide redirect behavior for root and module entry routes in Phase 1.
 * Design reminder for this file: routing logic must remain explicit, minimal, and presentation-neutral.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";

type RouteRedirectProps = {
  to: string;
};

export default function RouteRedirect({ to }: RouteRedirectProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate(to);
  }, [navigate, to]);

  return <p>Redirecting to {to}...</p>;
}
