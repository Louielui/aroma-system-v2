/*
 * File intent: provide local-storage-backed repository abstractions for Stores / Branch Operations Phase 3.
 * Design reminder for this file: keep Stores records separate from Logistics and Internal Transfer, keep replenishment requests demand-side only, and make handoff to Logistics explicit through conversion rather than mutation.
 */

import { internalTransferRepository } from "@/modules/logistics/internal-transfers.repository";
import type { InternalTransferUpsert } from "@/modules/logistics/internal-transfers.types";
import {
  calculateOverageQuantity,
  calculateShortageQuantity,
  canCancelStoreReplenishmentRequest,
  canConvertStoreReplenishmentRequest,
  canReviewStoreReplenishmentRequest,
  canStartStoreReplenishmentRequestReview,
  isStoreReplenishmentRequestEditable,
  type StoreParLevel,
  type StoreParLevelUpsert,
  type StoreReplenishmentRequest,
  type StoreReplenishmentRequestCreateInput,
  type StoreReplenishmentRequestLine,
  type StoreReplenishmentRequestReviewInput,
  type StoreReplenishmentRequestUpdateInput,
  type StoreStockTake,
  type StoreStockTakeCreateInput,
  type StoreStockTakeLine,
} from "@/modules/stores/stores.types";

const STORE_PAR_LEVELS_STORAGE_KEY = "aroma-system-v2.stores.par-levels";
const STORE_STOCK_TAKES_STORAGE_KEY = "aroma-system-v2.stores.stock-takes";
const STORE_REPLENISHMENT_REQUESTS_STORAGE_KEY = "aroma-system-v2.stores.replenishment-requests";
const DEFAULT_TRANSFER_SOURCE_LOCATION_ID = "Central Kitchen";

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

function buildStoreReplenishmentRequestLineId(base: string, index: number) {
  return `store-replenishment-request-line-${base}-${index + 1}-${Date.now()}`;
}

function normalizeStoreReplenishmentRequestLine(
  line: Omit<StoreReplenishmentRequestLine, "linked_internal_transfer_line_id" | "converted_quantity"> &
    Partial<Pick<StoreReplenishmentRequestLine, "linked_internal_transfer_line_id" | "converted_quantity">>,
): StoreReplenishmentRequestLine {
  return {
    ...line,
    approved_quantity: line.approved_quantity ?? null,
    linked_internal_transfer_line_id: line.linked_internal_transfer_line_id ?? null,
    converted_quantity:
      typeof line.converted_quantity === "number" && Number.isFinite(line.converted_quantity)
        ? line.converted_quantity
        : 0,
  };
}

function buildReplenishmentRequestLines(
  input: StoreReplenishmentRequestCreateInput | StoreReplenishmentRequestUpdateInput,
  existingRequestId?: string,
): StoreReplenishmentRequestLine[] {
  const lineBase = existingRequestId ?? input.store_location_id;

  return input.lines.map((line, index) =>
    normalizeStoreReplenishmentRequestLine({
      id: line.id ?? buildStoreReplenishmentRequestLineId(lineBase, index),
      source_store_stock_take_line_id: line.source_store_stock_take_line_id,
      source_store_par_level_id: line.source_store_par_level_id,
      raw_ingredient_id: line.raw_ingredient_id,
      item_name: line.item_name,
      category: line.category,
      base_unit: line.base_unit,
      par_quantity_snapshot: line.par_quantity_snapshot,
      counted_quantity_snapshot: line.counted_quantity_snapshot,
      shortage_quantity_snapshot: line.shortage_quantity_snapshot,
      requested_quantity: line.requested_quantity,
      approved_quantity: line.approved_quantity ?? null,
      line_notes: line.line_notes,
      linked_internal_transfer_line_id: null,
      converted_quantity: 0,
    }),
  );
}

