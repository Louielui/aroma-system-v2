# Logistics Phase 2 Planning Spec

This document defines the **planning-only architecture** for **Logistics Phase 2** in `aroma-system-v2`. It does **not** authorize implementation yet. The purpose of this phase is to establish the correct operational boundaries before any data, repository, or page work begins.

The controlling principle is that **Logistics owns execution, movement, and tracking**, but it does **not** own the original business intent. Internal replenishment intent belongs to the internal operating flow, grocery demand belongs to grocery ordering, and inbound collection intent belongs to procurement or external sourcing context. Logistics becomes responsible when a movement task must be executed, monitored, and completed.

| Planning rule | Decision |
| --- | --- |
| Shared across flows | **Status and tracking only** |
| Must remain separate | **Internal Transfer**, **External Pickup**, and **Grocery Customer Order Fulfillment** |
| Shared monitor page | **Delivery Status** |
| Internal-transfer-only record | **Transfer Order** |
| Avoid in Phase 2 | A single generic logistics master table that merges all business flows |
| Phase output | Architecture, models, statuses, page sets, and implementation order only |

## 1. Shared Logistics Status Model

The shared model should represent the **execution state of movement**, not the business meaning of the record. This means the same status vocabulary can be reused across different flow-specific records, while each flow still keeps its own domain model and page set.

### 1.1 Purpose of the shared status model

The shared status model exists to power **Delivery Status** and other operational tracking views. It should answer questions such as which records are pending action, currently in transit, completed, delayed, or blocked by an exception. It should not replace flow-specific tables.

| Shared concept | Meaning |
| --- | --- |
| **logistics_status** | Current operational state of execution |
| **tracking timestamps** | When work was created, assigned, dispatched, received, completed, or flagged |
| **exception state** | Whether the record has an issue requiring attention |
| **tracking reference** | Flow-specific identifier shown in Delivery Status |
| **origin type** | Which flow owns the record: internal transfer, external pickup, or grocery fulfillment |

### 1.2 Recommended shared status values

The shared statuses should stay operational and neutral. They should be understandable across all three flows.

| Status | Meaning | Applies to |
| --- | --- | --- |
| `draft` | Record is created but not yet ready for execution | Flow-specific records that support drafting |
| `pending_review` | Waiting for operational review or confirmation before execution starts | All flows where review is needed |
| `approved` | Approved and ready for execution planning | Internal Transfer, External Pickup, Grocery Fulfillment |
| `assigned` | Assigned to staff, runner, or driver | All execution flows |
| `picking` | Items are being picked, packed, or assembled | Internal Transfer, Grocery Fulfillment |
| `awaiting_pickup` | Waiting to collect from supplier or supermarket | External Pickup |
| `in_transit` | Movement is underway toward destination | All flows |
| `arrived` | Reached destination and awaiting final receipt/confirmation | All flows |
| `completed` | Operational flow is finished | All flows |
| `partially_completed` | Finished with shortages, partial receipt, or partial fulfillment | All flows |
| `cancelled` | Cancelled before completion | All flows |
| `exception` | An issue requires intervention | All flows |

### 1.3 Recommended shared tracking fields

These fields should be considered a **tracking shape** reused conceptually across the separate flow-specific models. They do not require a single database table in Phase 2.

| Field | Purpose |
| --- | --- |
| `logistics_status` | Shared execution status |
| `tracking_reference` | Human-readable operational code for status view |
| `origin_flow_type` | `internal_transfer`, `external_pickup`, or `grocery_order_fulfillment` |
| `assigned_to_user_id` | Person responsible for the execution step |
| `scheduled_date` | Planned execution date |
| `dispatched_at` | When movement started |
| `arrived_at` | When movement reached destination |
| `completed_at` | When flow was fully completed |
| `exception_code` | Optional normalized issue label |
| `exception_notes` | Free-text operational issue notes |
| `destination_location_id` | Receiving or fulfillment destination |

### 1.4 Shared exception categories

Exceptions should also be shared conceptually because operational risk patterns repeat across flows.

