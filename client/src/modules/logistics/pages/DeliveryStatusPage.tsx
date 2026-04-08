/**
 * File intent: render the shared Logistics Delivery Status page using the shared tracking model for currently implemented flows.
 * Design reminder for this file: Delivery Status is shared tracking, not a merged business-intent table.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { internalTransferRepository } from "@/modules/logistics/internal-transfers.repository";
import type { InternalTransferTrackingRow } from "@/modules/logistics/internal-transfers.types";
import { sharedLogisticsStatusLabels } from "@/modules/logistics/logistics-status.types";

function canViewTrackingRow(
  trackingRow: InternalTransferTrackingRow,
  isAllowedLocation: (locationId: string | null | undefined) => boolean,
) {
  return isAllowedLocation(trackingRow.source_label) || isAllowedLocation(trackingRow.destination_label);
}

export default function DeliveryStatusPage() {
  const { isLoading: isAccessLoading, isAllowedLocation } = useAccessControl();
  const [isLoading, setIsLoading] = useState(true);
  const [trackingRows, setTrackingRows] = useState<InternalTransferTrackingRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadTrackingRows() {
      const nextRows = await internalTransferRepository.listTrackingRows();

      if (!isMounted) {
        return;
      }

      setTrackingRows(nextRows.filter((row) => canViewTrackingRow(row, isAllowedLocation)));
      setIsLoading(false);
    }

    loadTrackingRows();

    return () => {
      isMounted = false;
    };
  }, [isAllowedLocation]);

  if (isAccessLoading || isLoading) {
    return <p>Loading delivery status...</p>;
  }

  return (
    <section>
      <header>
        <p>Logistics</p>
        <h1>Delivery Status</h1>
        <p>This shared tracking page currently surfaces Internal Transfer records only. External Pickup and Grocery Fulfillment remain deferred.</p>
      </header>

      <table>
        <thead>
          <tr>
            <th>Tracking Reference</th>
            <th>Flow Type</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Scheduled Date</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Exception</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trackingRows.map((trackingRow) => (
            <tr key={trackingRow.internal_transfer_id}>
              <td>{trackingRow.tracking_reference}</td>
              <td>{trackingRow.origin_flow_type}</td>
              <td>{trackingRow.source_label}</td>
              <td>{trackingRow.destination_label}</td>
              <td>{trackingRow.scheduled_date}</td>
              <td>{trackingRow.assigned_to_user_id || "—"}</td>
              <td>{sharedLogisticsStatusLabels[trackingRow.logistics_status]}</td>
              <td>{trackingRow.has_exception ? "Yes" : "No"}</td>
              <td>
                <Link href={`/logistics/transfer-orders/${trackingRow.internal_transfer_id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
