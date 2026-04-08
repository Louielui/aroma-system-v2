/*
 * File intent: implement Stores / Branch Operations replenishment request create and edit form page.
 * Design reminder for this file: keep replenishment request management inside Stores demand capture only, without approval, conversion, or Logistics linkage.
 */

import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import StoreReplenishmentRequestForm from "@/modules/stores/components/StoreReplenishmentRequestForm";
import {
  storeReplenishmentRequestRepository,
  storeStockTakeRepository,
} from "@/modules/stores/stores.repository";
import {
  createStoreReplenishmentRequestFormValues,
  parseStoreReplenishmentRequestCreateFormValues,
  parseStoreReplenishmentRequestUpdateFormValues,
  storeReplenishmentRequestToFormValues,
} from "@/modules/stores/stores.validation";
import {
  isStoreReplenishmentRequestEditable,
  type StoreReplenishmentRequest,
  type StoreReplenishmentRequestFormValues,
  type StoreStockTake,
} from "@/modules/stores/stores.types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

const emptyFormValues: StoreReplenishmentRequestFormValues = {
  store_location_id: "",
  request_date: new Date().toISOString().slice(0, 10),
  requested_by_user_id: "",
  source_store_stock_take_id: "",
  notes: "",
  status: "draft",
  lines: [],
};

type StoreReplenishmentRequestFormPageProps = {
  mode?: "create" | "edit";
};

export default function StoreReplenishmentRequestFormPage({
  mode = "create",
}: StoreReplenishmentRequestFormPageProps) {
  const [, navigate] = useLocation();
  const { filterByAllowedLocations, isAllowedLocation } = useAccessControl();
  const [matches, params] = useRoute<{ storeReplenishmentRequestId: string }>(
    "/stores/replenishment-requests/:storeReplenishmentRequestId/edit",
  );
  const [stockTakes, setStockTakes] = useState<StoreStockTake[]>([]);
  const [selectedStockTakeId, setSelectedStockTakeId] = useState("");
  const [request, setRequest] = useState<StoreReplenishmentRequest | null>(null);
  const [defaultValues, setDefaultValues] = useState<StoreReplenishmentRequestFormValues>(emptyFormValues);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCreateState() {
      const allStockTakes = await storeStockTakeRepository.list();
      const scopedStockTakes = filterByAllowedLocations(allStockTakes, (item) => item.store_location_id).filter(
        (item) => item.lines.some((line) => line.shortage_quantity > 0),
      );

      if (!isMounted) {
        return;
      }

      setStockTakes(scopedStockTakes);
      const initialStockTake = scopedStockTakes[0] ?? null;
      const initialStockTakeId = initialStockTake?.id ?? "";
      setSelectedStockTakeId(initialStockTakeId);
      setDefaultValues(initialStockTake ? createStoreReplenishmentRequestFormValues(initialStockTake) : emptyFormValues);
      setIsLoading(false);
    }

    async function loadEditState() {
      if (!matches || !params?.storeReplenishmentRequestId) {
        setIsLoading(false);
        return;
      }

      const existing = await storeReplenishmentRequestRepository.getById(params.storeReplenishmentRequestId);

      if (!isMounted) {
        return;
      }

      if (!existing || !isAllowedLocation(existing.store_location_id)) {
        navigate("/stores/replenishment-requests");
        return;
      }

      if (!isStoreReplenishmentRequestEditable(existing)) {
        navigate(`/stores/replenishment-requests/${existing.id}`);
        return;
      }

      setRequest(existing);
      setSelectedStockTakeId(existing.source_store_stock_take_id ?? "");
      setDefaultValues(storeReplenishmentRequestToFormValues(existing));
      setIsLoading(false);
    }

    if (mode === "edit") {
      loadEditState();
      return () => {
        isMounted = false;
      };
    }

    loadCreateState();

    return () => {
      isMounted = false;
    };
  }, [filterByAllowedLocations, isAllowedLocation, matches, mode, navigate, params?.storeReplenishmentRequestId]);

  const selectedStockTake = useMemo(
    () => stockTakes.find((item) => item.id === selectedStockTakeId) ?? null,
    [selectedStockTakeId, stockTakes],
  );

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    if (!selectedStockTake) {
      setDefaultValues(emptyFormValues);
      return;
    }

    setDefaultValues(createStoreReplenishmentRequestFormValues(selectedStockTake));
  }, [mode, selectedStockTake]);

  async function handleSubmit(values: StoreReplenishmentRequestFormValues) {
    if (mode === "edit" && request) {
      const payload = parseStoreReplenishmentRequestUpdateFormValues(values);
      const updated = await storeReplenishmentRequestRepository.update(request.id, payload);
      toast.success(`Store replenishment request ${updated.request_number} updated`);
      navigate(`/stores/replenishment-requests/${updated.id}`);
      return;
    }

    const payload = parseStoreReplenishmentRequestCreateFormValues(values);
    const created = await storeReplenishmentRequestRepository.create(payload);
    toast.success(`Store replenishment request ${created.request_number} created`);
    navigate(`/stores/replenishment-requests/${created.id}`);
  }

  if (isLoading) {
    return <p>Loading Store Replenishment Request form...</p>;
  }

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>{mode === "edit" ? "Edit Store Replenishment Request" : "Create Store Replenishment Request"}</h1>
        <p>
          {mode === "edit"
            ? "Edit a draft Stores-side replenishment request before submission. Phase 2B supports draft and submitted lifecycle only, without approval, conversion, or Logistics linkage."
            : "Select a Store Stock Take with shortage lines and create a draft Stores-side replenishment request. Phase 2B supports draft and submitted lifecycle only, without approval, conversion, or Logistics linkage."}
        </p>
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
        <Link href="/stores/replenishment-requests">Back to Store Replenishment Requests</Link>
      </p>

      {mode === "create" && stockTakes.length === 0 ? (
        <p>No Store Stock Takes with shortage lines are available for your allowed locations. Create and finalize shortage-bearing stock takes first.</p>
      ) : (
        <>
          {mode === "create" ? (
            <p>
              <label>
                <span>Source Store Stock Take</span>
                <select
                  value={selectedStockTakeId}
                  onChange={(event) => {
                    setSelectedStockTakeId(event.target.value);
                  }}
                >
                  {stockTakes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.stock_take_number} — {item.store_location_id} — {item.stock_take_date}
                    </option>
                  ))}
                </select>
              </label>
            </p>
          ) : null}

          <StoreReplenishmentRequestForm
            defaultValues={defaultValues}
            submitLabel={mode === "edit" ? "Save Store Replenishment Request" : "Create Store Replenishment Request"}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </section>
  );
}
