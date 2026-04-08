/**
 * File intent: define the approved MVP Supplier domain model and related form types.
 * Design reminder for this file: preserve the approved data model exactly and keep it API-ready.
 */

export type SupplierStatus = "active" | "inactive" | "pending";
export type OrderingMethod = "email" | "phone" | "portal" | "sales_rep" | "other" | "";

export type Supplier = {
  id: string;
  name: string;
  short_name: string;
  legal_name: string;
  code: string;
  status: SupplierStatus;
  contact_person: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  ordering_method: OrderingMethod;
  payment_terms: string;
  delivery_days: string[];
  minimum_order_amount: number | null;
  lead_time_days: number | null;
  aliases: string[];
  notes: string;
  is_enabled_for_invoice_parsing: boolean;
  created_at: string;
  updated_at: string;
};

export type SupplierUpsert = Omit<Supplier, "id" | "created_at" | "updated_at">;

export type SupplierFormValues = {
  name: string;
  short_name: string;
  legal_name: string;
  code: string;
  status: SupplierStatus;
  contact_person: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  ordering_method: OrderingMethod;
  payment_terms: string;
  delivery_days: string;
  minimum_order_amount: string;
  lead_time_days: string;
  aliases: string;
  notes: string;
  is_enabled_for_invoice_parsing: boolean;
};