function normalizeStoreReplenishmentRequest(
  request: Omit<
    StoreReplenishmentRequest,
    | "conversion_status"
    | "linked_internal_transfer_id"
    | "linked_internal_transfer_number"
    | "converted_at"
    | "converted_by_user_id"
    | "lines"
  > &
    Partial<
      Pick<
        StoreReplenishmentRequest,
        | "conversion_status"
        | "linked_internal_transfer_id"
        | "linked_internal_transfer_number"
        | "converted_at"
        | "converted_by_user_id"
      >
    > & {
      lines: Array<
        Omit<StoreReplenishmentRequestLine, "linked_internal_transfer_line_id" | "converted_quantity"> &
          Partial<Pick<StoreReplenishmentRequestLine, "linked_internal_transfer_line_id" | "converted_quantity">>
      >;
    },
): StoreReplenishmentRequest {
  return {
    ...request,
    conversion_status: request.conversion_status ?? "not_converted",
    linked_internal_transfer_id: request.linked_internal_transfer_id ?? null,
    linked_internal_transfer_number: request.linked_internal_transfer_number ?? null,
    converted_at: request.converted_at ?? null,
    converted_by_user_id: request.converted_by_user_id ?? null,
    lines: request.lines.map(normalizeStoreReplenishmentRequestLine),
  };
}

const seedStoreReplenishmentRequests: StoreReplenishmentRequest[] = [
  normalizeStoreReplenishmentRequest({
    id: "store-replenishment-request-downtown-2026-02-18-001",
    request_number: "SRR-20260218-001",
    store_location_id: "store-downtown",
    request_date: "2026-02-18",
    status: "draft",
    source_store_stock_take_id: "store-stock-take-downtown-2026-02-18",
    requested_by_user_id: null,
    review_notes: "",
    reviewed_by_user_id: null,
    reviewed_at: null,
    approved_by_user_id: null,
    approved_at: null,
    notes: "Draft replenishment request created from Downtown shortage lines.",
    lines: [
      {
        id: "store-replenishment-request-line-downtown-001",
        source_store_stock_take_line_id: "store-stock-take-line-store-par-level-downtown-chicken-breast",
        source_store_par_level_id: "store-par-level-downtown-chicken-breast",
        raw_ingredient_id: "raw-ingredient-chicken-breast",
        item_name: "Chicken Breast",
        category: "Protein",
        base_unit: "kg",
        par_quantity_snapshot: 12,
        counted_quantity_snapshot: 7,
        shortage_quantity_snapshot: 5,
        requested_quantity: 5,
        approved_quantity: null,
        line_notes: "Requested to replenish the full shortage amount.",
        linked_internal_transfer_line_id: null,
        converted_quantity: 0,
      },
    ],
    created_at: new Date("2026-02-18T09:00:00.000Z").toISOString(),
    updated_at: new Date("2026-02-18T09:00:00.000Z").toISOString(),
  }),
];

let memoryStoreParLevels = [...seedStoreParLevels];
let memoryStoreStockTakes = [...seedStoreStockTakes];
let memoryStoreReplenishmentRequests = [...seedStoreReplenishmentRequests];

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

function writeStoreReplenishmentRequests(storeReplenishmentRequests: StoreReplenishmentRequest[]) {
  memoryStoreReplenishmentRequests = [...storeReplenishmentRequests];

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(
      STORE_REPLENISHMENT_REQUESTS_STORAGE_KEY,
      JSON.stringify(storeReplenishmentRequests),
    );
  }
}

function readStoreParLevels() {
  return readCollection(STORE_PAR_LEVELS_STORAGE_KEY, seedStoreParLevels, memoryStoreParLevels);
}

function readStoreStockTakes() {
  return readCollection(STORE_STOCK_TAKES_STORAGE_KEY, seedStoreStockTakes, memoryStoreStockTakes);
}

function readStoreReplenishmentRequests() {
  return readCollection(
    STORE_REPLENISHMENT_REQUESTS_STORAGE_KEY,
    seedStoreReplenishmentRequests,
    memoryStoreReplenishmentRequests,
  ).map((request) => normalizeStoreReplenishmentRequest(request));
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
  return `SST-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
    storeStockTakes.length + 1,
  ).padStart(3, "0")}`;
}

