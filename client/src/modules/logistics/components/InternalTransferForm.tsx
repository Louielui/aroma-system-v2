/**
 * File intent: render the reusable Internal Transfer create/edit form for Logistics Phase 2B.
 * Design reminder for this file: keep the form structural, explicit, and separate from repository and status logic.
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  InternalTransferFormLineValues,
  InternalTransferFormValues,
} from "@/modules/logistics/internal-transfers.types";

type RawIngredientOption = {
  id: string;
  name: string;
  base_unit: string;
};

type InternalTransferFormProps = {
  defaultValues: InternalTransferFormValues;
  rawIngredientOptions: RawIngredientOption[];
  submitLabel: string;
  onSubmit: (values: InternalTransferFormValues) => Promise<void>;
};

const LOCATION_OPTIONS = ["Central Kitchen", "St Mary", "Forks"];

function createEmptyLine(): InternalTransferFormLineValues {
  return {
    raw_ingredient_id: "",
    requested_quantity: "",
    picked_quantity: "0",
    received_quantity: "0",
    shortage_notes: "",
    discrepancy_notes: "",
    line_notes: "",
  };
}

export default function InternalTransferForm({
  defaultValues,
  rawIngredientOptions,
  submitLabel,
  onSubmit,
}: InternalTransferFormProps) {
  const [values, setValues] = useState<InternalTransferFormValues>(defaultValues);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(defaultValues);
  }, [defaultValues]);

  const rawIngredientMap = useMemo(
    () => new Map(rawIngredientOptions.map((option) => [option.id, option])),
    [rawIngredientOptions],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save internal transfer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<Key extends keyof InternalTransferFormValues>(field: Key, nextValue: InternalTransferFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [field]: nextValue,
    }));
  }

  function updateLineItem(index: number, field: keyof InternalTransferFormLineValues, nextValue: string) {
    setValues((current) => ({
      ...current,
      line_items: current.line_items.map((lineItem, lineIndex) =>
        lineIndex === index
          ? {
              ...lineItem,
              [field]: nextValue,
            }
          : lineItem,
      ),
    }));
  }

  function addLineItem() {
    setValues((current) => ({
      ...current,
      line_items: [...current.line_items, createEmptyLine()],
    }));
  }

  function removeLineItem(index: number) {
    setValues((current) => ({
      ...current,
      line_items: current.line_items.filter((_, lineIndex) => lineIndex !== index),
    }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <label>
          Request date
          <br />
          <input
            type="date"
            value={values.request_date}
            onChange={(event) => updateField("request_date", event.target.value)}
          />
        </label>
      </p>

      <p>
        <label>
          Source location
          <br />
          <select
            value={values.source_location_id}
            onChange={(event) => updateField("source_location_id", event.target.value)}
          >
            {LOCATION_OPTIONS.map((locationOption) => (
              <option key={locationOption} value={locationOption}>
                {locationOption}
              </option>
            ))}
          </select>
        </label>
      </p>

      <p>
        <label>
          Destination location
          <br />
          <select
            value={values.destination_location_id}
            onChange={(event) => updateField("destination_location_id", event.target.value)}
          >
            <option value="">Select destination</option>
            {LOCATION_OPTIONS.filter((locationOption) => locationOption !== values.source_location_id).map((locationOption) => (
              <option key={locationOption} value={locationOption}>
                {locationOption}
              </option>
            ))}
          </select>
        </label>
      </p>

      <p>
        <label>
          Requested by user ID
          <br />
          <input
            type="text"
            value={values.requested_by_user_id}
            onChange={(event) => updateField("requested_by_user_id", event.target.value)}
          />
        </label>
      </p>

      <p>
        <label>
          Scheduled dispatch date
          <br />
          <input
            type="date"
            value={values.scheduled_dispatch_date}
            onChange={(event) => updateField("scheduled_dispatch_date", event.target.value)}
          />
        </label>
      </p>

      <p>
        <label>
          Priority
          <br />
          <select
            value={values.priority}
            onChange={(event) => updateField("priority", event.target.value as InternalTransferFormValues["priority"])}
          >
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </label>
      </p>

      <p>
        <label>
          Assigned to user ID
          <br />
          <input
            type="text"
            value={values.assigned_to_user_id}
            onChange={(event) => updateField("assigned_to_user_id", event.target.value)}
          />
        </label>
      </p>

      <p>
        <label>
          Notes
          <br />
          <textarea value={values.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} />
        </label>
      </p>

      <section>
        <h2>Line Items</h2>
        {values.line_items.map((lineItem, index) => {
          const selectedIngredient = rawIngredientMap.get(lineItem.raw_ingredient_id);

          return (
            <fieldset key={`${lineItem.raw_ingredient_id}-${index}`}>
              <legend>Line {index + 1}</legend>

              <p>
                <label>
                  Raw ingredient
                  <br />
                  <select
                    value={lineItem.raw_ingredient_id}
                    onChange={(event) => updateLineItem(index, "raw_ingredient_id", event.target.value)}
                  >
                    <option value="">Select raw ingredient</option>
                    {rawIngredientOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              </p>

              <p>Base unit: {selectedIngredient?.base_unit ?? "—"}</p>

              <p>
                <label>
                  Requested quantity
                  <br />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItem.requested_quantity}
                    onChange={(event) => updateLineItem(index, "requested_quantity", event.target.value)}
                  />
                </label>
              </p>

              <p>
                <label>
                  Picked quantity
                  <br />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItem.picked_quantity}
                    onChange={(event) => updateLineItem(index, "picked_quantity", event.target.value)}
                  />
                </label>
              </p>

              <p>
                <label>
                  Received quantity
                  <br />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItem.received_quantity}
                    onChange={(event) => updateLineItem(index, "received_quantity", event.target.value)}
                  />
                </label>
              </p>

              <p>
                <label>
                  Shortage notes
                  <br />
                  <input
                    type="text"
                    value={lineItem.shortage_notes}
                    onChange={(event) => updateLineItem(index, "shortage_notes", event.target.value)}
                  />
                </label>
              </p>

              <p>
                <label>
                  Discrepancy notes
                  <br />
                  <input
                    type="text"
                    value={lineItem.discrepancy_notes}
                    onChange={(event) => updateLineItem(index, "discrepancy_notes", event.target.value)}
                  />
                </label>
              </p>

              <p>
                <label>
                  Line notes
                  <br />
                  <input
                    type="text"
                    value={lineItem.line_notes}
                    onChange={(event) => updateLineItem(index, "line_notes", event.target.value)}
                  />
                </label>
              </p>

              <p>
                <button type="button" onClick={() => removeLineItem(index)} disabled={values.line_items.length === 1}>
                  Remove line
                </button>
              </p>
            </fieldset>
          );
        })}

        <p>
          <button type="button" onClick={addLineItem}>
            Add line item
          </button>
        </p>
      </section>

      {error ? <p>{error}</p> : null}

      <p>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </p>
    </form>
  );
}
