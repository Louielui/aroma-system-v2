/**
 * File intent: define the HR People / User Management MVP domain model and related form types.
 * Design reminder for this file: keep the model simple, structural, and API-ready without redesigning auth.
 */

export type PersonRole =
  | "admin"
  | "hr"
  | "procurement_manager"
  | "kitchen_manager"
  | "inventory_staff"
  | "prep_staff";

export type ActiveStatus = "active" | "inactive";
export type PayType = "hourly" | "salary";

export type Person = {
  id: string;
  name: string;
  email: string;
  role: PersonRole;
  allowed_locations: string[];
  active_status: ActiveStatus;
  pay_type: PayType;
  hourly_rate: number | null;
};

export type PersonUpsert = Omit<Person, "id">;

export type PersonFormValues = {
  name: string;
  email: string;
  role: PersonRole;
  allowed_locations: string;
  active_status: ActiveStatus;
  pay_type: PayType;
  hourly_rate: string;
};
