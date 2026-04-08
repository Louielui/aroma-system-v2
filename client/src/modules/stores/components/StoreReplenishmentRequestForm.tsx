/*
 * File intent: provide the Stores / Branch Operations Phase 2A replenishment request create form.
 * Design reminder for this file: keep the form structural, unstyled, and limited to Stores-side request capture without approval, conversion, or Logistics linkage.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import type { StoreReplenishmentRequestFormValues } from "@/modules/stores/stores.types";
import { storeReplenishmentRequestFormSchema } from "@/modules/stores/stores.validation";

type StoreReplenishmentRequestFormProps = {
  defaultValues: StoreReplenishmentRequestFormValues;
  submitLabel: string;
  onSubmit: (values: StoreReplenishmentRequestFormValues) => Promise<void>;
};

export default function StoreReplenishmentRequestForm({
  defaultValues,
  submitLabel,
  onSubmit,
}: StoreReplenishmentRequestFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StoreReplenishmentRequestFormValues>({
    resolver: zodResolver(storeReplenishmentRequestFormSchema) as Resolver<StoreReplenishmentRequestFormValues>,
    defaultValues,
  });

  const lines = watch("lines");

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p>
        <label>
          <span>Store Location</span>
          <input type="text" {...register("store_location_id")} />
        </label>
        {errors.store_location_id ? <span>{errors.store_location_id.message}</span> : null}
      </p>

      <p>
        <label>
          <span>Request Date</span>
          <input type="date" {...register("request_date")} />
        </label>
        {errors.request_date ? <span>{errors.request_date.message}</span> : null}
      </p>

      <p>
        <label>
          <span>Requested By User Id</span>
          <input type="text" {...register("requested_by_user_id")} />
        </label>
      </p>

      <p>
        <label>
          <span>Source Store Stock Take Id</span>
          <input type="text" {...register("source_store_stock_take_id")} readOnly />
        </label>
      </p>

      <p>
        <label>
          <span>Status</span>
          <input type="text" {...register("status")} readOnly />
        </label>
      </p>

      <p>
        <label>
          <span>Notes</span>
          <textarea rows={4} {...register("notes")} />
        </label>
      </p>

      {lines.length === 0 ? (
        <p>No shortage lines are available for replenishment request creation.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Base Unit</th>
              <th>Par Quantity</th>
              <th>Counted Quantity</th>
              <th>Shortage Quantity</th>
              <th>Requested Quantity</th>
              <th>Line Notes</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.source_store_stock_take_line_id || line.raw_ingredient_id}-${index}`}>
                <td>
                  {line.item_name}
                  <input type="hidden" {...register(`lines.${index}.source_store_stock_take_line_id`)} />
                  <input type="hidden" {...register(`lines.${index}.source_store_par_level_id`)} />
                  <input type="hidden" {...register(`lines.${index}.raw_ingredient_id`)} />
                  <input type="hidden" {...register(`lines.${index}.item_name`)} />
                  <input type="hidden" {...register(`lines.${index}.category`)} />
                  <input type="hidden" {...register(`lines.${index}.base_unit`)} />
                  <input
                    type="hidden"
                    value={line.par_quantity_snapshot ?? ""}
                    {...register(`lines.${index}.par_quantity_snapshot`, {
                      setValueAs: (value) => (value === "" ? null : Number(value)),
                    })}
                  />
                  <input
                    type="hidden"
                    value={line.counted_quantity_snapshot ?? ""}
                    {...register(`lines.${index}.counted_quantity_snapshot`, {
                      setValueAs: (value) => (value === "" ? null : Number(value)),
                    })}
                  />
                  <input
                    type="hidden"
                    value={line.shortage_quantity_snapshot}
                    {...register(`lines.${index}.shortage_quantity_snapshot`, {
                      setValueAs: (value) => Number(value),
                    })}
                  />
                </td>
                <td>{line.category}</td>
                <td>{line.base_unit}</td>
                <td>{line.par_quantity_snapshot ?? "-"}</td>
                <td>{line.counted_quantity_snapshot ?? "-"}</td>
                <td>{line.shortage_quantity_snapshot}</td>
                <td>
                  <label>
                    <span className="sr-only">Requested quantity for {line.item_name}</span>
                    <input type="number" step="any" min="0" {...register(`lines.${index}.requested_quantity`)} />
                  </label>
                  {errors.lines?.[index]?.requested_quantity ? <p>{errors.lines[index]?.requested_quantity?.message}</p> : null}
                </td>
                <td>
                  <label>
                    <span className="sr-only">Line notes for {line.item_name}</span>
                    <input type="text" {...register(`lines.${index}.line_notes`)} />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {errors.lines?.root?.message ? <p>{errors.lines.root.message}</p> : null}

      <p>
        <button type="submit" disabled={isSubmitting || lines.length === 0}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </p>
    </form>
  );
}
