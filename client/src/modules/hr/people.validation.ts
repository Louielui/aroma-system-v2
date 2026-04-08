/**
 * File intent: provide basic validation for the HR People / User Management MVP form.
 * Design reminder for this file: keep validation practical, explicit, and aligned to the approved minimum fields.
 */

import { z } from "zod";
import type { Person, PersonFormValues, PersonUpsert } from "@/modules/hr/people.types";

export const personFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(200),
  role: z.enum(["admin", "hr", "procurement_manager", "kitchen_manager", "inventory_staff", "prep_staff"]),
  allowed_locations: z.string().trim(),
  active_status: z.enum(["active", "inactive"]),
  pay_type: z.enum(["hourly", "salary"]),
  hourly_rate: z
    .string()
    .trim()
    .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0), "Hourly rate must be 0 or greater"),
});

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function createDefaultPersonFormValues(): PersonFormValues {
  return {
    name: "",
    email: "",
    role: "prep_staff",
    allowed_locations: "",
    active_status: "active",
    pay_type: "hourly",
    hourly_rate: "",
  };
}

export function personToFormValues(person: Person): PersonFormValues {
  return {
    name: person.name,
    email: person.email,
    role: person.role,
    allowed_locations: person.allowed_locations.join(", "),
    active_status: person.active_status,
    pay_type: person.pay_type,
    hourly_rate: person.hourly_rate === null ? "" : String(person.hourly_rate),
  };
}

export function parsePersonFormValues(values: PersonFormValues): PersonUpsert {
  const validated = personFormSchema.parse(values);

  return {
    name: validated.name,
    email: validated.email,
    role: validated.role,
    allowed_locations: splitCommaSeparated(validated.allowed_locations),
    active_status: validated.active_status,
    pay_type: validated.pay_type,
    hourly_rate: validated.hourly_rate === "" ? null : Number(validated.hourly_rate),
  };
}
