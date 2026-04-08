# Supplier MVP Data Model

This is the recommended **initial Supplier data model** for **Aroma System V2**. It follows the requested constraints by keeping the design **simple**, **single-table**, and **not over-normalized**, while still preparing the model to connect later to **Invoices**, **Price Book**, and **Raw Ingredients**.

## Design Decision

| Decision Area | MVP Choice |
|---|---|
| Table structure | **One table only**: `suppliers` |
| Normalization level | Keep contact, address, and procurement fields in the same table for now |
| Future compatibility | Reserve this table as the canonical supplier record for Procurement and future cross-module links |
| AI compatibility | Include `aliases` and `is_enabled_for_invoice_parsing` now, so supplier matching and invoice parsing can attach later |

## Recommended Table: `suppliers`

| Column | Suggested Type | Required | Purpose |
|---|---|---:|---|
| `id` | `uuid` or `bigint` | Yes | Primary key for the supplier record |
| `name` | `varchar(200)` | Yes | Main display name used in the system |
| `short_name` | `varchar(100)` | No | Short operational name for tables, labels, and internal references |
| `legal_name` | `varchar(200)` | No | Registered or formal business name |
| `code` | `varchar(50)` | No | Internal supplier code or ERP/vendor code |
| `status` | `varchar(30)` | Yes | Operational status such as `active`, `inactive`, or `pending` |
| `contact_person` | `varchar(150)` | No | Primary contact person |
| `phone` | `varchar(50)` | No | Main phone number |
| `email` | `varchar(200)` | No | Main supplier email |
| `address_line_1` | `varchar(200)` | No | Primary address line |
| `address_line_2` | `varchar(200)` | No | Secondary address information |
| `city` | `varchar(100)` | No | City |
| `province` | `varchar(100)` | No | Province or region |
| `postal_code` | `varchar(30)` | No | Postal or ZIP code |
| `ordering_method` | `varchar(50)` | No | Ordering style such as `email`, `phone`, `portal`, or `sales_rep` |
| `payment_terms` | `varchar(100)` | No | Payment terms text such as `Net 30` |
| `delivery_days` | `text` or `json` | No | Simple storage for delivery schedule, such as `Mon,Wed,Fri` |
| `minimum_order_amount` | `decimal(12,2)` | No | Minimum order threshold |
| `lead_time_days` | `integer` | No | Typical lead time in days |
| `aliases` | `text` or `json` | No | Alternate supplier names used for invoice parsing and supplier matching |
| `notes` | `text` | No | Internal notes |
| `is_enabled_for_invoice_parsing` | `boolean` | Yes | Whether invoice parsing should attempt supplier-level matching and parsing for this supplier |
| `created_at` | `timestamp` | Yes | Record creation timestamp |
| `updated_at` | `timestamp` | Yes | Record last update timestamp |

## MVP Field Notes

The field `name` should be treated as the primary operational name shown in the interface. The field `legal_name` can remain optional because some suppliers may be known operationally before their legal registration details are fully entered. The field `short_name` is useful for compact UI labels and quick internal references, but it should not replace `name`.

The field `aliases` is important even in the MVP because it gives Procurement and future AI matching logic a place to store alternate supplier spellings, invoice header variants, and common abbreviations. This should remain simple for now. If the database supports JSON arrays comfortably, storing aliases as a JSON array is the most practical MVP option. If not, a plain text field can be used first and upgraded later.

The field `delivery_days` should also remain simple in the MVP. It does not need a separate schedule table yet. A text value or JSON array is enough until procurement scheduling becomes more complex.

## Minimal Constraints Recommendation

| Constraint | Recommendation |
|---|---|
| Primary key | `id` |
| Unique recommendation | `code` should be unique if the business already has reliable supplier codes |
| Secondary uniqueness | Do **not** force `name` to be unique yet, because duplicate or near-duplicate supplier naming may need cleanup first |
| Default values | `status = 'active'`, `is_enabled_for_invoice_parsing = false`, `created_at = now()`, `updated_at = now()` |

## Future Connection Readiness

This table is intentionally designed so later modules can connect to it without redesigning the MVP.

| Future Module / Feature | How it should connect later |
|---|---|
| **Invoices** | Add `supplier_id` on invoices so parsed or manually selected invoices point to the canonical supplier record |
| **Price Book** | Add `supplier_id` on price book entries so supplier-specific prices can be tracked over time |
| **Raw Ingredients** | Allow ingredient-supplier mapping later through a linking table or preferred supplier reference when needed |
| **Supplier matching AI** | Use `name`, `short_name`, `legal_name`, `code`, and `aliases` as the canonical supplier matching surface |
| **Invoice parsing AI** | Use `is_enabled_for_invoice_parsing` plus aliases and known supplier naming patterns |

## Recommended MVP Shape

> Keep **all supplier information in one `suppliers` table first**. Do not split contacts, addresses, delivery schedules, aliases, or procurement settings into separate tables yet. The goal of the MVP is to create one stable supplier record that Procurement can use immediately and other modules can reference later.

## Optional Example Schema

```sql
suppliers (
  id uuid primary key,
  name varchar(200) not null,
  short_name varchar(100),
  legal_name varchar(200),
  code varchar(50),
  status varchar(30) not null default 'active',
  contact_person varchar(150),
  phone varchar(50),
  email varchar(200),
  address_line_1 varchar(200),
  address_line_2 varchar(200),
  city varchar(100),
  province varchar(100),
  postal_code varchar(30),
  ordering_method varchar(50),
  payment_terms varchar(100),
  delivery_days text,
  minimum_order_amount decimal(12,2),
  lead_time_days integer,
  aliases text,
  notes text,
  is_enabled_for_invoice_parsing boolean not null default false,
  created_at timestamp not null,
  updated_at timestamp not null
)
```

## Final Recommendation

For the MVP, I recommend accepting this model as the canonical **Supplier master table** for Procurement. It is simple enough to build now, but already structured to support later links into **Invoices**, **Price Book**, and **Raw Ingredients** without forcing an early normalization pass.
