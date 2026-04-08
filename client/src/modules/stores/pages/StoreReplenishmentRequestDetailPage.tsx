/*
 * File intent: implement Stores / Branch Operations replenishment request detail page.
 * Design reminder for this file: keep replenishment requests as Stores demand records only, and do not introduce approval, conversion, or Internal Transfer execution behavior.
 */

import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { storeReplenishmentRequestRepository } from "@/modules/stores/stores.repository";
import {
  isStoreReplenishmentRequestEditable,
  summarizeStoreReplenishmentRequest,
  type StoreReplenishmentRequest,
} from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

export default function StoreReplenishmentRequestDetailPage() {
  const [, navigate] = useLocation();
  const { isAllowedLocation } = useAccessControl();
  const [matches, params] = useRoute<{ storeReplenishmentRequestId: string }>(
    "/stores/replenishment-requests/:storeReplenishmentRequestId",
  );
  const [item, setItem] = useState<StoreReplenishmentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadItem() {
      if (!matches || !params?.storeReplenishmentRequestId) {
        setIsLoading(false);
        return;
      }

      const nextItem = await storeReplenishmentRequestRepository.getById(params.storeReplenishmentRequestId);

      if (!isMounted) {
        return;
      }

      if (!nextItem || !isAllowedLocation(nextItem.store_location_id)) {
        navigate("/stores/replenishment-requests");
        return;
      }

      setItem(nextItem);
      setIsLoading(false);
    }

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [isAllowedLocation, matches, navigate, params?.storeReplenishmentRequestId]);

  async function handleSubmitRequest() {
    if (!item || !isStoreReplenishmentRequestEditable(item)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitted = await storeReplenishmentRequestRepository.submit(item.id);
      setItem(submitted);
      toast.success(`Store replenishment request ${submitted.request_number} submitted`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit Store Replenishment Request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>Loading Store Replenishment Request...</p>;
  }

  if (!item) {
    return <p>Store Replenishment Request not found.</p>;
  }

  const summary = summarizeStoreReplenishmentRequest(item.lines);
  const isEditable = isStoreReplenishmentRequestEditable(item);

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>{item.request_number}</h1>
        <p>
          This page shows the Stores-side replenishment request as a demand record. Phase 2B supports draft and submitted lifecycle only, without approval, conversion, or Logistics execution linkage.
        </p>
      </header>

      <nav aria-label="Stores module links">
        <p>Module routes</p>
        <ul>
          {storesItems.map((navItem) => (
            <li key={navItem.path}>
              <Link href={navItem.path}>{navItem.title}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <p>
        <Link href="/stores/replenishment-requests">Back to Store Replenishment Requests</Link>
      </p>

      {isEditable ? (
        <p>
          <Link href={`/stores/replenishment-requests/${item.id}/edit`}>Edit draft request</Link>{" "}
          <button type="button" onClick={handleSubmitRequest} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit request"}
          </button>
        </p>
      ) : (
        <p>This request has been submitted and is no longer editable in Stores Phase 2B.</p>
      )}

      <dl>
        <dt>Store Location</dt>
        <dd>{item.store_location_id}</dd>
        <dt>Request Date</dt>
        <dd>{item.request_date}</dd>
        <dt>Status</dt>
        <dd>{item.status}</dd>
        <dt>Requested By User Id</dt>
        <dd>{item.requested_by_user_id ?? "-"}</dd>
        <dt>Source Store Stock Take Id</dt>
        <dd>{item.source_store_stock_take_id ?? "-"}</dd>
        <dt>Line Count</dt>
        <dd>{summary.total_line_count}</dd>
        <dt>Shortage Line Count</dt>
        <dd>{summary.shortage_line_count}</dd>
        <dt>Total Shortage Quantity</dt>
        <dd>{summary.total_shortage_quantity}</dd>
        <dt>Total Requested Quantity</dt>
        <dd>{summary.total_requested_quantity}</dd>
        <dt>Notes</dt>
        <dd>{item.notes || "-"}</dd>
      </dl>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Base Unit</th>
            <th>Par Quantity</th>
            <th>Counted Quantity</th>
            <th>Shortage Quantity</th>
            <th>Requested Quantity</th>
            <th>Line Notes</th>
          </tr>
        </thead>
        <tbody>
          {item.lines.map((line) => (
            <tr key={line.id}>
              <td>{line.item_name}</td>
              <td>{line.category}</td>
              <td>{line.base_unit}</td>
              <td>{line.par_quantity_snapshot ?? "-"}</td>
              <td>{line.counted_quantity_snapshot ?? "-"}</td>
              <td>{line.shortage_quantity_snapshot}</td>
              <td>{line.requested_quantity}</td>
              <td>{line.line_notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
