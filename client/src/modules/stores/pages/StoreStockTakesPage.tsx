/**
 * File intent: implement Stores / Branch Operations Phase 1 Store Stock Take list page.
 * Design reminder for this file: keep Stores demand-side records separate from Logistics and focus on count history plus shortage visibility.
 */

import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { storeStockTakeRepository } from "@/modules/stores/stores.repository";
import { summarizeStoreStockTake, type StoreStockTake } from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function StoreStockTakesPage() {
  const { filterByAllowedLocations } = useAccessControl();
  const [items, setItems] = useState<StoreStockTake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadItems() {
      const allItems = await storeStockTakeRepository.list();
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
    return <p>Loading Store Stock Takes...</p>;
  }

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>Store Stock Take</h1>
        <p>Capture branch-side counted quantities and compare them against par level to identify shortages inside the Stores module.</p>
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
        <Link href="/stores/stock-takes/new">Create Store Stock Take</Link>
      </p>

      {items.length === 0 ? (
        <p>No Store Stock Takes found for your allowed locations.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Stock Take Number</th>
              <th>Store</th>
              <th>Date</th>
              <th>Status</th>
              <th>Shortage Lines</th>
              <th>Total Shortage Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const summary = summarizeStoreStockTake(item.lines);

              return (
                <tr key={item.id}>
                  <td>{item.stock_take_number}</td>
                  <td>{item.store_location_id}</td>
                  <td>{item.stock_take_date}</td>
                  <td>{item.status}</td>
                  <td>{summary.shortage_line_count}</td>
                  <td>{summary.total_shortage_quantity}</td>
                  <td>
                    <Link href={`/stores/stock-takes/${item.id}`}>View</Link>
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
