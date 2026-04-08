/**
 * File intent: Central Kitchen > Raw Ingredient create/edit form page for the MVP Raw Ingredients feature.
 * Design reminder for this file: keep behavior explicit, validation basic, and repository-driven.
 */

import RawIngredientForm from "@/modules/central-kitchen/components/RawIngredientForm";
import { rawIngredientRepository } from "@/modules/central-kitchen/raw-ingredients.repository";
import {
  createDefaultRawIngredientFormValues,
  parseRawIngredientFormValues,
  rawIngredientToFormValues,
} from "@/modules/central-kitchen/raw-ingredients.validation";
import type { RawIngredientFormValues } from "@/modules/central-kitchen/raw-ingredients.types";
import { supplierRepository } from "@/modules/procurement/suppliers.repository";
import type { Supplier } from "@/modules/procurement/suppliers.types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

type RawIngredientFormPageProps = {
  mode: "create" | "edit";
};

export default function RawIngredientFormPage({ mode }: RawIngredientFormPageProps) {
  const [, navigate] = useLocation();
  const [matches, params] = useRoute<{ rawIngredientId: string }>("/central-kitchen/raw-ingredients/:rawIngredientId/edit");
  const [defaultValues, setDefaultValues] = useState<RawIngredientFormValues>(createDefaultRawIngredientFormValues());
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      const nextSuppliers = await supplierRepository.list();

      if (!isMounted) {
        return;
      }

      setSuppliers(nextSuppliers);

      if (mode !== "edit") {
        setIsLoading(false);
        return;
      }

      if (!matches || !params?.rawIngredientId) {
        setIsLoading(false);
        return;
      }

      const rawIngredient = await rawIngredientRepository.getById(params.rawIngredientId);

      if (!isMounted) {
        return;
      }

      if (!rawIngredient) {
        toast.error("Raw ingredient not found");
        navigate("/central-kitchen/raw-ingredients");
        return;
      }

      setDefaultValues(rawIngredientToFormValues(rawIngredient));
      setIsLoading(false);
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [matches, mode, navigate, params?.rawIngredientId]);

  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name })),
    [suppliers],
  );

  async function handleSubmit(values: RawIngredientFormValues) {
    const payload = parseRawIngredientFormValues(values);

    if (mode === "create") {
      const createdRawIngredient = await rawIngredientRepository.create(payload);
      toast.success("Raw ingredient created");
      navigate(`/central-kitchen/raw-ingredients/${createdRawIngredient.id}`);
      return;
    }

    if (!params?.rawIngredientId) {
      toast.error("Missing raw ingredient id");
      return;
    }

    const updatedRawIngredient = await rawIngredientRepository.update(params.rawIngredientId, payload);
    toast.success("Raw ingredient updated");
    navigate(`/central-kitchen/raw-ingredients/${updatedRawIngredient.id}`);
  }

  if (isLoading) {
    return <p>Loading form...</p>;
  }

  return (
    <section>
      <header>
        <p>Central Kitchen</p>
        <h1>{mode === "create" ? "Create Raw Ingredient" : "Edit Raw Ingredient"}</h1>
        <p>This form preserves the approved single-table Raw Ingredients model and keeps all stock fields in the base unit.</p>
      </header>

      <p>
        <Link href="/central-kitchen/raw-ingredients">Back to Raw Ingredients</Link>
      </p>

      <RawIngredientForm
        defaultValues={defaultValues}
        submitLabel={mode === "create" ? "Create Raw Ingredient" : "Save Raw Ingredient"}
        supplierOptions={supplierOptions}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
