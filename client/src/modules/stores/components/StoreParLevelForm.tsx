/**
 * File intent: provide the Stores / Branch Operations Phase 1 Store Par Level create/edit form.
 * Design reminder for this file: keep the form structural, unstyled, and limited to par-level maintenance without Logistics linkage.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import type { StoreParLevelFormValues } from "@/modules/stores/stores.types";
import { storeParLevelFormSchema } from "@/modules/stores/stores.validation";

type StoreParLevelFormProps = {
  defaultValues: StoreParLevelFormValues;
  submitLabel: string;
  onSubmit: (values: StoreParLevelFormValues) => Promise<void>;
};

export default function StoreParLevelForm({ defaultValues, submitLabel, onSubmit }: StoreParLevelFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreParLevelFormValues>({
    resolver: zodResolver(storeParLevelFormSchema) as Resolver<StoreParLevelFormValues>,
    defaultValues,
  });

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
          <span>Raw Ingredient Id</span>
          <input type="text" {...register("raw_ingredient_id")} />
        </label>
        {errors.raw_ingredient_id ? <span>{errors.raw_ingredient_id.message}</span> : null}
      </p>

      <p>
        <label>
          <span>Item Name</span>
          <input type="text" {...register("item_name")} />
        </label>
        {errors.item_name ? <span>{errors.item_name.message}</span> : null}
      </p>

      <p>
        <label>
          <span>Category</span>
          <input type="text" {...register("category")} />
        </label>
        {errors.category ? <span>{errors.category.message}</span> : null}
      </p>

      <p>
        <label>
          <span>Base Unit</span>
          <input type="text" {...register("base_unit")} />
        </label>
        {errors.base_unit ? <span>{errors.base_unit.message}</span> : null}
      </p>

      <p>
        <label>
          <span>Par Quantity</span>
          <input type="number" step="any" min="0" {...register("par_quantity")} />
        </label>
        {errors.par_quantity ? <span>{errors.par_quantity.message}</span> : null}
      </p>

      <p>
        <label>
          <span>Reorder Trigger Quantity</span>
          <input type="number" step="any" min="0" {...register("reorder_trigger_quantity")} />
        </label>
        {errors.reorder_trigger_quantity ? <span>{errors.reorder_trigger_quantity.message}</span> : null}
      </p>

      <p>
        <label>
          <input type="checkbox" {...register("is_active")} />
          <span>Active</span>
        </label>
      </p>

      <p>
        <label>
          <span>Notes</span>
          <textarea rows={4} {...register("notes")} />
        </label>
      </p>

      <p>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </p>
    </form>
  );
}
