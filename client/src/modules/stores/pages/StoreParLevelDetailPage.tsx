/**
 * File intent: implement Stores / Branch Operations Phase 1 Store Par Level detail page.
 * Design reminder for this file: keep Stores records separate from Logistics and focus on branch demand targets only.
 */

import { storesItems } from "@/app/navigation";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { storeParLevelRepository } from "@/modules/stores/stores.repository";
import type { StoreParLevel } from "@/modules/stores/stores.types";
import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

export default function StoreParLevelDetailPage() {
  const [, navigate] = useLocation();
  const { isAllowedLocation } = useAccessControl();
  const [matches, params] = useRoute<{ storeParLevelId: string }>("/stores/par-levels/:storeParLevelId");
  const [item, setItem] = useState<StoreParLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadItem() {
      if (!matches || !params?.storeParLevelId) {
        setIsLoading(false);
        return;
      }

      const nextItem = await storeParLevelRepository.getById(params.storeParLevelId);

      if (!isMounted) {
        return;
      }

      if (!nextItem) {
        navigate("/stores/par-levels");
        return;
      }

      if (!isAllowedLocation(nextItem.store_location_id)) {
        navigate("/stores/par-levels");
        return;
      }

      setItem(nextItem);
      setIsLoading(false);
    }

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [isAllowedLocation, matches, navigate, params?.storeParLevelId]);

  if (isLoading) {
    return <p>Loading Store Par Level...</p>;
  }

  if (!item) {
    return <p>Store Par Level not found.</p>;
  }

  return (
    <section>
      <header>
        <p>Stores / Branch Operations</p>
        <h1>{item.item_name}</h1>
        <p>This record defines the branch-side target stock level used for shortage calculation during Store Stock Take.</p>
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
        <Link href="/stores/par-levels">Back to Store Par Levels</Link>{" "}
        <Link href={`/stores/par-levels/${item.id}/edit`}>Edit Store Par Level</Link>
      </p>

      <dl>
        <dt>Store Location</dt>
        <dd>{item.store_location_id}</dd>
        <dt>Raw Ingredient Id</dt>
        <dd>{item.raw_ingredient_id}</dd>
        <dt>Category</dt>
        <dd>{item.category}</dd>
        <dt>Base Unit</dt>
        <dd>{item.base_unit}</dd>
        <dt>Par Quantity</dt>
        <dd>{item.par_quantity ?? "-"}</dd>
        <dt>Reorder Trigger Quantity</dt>
        <dd>{item.reorder_trigger_quantity ?? "-"}</dd>
        <dt>Status</dt>
        <dd>{item.is_active ? "Active" : "Inactive"}</dd>
        <dt>Notes</dt>
        <dd>{item.notes || "-"}</dd>
        <dt>Updated At</dt>
        <dd>{new Date(item.updated_at).toLocaleString()}</dd>
      </dl>
    </section>
  );
}
