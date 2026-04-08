/**
 * File intent: define the Prep Stock Take data shape for updating Raw Ingredients current_stock.
 * Design reminder for this file: keep the workflow simple, schema-preserving, and ready for later API integration.
 */

export type PrepStockTakeLine = {
  id: string;
  name: string;
  category: string;
  base_unit: string;
  current_stock: number | null;
  counted_quantity: string;
};

export type PrepStockTakeFormValues = {
  lines: PrepStockTakeLine[];
};

export type PrepStockTakeSaveEntry = {
  id: string;
  counted_quantity: number;
};