| Exception code | Meaning |
| --- | --- |
| `short_qty` | Picked or received quantity is less than expected |
| `missing_item` | Required line item was unavailable |
| `damaged_item` | Item cannot be accepted or delivered |
| `pickup_delay` | Supplier or supermarket pickup was delayed |
| `delivery_delay` | Delivery to destination was delayed |
| `destination_closed` | Destination could not receive |
| `order_change` | Request changed after execution started |
| `other` | Manual fallback category |

## 2. Architectural Separation: Shared Tracking vs Flow-Specific Records

The key design rule is that **shared tracking is horizontal**, while **flow-specific records are vertical**. The shared layer gives the operations team one unified status lens. The flow-specific layers preserve business meaning and keep the data model clean.

| Layer | Role | Must remain shared or separate |
| --- | --- | --- |
| **Delivery Status** | Shared monitoring surface across all movement work | **Shared** |
| **Shared status vocabulary** | Reusable operational lifecycle terms | **Shared** |
| **Shared tracking timestamps and exception logic** | Common execution monitoring fields | **Shared** |
| **Internal Transfer record** | Internal movement from Central Kitchen to Store | **Separate** |
| **External Pickup record** | Inbound collection from supplier or supermarket | **Separate** |
| **Grocery Fulfillment record** | Outbound fulfillment of grocery demand | **Separate** |
| **Transfer Order** | Internal-transfer execution record only | **Separate and restricted** |

The system should therefore avoid one generic record such as `logistics_jobs` as the primary domain table in Phase 2. If a unified reporting table is ever needed later, it should be introduced only as a derived reporting projection after the business flows have proven stable.

## 3. Internal Transfer Planning Model

Internal Transfer covers **Central Kitchen → Stores** movement. This is the cleanest logistics flow because both origin and destination are internal locations. It should be the first implementation target after planning approval.

### 3.1 Business role

Internal Transfer represents a controlled inventory movement between internal locations. In this flow, the **Transfer Order** is valid as the core execution record because the business meaning is truly a transfer.

### 3.2 Recommended data model

| Field | Purpose |
| --- | --- |
| `id` | Unique transfer record identifier |
| `transfer_order_number` | Human-readable transfer order code |
| `request_date` | Date the transfer was raised |
| `source_location_id` | Usually Central Kitchen in this phase |
| `destination_location_id` | Store receiving the transfer |
| `requested_by_user_id` | Who requested the movement |
| `approved_by_user_id` | Who approved the transfer |
| `scheduled_dispatch_date` | Planned dispatch date |
| `logistics_status` | Shared execution status |
| `priority` | `normal`, `urgent`, or `scheduled` |
| `notes` | Operational notes |
| `line_items` | Separate embedded line list for requested items |
| `assigned_to_user_id` | Runner or responsible staff |
| `picked_at` | When picking completed |
| `dispatched_at` | When transfer left source |
| `received_at` | When destination confirmed receipt |
| `exception_code` | Shared exception code |
| `exception_notes` | Shared exception notes |

### 3.3 Recommended line item shape

| Field | Purpose |
| --- | --- |
| `id` | Unique line identifier |
| `raw_ingredient_id` | Linked stock item |
| `item_name` | Snapshot name for audit readability |
| `base_unit` | Must match existing inventory standard |
| `requested_quantity` | Quantity requested |
| `picked_quantity` | Quantity actually picked |
| `received_quantity` | Quantity actually received |
| `line_notes` | Optional line-level note |

### 3.4 Internal Transfer page set

| Page | Purpose |
| --- | --- |
| **Transfer Orders List** | View all internal transfer records with status and location filters |
| **Transfer Order Detail** | View header, lines, status progression, and receipt result |
| **Create Transfer Order** | Raise a new internal transfer request |
| **Edit Transfer Order** | Update request before operational lock point |
| **Transfer Picking Page** | Operational picking confirmation against requested lines |
| **Transfer Receipt Page** | Destination receipt confirmation and discrepancy capture |

### 3.5 Internal Transfer lifecycle

| Stage | Meaning |
| --- | --- |
| Request raised | Transfer need is created |
| Reviewed / approved | Operational approval is completed |
| Picking | Source location prepares stock |
| Dispatched | Transfer leaves source |
| Arrived / received | Destination receives items |
| Completed or exception | Flow closes normally or with discrepancy |

## 4. External Pickup Planning Model

External Pickup covers movement from **supplier or supermarket → Central Kitchen or Store**. This is an inbound logistics flow. It must remain distinct from Internal Transfer because the origin is external and the business context is collection, not internal stock transfer.

