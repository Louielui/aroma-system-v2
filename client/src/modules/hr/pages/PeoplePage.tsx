/**
 * File intent: render the HR People / User Management list page.
 * Design reminder for this file: keep the structure simple and prepare the data flow for future API integration.
 */

import { useAccessControl } from "@/contexts/AccessControlContext";
import { peopleRepository } from "@/modules/hr/people.repository";
import type { Person } from "@/modules/hr/people.types";
import { useEffect, useState } from "react";
import { Link } from "wouter";

function hasSharedAllowedLocation(person: Person, allowedLocations: string[]) {
  if (allowedLocations.length === 0) {
    return false;
  }

  const normalizedAllowedLocations = allowedLocations.map((value) => value.trim().toLowerCase());

  return person.allowed_locations.some((location) => normalizedAllowedLocations.includes(location.trim().toLowerCase()));
}

export default function PeoplePage() {
  const { allowedLocations, canManagePeople } = useAccessControl();
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPeople() {
      try {
        const data = await peopleRepository.list();
        const scopedPeople = data.filter((person) => hasSharedAllowedLocation(person, allowedLocations));

        if (isMounted) {
          setPeople(scopedPeople);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load people.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPeople();

    return () => {
      isMounted = false;
    };
  }, [allowedLocations]);

  return (
    <section>
      <header>
        <p>HR</p>
        <h1>People / User Management</h1>
        <p>Employee management foundation for roles, allowed locations, active status, and compensation visibility.</p>
        {canManagePeople ? (
          <p>
            <Link href="/hr/people/new">Create person</Link>
          </p>
        ) : null}
      </header>

      {isLoading ? <p>Loading people...</p> : null}
      {error ? <p>{error}</p> : null}

      {!isLoading && !error ? (
        people.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Allowed Locations</th>
                <th>Active Status</th>
                <th>Pay Type</th>
                <th>Hourly Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td>{person.name}</td>
                  <td>{person.email}</td>
                  <td>{person.role}</td>
                  <td>{person.allowed_locations.join(", ") || "—"}</td>
                  <td>{person.active_status}</td>
                  <td>{person.pay_type}</td>
                  <td>{person.hourly_rate ?? "—"}</td>
                  <td>
                    <Link href={`/hr/people/${person.id}`}>View</Link>{" "}
                    {canManagePeople ? <Link href={`/hr/people/${person.id}/edit`}>Edit</Link> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No people records found for your allowed locations.</p>
        )
      ) : null}
    </section>
  );
}
