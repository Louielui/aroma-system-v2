/**
 * File intent: provide the shared create/edit Person form for HR People / User Management.
 * Design reminder for this file: keep the form simple, structural, and validation-focused.
 */

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personFormSchema } from "@/modules/hr/people.validation";
import type { PersonFormValues } from "@/modules/hr/people.types";

type PersonFormProps = {
  defaultValues: PersonFormValues;
  submitLabel: string;
  onSubmit: (values: PersonFormValues) => Promise<void>;
};

const textFields: Array<{ name: keyof PersonFormValues; label: string; type?: string }> = [
  { name: "name", label: "Name" },
  { name: "email", label: "Email", type: "email" },
  { name: "hourly_rate", label: "Hourly Rate", type: "number" },
];

export default function PersonForm({ defaultValues, submitLabel, onSubmit }: PersonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema) as Resolver<PersonFormValues>,
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <fieldset disabled={isSubmitting}>
        <legend>Person form</legend>

        {textFields.map(({ name, label, type }) => (
          <div key={name}>
            <label>
              <span>{label}</span>
              <input type={type ?? "text"} step={type === "number" ? "any" : undefined} {...register(name)} />
            </label>
            {errors[name] ? <p>{errors[name]?.message as string}</p> : null}
          </div>
        ))}

        <div>
          <label>
            <span>Role</span>
            <select {...register("role")}>
              <option value="admin">admin</option>
              <option value="hr">hr</option>
              <option value="procurement_manager">procurement_manager</option>
              <option value="kitchen_manager">kitchen_manager</option>
              <option value="inventory_staff">inventory_staff</option>
              <option value="prep_staff">prep_staff</option>
            </select>
          </label>
          {errors.role ? <p>{errors.role.message}</p> : null}
        </div>

        <div>
          <label>
            <span>Allowed Locations</span>
            <textarea {...register("allowed_locations")} />
          </label>
          <p>Enter a comma-separated list such as Central Kitchen, St Mary, Forks.</p>
          {errors.allowed_locations ? <p>{errors.allowed_locations.message}</p> : null}
        </div>

        <div>
          <label>
            <span>Active Status</span>
            <select {...register("active_status")}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          {errors.active_status ? <p>{errors.active_status.message}</p> : null}
        </div>

        <div>
          <label>
            <span>Pay Type</span>
            <select {...register("pay_type")}>
              <option value="hourly">hourly</option>
              <option value="salary">salary</option>
            </select>
          </label>
          {errors.pay_type ? <p>{errors.pay_type.message}</p> : null}
        </div>

        <button type="submit">{isSubmitting ? "Saving..." : submitLabel}</button>
      </fieldset>
    </form>
  );
}
