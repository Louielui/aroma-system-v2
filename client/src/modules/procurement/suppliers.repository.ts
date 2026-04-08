/**
 * File intent: provide an API-ready Supplier repository abstraction with a local storage implementation.
 * Design reminder for this file: keep the data handling ready to swap to HTTP later without changing page logic.
 */

import type { Supplier, SupplierUpsert } from "@/modules/procurement/suppliers.types";

const STORAGE_KEY = "aroma-system-v2.procurement.suppliers";

const seedSuppliers: Supplier[] = [
  {
    id: "supplier-gfs",
    name: "Gordon Food Service",
    short_name: "GFS",
    legal_name: "Gordon Food Service Canada Ltd.",
    code: "GFS-001",
    status: "active",
    contact_person: "Account Manager",
    phone: "555-0101",
    email: "orders@gfs.example",
    address_line_1: "100 Supply Avenue",
    address_line_2: "",
    city: "Winnipeg",
    province: "MB",
    postal_code: "R3C 0A1",
    ordering_method: "portal",
    payment_terms: "Net 30",
    delivery_days: ["Monday", "Wednesday", "Friday"],
    minimum_order_amount: 250,
    lead_time_days: 2,
    aliases: ["GFS", "Gordon FS"],
    notes: "Seed supplier for Procurement MVP.",
    is_enabled_for_invoice_parsing: true,
    created_at: new Date("2026-01-01T10:00:00.000Z").toISOString(),
    updated_at: new Date("2026-01-01T10:00:00.000Z").toISOString(),
  },
  {
    id: "supplier-freshline",
    name: "Freshline Produce",
    short_name: "Freshline",
    legal_name: "Freshline Produce Inc.",
    code: "FRSH-002",
    status: "active",
    contact_person: "Produce Desk",
    phone: "555-0102",
    email: "orders@freshline.example",
    address_line_1: "22 Market Road",
    address_line_2: "",
    city: "Winnipeg",
    province: "MB",
    postal_code: "R3B 1A2",
    ordering_method: "email",
    payment_terms: "Net 14",
    delivery_days: ["Tuesday", "Thursday"],
    minimum_order_amount: 100,
    lead_time_days: 1,
    aliases: ["Fresh Line", "Freshline Produce"],
    notes: "Seed supplier for Produce ordering.",
    is_enabled_for_invoice_parsing: false,
    created_at: new Date("2026-01-02T10:00:00.000Z").toISOString(),
    updated_at: new Date("2026-01-02T10:00:00.000Z").toISOString(),
  },
];

let memorySuppliers = [...seedSuppliers];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readSuppliers(): Supplier[] {
  if (!canUseBrowserStorage()) {
    return memorySuppliers;
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSuppliers));
    return [...seedSuppliers];
  }

  try {
    const parsed = JSON.parse(existing) as Supplier[];
    return Array.isArray(parsed) ? parsed : [...seedSuppliers];
  } catch {
    return [...seedSuppliers];
  }
}

function writeSuppliers(suppliers: Supplier[]) {
  memorySuppliers = [...suppliers];

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
  }
}

function buildSupplierId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return `supplier-${slug || Date.now()}`;
}

export interface SupplierRepository {
  list(): Promise<Supplier[]>;
  getById(id: string): Promise<Supplier | null>;
  create(input: SupplierUpsert): Promise<Supplier>;
  update(id: string, input: SupplierUpsert): Promise<Supplier>;
}

class LocalSupplierRepository implements SupplierRepository {
  async list() {
    return readSuppliers();
  }

  async getById(id: string) {
    return readSuppliers().find((supplier) => supplier.id === id) ?? null;
  }

  async create(input: SupplierUpsert) {
    const suppliers = readSuppliers();
    const timestamp = new Date().toISOString();
    const supplier: Supplier = {
      id: buildSupplierId(input.name),
      ...input,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const next = [supplier, ...suppliers];
    writeSuppliers(next);
    return supplier;
  }

  async update(id: string, input: SupplierUpsert) {
    const suppliers = readSuppliers();
    const existing = suppliers.find((supplier) => supplier.id === id);

    if (!existing) {
      throw new Error("Supplier not found");
    }

    const updated: Supplier = {
      ...existing,
      ...input,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };

    writeSuppliers(suppliers.map((supplier) => (supplier.id === id ? updated : supplier)));
    return updated;
  }
}

export const supplierRepository: SupplierRepository = new LocalSupplierRepository();