function buildStoreReplenishmentRequestId(storeLocationId: string) {
  return `store-replenishment-request-${storeLocationId}-${Date.now()}`;
}

function buildStoreReplenishmentRequestNumber(
  storeReplenishmentRequests: StoreReplenishmentRequest[],
) {
  return `SRR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
    storeReplenishmentRequests.length + 1,
  ).padStart(3, "0")}`;
}

function requireStoreReplenishmentRequest(items: StoreReplenishmentRequest[], id: string) {
  const existing = items.find((item) => item.id === id);

  if (!existing) {
    throw new Error("Store Replenishment Request not found");
  }

  return existing;
}

function stampReviewProgress(
  request: StoreReplenishmentRequest,
  reviewInput: StoreReplenishmentRequestReviewInput,
  actorUserId: string,
) {
  const reviewLines = new Map(reviewInput.lines.map((line) => [line.id, line.approved_quantity]));

  return {
    ...request,
    review_notes: reviewInput.review_notes,
    reviewed_by_user_id: actorUserId || null,
    reviewed_at: new Date().toISOString(),
    lines: request.lines.map((line) => ({
      ...line,
      approved_quantity: reviewLines.get(line.id) ?? 0,
    })),
  };
}

function buildTransferLineId(requestId: string, lineId: string, index: number) {
  return `internal-transfer-line-${requestId}-${lineId}-${index + 1}`;
}