### 4.1 Business role

External Pickup executes a collection task after a sourcing or purchase decision already exists elsewhere. Logistics does not decide what to buy. Logistics only performs the pickup and confirms arrival.

### 4.2 Recommended data model

| Field | Purpose |
| --- | --- |
| `id` | Unique pickup record identifier |
| `pickup_task_number` | Human-readable pickup code |
| `pickup_source_type` | `supplier` or `supermarket` |
| `supplier_id` | Linked supplier when applicable |
| `pickup_source_name` | Snapshot source name |
| `destination_location_id` | Central Kitchen or Store receiving goods |
| `requested_by_user_id` | Who initiated the operational pickup request |
| `scheduled_pickup_date` | Planned collection date |
| `assigned_to_user_id` | Person responsible for collection |
| `vehicle_or_method` | Optional operational transport note |
| `logistics_status` | Shared execution status |
| `notes` | Operational notes |
| `line_items` | Separate embedded pickup line list |
| `picked_up_at` | When goods were collected |
| `arrived_at` | When goods reached destination |
| `completed_at` | When receipt and close-out finished |
| `exception_code` | Shared exception code |
| `exception_notes` | Shared exception notes |

### 4.3 Recommended line item shape

| Field | Purpose |
| --- | --- |
| `id` | Unique line identifier |
| `item_name` | Snapshot item description |
| `base_unit` | Standard quantity unit |
| `expected_quantity` | Planned quantity to collect |
| `picked_up_quantity` | Actual collected quantity |
| `received_quantity` | Quantity accepted by destination |
| `line_notes` | Operational note |

### 4.4 External Pickup page set

| Page | Purpose |
| --- | --- |
| **External Pickup List** | View all pickup tasks with source and destination filters |
| **External Pickup Detail** | View task details, source, assigned runner, and status |
| **Create External Pickup Task** | Create a pickup execution record |
| **Edit External Pickup Task** | Modify details before execution lock point |
| **Pickup Confirmation Page** | Confirm collected quantities at source |
| **Pickup Receipt Page** | Confirm destination receipt and discrepancies |

### 4.5 External Pickup lifecycle

| Stage | Meaning |
| --- | --- |
| Pickup requested | Logistics is asked to collect goods |
| Reviewed / approved | Pickup is authorized |
| Assigned | Staff is assigned |
| Awaiting pickup | Scheduled but not yet collected |
| In transit | Goods are on the way to destination |
| Arrived / received | Destination has received the goods |
| Completed or exception | Flow closes normally or with issue |

## 5. Grocery Customer Order Fulfillment Planning Model

Grocery Customer Order Fulfillment covers **customer-facing or store-facing grocery demand** that must be picked, packed, and delivered or handed over. This should remain distinct from both Internal Transfer and External Pickup because the business meaning is fulfillment, not transfer or inbound collection.

### 5.1 Business role

This flow executes demand fulfillment. The business intent is an order. Logistics owns the downstream execution once the order is ready for fulfillment.

### 5.2 Recommended data model

| Field | Purpose |
| --- | --- |
| `id` | Unique fulfillment record identifier |
| `fulfillment_order_number` | Human-readable fulfillment code |
| `grocery_order_reference` | Reference back to the originating order |
| `customer_or_requestor_name` | Snapshot requestor identity |
| `fulfillment_type` | `delivery` or `pickup` |
| `source_location_id` | Fulfillment origin |
| `destination_location_id` | Delivery destination or pickup site |
| `requested_by_user_id` | Who created or confirmed the order |
| `scheduled_fulfillment_date` | Planned date |
| `assigned_to_user_id` | Staff handling execution |
| `logistics_status` | Shared execution status |
| `packing_notes` | Packing or handling notes |
| `line_items` | Separate embedded fulfillment line list |
| `packed_at` | When packing finished |
| `dispatched_at` | When order left source |
| `completed_at` | When delivery or pickup was confirmed |
| `exception_code` | Shared exception code |
| `exception_notes` | Shared exception notes |

### 5.3 Recommended line item shape

