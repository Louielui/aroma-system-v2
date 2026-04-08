/**
 * File intent: provide a repository-driven Prep List MVP for Central Kitchen production needs.
 * Design reminder for this file: keep the logic simple, structural, and separate from page rendering.
 */

import type {
  PrepListComputedItem,
  PrepListItem,
} from "@/modules/central-kitchen/prep-list.types";

const seedPrepListItems: PrepListItem[] = [
  {
    id: "prep-item-marinated-chicken",
    name: "Marinated Chicken",
    base_unit: "kg",
    current_prep_quantity: 6,
    target_quantity: 14,
  },
  {
    id: "prep-item-sliced-onions",
    name: "Sliced Onions",
    base_unit: "kg",
    current_prep_quantity: 10,
    target_quantity: 8,
  },
  {
    id: "prep-item-garlic-butter",
    name: "Garlic Butter",
    base_unit: "kg",
    current_prep_quantity: 2,
    target_quantity: 5,
  },
];

function computePrepNeeded(item: PrepListItem) {
  return Math.max(item.target_quantity - item.current_prep_quantity, 0);
}

export interface PrepListRepository {
  list(): Promise<PrepListComputedItem[]>;
}

class LocalPrepListRepository implements PrepListRepository {
  async list() {
    return seedPrepListItems.map((item) => ({
      ...item,
      prep_needed: computePrepNeeded(item),
    }));
  }
}

export const prepListRepository: PrepListRepository = new LocalPrepListRepository();
