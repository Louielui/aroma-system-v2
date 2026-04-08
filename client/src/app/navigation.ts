/*
 * File intent: define architecture-first navigation metadata for Aroma System V2.
 * Design reminder for this file: structure over appearance, no visual exploration, keep routing and module boundaries explicit.
 */

export type SidebarItem = {
  title: string;
  path: string;
};

export type SidebarSection = {
  title: string;
  basePath: string;
  items: SidebarItem[];
};

export const procurementItems: SidebarItem[] = [
  { title: "Suppliers", path: "/procurement/suppliers" },
  { title: "Scan / Upload", path: "/procurement/scan-upload" },
  { title: "Invoices", path: "/procurement/invoices" },
  { title: "Price Book", path: "/procurement/price-book" },
  { title: "Transfer Orders", path: "/procurement/transfer-orders" },
];

export const centralKitchenItems: SidebarItem[] = [
  { title: "Raw Ingredients", path: "/central-kitchen/raw-ingredients" },
  { title: "Prep Stock Take", path: "/central-kitchen/prep-stock-take" },
  { title: "Prep List", path: "/central-kitchen/prep-list" },
];

export const hrItems: SidebarItem[] = [
  { title: "People / User Management", path: "/hr/people" },
  { title: "Onboarding", path: "/hr/onboarding" },
];

export const logisticsItems: SidebarItem[] = [
  { title: "Transfer Orders", path: "/logistics/transfer-orders" },
  { title: "Pick List", path: "/logistics/pick-list" },
  { title: "Delivery Status", path: "/logistics/delivery-status" },
];

export const storesItems: SidebarItem[] = [
  { title: "Store Par Levels", path: "/stores/par-levels" },
  { title: "Store Stock Take", path: "/stores/stock-takes" },
  { title: "Replenishment Requests", path: "/stores/replenishment-requests" },
];

export const sidebarSections: SidebarSection[] = [
  {
    title: "Procurement",
    basePath: "/procurement",
    items: procurementItems,
  },
  {
    title: "Central Kitchen",
    basePath: "/central-kitchen",
    items: centralKitchenItems,
  },
  {
    title: "HR",
    basePath: "/hr",
    items: hrItems,
  },
  {
    title: "Logistics",
    basePath: "/logistics",
    items: logisticsItems,
  },
  {
    title: "Stores",
    basePath: "/stores",
    items: storesItems,
  },
];

export const defaultRoute = procurementItems[0].path;
