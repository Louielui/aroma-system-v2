/**
 * File intent: provide basic validation for the approved MVP Supplier form.
 * Design reminder for this file: keep validation practical, explicit, and aligned to the approved fields.
 */

import { z } from "zod";
import type { Supplier, SupplierFormValues, SupplierUpsert } from "@/modules/procurement/suppliers.types";

const optionalText = z.string().trim().max(200).optional().or(z.literal(""));
const optionalLongText = z.string().trim().max(2000).optional().or(z.literal(""));

export const supplierFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  short_name: z.string().trim().max(100).optional().or(z.literal("")),
  legal_name: z.string().trim().max(200).optional().or(z.literal("")),
  code: z.string().trim().max(50).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "pending"]),
  contact_person: z.string().trim().max(150).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || z.string().email().safeParse(value).success, "Enter a valid email"),
  address_line_1: optionalText,
  address_line_2: optionalText,
  city: z.string().trim().max(100).optional().or(z.literal("")),
  province: z.string().trim().max(100).optional().or(z.literal("")),
  postal_code: z.string().trim().max(30).optional().or(z.literal("")),
  ordering_method: z.enum(["", "email", "phone", "portal", "sales_rep", "other"]),
  payment_terms: z.string().trim().max(100).optional().or(z.literal("")),
  delivery_days: optionalLongText,
  minimum_order_amount: z
    .string()
    .trim()
    .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0), "Minimum order amount must be 0 or greater"),
  lead_time_days: z
    .string()
    .trim()
    .refine((value) => value === "" || (Number.isInteger(Number(value)) && Number(value) >= 0), "Lead time days must be a whole number 0 or greater"),
  aliases: optionalLongText,
  notes: optionalLongText,
  is_enabled_for_invoice_parsing: z.boolean(),
});

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function createDefaultSupplierFormValues(): SupplierFormValues {
  return {
    name: "",
    short_name: "",
    legal_name: "",
    code: "",
    status: "active",
    contact_person: "",
    phone: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    province: "",
    postal_code: "",
    ordering_method: "",
    payment_terms: "",
    delivery_days: "",
    minimum_order_amount: "",
    lead_time_days: "",
    aliases: "",
    notes: "",
    is_enabled_for_invoice_parsing: false,
  };
}

export function supplierToFormValues(supplier: Supplier): SupplierFormValues {
  return {
    name: supplier.name,
    short_name: supplier.short_name,
    legal_name: supplier.legal_name,
    code: supplier.code,
    status: supplier.status,
    contact_person: supplier.contact_person,
    phone: supplier.phone,
    email: supplier.email,
    address_line_1: supplier.address_line_1,
    address_line_2: supplier.address_line_2,
    city: supplier.city,
    province: supplier.province,
    postal_code: supplier.postal_code,
    ordering_method: supplier.ordering_method,
    payment_terms: supplier.payment_terms,
    delivery_days: supplier.delivery_days.join(", "),
    minimum_order_amount: supplier.minimum_order_amount === null ? "" : String(supplier.minimum_order_amount),
    lead_time_days: supplier.lead_time_days === null ? "" : String(supplier.lead_time_days),
    aliases: supplier.aliases.join(", "),
    notes: supplier.notes,
    is_enabled_for_invoice_parsing: supplier.is_enabled_for_invoice_parsing,
  };
}

export function parseSupplierFormValues(values: SupplierFormValues): SupplierUpsert {
  const validated = supplierFormSchema.parse(values);

  return {
    name: validated.name,
    short_name: validated.short_name ?? "",
    legal_name: validated.legal_name ?? "",
    code: validated.code ?? "",
    status: validated.status,
    contact_person: validated.contact_person ?? "",
    phone: validated.phone ?? "",
    email: validated.email,
    address_line_1: validated.address_line_1 ?? "",
    address_line_2: validated.address_line_2 ?? "",
    city: validated.city ?? "",
    province: validated.province ?? "",
    postal_code: validated.postal_code ?? "",
    ordering_method: validated.ordering_method,
    payment_terms: validated.payment_terms ?? "",
    delivery_days: splitCommaSeparated(validated.delivery_days ?? ""),
    minimum_order_amount: validated.minimum_order_amount === "" ? null : Number(validated.minimum_order_amount),
    lead_time_days: validated.lead_time_days === "" ? null : Number(validated.lead_time_days),
    aliases: splitCommaSeparated(validated.aliases ?? ""),
    notes: validated.notes ?? "",
    is_enabled_for_invoice_parsing: validated.is_enabled_for_invoice_parsing,
  };
}
