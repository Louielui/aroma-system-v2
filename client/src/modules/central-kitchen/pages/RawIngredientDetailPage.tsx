/**
 * File intent: Central Kitchen > Raw Ingredient detail page for the MVP Raw Ingredients feature.
 * Design reminder for this file: show all approved fields clearly without design embellishment.
 */

import { useAccessControl } from "@/contexts/AccessControlContext";
import { rawIngredientRepository } from "@/modules/central-kitchen/raw-ingredients.repository";
import type { RawIngredient } from "@/modules/central-kitchen/raw-ingredients.types";
import { supplierRepository } from "@/modules/procurement/suppliers.repository";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";

const rawIngredientDetailFields: Array<{ key: keyof RawIngredient; label: string }> = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "short_name", label: "Short Name" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "status", label: "Status" },
  { key: "location_id", label: "Location ID" },
  { key: "preferred_supplier_id", label: "Preferred Supplier ID" },
  { key: "supplier_item_name", label: "Supplier Item Name" },
  { key: "supplier_item_code", label: "Supplier Item Code" },
  { key: "base_unit", label: "Base Unit" },
  { key: "purchase_unit", label: "Purchase Unit" },
  { key: "purchase_pack_size", label: "Purchase Pack Size" },
  { key: "unit_conversion_ratio", label: "Unit Conversion Ratio" },
  { key: "current_stock", label: "Current Stock (base_unit)" },
  { key: "par_level", label: "Par Level (base_unit)" },
  { key: "reorder_point", label: "Reorder Point (base_unit)" },
  { key: "reorder_quantity", label: "Reorder Quantity (base_unit)" },
  { key: "minimum_order_quantity", label: "Minimum Order Quantity (base_unit)" },
  { key: "is_prep_input", label: "Is Prep Input" },
  { key: "is_active", label: "Is Active" },
  { key: "notes", label: "Notes" },
  { key: "created_at", label: "Created At" },
  { key: "updated_at", label: "Updated At" },
];

function formatValue(value: RawIngredient[keyof RawIngredient]) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value === null || value === "") {
    return "-";
  }

  return String(value);
}

export default function RawIngredientDetailPage() {
  const { isAllowedLocation } = useAccessControl();
  const [matches, params] = useRoute<{ rawIngredientId: string }>("/central-kitchen/raw-ingredients/:rawIngredientId");
  const [rawIngredient, setRawIngredient] = useState<RawIngredient | null>(null);
  const [preferredSupplierName, setPreferredSupplierName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRawIngredient() {
      if (!matches || !params?.rawIngredientId) {
        setIsLoading(false);
        return;
      }

      const nextRawIngredient = await rawIngredientRepository.getById(params.rawIngredientId);

      if (!isMounted) {
        return;
      }

      if (!nextRawIngredient || !isAllowedLocation(nextRawIngredient.location_id)) {
        setRawIngredient(null);
        setPreferredSupplierName("");
        setIsLoading(false);
        return;
      }

      setRawIngredient(nextRawIngredient);

      if (nextRawIngredient.preferred_supplier_id) {
        const supplier = await supplierRepository.getById(nextRawIngredient.preferred_supplier_id);

        if (isMounted) {
          setPreferredSupplierName(supplier?.name ?? "");
        }
      }

      setIsLoading(false);
    }

    loadRawIngredient();

    return () => {
      isMounted = false;
    };
  }, [isAllowedLocation, matches, params?.rawIngredientId]);

  if (isLoading) {
    return <p>Loading raw ingredient...</p>;
  }

  if (!rawIngredient) {
    return (
      <section>
        <h1>Raw ingredient not found</h1>
        <p>The requested raw ingredient could not be found for your allowed locations.</p>
        <p>
          <Link href="/central-kitchen/raw-ingredients">Back to Raw Ingredients</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <header>
        <p>Central Kitchen</p>
        <h1>{rawIngredient.name}</h1>
        <p>Raw ingredient detail page using the approved MVP pre-prep inventory model.</p>
      </header>

      <p>
        <Link href="/central-kitchen/raw-ingredients">Back to Raw Ingredients</Link>{" "}
        <Link href={`/central-kitchen/raw-ingredients/${rawIngredient.id}/edit`}>Edit Raw Ingredient</Link>
      </p>

      {preferredSupplierName ? <p>Linked preferred supplier: {preferredSupplierName}</p> : null}

      <table>
        <tbody>
          {rawIngredientDetailFields.map((field) => (
            <tr key={field.key}>
              <th>{field.label}</th>
              <td>{formatValue(rawIngredient[field.key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
