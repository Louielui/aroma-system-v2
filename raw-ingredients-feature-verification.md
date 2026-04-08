# Raw Ingredients Feature Verification

The Raw Ingredients feature under Central Kitchen was verified in the running preview after implementation.

| Check | Result |
|---|---|
| List route | `/central-kitchen/raw-ingredients` loaded successfully |
| Detail route | `/central-kitchen/raw-ingredients/raw-ingredient-chicken-breast` loaded successfully |
| Seed data visible | Chicken Breast and Yellow Onion appeared on the list page |
| Supplier linkage | Preferred supplier resolved on the list and detail pages |
| Base-unit stock fields | `current_stock`, `par_level`, `reorder_point`, `reorder_quantity`, and `minimum_order_quantity` were displayed as base-unit values |
| Structure scope | Feature remained under Central Kitchen only |

The list page displayed the approved single-table Raw Ingredients model in a simple structural table. The detail page displayed all approved fields, including `preferred_supplier_id`, `base_unit`, stock fields, and system timestamps.
