/**
 * File intent: implement Central Kitchen > Prep Stock Take for updating Raw Ingredients current_stock.
 * Design reminder for this file: keep the workflow structural, schema-preserving, and unstyled.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { centralKitchenItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import {
  createPrepStockTakeFormValues,
  parsePrepStockTakeFormValues,
  prepStockTakeFormSchema,
} from "@/modules/central-kitchen/prep-stock-take.validation";
import type { PrepStockTakeFormValues } from "@/modules/central-kitchen/prep-stock-take.types";
import { rawIngredientRepository } from "@/modules/central-kitchen/raw-ingredients.repository";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Link } from "wouter";

export default function PrepStockTakePage() {
  const { filterByAllowedLocations } = useAccessControl();
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PrepStockTakeFormValues>({
    resolver: zodResolver(prepStockTakeFormSchema) as Resolver<PrepStockTakeFormValues>,
    defaultValues: { lines: [] },
  });

  const lines = watch("lines");

  useEffect(() => {
    let isMounted = true;

    async function loadRawIngredients() {
      const rawIngredients = await rawIngredientRepository.list();
      const scopedRawIngredients = filterByAllowedLocations(rawIngredients, (rawIngredient) => rawIngredient.location_id);

      if (!isMounted) {
        return;
      }

      reset(createPrepStockTakeFormValues(scopedRawIngredients));
      setIsLoading(false);
    }

    loadRawIngredients();

    return () => {
      isMounted = false;
    };
  }, [filterByAllowedLocations, reset]);

  async function onSubmit(values: PrepStockTakeFormValues) {
    const entries = parsePrepStockTakeFormValues(values);
    const updatedRawIngredients = await rawIngredientRepository.applyStockTake(entries);
    const scopedUpdatedRawIngredients = filterByAllowedLocations(updatedRawIngredients, (rawIngredient) => rawIngredient.location_id);
    reset(createPrepStockTakeFormValues(scopedUpdatedRawIngredients));
    toast.success("Prep stock take saved");
  }

  if (isLoading) {
    return <p>Loading Prep Stock Take...</p>;
  }

  return (
    <section>
      <header>
        <p>Central Kitchen</p>
        <h1>Prep Stock Take</h1>
        <p>Enter actual counted quantities for Raw Ingredients. All quantities are handled in each item&apos;s base_unit.</p>
      </header>

      <nav aria-label="Central Kitchen module links">
        <p>Module routes</p>
        <ul>
          {centralKitchenItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>{item.title}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {lines.length === 0 ? (
        <p>No Raw Ingredients found for your allowed locations.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Base Unit</th>
                <th>Current Stock</th>
                <th>Actual Counted Quantity</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id}>
                  <td>
                    {line.name}
                    <input type="hidden" {...register(`lines.${index}.id`)} />
                    <input type="hidden" {...register(`lines.${index}.name`)} />
                    <input type="hidden" {...register(`lines.${index}.category`)} />
                    <input type="hidden" {...register(`lines.${index}.base_unit`)} />
                    <input
                      type="hidden"
                      value={line.current_stock ?? ""}
                      {...register(`lines.${index}.current_stock`, {
                        setValueAs: (value) => (value === "" ? null : Number(value)),
                      })}
                    />
                  </td>
                  <td>{line.category}</td>
                  <td>{line.base_unit}</td>
                  <td>{line.current_stock ?? "-"}</td>
                  <td>
                    <label>
                      <span className="sr-only">Actual counted quantity for {line.name}</span>
                      <input type="number" step="any" min="0" {...register(`lines.${index}.counted_quantity`)} />
                    </label>
                    {errors.lines?.[index]?.counted_quantity ? (
                      <p>{errors.lines[index]?.counted_quantity?.message}</p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Stock Take"}
            </button>
          </p>
        </form>
      )}
    </section>
  );
}
