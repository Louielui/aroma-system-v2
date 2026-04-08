/**
 * File intent: render the create/edit Person flow for HR People / User Management.
 * Design reminder for this file: keep the page simple while separating form, validation, and repository concerns.
 */

import { useAccessControl } from "@/contexts/AccessControlContext";
import PersonForm from "@/modules/hr/components/PersonForm";
import { peopleRepository } from "@/modules/hr/people.repository";
import type { Person, PersonFormValues } from "@/modules/hr/people.types";
import {
  createDefaultPersonFormValues,
  parsePersonFormValues,
  personToFormValues,
} from "@/modules/hr/people.validation";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";

function hasSharedAllowedLocation(person: Person, allowedLocations: string[]) {
  if (allowedLocations.length === 0) {
    return false;
  }

  const normalizedAllowedLocations = allowedLocations.map((value) => value.trim().toLowerCase());

  return person.allowed_locations.some((location) => normalizedAllowedLocations.includes(location.trim().toLowerCase()));
}

type PersonFormPageProps = {
  mode?: "create" | "edit";
};

export default function PersonFormPage({ mode: routeMode }: PersonFormPageProps) {
  const { allowedLocations, canManagePeople } = useAccessControl();
  const [, navigate] = useLocation();
  const editMatch = useRoute("/hr/people/:personId/edit");
  const personId = editMatch?.[1]?.personId;
  const [isLoading, setIsLoading] = useState(Boolean(personId && (routeMode === "edit" || !routeMode)));
  const [error, setError] = useState("");
  const [initialValues, setInitialValues] = useState<PersonFormValues>(createDefaultPersonFormValues());

  const mode = useMemo(() => routeMode ?? (personId ? "edit" : "create"), [personId, routeMode]);

  useEffect(() => {
    let isMounted = true;

    async function loadPerson() {
      if (!canManagePeople) {
        setError("You are not allowed to manage people.");
        setIsLoading(false);
        return;
      }

      if (mode !== "edit" || !personId) {
        setInitialValues(createDefaultPersonFormValues());
        setIsLoading(false);
        return;
      }

      try {
        const person = await peopleRepository.getById(personId);

        if (!person || !hasSharedAllowedLocation(person, allowedLocations)) {
          throw new Error("Person not found for your allowed locations.");
        }

        if (isMounted) {
          setInitialValues(personToFormValues(person));
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
  }, [allowedLocations, canManagePeople, mode, personId]);

  async function handleSubmit(values: PersonFormValues) {
    if (!canManagePeople) {
      setError("You are not allowed to manage people.");
      return;
    }

    const payload = parsePersonFormValues(values);
    const saved = mode === "edit" && personId
      ? await peopleRepository.update(personId, payload)
      : await peopleRepository.create(payload);

    navigate(`/hr/people/${saved.id}`);
  }

  if (isLoading) {
    return <p>Loading person form...</p>;
  }

  if (error) {
    return (
      <section>
        <p>{error}</p>
        <p>
          <button type="button" onClick={() => navigate("/hr/people")}>
            Back to people list
          </button>
        </p>
      </section>
    );
  }

  return (
    <section>
      <p>HR</p>
      <h1>{mode === "create" ? "Create Person" : "Edit Person"}</h1>
      <p>People / User Management fields follow the approved minimum employee data model.</p>
      <PersonForm
        defaultValues={initialValues}
        submitLabel={mode === "create" ? "Create person" : "Save person"}
        onSubmit={handleSubmit}
      />
      <p>
        <button type="button" onClick={() => navigate("/hr/people")}>
          Back to people list
        </button>
      </p>
    </section>
  );
}
