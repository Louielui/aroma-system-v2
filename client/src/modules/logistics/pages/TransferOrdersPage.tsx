/**
 * File intent: render the Logistics > Transfer Orders list for the Internal Transfer flow in Phase 2A.
 * Design reminder for this file: implement Internal Transfer only, keep External Pickup and Grocery Fulfillment separate and deferred.
 */

import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type { InternalTransfer } from "@/modules/logistics/internal-transfers.types";
import { internalTransferRepository } from "@/modules/logistics/internal-transfers.repository";
import { sharedLogisticsStatusLabels } from "@/modules/logistics/logistics-status.types";

function canViewInternalTransfer(
  internalTransfer: InternalTransfer,
  isAllowedLocation: (locationId: string | null | undefined) => boolean,
) {
  return (
    isAllowedLocation(internalTransfer.source_location_id) ||
    isAllowedLocation(internalTransfer.destination_location_id)
  );
}

export default function TransferOrdersPage() {
  const { isLoading: isAccessLoading, isAllowedLocation } = useAccessControl();
  const [isLoading, setIsLoading] = useState(true);
  const [internalTransfers, setInternalTransfers] = useState<InternalTransfer[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadInternalTransfers() {
      const records = await internalTransferRepository.list();

      if (!isMounted) {
        return;
      }

      setInternalTransfers(records.filter((record) => canViewInternalTransfer(record, isAllowedLocation)));
      setIsLoading(false);
    }

    loadInternalTransfers();

    return () => {
      isMounted = false;
    };
  }, [isAllowedLocation]);

  if (isAccessLoading || isLoading) {
    return <p>Loading transfer orders...</p>;
  }

  return (
    <section>
      <header>
        <p>Logistics</p>
        <h1>Transfer Orders</h1>
        <p>Internal Transfer is the first implemented Logistics execution flow in Phase 2A.</p>
      </header>

      <p>
        <Link href="/logistics/transfer-orders/new">Create Transfer Order</Link>
      </p>

      <table>
        <thead>
          <tr>
            <th>Transfer Order</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Scheduled Dispatch</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {internalTransfers.map((internalTransfer) => (
            <tr key={internalTransfer.id}>
              <td>{internalTransfer.transfer_order_number}</td>
              <td>{internalTransfer.source_location_id}</td>
              <td>{internalTransfer.destination_location_id}</td>
              <td>{internalTransfer.scheduled_dispatch_date}</td>
              <td>{sharedLogisticsStatusLabels[internalTransfer.logistics_status]}</td>
              <td>{internalTransfer.priority}</td>
              <td>
                <Link href={`/logistics/transfer-orders/${internalTransfer.id}`}>View</Link>{" "}
                <Link href={`/logistics/transfer-orders/${internalTransfer.id}/edit`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
