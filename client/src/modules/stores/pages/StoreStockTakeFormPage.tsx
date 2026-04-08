/**
 * File intent: implement Stores / Branch Operations Phase 1 Store Stock Take create page.
 * Design reminder for this file: keep the workflow structural, preserve Stores ownership of demand intent, and limit the result to shortage calculation only.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { storeParLevelRepository, storeStockTakeRepository } from "@/modules/stores/stores.repository";
import { summarizeStoreStockTake } from "@/modules/stores/stores.types";
import {
  createStoreStockTakeFormValues,
  parseStoreStockTakeFormValues,
  storeStockTakeFormSchema,
} from "@/modules/stores/stores.validation";
import type { StoreStockTakeFormValues } from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function StoreStockTakeFormPage() {
  const [, navigate] = useLocation();
  const { filterByAllowedLocations } = useAccessControl();
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StoreStockTakeFormValues>({
    resolver: zodResolver(storeStockTakeFormSchema) as Resolver<StoreStockTakeFormValues>,
    defaultValues: {
      store_location_id: "",
      stock_take_date: new Date().toISOString().slice(0, 10),
      counted_by_user_id: "",
      notes: "",
      status: "draft",
      lines: [],
    },
  });

  const lines = watch("lines");

  useEffect(() => {
    let isMounted = true;

    async function loadParLevels() {
      const parLevels = await storeParLevelRepository.list();
      const scopedParLevels = filterByAllowedLocations(parLevels, (item) => item.store_location_id);

      if (!isMounted) {
        return;
      }

      reset(createStoreStockTakeFormValues(scopedParLevels));
      setIsLoading(false);
    }

    loadParLevels();

    return () => {
      isMounted = false;
    };
  }, [filterByAllowedLocations, reset]);

  async function onSubmit(values: StoreStockTakeFormValues) {
    const payload = parseStoreStockTakeFormValues(values);
    const created = await storeStockTakeRepository.create(payload);
    const summary = summarizeStoreStockTake(created.lines);
    toast.success(`Store stock take saved with ${summary.shortage_line_count} shortage lines`);
    navigate(`/stores/stock-takes/${created.id}`);
  }

  if (isLoading) {
    return <p>Loading Store Stock Take...</p>;
  }

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>Create Store Stock Take</h1>
        <p>Enter counted quantities for each branch par-level item. Shortage is calculated only against par level and does not create any Logistics or Internal Transfer record in Phase 1.</p>
      </header>

      <nav aria-label="Stores module links">
        <p>Module routes</p>
        <ul>
          {storesItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>{item.title}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <p>
        <Link href="/stores/stock-takes">Back to Store Stock Takes</Link>
      </p>

      {lines.length === 0 ? (
        <p>No Store Par Levels found for your allowed locations. Create Store Par Levels first.</p>
      ) : (
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
              <span>Stock Take Date</span>
              <input type="date" {...register("stock_take_date")} />
            </label>
            {errors.stock_take_date ? <span>{errors.stock_take_date.message}</span> : null}
          </p>

          <p>
            <label>
              <span>Counted By User Id</span>
              <input type="text" {...register("counted_by_user_id")} />
            </label>
          </p>

          <p>
            <label>
              <span>Status</span>
              <select {...register("status")}>
                <option value="draft">draft</option>
                <option value="submitted">submitted</option>
                <option value="finalized">finalized</option>
              </select>
            </label>
          </p>

          <p>
            <label>
              <span>Notes</span>
              <textarea rows={3} {...register("notes")} />
            </label>
          </p>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Base Unit</th>
                <th>Par Quantity</th>
                <th>Counted Quantity</th>
                <th>Line Notes</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`${line.store_par_level_id}-${line.raw_ingredient_id}`}>
                  <td>
                    {line.item_name}
                    <input type="hidden" {...register(`lines.${index}.store_par_level_id`)} />
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
                  </td>
                  <td>{line.category}</td>
                  <td>{line.base_unit}</td>
                  <td>{line.par_quantity_snapshot ?? "-"}</td>
                  <td>
                    <label>
                      <span className="sr-only">Counted quantity for {line.item_name}</span>
                      <input type="number" step="any" min="0" {...register(`lines.${index}.counted_quantity`)} />
                    </label>
                    {errors.lines?.[index]?.counted_quantity ? <p>{errors.lines[index]?.counted_quantity?.message}</p> : null}
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

          <p>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Store Stock Take"}
            </button>
          </p>
        </form>
      )}
    </section>
  );
}
