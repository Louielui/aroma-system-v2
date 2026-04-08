/**
 * File intent: provide local-storage-backed repository abstractions for Stores / Branch Operations Phase 1.
 * Design reminder for this file: keep Stores records separate from Logistics and Internal Transfer, and limit the workflow to par levels, stock takes, and shortage calculation.
 */

import {
  calculateOverageQuantity,
  calculateShortageQuantity,
  type StoreParLevel,
  type StoreParLevelUpsert,
  type StoreStockTake,
  type StoreStockTakeCreateInput,
  type StoreStockTakeLine,
} from "@/modules/stores/stores.types";

const STORE_PAR_LEVELS_STORAGE_KEY = "aroma-system-v2.stores.par-levels";
const STORE_STOCK_TAKES_STORAGE_KEY = "aroma-system-v2.stores.stock-takes";

const seedStoreParLevels: StoreParLevel[] = [
  {
    id: "store-par-level-downtown-chicken-breast",
    store_location_id: "store-downtown",
    raw_ingredient_id: "raw-ingredient-chicken-breast",
    item_name: "Chicken Breast",
    category: "Protein",
    base_unit: "kg",
    par_quantity: 12,
    reorder_trigger_quantity: 6,
    is_active: true,
    notes: "Downtown branch target level for chicken breast.",
    created_at: new Date("2026-02-10T09:00:00.000Z").toISOString(),
    updated_at: new Date("2026-02-10T09:00:00.000Z").toISOString(),
  },
  {
    id: "store-par-level-downtown-yellow-onion",
    store_location_id: "store-downtown",
    raw_ingredient_id: "raw-ingredient-yellow-onion",
    item_name: "Yellow Onion",
    category: "Vegetable",
    base_unit: "kg",
    par_quantity: 8,
    reorder_trigger_quantity: 4,
    is_active: true,
    notes: "Downtown branch target level for onions.",
    created_at: new Date("2026-02-10T09:05:00.000Z").toISOString(),
    updated_at: new Date("2026-02-10T09:05:00.000Z").toISOString(),
  },
  {
    id: "store-par-level-riverside-chicken-breast",
    store_location_id: "store-riverside",
    raw_ingredient_id: "raw-ingredient-chicken-breast",
    item_name: "Chicken Breast",
    category: "Protein",
    base_unit: "kg",
    par_quantity: 10,
    reorder_trigger_quantity: 5,
    is_active: true,
    notes: "Riverside branch target level for chicken breast.",
    created_at: new Date("2026-02-10T09:10:00.000Z").toISOString(),
    updated_at: new Date("2026-02-10T09:10:00.000Z").toISOString(),
  },
];

function buildStockTakeLines(input: StoreStockTakeCreateInput): StoreStockTakeLine[] {
  return input.lines.map((line) => ({
    id: `store-stock-take-line-${line.store_par_level_id}`,
    store_par_level_id: line.store_par_level_id,
    raw_ingredient_id: line.raw_ingredient_id,
    item_name: line.item_name,
    category: line.category,
    base_unit: line.base_unit,
    counted_quantity: line.counted_quantity,
    par_quantity_snapshot: line.par_quantity_snapshot,
    shortage_quantity: calculateShortageQuantity(line.par_quantity_snapshot, line.counted_quantity),
    overage_quantity: calculateOverageQuantity(line.par_quantity_snapshot, line.counted_quantity),
    line_notes: line.line_notes,
  }));
}

const seedStoreStockTakes: StoreStockTake[] = [
  {
    id: "store-stock-take-downtown-2026-02-18",
    stock_take_number: "SST-20260218-001",
    store_location_id: "store-downtown",
    stock_take_date: "2026-02-18",
    counted_by_user_id: null,
    status: "finalized",
    notes: "Opening count for Downtown branch.",
    lines: buildStockTakeLines({
      store_location_id: "store-downtown",
      stock_take_date: "2026-02-18",
      counted_by_user_id: null,
      status: "finalized",
      notes: "Opening count for Downtown branch.",
      lines: [
        {
          store_par_level_id: "store-par-level-downtown-chicken-breast",
          raw_ingredient_id: "raw-ingredient-chicken-breast",
          item_name: "Chicken Breast",
          category: "Protein",
          base_unit: "kg",
          par_quantity_snapshot: 12,
          counted_quantity: 7,
          line_notes: "Short by five kilograms against par.",
        },
        {
          store_par_level_id: "store-par-level-downtown-yellow-onion",
          raw_ingredient_id: "raw-ingredient-yellow-onion",
          item_name: "Yellow Onion",
          category: "Vegetable",
          base_unit: "kg",
          par_quantity_snapshot: 8,
          counted_quantity: 9,
          line_notes: "Slight overage from yesterday's transfer.",
        },
      ],
    }),
    created_at: new Date("2026-02-18T08:00:00.000Z").toISOString(),
    updated_at: new Date("2026-02-18T08:00:00.000Z").toISOString(),
  },
];

