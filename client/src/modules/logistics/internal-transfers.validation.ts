/**
 * File intent: validate and convert Internal Transfer form values into the Phase 2B Internal Transfer model.
 * Design reminder for this file: keep validation explicit, simple, and aligned with the separate Internal Transfer flow.
 */

import { z } from "zod";
import type { RawIngredient } from "@/modules/central-kitchen/raw-ingredients.types";
import type {
  InternalTransfer,
  InternalTransferFormValues,
  InternalTransferLineItem,
  InternalTransferUpsert,
} from "@/modules/logistics/internal-transfers.types";

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const optionalLongText = z.string().trim().max(2000).optional().or(z.literal(""));

const positiveNumericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, `${label} must be greater than 0`);

const nonNegativeNumericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value !== "" && !Number.isNaN(Number(value)) && Number(value) >= 0, `${label} must be 0 or greater`);

const internalTransferLineItemFormSchema = z
  .object({
    raw_ingredient_id: z.string().trim().min(1, "Raw ingredient is required"),
    requested_quantity: positiveNumericString("Requested quantity"),
    picked_quantity: nonNegativeNumericString("Picked quantity"),
    received_quantity: nonNegativeNumericString("Received quantity"),
    shortage_notes: optionalText,
    discrepancy_notes: optionalText,
    line_notes: optionalText,
  })
  .superRefine((lineItem, context) => {
    const requestedQuantity = Number(lineItem.requested_quantity);
    const pickedQuantity = Number(lineItem.picked_quantity);
    const receivedQuantity = Number(lineItem.received_quantity);

    if (pickedQuantity > requestedQuantity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Picked quantity cannot exceed requested quantity",
        path: ["picked_quantity"],
      });
    }

    if (receivedQuantity > pickedQuantity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Received quantity cannot exceed picked quantity",
        path: ["received_quantity"],
      });
    }
  });

export const internalTransferFormSchema = z
  .object({
    request_date: z.string().trim().min(1, "Request date is required"),
    source_location_id: z.string().trim().min(1, "Source location is required").max(100),
    destination_location_id: z.string().trim().min(1, "Destination location is required").max(100),
    requested_by_user_id: z.string().trim().min(1, "Requested by user ID is required").max(100),
    scheduled_dispatch_date: z.string().trim().min(1, "Scheduled dispatch date is required"),
    priority: z.enum(["normal", "urgent", "scheduled"]),
    assigned_to_user_id: optionalText,
    notes: optionalLongText,
    line_items: z.array(internalTransferLineItemFormSchema).min(1, "At least one line item is required"),
  })
  .refine((values) => values.source_location_id !== values.destination_location_id, {
    message: "Destination location must be different from the source location",
    path: ["destination_location_id"],
  });

function buildLineId(rawIngredientId: string, index: number) {
  return `${rawIngredientId || "line"}-${index + 1}`;
}

export function createDefaultInternalTransferFormValues(requestedByUserId = ""): InternalTransferFormValues {
  const today = new Date().toISOString().slice(0, 10);

  return {
    request_date: today,
    source_location_id: "Central Kitchen",
    destination_location_id: "",
    requested_by_user_id: requestedByUserId,
    scheduled_dispatch_date: today,
    priority: "normal",
    assigned_to_user_id: "",
    notes: "",
    line_items: [
      {
        raw_ingredient_id: "",
        requested_quantity: "",
        picked_quantity: "0",
        received_quantity: "0",
        shortage_notes: "",
        discrepancy_notes: "",
        line_notes: "",
      },
    ],
  };
}

export function internalTransferToFormValues(transfer: InternalTransfer): InternalTransferFormValues {
  return {
    request_date: transfer.request_date,
    source_location_id: transfer.source_location_id,
    destination_location_id: transfer.destination_location_id,
    requested_by_user_id: transfer.requested_by_user_id,
    scheduled_dispatch_date: transfer.scheduled_dispatch_date,
    priority: transfer.priority,
    assigned_to_user_id: transfer.assigned_to_user_id,
    notes: transfer.notes,
    line_items: transfer.line_items.map((lineItem) => ({
      raw_ingredient_id: lineItem.raw_ingredient_id,
      requested_quantity: String(lineItem.requested_quantity),
      picked_quantity: String(lineItem.picked_quantity),
      received_quantity: String(lineItem.received_quantity),
      shortage_notes: lineItem.shortage_notes,
      discrepancy_notes: lineItem.discrepancy_notes,
      line_notes: lineItem.line_notes,
    })),
  };
}

export function parseInternalTransferFormValues(
  values: InternalTransferFormValues,
  rawIngredients: RawIngredient[],
  defaults?: Partial<Pick<InternalTransferUpsert, "logistics_status" | "approved_by_user_id" | "exception_code" | "exception_notes">>,
): InternalTransferUpsert {
  const validated = internalTransferFormSchema.parse(values);
  const rawIngredientMap = new Map(rawIngredients.map((rawIngredient) => [rawIngredient.id, rawIngredient]));

  const lineItems: InternalTransferLineItem[] = validated.line_items.map((lineItem, index) => {
    const rawIngredient = rawIngredientMap.get(lineItem.raw_ingredient_id);

    if (!rawIngredient) {
      throw new Error(`Raw ingredient not found for line ${index + 1}.`);
    }

    return {
      id: buildLineId(rawIngredient.id, index),
      raw_ingredient_id: rawIngredient.id,
      item_name: rawIngredient.name,
      base_unit: rawIngredient.base_unit,
      requested_quantity: Number(lineItem.requested_quantity),
      picked_quantity: Number(lineItem.picked_quantity),
      received_quantity: Number(lineItem.received_quantity),
      shortage_notes: lineItem.shortage_notes ?? "",
      discrepancy_notes: lineItem.discrepancy_notes ?? "",
      line_notes: lineItem.line_notes ?? "",
    };
  });

  return {
    request_date: validated.request_date,
    source_location_id: validated.source_location_id,
    destination_location_id: validated.destination_location_id,
    requested_by_user_id: validated.requested_by_user_id,
    approved_by_user_id: defaults?.approved_by_user_id ?? "",
    scheduled_dispatch_date: validated.scheduled_dispatch_date,
    logistics_status: defaults?.logistics_status ?? "draft",
    priority: validated.priority,
    notes: validated.notes ?? "",
    line_items: lineItems,
    assigned_to_user_id: validated.assigned_to_user_id ?? "",
    exception_code: defaults?.exception_code ?? "",
    exception_notes: defaults?.exception_notes ?? "",
  };
}
