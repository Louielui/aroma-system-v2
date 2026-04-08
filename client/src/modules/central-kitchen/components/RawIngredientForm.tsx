/**
 * File intent: provide the shared create/edit Raw Ingredient form using the approved MVP model.
 * Design reminder for this file: keep the form simple, structural, and validation-focused.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { rawIngredientFormSchema } from "@/modules/central-kitchen/raw-ingredients.validation";
import type { RawIngredientFormValues } from "@/modules/central-kitchen/raw-ingredients.types";
import { useForm, type Resolver } from "react-hook-form";

type SupplierOption = {
  id: string;
  name: string;
};

type RawIngredientFormProps = {
  defaultValues: RawIngredientFormValues;
  submitLabel: string;
  supplierOptions: SupplierOption[];
  onSubmit: (values: RawIngredientFormValues) => Promise<void>;
};

const textFields: Array<{ name: keyof RawIngredientFormValues; label: string; type?: string }> = [
  { name: "name", label: "Name" },
  { name: "short_name", label: "Short Name" },
  { name: "category", label: "Category" },
  { name: "status", label: "Status" },
  { name: "location_id", label: "Location ID" },
  { name: "supplier_item_name", label: "Supplier Item Name" },
  { name: "supplier_item_code", label: "Supplier Item Code" },
  { name: "base_unit", label: "Base Unit" },
  { name: "purchase_unit", label: "Purchase Unit" },
  { name: "purchase_pack_size", label: "Purchase Pack Size", type: "number" },
  { name: "unit_conversion_ratio", label: "Unit Conversion Ratio", type: "number" },
  { name: "current_stock", label: "Current Stock (base_unit)", type: "number" },
  { name: "par_level", label: "Par Level (base_unit)", type: "number" },
  { name: "reorder_point", label: "Reorder Point (base_unit)", type: "number" },
  { name: "reorder_quantity", label: "Reorder Quantity (base_unit)", type: "number" },
  { name: "minimum_order_quantity", label: "Minimum Order Quantity (base_unit)", type: "number" },
];

export default function RawIngredientForm({
  defaultValues,
  submitLabel,
  supplierOptions,
  onSubmit,
}: RawIngredientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RawIngredientFormValues>({
    resolver: zodResolver(rawIngredientFormSchema) as Resolver<RawIngredientFormValues>,
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={isSubmitting}>
        <legend>Raw ingredient form</legend>

        {textFields.map(({ name, label, type }) => (
          <div key={name}>
            <label>
              <span>{label}</span>
              <input type={type ?? "text"} {...register(name)} />
            </label>
            {errors[name] ? <p>{errors[name]?.message as string}</p> : null}
          </div>
        ))}

        <div>
          <label>
            <span>Preferred Supplier</span>
            <select {...register("preferred_supplier_id")}>
              <option value="">No preferred supplier</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          {errors.preferred_supplier_id ? <p>{errors.preferred_supplier_id.message}</p> : null}
        </div>

        <div>
          <label>
            <span>Description</span>
            <textarea {...register("description")} />
          </label>
          {errors.description ? <p>{errors.description.message}</p> : null}
        </div>

        <div>
          <label>
            <span>Notes</span>
            <textarea {...register("notes")} />
          </label>
          {errors.notes ? <p>{errors.notes.message}</p> : null}
        </div>

        <div>
          <label>
            <input type="checkbox" {...register("is_prep_input")} />
            <span>Is prep input</span>
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" {...register("is_active")} />
            <span>Is active</span>
          </label>
        </div>

        <p>All stock-related quantities on this form must use the same base unit.</p>

        <button type="submit">{isSubmitting ? "Saving..." : submitLabel}</button>
      </fieldset>
    </form>
  );
}
