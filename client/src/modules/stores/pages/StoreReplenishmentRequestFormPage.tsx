/*
 * File intent: implement Stores / Branch Operations Phase 2A replenishment request create form page.
 * Design reminder for this file: keep replenishment request creation inside Stores demand capture only, without approval, conversion, or Logistics linkage.
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
  parseStoreReplenishmentRequestFormValues,
} from "@/modules/stores/stores.validation";
import type { StoreReplenishmentRequestFormValues, StoreStockTake } from "@/modules/stores/stores.types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

const emptyFormValues: StoreReplenishmentRequestFormValues = {
  store_location_id: "",
  request_date: new Date().toISOString().slice(0, 10),
  requested_by_user_id: "",
  source_store_stock_take_id: "",
  notes: "",
  status: "draft",
  lines: [],
};

export default function StoreReplenishmentRequestFormPage() {
  const [, navigate] = useLocation();
  const { filterByAllowedLocations } = useAccessControl();
  const [stockTakes, setStockTakes] = useState<StoreStockTake[]>([]);
  const [selectedStockTakeId, setSelectedStockTakeId] = useState("");
  const [defaultValues, setDefaultValues] = useState<StoreReplenishmentRequestFormValues>(emptyFormValues);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStockTakes() {
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

    loadStockTakes();

    return () => {
      isMounted = false;
    };
  }, [filterByAllowedLocations]);

  const selectedStockTake = useMemo(
    () => stockTakes.find((item) => item.id === selectedStockTakeId) ?? null,
    [selectedStockTakeId, stockTakes],
  );

  useEffect(() => {
    if (!selectedStockTake) {
      setDefaultValues(emptyFormValues);
      return;
    }

    setDefaultValues(createStoreReplenishmentRequestFormValues(selectedStockTake));
  }, [selectedStockTake]);

  async function handleSubmit(values: StoreReplenishmentRequestFormValues) {
    const payload = parseStoreReplenishmentRequestFormValues(values);
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
        <h1>Create Store Replenishment Request</h1>
        <p>Select a Store Stock Take with shortage lines and create a draft Stores-side replenishment request. Phase 2A does not include approval, conversion, or Logistics linkage.</p>
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

      {stockTakes.length === 0 ? (
        <p>No Store Stock Takes with shortage lines are available for your allowed locations. Create and finalize shortage-bearing stock takes first.</p>
      ) : (
        <>
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

          <StoreReplenishmentRequestForm
            defaultValues={defaultValues}
            submitLabel="Create Store Replenishment Request"
            onSubmit={handleSubmit}
          />
        </>
      )}
    </section>
  );
}
