/**
 * File intent: provide an API-ready repository abstraction for HR People / User Management.
 * Design reminder for this file: keep the implementation simple, structural, and ready to swap to HTTP later without changing page logic.
 */

import type { Person, PersonUpsert } from "@/modules/hr/people.types";

const STORAGE_KEY = "aroma-system-v2.hr.people";

const seedPeople: Person[] = [
  {
    id: "person-ava-chen",
    name: "Ava Chen",
    email: "ava.chen@aroma.local",
    role: "hr",
    allowed_locations: ["Central Kitchen", "St Mary"],
    active_status: "active",
    pay_type: "salary",
    hourly_rate: null,
  },
  {
    id: "person-liam-foster",
    name: "Liam Foster",
    email: "liam.foster@aroma.local",
    role: "kitchen_manager",
    allowed_locations: ["Central Kitchen"],
    active_status: "active",
    pay_type: "hourly",
    hourly_rate: 24,
  },
  {
    id: "person-maya-singh",
    name: "Maya Singh",
    email: "maya.singh@aroma.local",
    role: "prep_staff",
    allowed_locations: ["Forks"],
    active_status: "inactive",
    pay_type: "hourly",
    hourly_rate: 18.5,
  },
];

let memoryPeople = [...seedPeople];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readPeople(): Person[] {
  if (!canUseBrowserStorage()) {
    return memoryPeople;
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPeople));
    return [...seedPeople];
  }

  try {
    const parsed = JSON.parse(existing) as Person[];
    return Array.isArray(parsed) ? parsed : [...seedPeople];
  } catch {
    return [...seedPeople];
  }
}

function writePeople(people: Person[]) {
  memoryPeople = [...people];

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  }
}

function buildPersonId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return `person-${slug || Date.now()}`;
}

export interface PeopleRepository {
  list(): Promise<Person[]>;
  getById(id: string): Promise<Person | null>;
  create(input: PersonUpsert): Promise<Person>;
  update(id: string, input: PersonUpsert): Promise<Person>;
}

class LocalPeopleRepository implements PeopleRepository {
  async list() {
    return readPeople();
  }

  async getById(id: string) {
    return readPeople().find((person) => person.id === id) ?? null;
  }

  async create(input: PersonUpsert) {
    const people = readPeople();
    const person: Person = {
      id: buildPersonId(input.name),
      ...input,
    };

    const next = [person, ...people];
    writePeople(next);
    return person;
  }

  async update(id: string, input: PersonUpsert) {
    const people = readPeople();
    const existing = people.find((person) => person.id === id);

    if (!existing) {
      throw new Error("Person not found");
    }

    const updated: Person = {
      ...existing,
      ...input,
      id: existing.id,
    };

    writePeople(people.map((person) => (person.id === id ? updated : person)));
    return updated;
  }
}

export const peopleRepository: PeopleRepository = new LocalPeopleRepository();