| Field | Purpose |
| --- | --- |
| `id` | Unique line identifier |
| `item_name` | Snapshot item description |
| `base_unit` | Standard quantity unit |
| `ordered_quantity` | Quantity requested by customer or requestor |
| `fulfilled_quantity` | Quantity actually prepared |
| `delivered_quantity` | Quantity actually handed over |
| `substitution_notes` | Manual note for substitutions or shortages |

### 5.4 Grocery Fulfillment page set

| Page | Purpose |
| --- | --- |
| **Grocery Fulfillment List** | View fulfillment records with delivery/pickup and status filters |
| **Grocery Fulfillment Detail** | View order execution, line items, and completion state |
| **Create Fulfillment Record** | Create logistics execution record from an approved grocery order |
| **Edit Fulfillment Record** | Update schedule or assignment before lock point |
| **Packing / Pick Confirmation Page** | Confirm prepared and packed quantities |
| **Delivery / Handover Completion Page** | Confirm completed delivery or pickup |

### 5.5 Grocery Fulfillment lifecycle

| Stage | Meaning |
| --- | --- |
| Fulfillment requested | Grocery demand enters logistics execution |
| Reviewed / approved | Ready for operational work |
| Picking / packing | Items are prepared |
| In transit or ready for pickup | Movement or handover readiness |
| Completed or partially completed | Order finished with or without shortage |
| Exception | Delay, substitution, or shortage requires review |

## 6. Delivery Status as the Shared Monitoring Surface

Delivery Status should not be treated as a parent transactional table. It should be treated as the **shared operational tracking surface** across the three separate flow types.

| Delivery Status responsibility | Included |
| --- | --- |
| Cross-flow queue of active work | Yes |
| Shared filters by status, location, assignee, and date | Yes |
| Visibility of exceptions and delays | Yes |
| Direct ownership of business records | No |
| Replacement for flow-specific detail pages | No |

The Delivery Status page should therefore show a normalized summary row structure such as the following.

| Field in shared status view | Purpose |
| --- | --- |
| `tracking_reference` | Primary visible code |
| `origin_flow_type` | Internal Transfer, External Pickup, or Grocery Fulfillment |
| `source_label` | Readable source |
| `destination_label` | Readable destination |
| `scheduled_date` | Planned execution date |
| `assigned_to_name` | Current owner |
| `logistics_status` | Shared status |
| `has_exception` | Quick issue indicator |

## 7. Recommended Implementation Order After Planning Approval

The recommended build order should follow the most stable execution pattern first and defer the most variable fulfillment behavior until later.

| Order | Scope | Why |
| --- | --- | --- |
| **1** | Shared status vocabulary and Delivery Status tracking shape | Establishes common execution language first |
| **2** | Internal Transfer model and pages | Cleanest and most controlled logistics pattern |
| **3** | Internal Transfer picking and receipt flow | Validates execution lifecycle end-to-end |
| **4** | External Pickup model and pages | Reuses status logic with external-origin differences |
| **5** | External Pickup confirmation and receipt flow | Completes inbound execution pattern |
| **6** | Grocery Fulfillment model and pages | Adds order-based outbound logistics after backbone is stable |
| **7** | Grocery packing and delivery completion flow | Finishes the most variable execution pattern last |

## 8. Phase 2 Planning Decisions to Preserve

| Decision | Rule to preserve during implementation |
| --- | --- |
| Logistics ownership | Logistics owns **execution**, not original business intent |
| Shared model boundary | Only **status, tracking, timestamps, and exceptions** are shared |
| Flow separation | Internal Transfer, External Pickup, and Grocery Fulfillment remain separate domain models |
| Transfer Order scope | Transfer Order is used **only** for Internal Transfer |
| Delivery Status role | Shared monitoring page, not the parent transactional record |
| Generic table avoidance | Do not collapse all flows into one generic master model in Phase 2 |

## 9. Recommended Implementation Files Later

This section is still planning-only, but it establishes the intended structural pattern for a future build.

| Flow | Planned structural pattern |
| --- | --- |
| Internal Transfer | `types` → `validation` → `repository` → `pages` |
| External Pickup | `types` → `validation` → `repository` → `pages` |
| Grocery Fulfillment | `types` → `validation` → `repository` → `pages` |
| Shared Delivery Status | shared tracking types + status helpers + monitoring page |

No implementation should begin until this planning spec is explicitly approved for build-out.
