/**
 * File intent: render the Logistics Internal Transfer create/edit form page for Phase 2A.
 * Design reminder for this file: keep Internal Transfer implementation explicit and repository-driven without introducing other logistics flows.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import InternalTransferForm from "@/modules/logistics/components/InternalTransferForm";
import { rawIngredientRepository } from "@/modules/central-kitchen/raw-ingredients.repository";
import type { RawIngredient } from "@/modules/central-kitchen/raw-ingredients.types";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { internalTransferRepository } from "@/modules/logistics/internal-transfers.repository";
import {
  createDefaultInternalTransferFormValues,
  internalTransferToFormValues,
  parseInternalTransferFormValues,
} from "@/modules/logistics/internal-transfers.validation";
import type {
  InternalTransfer,
  InternalTransferFormValues,
} from "@/modules/logistics/internal-transfers.types";

type InternalTransferFormPageProps = {
  mode: "create" | "edit";
};

export default function InternalTransferFormPage({ mode }: InternalTransferFormPageProps) {
  const [, navigate] = useLocation();
  const [matches, params] = useRoute<{ transferOrderId: string }>("/logistics/transfer-orders/:transferOrderId/edit");
  const { currentUser, isAllowedLocation } = useAccessControl();
  const [defaultValues, setDefaultValues] = useState<InternalTransferFormValues>(
    createDefaultInternalTransferFormValues(currentUser?.id ?? ""),
  );
  const [rawIngredients, setRawIngredients] = useState<RawIngredient[]>([]);
  const [existingTransfer, setExistingTransfer] = useState<InternalTransfer | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      const nextRawIngredients = await rawIngredientRepository.list();

      if (!isMounted) {
        return;
      }

      setRawIngredients(nextRawIngredients);

      if (mode !== "edit") {
        setDefaultValues(createDefaultInternalTransferFormValues(currentUser?.id ?? ""));
        setIsLoading(false);
        return;
      }

      if (!matches || !params?.transferOrderId) {
        setError("Transfer order not found.");
        setIsLoading(false);
        return;
      }

      const record = await internalTransferRepository.getById(params.transferOrderId);

      if (!isMounted) {
        return;
      }

      if (!record) {
        setError("Transfer order not found.");
        setIsLoading(false);
        return;
      }

      if (!(isAllowedLocation(record.source_location_id) || isAllowedLocation(record.destination_location_id))) {
        setError("You do not have access to edit this transfer order.");
        setIsLoading(false);
        return;
      }

      setExistingTransfer(record);
      setDefaultValues(internalTransferToFormValues(record));
      setIsLoading(false);
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, isAllowedLocation, matches, mode, params?.transferOrderId]);

  const rawIngredientOptions = useMemo(
    () =>
      rawIngredients.map((rawIngredient) => ({
        id: rawIngredient.id,
        name: rawIngredient.name,
        base_unit: rawIngredient.base_unit,
      })),
    [rawIngredients],
  );

  async function handleSubmit(values: InternalTransferFormValues) {
    const payload = parseInternalTransferFormValues(values, rawIngredients, {
      logistics_status: existingTransfer?.logistics_status ?? "draft",
      approved_by_user_id: existingTransfer?.approved_by_user_id ?? "",
      exception_code: existingTransfer?.exception_code ?? "",
      exception_notes: existingTransfer?.exception_notes ?? "",
    });

    if (mode === "create") {
      const created = await internalTransferRepository.create(payload);
      navigate(`/logistics/transfer-orders/${created.id}`);
      return;
    }

    if (!params?.transferOrderId) {
      throw new Error("Missing transfer order id.");
    }

    const updated = await internalTransferRepository.update(params.transferOrderId, payload);
    navigate(`/logistics/transfer-orders/${updated.id}`);
  }

  if (isLoading) {
    return <p>Loading transfer order form...</p>;
  }

  if (error) {
    return (
      <section>
        <p>{error}</p>
        <p>
          <Link href="/logistics/transfer-orders">Back to Transfer Orders</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <header>
        <p>Logistics</p>
        <h1>{mode === "create" ? "Create Transfer Order" : "Edit Transfer Order"}</h1>
        <p>Phase 2B refines Internal Transfer with realistic picking, receiving, and partial-fulfillment handling.</p>
      </header>

      <p>
        <Link href="/logistics/transfer-orders">Back to Transfer Orders</Link>
      </p>

      <InternalTransferForm
        defaultValues={defaultValues}
        rawIngredientOptions={rawIngredientOptions}
        submitLabel={mode === "create" ? "Create Transfer Order" : "Save Transfer Order"}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
