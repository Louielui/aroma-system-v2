/*
 * File intent: implement Stores / Branch Operations replenishment request detail and lifecycle actions.
 * Design reminder for this file: keep replenishment requests as Stores demand records only, and expose Internal Transfer handoff as an explicit conversion action rather than embedding Logistics execution behavior inside Stores.
 */

import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import StoreReplenishmentRequestReviewForm from "@/modules/stores/components/StoreReplenishmentRequestReviewForm";
import { storeReplenishmentRequestRepository } from "@/modules/stores/stores.repository";
import {
  createStoreReplenishmentRequestReviewFormValues,
  parseStoreReplenishmentRequestReviewFormValues,
} from "@/modules/stores/stores.validation";
import {
  canCancelStoreReplenishmentRequest,
  canConvertStoreReplenishmentRequest,
  canReviewStoreReplenishmentRequest,
  canStartStoreReplenishmentRequestReview,
  isStoreReplenishmentRequestEditable,
  summarizeStoreReplenishmentRequest,
  type StoreReplenishmentRequest,
  type StoreReplenishmentRequestReviewFormValues,
} from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

export default function StoreReplenishmentRequestDetailPage() {
  const [, navigate] = useLocation();
  const { currentUser, isAllowedLocation } = useAccessControl();
  const [matches, params] = useRoute<{ storeReplenishmentRequestId: string }>(
    "/stores/replenishment-requests/:storeReplenishmentRequestId",
  );
  const [item, setItem] = useState<StoreReplenishmentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

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
      setShowReviewForm(nextItem.status === "under_review");
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
      setShowReviewForm(false);
      toast.success(`Store replenishment request ${submitted.request_number} submitted`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit Store Replenishment Request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartReview() {
    if (!item || !canStartStoreReplenishmentRequestReview(item)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const underReview = await storeReplenishmentRequestRepository.startReview(item.id, currentUser?.id ?? "");
      setItem(underReview);
      setShowReviewForm(true);
      toast.success(`Store replenishment request ${underReview.request_number} moved to review`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start review";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApprove(values: StoreReplenishmentRequestReviewFormValues) {
    if (!item || !canReviewStoreReplenishmentRequest(item)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = parseStoreReplenishmentRequestReviewFormValues(values);
      const approved = await storeReplenishmentRequestRepository.approve(item.id, payload, currentUser?.id ?? "");
      setItem(approved);
      setShowReviewForm(false);
      toast.success(`Store replenishment request ${approved.request_number} approved`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve Store Replenishment Request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject(values: StoreReplenishmentRequestReviewFormValues) {
    if (!item || !canReviewStoreReplenishmentRequest(item)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = parseStoreReplenishmentRequestReviewFormValues(values);
      const rejected = await storeReplenishmentRequestRepository.reject(item.id, payload, currentUser?.id ?? "");
      setItem(rejected);
      setShowReviewForm(false);
      toast.success(`Store replenishment request ${rejected.request_number} rejected`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject Store Replenishment Request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelRequest() {
    if (!item || !canCancelStoreReplenishmentRequest(item)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const cancelled = await storeReplenishmentRequestRepository.cancel(item.id, currentUser?.id ?? "");
      setItem(cancelled);
      setShowReviewForm(false);
      toast.success(`Store replenishment request ${cancelled.request_number} cancelled`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel Store Replenishment Request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConvertToInternalTransfer() {
    if (!item || !canConvertStoreReplenishmentRequest(item)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const converted = await storeReplenishmentRequestRepository.convertToInternalTransfer(
        item.id,
        currentUser?.id ?? "",
      );
      setItem(converted);
      toast.success(`Internal Transfer ${converted.linked_internal_transfer_number ?? "created"} generated from approved request`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to convert Store Replenishment Request to Internal Transfer";
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
  const canStartReview = canStartStoreReplenishmentRequestReview(item);
  const canReview = canReviewStoreReplenishmentRequest(item);
  const canCancel = canCancelStoreReplenishmentRequest(item);
  const canConvert = canConvertStoreReplenishmentRequest(item);

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>{item.request_number}</h1>
        <p>
          This page shows the Stores-side replenishment request as a demand record. Phase 3 adds an explicit handoff action that
          converts approved demand into a new linked Internal Transfer, while keeping Stores demand records separate from
          Logistics execution records.
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

      <p>
        {isEditable ? (
          <>
            <Link href={`/stores/replenishment-requests/${item.id}/edit`}>Edit draft request</Link>{" "}
            <button type="button" onClick={handleSubmitRequest} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit request"}
            </button>
          </>
        ) : null}
        {canStartReview ? (
          <button type="button" onClick={handleStartReview} disabled={isSubmitting}>
            {isSubmitting ? "Starting review..." : "Start review"}
          </button>
        ) : null}
        {canCancel ? (
          <button type="button" onClick={handleCancelRequest} disabled={isSubmitting}>
            {isSubmitting ? "Cancelling..." : "Cancel request"}
          </button>
        ) : null}
        {canReview ? (
          <button
            type="button"
            onClick={() => {
              setShowReviewForm((current) => !current);
            }}
          >
            {showReviewForm ? "Hide review form" : "Open review form"}
          </button>
        ) : null}
        {canConvert ? (
          <button type="button" onClick={handleConvertToInternalTransfer} disabled={isSubmitting}>
            {isSubmitting ? "Converting..." : "Convert to Internal Transfer"}
          </button>
        ) : null}
      </p>

      <dl>
        <dt>Store Location</dt>
        <dd>{item.store_location_id}</dd>
        <dt>Request Date</dt>
        <dd>{item.request_date}</dd>
        <dt>Status</dt>
        <dd>{item.status}</dd>
        <dt>Conversion Status</dt>
        <dd>{item.conversion_status}</dd>
        <dt>Requested By User Id</dt>
        <dd>{item.requested_by_user_id ?? "-"}</dd>
        <dt>Source Store Stock Take Id</dt>
        <dd>{item.source_store_stock_take_id ?? "-"}</dd>
        <dt>Reviewed By User Id</dt>
        <dd>{item.reviewed_by_user_id ?? "-"}</dd>
        <dt>Reviewed At</dt>
        <dd>{item.reviewed_at ?? "-"}</dd>
        <dt>Approved By User Id</dt>
        <dd>{item.approved_by_user_id ?? "-"}</dd>
        <dt>Approved At</dt>
        <dd>{item.approved_at ?? "-"}</dd>
        <dt>Review Notes</dt>
        <dd>{item.review_notes || "-"}</dd>
        <dt>Linked Internal Transfer Id</dt>
        <dd>{item.linked_internal_transfer_id ?? "-"}</dd>
        <dt>Linked Internal Transfer Number</dt>
        <dd>
          {item.linked_internal_transfer_id && item.linked_internal_transfer_number ? (
            <Link href={`/logistics/transfer-orders/${item.linked_internal_transfer_id}`}>
              {item.linked_internal_transfer_number}
            </Link>
          ) : (
            "-"
          )}
        </dd>
        <dt>Converted At</dt>
        <dd>{item.converted_at ?? "-"}</dd>
        <dt>Converted By User Id</dt>
        <dd>{item.converted_by_user_id ?? "-"}</dd>
        <dt>Line Count</dt>
        <dd>{summary.total_line_count}</dd>
        <dt>Shortage Line Count</dt>
        <dd>{summary.shortage_line_count}</dd>
        <dt>Total Shortage Quantity</dt>
        <dd>{summary.total_shortage_quantity}</dd>
        <dt>Total Requested Quantity</dt>
        <dd>{summary.total_requested_quantity}</dd>
        <dt>Total Approved Quantity</dt>
        <dd>{summary.total_approved_quantity}</dd>
        <dt>Total Converted Quantity</dt>
        <dd>{summary.total_converted_quantity}</dd>
        <dt>Notes</dt>
        <dd>{item.notes || "-"}</dd>
      </dl>

      {canReview && showReviewForm ? (
        <section>
          <h2>Review / Approval</h2>
          <p>
            Review approved quantities inside Stores only. This step records reviewer intent and approved demand, but does not
            create an Internal Transfer or trigger Logistics execution until the explicit conversion action is used.
          </p>
          <StoreReplenishmentRequestReviewForm
            defaultValues={createStoreReplenishmentRequestReviewFormValues(item)}
            approveLabel="Approve Store Replenishment Request"
            rejectLabel="Reject Store Replenishment Request"
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </section>
      ) : null}

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
            <th>Approved Quantity</th>
            <th>Converted Quantity</th>
            <th>Linked Transfer Line</th>
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
              <td>{line.approved_quantity ?? "-"}</td>
              <td>{line.converted_quantity}</td>
              <td>{line.linked_internal_transfer_line_id ?? "-"}</td>
              <td>{line.line_notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
