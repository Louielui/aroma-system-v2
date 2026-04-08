/**
 * File intent: implement Stores / Branch Operations Phase 1 Store Par Level create/edit form page.
 * Design reminder for this file: keep Stores as a separate top-level module and limit this page to branch demand configuration only.
 */

import StoreParLevelForm from "@/modules/stores/components/StoreParLevelForm";
import { storeParLevelRepository } from "@/modules/stores/stores.repository";
import {
  createDefaultStoreParLevelFormValues,
  parseStoreParLevelFormValues,
  storeParLevelToFormValues,
} from "@/modules/stores/stores.validation";
import type { StoreParLevelFormValues } from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

type StoreParLevelFormPageProps = {
  mode: "create" | "edit";
};

export default function StoreParLevelFormPage({ mode }: StoreParLevelFormPageProps) {
  const [, navigate] = useLocation();
  const [matches, params] = useRoute<{ storeParLevelId: string }>("/stores/par-levels/:storeParLevelId/edit");
  const [defaultValues, setDefaultValues] = useState<StoreParLevelFormValues>(createDefaultStoreParLevelFormValues());
  const [isLoading, setIsLoading] = useState(mode === "edit");

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      if (mode !== "edit") {
        setIsLoading(false);
        return;
      }

      if (!matches || !params?.storeParLevelId) {
        setIsLoading(false);
        return;
      }

      const existing = await storeParLevelRepository.getById(params.storeParLevelId);

      if (!isMounted) {
        return;
      }

      if (!existing) {
        toast.error("Store Par Level not found");
        navigate("/stores/par-levels");
        return;
      }

      setDefaultValues(storeParLevelToFormValues(existing));
      setIsLoading(false);
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, [matches, mode, navigate, params?.storeParLevelId]);

  async function handleSubmit(values: StoreParLevelFormValues) {
    const payload = parseStoreParLevelFormValues(values);

    if (mode === "create") {
      const created = await storeParLevelRepository.create(payload);
      toast.success("Store Par Level created");
      navigate(`/stores/par-levels/${created.id}`);
      return;
    }

    if (!params?.storeParLevelId) {
      toast.error("Missing Store Par Level id");
      return;
    }

    const updated = await storeParLevelRepository.update(params.storeParLevelId, payload);
    toast.success("Store Par Level updated");
    navigate(`/stores/par-levels/${updated.id}`);
  }

  if (isLoading) {
    return <p>Loading form...</p>;
  }

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>{mode === "create" ? "Create Store Par Level" : "Edit Store Par Level"}</h1>
        <p>This form configures branch-side par targets used later by Store Stock Take shortage calculation. It does not create Logistics work or Internal Transfer records.</p>
      </header>

      <p>
        <Link href="/stores/par-levels">Back to Store Par Levels</Link>
      </p>

      <StoreParLevelForm
        defaultValues={defaultValues}
        submitLabel={mode === "create" ? "Create Store Par Level" : "Save Store Par Level"}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