function buildConversionTransferInput(request: StoreReplenishmentRequest): InternalTransferUpsert {
  const convertibleLines = request.lines.filter(
    (line) => (line.approved_quantity ?? 0) > 0 && !line.linked_internal_transfer_line_id,
  );

  if (convertibleLines.length === 0) {
    throw new Error("No approved lines are available for conversion to Internal Transfer.");
  }

  return {
    request_date: new Date().toISOString().slice(0, 10),
    source_location_id: DEFAULT_TRANSFER_SOURCE_LOCATION_ID,
    destination_location_id: request.store_location_id,
    requested_by_user_id: request.requested_by_user_id ?? request.approved_by_user_id ?? "",
    approved_by_user_id: "",
    scheduled_dispatch_date: request.request_date,
    logistics_status: "draft",
    priority: "normal",
    notes: request.notes
      ? `Converted from ${request.request_number}. ${request.notes}`
      : `Converted from ${request.request_number}.`,
    line_items: convertibleLines.map((line, index) => ({
      id: buildTransferLineId(request.id, line.id, index),
      raw_ingredient_id: line.raw_ingredient_id,
      item_name: line.item_name,
      base_unit: line.base_unit,
      requested_quantity: line.approved_quantity ?? 0,
      picked_quantity: 0,
      received_quantity: 0,
      shortage_notes: "",
      discrepancy_notes: "",
      line_notes: line.line_notes,
      source_store_replenishment_request_line_id: line.id,
    })),
    assigned_to_user_id: "",
    exception_code: "",
    exception_notes: "",
    source_store_replenishment_request_id: request.id,
    source_store_replenishment_request_number: request.request_number,
  };
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

export interface StoreReplenishmentRequestRepository {
  list(): Promise<StoreReplenishmentRequest[]>;
  getById(id: string): Promise<StoreReplenishmentRequest | null>;
  create(input: StoreReplenishmentRequestCreateInput): Promise<StoreReplenishmentRequest>;
  update(id: string, input: StoreReplenishmentRequestUpdateInput): Promise<StoreReplenishmentRequest>;
  submit(id: string): Promise<StoreReplenishmentRequest>;
  startReview(id: string, actorUserId: string): Promise<StoreReplenishmentRequest>;
  approve(id: string, input: StoreReplenishmentRequestReviewInput, actorUserId: string): Promise<StoreReplenishmentRequest>;
  reject(id: string, input: StoreReplenishmentRequestReviewInput, actorUserId: string): Promise<StoreReplenishmentRequest>;
  cancel(id: string, actorUserId: string): Promise<StoreReplenishmentRequest>;
  convertToInternalTransfer(id: string, actorUserId: string): Promise<StoreReplenishmentRequest>;
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

class LocalStoreReplenishmentRequestRepository implements StoreReplenishmentRequestRepository {
  async list() {
    return readStoreReplenishmentRequests();
  }

  async getById(id: string) {
    return readStoreReplenishmentRequests().find((item) => item.id === id) ?? null;
  }

  async create(input: StoreReplenishmentRequestCreateInput) {
    const current = readStoreReplenishmentRequests();
    const timestamp = new Date().toISOString();
    const created = normalizeStoreReplenishmentRequest({
      id: buildStoreReplenishmentRequestId(input.store_location_id),
      request_number: buildStoreReplenishmentRequestNumber(current),
      store_location_id: input.store_location_id,
      request_date: input.request_date,
      status: "draft",
      conversion_status: "not_converted",
      linked_internal_transfer_id: null,
      linked_internal_transfer_number: null,
      converted_at: null,
      converted_by_user_id: null,
      source_store_stock_take_id: input.source_store_stock_take_id,
      requested_by_user_id: input.requested_by_user_id,
      review_notes: "",
      reviewed_by_user_id: null,
      reviewed_at: null,
      approved_by_user_id: null,
      approved_at: null,
      notes: input.notes,
      lines: buildReplenishmentRequestLines(input),
      created_at: timestamp,
      updated_at: timestamp,
    });

    writeStoreReplenishmentRequests([created, ...current]);
    return created;
  }

  async update(id: string, input: StoreReplenishmentRequestUpdateInput) {
    const current = readStoreReplenishmentRequests();
    const existing = requireStoreReplenishmentRequest(current, id);

    if (!isStoreReplenishmentRequestEditable(existing)) {
      throw new Error("Only draft Store Replenishment Requests can be edited");
    }

    const updated = normalizeStoreReplenishmentRequest({
      ...existing,
      store_location_id: input.store_location_id,
      request_date: input.request_date,
      requested_by_user_id: input.requested_by_user_id,
      source_store_stock_take_id: input.source_store_stock_take_id,
      notes: input.notes,
      status: input.status,
      lines: buildReplenishmentRequestLines(input, existing.id),
      updated_at: new Date().toISOString(),
    });

    writeStoreReplenishmentRequests(current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  async submit(id: string) {
    const current = readStoreReplenishmentRequests();
    const existing = requireStoreReplenishmentRequest(current, id);

    if (!isStoreReplenishmentRequestEditable(existing)) {
      throw new Error("Only draft Store Replenishment Requests can be submitted");
    }

    const submitted: StoreReplenishmentRequest = {
      ...existing,
      status: "submitted",
      updated_at: new Date().toISOString(),
    };

    writeStoreReplenishmentRequests(current.map((item) => (item.id === id ? submitted : item)));
    return submitted;
  }

  async startReview(id: string, actorUserId: string) {
    const current = readStoreReplenishmentRequests();
    const existing = requireStoreReplenishmentRequest(current, id);

    if (!canStartStoreReplenishmentRequestReview(existing)) {
      throw new Error("Only submitted Store Replenishment Requests can move into review");
    }

    const timestamp = new Date().toISOString();
    const underReview: StoreReplenishmentRequest = {
      ...existing,
      status: "under_review",
      reviewed_by_user_id: actorUserId || null,
      reviewed_at: timestamp,
      updated_at: timestamp,
    };

    writeStoreReplenishmentRequests(current.map((item) => (item.id === id ? underReview : item)));
    return underReview;
  }

  async approve(id: string, input: StoreReplenishmentRequestReviewInput, actorUserId: string) {
    const current = readStoreReplenishmentRequests();
    const existing = requireStoreReplenishmentRequest(current, id);

    if (!canReviewStoreReplenishmentRequest(existing)) {
      throw new Error("Only under-review Store Replenishment Requests can be approved");
    }

    const reviewed = stampReviewProgress(existing, input, actorUserId);
    const timestamp = new Date().toISOString();
    const approved: StoreReplenishmentRequest = {
      ...reviewed,
      status: "approved",
      approved_by_user_id: actorUserId || null,
      approved_at: timestamp,
      updated_at: timestamp,
    };

    writeStoreReplenishmentRequests(current.map((item) => (item.id === id ? approved : item)));
    return approved;
  }

  async reject(id: string, input: StoreReplenishmentRequestReviewInput, actorUserId: string) {
    const current = readStoreReplenishmentRequests();
    const existing = requireStoreReplenishmentRequest(current, id);

    if (!canReviewStoreReplenishmentRequest(existing)) {
      throw new Error("Only under-review Store Replenishment Requests can be rejected");
    }

    const reviewed = stampReviewProgress(existing, input, actorUserId);
    const rejected: StoreReplenishmentRequest = {
      ...reviewed,
      status: "rejected",
      approved_by_user_id: null,
      approved_at: null,
      updated_at: new Date().toISOString(),
    };

    writeStoreReplenishmentRequests(current.map((item) => (item.id === id ? rejected : item)));
    return rejected;
  }

  async cancel(id: string, actorUserId: string) {
    const current = readStoreReplenishmentRequests();
    const existing = requireStoreReplenishmentRequest(current, id);

    if (!canCancelStoreReplenishmentRequest(existing)) {
      throw new Error("Only submitted or under-review Store Replenishment Requests can be cancelled");
    }

    const timestamp = new Date().toISOString();
    const cancelled: StoreReplenishmentRequest = {
      ...existing,
      status: "cancelled",
      reviewed_by_user_id: existing.reviewed_by_user_id || actorUserId || null,
      reviewed_at: existing.reviewed_at || timestamp,
      updated_at: timestamp,
    };

    writeStoreReplenishmentRequests(current.map((item) => (item.id === id ? cancelled : item)));
    return cancelled;
  }

  async convertToInternalTransfer(id: string, actorUserId: string) {
    const current = readStoreReplenishmentRequests();
    const existing = requireStoreReplenishmentRequest(current, id);

    if (!canConvertStoreReplenishmentRequest(existing)) {
      throw new Error(
        "Only approved Store Replenishment Requests with approved quantities can be converted to Internal Transfer.",
      );
    }

    const transferInput = buildConversionTransferInput(existing);
    const createdTransfer = await internalTransferRepository.create(transferInput);
    const timestamp = new Date().toISOString();
    const transferLineMap = new Map(
      createdTransfer.line_items
        .filter((line) => line.source_store_replenishment_request_line_id)
        .map((line) => [line.source_store_replenishment_request_line_id as string, line]),
    );

    const converted: StoreReplenishmentRequest = {
      ...existing,
      conversion_status: "converted",
      linked_internal_transfer_id: createdTransfer.id,
      linked_internal_transfer_number: createdTransfer.transfer_order_number,
      converted_at: timestamp,
      converted_by_user_id: actorUserId || null,
      updated_at: timestamp,
      lines: existing.lines.map((line) => {
        const linkedTransferLine = transferLineMap.get(line.id);

        if (!linkedTransferLine) {
          return line;
        }

        return {
          ...line,
          linked_internal_transfer_line_id: linkedTransferLine.id,
          converted_quantity: linkedTransferLine.requested_quantity,
        };
      }),
    };

    writeStoreReplenishmentRequests(current.map((item) => (item.id === id ? converted : item)));
    return converted;
  }
}

export const storeParLevelRepository: StoreParLevelRepository = new LocalStoreParLevelRepository();
export const storeStockTakeRepository: StoreStockTakeRepository = new LocalStoreStockTakeRepository();
export const storeReplenishmentRequestRepository: StoreReplenishmentRequestRepository =
  new LocalStoreReplenishmentRequestRepository();
