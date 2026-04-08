/**
 * File intent: render the HR Person detail page for People / User Management.
 * Design reminder for this file: keep presentation simple and focus on role, location, status, and compensation visibility.
 */

import { useAccessControl } from "@/contexts/AccessControlContext";
import { peopleRepository } from "@/modules/hr/people.repository";
import type { Person } from "@/modules/hr/people.types";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

function hasSharedAllowedLocation(person: Person, allowedLocations: string[]) {
  if (allowedLocations.length === 0) {
    return false;
  }

  const normalizedAllowedLocations = allowedLocations.map((value) => value.trim().toLowerCase());

  return person.allowed_locations.some((location) => normalizedAllowedLocations.includes(location.trim().toLowerCase()));
}

export default function PersonDetailPage() {
  const { allowedLocations, canManagePeople } = useAccessControl();
  const match = useRoute("/hr/people/:personId");
  const personId = match?.[1]?.personId ?? "";
  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPerson() {
      try {
        const data = await peopleRepository.getById(personId);

        if (!data || !hasSharedAllowedLocation(data, allowedLocations)) {
          throw new Error("Person not found for your allowed locations.");
        }

        if (isMounted) {
          setPerson(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load person.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPerson();

    return () => {
      isMounted = false;
    };
  }, [allowedLocations, personId]);

  if (isLoading) {
    return <p>Loading person...</p>;
  }

  if (error || !person) {
    return (
      <section>
        <p>{error || "Person not found."}</p>
        <Link href="/hr/people">Back to people list</Link>
      </section>
    );
  }

  return (
    <section>
      <header>
        <p>HR</p>
        <h1>{person.name}</h1>
        <p>People / User Management detail page using the approved minimum employee fields.</p>
        <p>
          <Link href="/hr/people">Back to people list</Link>{" "}
          {canManagePeople ? <Link href={`/hr/people/${person.id}/edit`}>Edit person</Link> : null}
        </p>
      </header>

      <table>
        <tbody>
          <tr><th>ID</th><td>{person.id}</td></tr>
          <tr><th>Name</th><td>{person.name}</td></tr>
          <tr><th>Email</th><td>{person.email}</td></tr>
          <tr><th>Role</th><td>{person.role}</td></tr>
          <tr><th>Allowed Locations</th><td>{person.allowed_locations.join(", ") || "—"}</td></tr>
          <tr><th>Active Status</th><td>{person.active_status}</td></tr>
          <tr><th>Pay Type</th><td>{person.pay_type}</td></tr>
          <tr><th>Hourly Rate</th><td>{person.hourly_rate ?? "—"}</td></tr>
        </tbody>
      </table>
    </section>
  );
}
