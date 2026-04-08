/**
 * File intent: render the create/edit supplier flow for the Procurement module.
 * Design reminder for this file: keep the page simple while separating form, validation, and repository concerns.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import SupplierForm from "@/modules/procurement/components/SupplierForm";
import {
  createDefaultSupplierFormValues,
  parseSupplierFormValues,
  supplierToFormValues,
} from "@/modules/procurement/suppliers.validation";
import { supplierRepository } from "@/modules/procurement/suppliers.repository";
import type { SupplierFormValues } from "@/modules/procurement/suppliers.types";

export default function SupplierFormPage() {
  const [, navigate] = useLocation();
  const editMatch = useRoute("/procurement/suppliers/:supplierId/edit");
  const supplierId = editMatch?.[1]?.supplierId;
  const [isLoading, setIsLoading] = useState(Boolean(supplierId));
  const [error, setError] = useState("");
  const [initialValues, setInitialValues] = useState<SupplierFormValues>(createDefaultSupplierFormValues());

  const mode = useMemo(() => (supplierId ? "edit" : "create"), [supplierId]);

  useEffect(() => {
    let isMounted = true;

    async function loadSupplier() {
      if (!supplierId) {
        setInitialValues(createDefaultSupplierFormValues());
        setIsLoading(false);
        return;
      }

      try {
        const supplier = await supplierRepository.getById(supplierId);

        if (!supplier) {
          throw new Error("Supplier not found.");
        }

        if (isMounted) {
          setInitialValues(supplierToFormValues(supplier));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load supplier.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSupplier();

    return () => {
      isMounted = false;
    };
  }, [supplierId]);

  async function handleSubmit(values: SupplierFormValues) {
    const payload = parseSupplierFormValues(values);
    const saved = supplierId
      ? await supplierRepository.update(supplierId, payload)
      : await supplierRepository.create(payload);

    navigate(`/procurement/suppliers/${saved.id}`);
  }

  if (isLoading) {
    return <p>Loading supplier form...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section>
      <p>Procurement</p>
      <h1>{mode === "create" ? "Create Supplier" : "Edit Supplier"}</h1>
      <p>Supplier fields follow the approved MVP single-table model.</p>
      <SupplierForm
        defaultValues={initialValues}
        submitLabel={mode === "create" ? "Create supplier" : "Save supplier"}
        onSubmit={handleSubmit}
      />
      <p>
        <button type="button" onClick={() => navigate("/procurement/suppliers")}>
          Back to supplier list
        </button>
      </p>
    </section>
  );
}
