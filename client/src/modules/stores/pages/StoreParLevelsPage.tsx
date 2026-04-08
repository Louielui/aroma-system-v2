/**
 * File intent: implement Stores / Branch Operations Phase 1 Store Par Levels list page.
 * Design reminder for this file: keep Stores separate from Logistics, keep behavior structural, and focus on par-level visibility rather than transfer execution.
 */

import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { storeParLevelRepository } from "@/modules/stores/stores.repository";
import type { StoreParLevel } from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function StoreParLevelsPage() {
  const { filterByAllowedLocations } = useAccessControl();
  const [items, setItems] = useState<StoreParLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadItems() {
      const allItems = await storeParLevelRepository.list();
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
    return <p>Loading Store Par Levels...</p>;
  }

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>Store Par Levels</h1>
        <p>Define branch-side target stock quantities for each item. These records stay in Stores and do not create Logistics work by themselves.</p>
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
        <Link href="/stores/par-levels/new">Create Store Par Level</Link>
      </p>

      {items.length === 0 ? (
        <p>No Store Par Levels found for your allowed locations.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Store</th>
              <th>Item</th>
              <th>Category</th>
              <th>Base Unit</th>
              <th>Par Quantity</th>
              <th>Reorder Trigger</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.store_location_id}</td>
                <td>{item.item_name}</td>
                <td>{item.category}</td>
                <td>{item.base_unit}</td>
                <td>{item.par_quantity ?? "-"}</td>
                <td>{item.reorder_trigger_quantity ?? "-"}</td>
                <td>{item.is_active ? "Active" : "Inactive"}</td>
                <td>
                  <Link href={`/stores/par-levels/${item.id}`}>View</Link>{" "}
                  <Link href={`/stores/par-levels/${item.id}/edit`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
