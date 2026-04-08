/**
 * File intent: provide an API-ready Raw Ingredient repository abstraction with a local storage implementation.
 * Design reminder for this file: keep the Central Kitchen feature ready to swap to HTTP later without changing page logic.
 */

import type {
  RawIngredient,
  RawIngredientUpsert,
} from "@/modules/central-kitchen/raw-ingredients.types";

const STORAGE_KEY = "aroma-system-v2.central-kitchen.raw-ingredients";

const seedRawIngredients: RawIngredient[] = [
  {
    id: "raw-ingredient-chicken-breast",
    name: "Chicken Breast",
    short_name: "Chicken",
    category: "Protein",
    description: "Raw boneless skinless chicken breast for prep before marination and portioning.",
    status: "active",
    location_id: "ck-main-cooler",
    preferred_supplier_id: "supplier-gfs",
    supplier_item_name: "Chicken Breast Fresh",
    supplier_item_code: "GFS-CHK-101",
    base_unit: "kg",
    purchase_unit: "case",
    purchase_pack_size: 10,
    unit_conversion_ratio: 10,
    current_stock: 18,
    par_level: 30,
    reorder_point: 12,
    reorder_quantity: 20,
    minimum_order_quantity: 10,
    is_prep_input: true,
    is_active: true,
    notes: "Central Kitchen raw ingredient before prep processing.",
    created_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
    updated_at: new Date("2026-01-03T10:00:00.000Z").toISOString(),
  },
  {
    id: "raw-ingredient-yellow-onion",
    name: "Yellow Onion",
    short_name: "Onion",
    category: "Vegetable",
    description: "Whole yellow onion stored before slicing and prep output generation.",
    status: "active",
    location_id: "ck-dry-store",
    preferred_supplier_id: "supplier-freshline",
    supplier_item_name: "Yellow Onion 50lb",
    supplier_item_code: "FRSH-ON-220",
    base_unit: "kg",
    purchase_unit: "bag",
    purchase_pack_size: 22.68,
    unit_conversion_ratio: 22.68,
    current_stock: 40,
    par_level: 55,
    reorder_point: 25,
    reorder_quantity: 30,
    minimum_order_quantity: 22.68,
    is_prep_input: true,
    is_active: true,
    notes: "Base-unit stock fields are recorded in kg only.",
    created_at: new Date("2026-01-04T10:00:00.000Z").toISOString(),
    updated_at: new Date("2026-01-04T10:00:00.000Z").toISOString(),
  },
];

let memoryRawIngredients = [...seedRawIngredients];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRawIngredients(): RawIngredient[] {
  if (!canUseBrowserStorage()) {
    return memoryRawIngredients;
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRawIngredients));
    return [...seedRawIngredients];
  }

  try {
    const parsed = JSON.parse(existing) as RawIngredient[];
    return Array.isArray(parsed) ? parsed : [...seedRawIngredients];
  } catch {
    return [...seedRawIngredients];
  }
}

function writeRawIngredients(rawIngredients: RawIngredient[]) {
  memoryRawIngredients = [...rawIngredients];

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rawIngredients));
  }
}

function buildRawIngredientId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return `raw-ingredient-${slug || Date.now()}`;
}

export type RawIngredientStockTakeEntry = {
  id: string;
  counted_quantity: number;
};

export interface RawIngredientRepository {
  list(): Promise<RawIngredient[]>;
  getById(id: string): Promise<RawIngredient | null>;
  create(input: RawIngredientUpsert): Promise<RawIngredient>;
  update(id: string, input: RawIngredientUpsert): Promise<RawIngredient>;
  applyStockTake(entries: RawIngredientStockTakeEntry[]): Promise<RawIngredient[]>;
}

class LocalRawIngredientRepository implements RawIngredientRepository {
  async list() {
    return readRawIngredients();
  }

  async getById(id: string) {
    return readRawIngredients().find((rawIngredient) => rawIngredient.id === id) ?? null;
  }

  async create(input: RawIngredientUpsert) {
    const rawIngredients = readRawIngredients();
    const timestamp = new Date().toISOString();
    const rawIngredient: RawIngredient = {
      id: buildRawIngredientId(input.name),
      ...input,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const next = [rawIngredient, ...rawIngredients];
    writeRawIngredients(next);
    return rawIngredient;
  }

  async update(id: string, input: RawIngredientUpsert) {
    const rawIngredients = readRawIngredients();
    const existing = rawIngredients.find((rawIngredient) => rawIngredient.id === id);

    if (!existing) {
      throw new Error("Raw ingredient not found");
    }

    const updated: RawIngredient = {
      ...existing,
      ...input,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };

    writeRawIngredients(rawIngredients.map((rawIngredient) => (rawIngredient.id === id ? updated : rawIngredient)));
    return updated;
  }

  async applyStockTake(entries: RawIngredientStockTakeEntry[]) {
    const rawIngredients = readRawIngredients();
    const entryMap = new Map(entries.map((entry) => [entry.id, entry.counted_quantity]));
    const timestamp = new Date().toISOString();

    const updatedRawIngredients = rawIngredients.map((rawIngredient) => {
      const countedQuantity = entryMap.get(rawIngredient.id);

      if (countedQuantity === undefined) {
        return rawIngredient;
      }

      return {
        ...rawIngredient,
        current_stock: countedQuantity,
        updated_at: timestamp,
      };
    });

    writeRawIngredients(updatedRawIngredients);
    return updatedRawIngredients;
  }
}

export const rawIngredientRepository: RawIngredientRepository = new LocalRawIngredientRepository();
