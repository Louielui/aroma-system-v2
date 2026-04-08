/**
 * File intent: Central Kitchen > Raw Ingredients list page for the MVP Raw Ingredients feature.
 * Design reminder for this file: keep the page structural, explicit, and ready for future API replacement.
 */

import { centralKitchenItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { rawIngredientRepository } from "@/modules/central-kitchen/raw-ingredients.repository";
import type { RawIngredient } from "@/modules/central-kitchen/raw-ingredients.types";
import { supplierRepository } from "@/modules/procurement/suppliers.repository";
import type { Supplier } from "@/modules/procurement/suppliers.types";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

function getReorderStatus(rawIngredient: RawIngredient) {
  if (rawIngredient.current_stock === null || rawIngredient.reorder_point === null) {
    return "OK";
  }

  return rawIngredient.current_stock < rawIngredient.reorder_point ? "Needs Reorder" : "OK";
}

export default function RawIngredientsPage() {
  const { filterByAllowedLocations } = useAccessControl();
  const [rawIngredients, setRawIngredients] = useState<RawIngredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [nextRawIngredients, nextSuppliers] = await Promise.all([
        rawIngredientRepository.list(),
        supplierRepository.list(),
      ]);

      if (isMounted) {
        setRawIngredients(filterByAllowedLocations(nextRawIngredients, (rawIngredient) => rawIngredient.location_id));
        setSuppliers(nextSuppliers);
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filterByAllowedLocations]);

  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])), [suppliers]);

  return (
    <section>
      <header>
        <p>Central Kitchen</p>
        <h1>Raw Ingredients</h1>
        <p>This page uses the approved MVP Raw Ingredients single-table model for pre-prep inventory.</p>
        <p>Reorder visibility is based on base-unit comparison only: current_stock &lt; reorder_point means Needs Reorder.</p>
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

      <p>
        <Link href="/central-kitchen/raw-ingredients/new">Create Raw Ingredient</Link>
      </p>

      {isLoading ? (
        <p>Loading raw ingredients...</p>
      ) : rawIngredients.length === 0 ? (
        <p>No raw ingredients found for your allowed locations.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Preferred Supplier</th>
              <th>Base Unit</th>
              <th>Current Stock</th>
              <th>Par Level</th>
              <th>Reorder Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rawIngredients.map((rawIngredient) => {
              const reorderStatus = getReorderStatus(rawIngredient);
              const preferredSupplierName = rawIngredient.preferred_supplier_id
                ? (supplierMap.get(rawIngredient.preferred_supplier_id) ?? rawIngredient.preferred_supplier_id)
                : "-";

              return (
                <tr key={rawIngredient.id}>
                  <td>{rawIngredient.name}</td>
                  <td>{rawIngredient.category}</td>
                  <td>{rawIngredient.location_id}</td>
                  <td>{preferredSupplierName}</td>
                  <td>{rawIngredient.base_unit}</td>
                  <td>{rawIngredient.current_stock ?? "-"}</td>
                  <td>{rawIngredient.par_level ?? "-"}</td>
                  <td>{rawIngredient.reorder_quantity ?? "-"}</td>
                  <td>{reorderStatus}</td>
                  <td>
                    <Link href={`/central-kitchen/raw-ingredients/${rawIngredient.id}`}>View</Link>{" "}
                    <Link href={`/central-kitchen/raw-ingredients/${rawIngredient.id}/edit`}>Edit</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
