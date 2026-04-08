/**
 * File intent: implement Stores / Branch Operations Phase 1 Store Stock Take detail page.
 * Design reminder for this file: keep shortage calculation visible inside Stores and avoid any Logistics or Internal Transfer execution behavior.
 */

import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { storeStockTakeRepository } from "@/modules/stores/stores.repository";
import { summarizeStoreStockTake, type StoreStockTake } from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

export default function StoreStockTakeDetailPage() {
  const [, navigate] = useLocation();
  const { isAllowedLocation } = useAccessControl();
  const [matches, params] = useRoute<{ storeStockTakeId: string }>("/stores/stock-takes/:storeStockTakeId");
  const [item, setItem] = useState<StoreStockTake | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadItem() {
      if (!matches || !params?.storeStockTakeId) {
        setIsLoading(false);
        return;
      }

      const nextItem = await storeStockTakeRepository.getById(params.storeStockTakeId);

      if (!isMounted) {
        return;
      }

      if (!nextItem || !isAllowedLocation(nextItem.store_location_id)) {
        navigate("/stores/stock-takes");
        return;
      }

      setItem(nextItem);
      setIsLoading(false);
    }

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [isAllowedLocation, matches, navigate, params?.storeStockTakeId]);

  if (isLoading) {
    return <p>Loading Store Stock Take...</p>;
  }

  if (!item) {
    return <p>Store Stock Take not found.</p>;
  }

  const summary = summarizeStoreStockTake(item.lines);

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>{item.stock_take_number}</h1>
        <p>This page shows shortage and overage against par level for the submitted Store Stock Take. It remains a Stores record and does not convert into Internal Transfer in Phase 1.</p>
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
        <Link href="/stores/stock-takes">Back to Store Stock Takes</Link>
      </p>

      <dl>
        <dt>Store Location</dt>
        <dd>{item.store_location_id}</dd>
        <dt>Stock Take Date</dt>
        <dd>{item.stock_take_date}</dd>
        <dt>Status</dt>
        <dd>{item.status}</dd>
        <dt>Counted By User Id</dt>
        <dd>{item.counted_by_user_id ?? "-"}</dd>
        <dt>Shortage Lines</dt>
        <dd>{summary.shortage_line_count}</dd>
        <dt>Total Shortage Quantity</dt>
        <dd>{summary.total_shortage_quantity}</dd>
        <dt>Overage Lines</dt>
        <dd>{summary.overage_line_count}</dd>
        <dt>Total Overage Quantity</dt>
        <dd>{summary.total_overage_quantity}</dd>
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
            <th>Overage Quantity</th>
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
              <td>{line.counted_quantity}</td>
              <td>{line.shortage_quantity}</td>
              <td>{line.overage_quantity}</td>
              <td>{line.line_notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
