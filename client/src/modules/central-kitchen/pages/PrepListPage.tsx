/**
 * File intent: implement Central Kitchen > Prep List MVP for showing what prep items need to be produced.
 * Design reminder for this file: keep the workflow structural, repository-driven, and unstyled.
 */

import { centralKitchenItems } from "@/app/navigation";
import { prepListRepository } from "@/modules/central-kitchen/prep-list.repository";
import type { PrepListComputedItem } from "@/modules/central-kitchen/prep-list.types";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function PrepListPage() {
  const [items, setItems] = useState<PrepListComputedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPrepList() {
      const nextItems = await prepListRepository.list();

      if (!isMounted) {
        return;
      }

      setItems(nextItems);
      setIsLoading(false);
    }

    loadPrepList();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <p>Loading Prep List...</p>;
  }

  return (
    <section>
      <header>
        <p>Central Kitchen</p>
        <h1>Prep List</h1>
        <p>This MVP shows what prep items need to be produced using a simple repository-driven structure.</p>
        <p>The calculation is `prep_needed = target_quantity - current_prep_quantity`, with a minimum value of 0.</p>
      </header>

      <nav aria-label="Central Kitchen module links">
        <p>Module routes</p>
        <ul>
          {centralKitchenItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>{item.title}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <table>
        <thead>
          <tr>
            <th>Prep Item</th>
            <th>Base Unit</th>
            <th>Current Quantity</th>
            <th>Target Quantity</th>
            <th>Prep Needed</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.base_unit}</td>
              <td>{item.current_prep_quantity}</td>
              <td>{item.target_quantity}</td>
              <td>{item.prep_needed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
