/*
 * File intent: implement Stores / Branch Operations Phase 2A replenishment request list page.
 * Design reminder for this file: keep replenishment requests as Stores demand records only, with no approval, conversion, or Internal Transfer execution behavior.
 */

import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { storeReplenishmentRequestRepository } from "@/modules/stores/stores.repository";
import {
  summarizeStoreReplenishmentRequest,
  type StoreReplenishmentRequest,
} from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function StoreReplenishmentRequestsPage() {
  const { filterByAllowedLocations } = useAccessControl();
  const [items, setItems] = useState<StoreReplenishmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadItems() {
      const allItems = await storeReplenishmentRequestRepository.list();
      const scopedItems = filterByAllowedLocations(allItems, (item) => item.store_location_id);

      if (!isMounted) {
        return;
      }

      setItems(scopedItems);
      setIsLoading(false);
    }

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [filterByAllowedLocations]);

  if (isLoading) {
    return <p>Loading Store Replenishment Requests...</p>;
  }

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>Store Replenishment Requests</h1>
        <p>This page shows Stores-side replenishment demand records only. Phase 2A allows creation and viewing, without approval, conversion, or Logistics linkage.</p>
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
        <Link href="/stores/replenishment-requests/new">Create Store Replenishment Request</Link>
      </p>

      {items.length === 0 ? (
        <p>No Store Replenishment Requests found for your allowed locations.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Request Number</th>
              <th>Store</th>
              <th>Request Date</th>
              <th>Status</th>
              <th>Line Count</th>
              <th>Total Requested Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const summary = summarizeStoreReplenishmentRequest(item.lines);

              return (
                <tr key={item.id}>
                  <td>{item.request_number}</td>
                  <td>{item.store_location_id}</td>
                  <td>{item.request_date}</td>
                  <td>{item.status}</td>
                  <td>{summary.total_line_count}</td>
                  <td>{summary.total_requested_quantity}</td>
                  <td>
                    <Link href={`/stores/replenishment-requests/${item.id}`}>View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