let memoryStoreParLevels = [...seedStoreParLevels];
let memoryStoreStockTakes = [...seedStoreStockTakes];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readCollection<T>(storageKey: string, seedData: T[], memoryData: T[]) {
  if (!canUseBrowserStorage()) {
    return memoryData;
  }

  const existing = window.localStorage.getItem(storageKey);

  if (!existing) {
    window.localStorage.setItem(storageKey, JSON.stringify(seedData));
    return [...seedData];
  }

  try {
    const parsed = JSON.parse(existing) as T[];
    return Array.isArray(parsed) ? parsed : [...seedData];
  } catch {
    return [...seedData];
  }
}

function writeStoreParLevels(storeParLevels: StoreParLevel[]) {
  memoryStoreParLevels = [...storeParLevels];

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORE_PAR_LEVELS_STORAGE_KEY, JSON.stringify(storeParLevels));
  }
}

function writeStoreStockTakes(storeStockTakes: StoreStockTake[]) {
  memoryStoreStockTakes = [...storeStockTakes];

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORE_STOCK_TAKES_STORAGE_KEY, JSON.stringify(storeStockTakes));
  }
}

function readStoreParLevels() {
  return readCollection(STORE_PAR_LEVELS_STORAGE_KEY, seedStoreParLevels, memoryStoreParLevels);
}

function readStoreStockTakes() {
  return readCollection(STORE_STOCK_TAKES_STORAGE_KEY, seedStoreStockTakes, memoryStoreStockTakes);
}

function buildStoreParLevelId(input: StoreParLevelUpsert) {
  const itemSlug = input.item_name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return `store-par-level-${input.store_location_id}-${itemSlug || Date.now()}`;
}

function buildStoreStockTakeId(storeLocationId: string) {
  return `store-stock-take-${storeLocationId}-${Date.now()}`;
}

function buildStoreStockTakeNumber(storeStockTakes: StoreStockTake[]) {
  return `SST-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(storeStockTakes.length + 1).padStart(3, "0")}`;
}

export interface StoreParLevelRepository {
  list(): Promise<StoreParLevel[]>;
  getById(id: string): Promise<StoreParLevel | null>;
  create(input: StoreParLevelUpsert): Promise<StoreParLevel>;
  update(id: string, input: StoreParLevelUpsert): Promise<StoreParLevel>;
}

export interface StoreStockTakeRepository {
  list(): Promise<StoreStockTake[]>;
  getById(id: string): Promise<StoreStockTake | null>;
  create(input: StoreStockTakeCreateInput): Promise<StoreStockTake>;
}

class LocalStoreParLevelRepository implements StoreParLevelRepository {
  async list() {
    return readStoreParLevels();
  }

  async getById(id: string) {
    return readStoreParLevels().find((item) => item.id === id) ?? null;
  }

  async create(input: StoreParLevelUpsert) {
    const current = readStoreParLevels();
    const timestamp = new Date().toISOString();
    const created: StoreParLevel = {
      id: buildStoreParLevelId(input),
      ...input,
      created_at: timestamp,
      updated_at: timestamp,
    };

    writeStoreParLevels([created, ...current]);
    return created;
  }

  async update(id: string, input: StoreParLevelUpsert) {
    const current = readStoreParLevels();
    const existing = current.find((item) => item.id === id);

    if (!existing) {
      throw new Error("Store Par Level not found");
    }

    const updated: StoreParLevel = {
      ...existing,
      ...input,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };

    writeStoreParLevels(current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
}

class LocalStoreStockTakeRepository implements StoreStockTakeRepository {
  async list() {
    return readStoreStockTakes();
  }

  async getById(id: string) {
    return readStoreStockTakes().find((item) => item.id === id) ?? null;
  }

  async create(input: StoreStockTakeCreateInput) {
    const current = readStoreStockTakes();
    const timestamp = new Date().toISOString();
    const created: StoreStockTake = {
      id: buildStoreStockTakeId(input.store_location_id),
      stock_take_number: buildStoreStockTakeNumber(current),
      store_location_id: input.store_location_id,
      stock_take_date: input.stock_take_date,
      counted_by_user_id: input.counted_by_user_id,
      status: input.status,
      notes: input.notes,
      lines: buildStockTakeLines(input),
      created_at: timestamp,
      updated_at: timestamp,
    };

    writeStoreStockTakes([created, ...current]);
    return created;
  }
}

export const storeParLevelRepository: StoreParLevelRepository = new LocalStoreParLevelRepository();
export const storeStockTakeRepository: StoreStockTakeRepository = new LocalStoreStockTakeRepository();
