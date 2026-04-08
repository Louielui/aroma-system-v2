/**
 * File intent: define the Prep List MVP data model for Central Kitchen production needs.
 * Design reminder for this file: keep the model simple, structural, and repository-ready without over-design.
 */

export type PrepListItem = {
  id: string;
  name: string;
  base_unit: string;
  current_prep_quantity: number;
  target_quantity: number;
};

export type PrepListComputedItem = PrepListItem & {
  prep_needed: number;
};
