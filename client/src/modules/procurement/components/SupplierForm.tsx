/**
 * File intent: provide the shared create/edit Supplier form using the approved MVP Supplier model.
 * Design reminder for this file: keep the form simple, practical, and validation-focused.
 */

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierFormSchema } from "@/modules/procurement/suppliers.validation";
import type { SupplierFormValues } from "@/modules/procurement/suppliers.types";

type SupplierFormProps = {
  defaultValues: SupplierFormValues;
  submitLabel: string;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
};

const textFields: Array<{ name: keyof SupplierFormValues; label: string; type?: string }> = [
  { name: "name", label: "Name" },
  { name: "short_name", label: "Short Name" },
  { name: "legal_name", label: "Legal Name" },
  { name: "code", label: "Code" },
  { name: "contact_person", label: "Contact Person" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email", type: "email" },
  { name: "address_line_1", label: "Address Line 1" },
  { name: "address_line_2", label: "Address Line 2" },
  { name: "city", label: "City" },
  { name: "province", label: "Province" },
  { name: "postal_code", label: "Postal Code" },
  { name: "payment_terms", label: "Payment Terms" },
  { name: "minimum_order_amount", label: "Minimum Order Amount", type: "number" },
  { name: "lead_time_days", label: "Lead Time Days", type: "number" },
];

export default function SupplierForm({ defaultValues, submitLabel, onSubmit }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema) as Resolver<SupplierFormValues>,
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={isSubmitting}>
        <legend>Supplier form</legend>

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
            <span>Status</span>
            <select {...register("status")}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="pending">pending</option>
            </select>
          </label>
          {errors.status ? <p>{errors.status.message}</p> : null}
        </div>

        <div>
          <label>
            <span>Ordering Method</span>
            <select {...register("ordering_method")}>
              <option value="">Select ordering method</option>
              <option value="email">email</option>
              <option value="phone">phone</option>
              <option value="portal">portal</option>
              <option value="sales_rep">sales_rep</option>
              <option value="other">other</option>
            </select>
          </label>
          {errors.ordering_method ? <p>{errors.ordering_method.message}</p> : null}
        </div>

        <div>
          <label>
            <span>Delivery Days</span>
            <textarea {...register("delivery_days")} />
          </label>
          <p>Enter a comma-separated list such as Monday, Wednesday, Friday.</p>
          {errors.delivery_days ? <p>{errors.delivery_days.message}</p> : null}
        </div>

        <div>
          <label>
            <span>Aliases</span>
            <textarea {...register("aliases")} />
          </label>
          <p>Enter comma-separated alternate supplier names for future matching and invoice parsing.</p>
          {errors.aliases ? <p>{errors.aliases.message}</p> : null}
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
            <input type="checkbox" {...register("is_enabled_for_invoice_parsing")} />
            <span>Enabled for invoice parsing</span>
          </label>
        </div>

        <button type="submit">{isSubmitting ? "Saving..." : submitLabel}</button>
      </fieldset>
    </form>
  );
}
