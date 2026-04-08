# AI Feature Restore Backlog

This backlog defines the approved restoration structure for AI capabilities in **Aroma System V2**. The controlling rule is that **AI must be embedded inside business modules**. AI is not a separate product area, not a separate sidebar item, and not a standalone module. Each AI capability must belong to a specific operational module and restore in business-priority order.

## Structural Rule

| Rule | Decision |
|---|---|
| AI placement | AI features must live inside existing modules |
| Standalone AI module | Not allowed |
| Navigation model | AI appears as functionality within module pages, not as a top-level section |
| Restore order | Restore by operational dependency, starting with Procurement-critical flows |

## Module-Attached AI Restoration Map

| Restore Order | AI Capability | Owning Module | Owning Page / Area | Restoration Phase | Notes |
|---|---:|---|---|---|---|
| 1 | **Invoice parsing** | **Procurement** | **Invoices** | Core AI features to restore early | This is the first AI dependency because downstream matching, review, and analytics require structured invoice extraction. |
| 2 | **Supplier matching** | **Procurement** | **Suppliers** | Core AI features to restore early | Supplier normalization and alias resolution should belong to the supplier domain, not to a shared AI area. |
| 3 | **Review / confidence rules** | **Procurement** | **Invoices** and **Suppliers** | Core AI features to restore early | This should operate at the points where parsing and supplier decisions are made, so uncertain results are routed for review in context. |
| 4 | **Price analysis** | **Procurement** | **Price Book** | Core AI features to restore early | Price intelligence belongs with price management and comparison workflows. |
| 5 | **Prep suggestion** | **Central Kitchen** | **Prep List** | Secondary or later domain AI restoration | This should support kitchen preparation workflows directly rather than exist as a generic assistant. |
| 6 | **AI Action Logs** | **Cross-module embedded** | Shown within each owning module activity/history view | Secondary AI features to restore later | Logs should be attached to the module where the AI action happened, such as Invoices, Suppliers, Price Book, Prep List, or HR. |
| 7 | **AI Memory** | **Cross-module embedded** | Stored per module context and reused inside each owning workflow | Secondary AI features to restore later | Memory should retain module-specific decisions such as supplier corrections, invoice review outcomes, prep preferences, or HR interpretation patterns. |
| 8 | **HR insights** | **HR** | **HR module** | Secondary or later domain AI restoration | HR-facing AI analysis must remain within HR workflows and should not appear as a separate analytics module. |
| 9 | **AI insights dashboards** | **Embedded by module** | Module dashboards such as Invoices, Price Book, Central Kitchen, and HR | Secondary AI features to restore later | Dashboards should report AI outcomes inside the business area they support. |

## Early Restoration Group

The early restoration group should remain tightly focused on **Procurement**, because that is where the clearest operational AI chain already exists. The correct early order is **Invoice parsing**, then **Supplier matching**, then **Review / confidence rules**, and then **Price analysis**.

This order matters because parsed invoice data must exist before suppliers can be matched reliably. Supplier matching should be stabilized before confidence rules are finalized, because the review layer needs to understand what is a clean match and what is uncertain. Price analysis should come after those steps, because pricing outputs are only trustworthy when the underlying invoice and supplier data are already controlled.

## Later Restoration Group

The later restoration group should expand AI deeper into module-specific support and observability. **Prep suggestion** belongs under **Central Kitchen**, specifically the **Prep List** workflow. **HR insights** belongs inside the **HR** module. **AI Action Logs**, **AI Memory**, and **AI insights dashboards** should all be embedded into the modules that generated the events, decisions, and history.

This means, for example, that invoice-related AI logs should appear in Procurement areas, kitchen-related AI memory should appear in Central Kitchen contexts, and HR-related AI insights should remain inside HR. Even when a capability is conceptually shared, it should still be presented and governed through the owning business workflow.

## Recommended Restoration Sequence

| Step | Module | Feature to restore | Why this step comes here |
|---|---|---|---|
| 1 | Procurement / Invoices | Invoice parsing | Establishes structured source data for all later procurement AI |
| 2 | Procurement / Suppliers | Supplier matching | Stabilizes vendor identity after invoice extraction |
| 3 | Procurement / Invoices + Suppliers | Review / confidence rules | Prevents uncertain parsing or matching from silently flowing downstream |
| 4 | Procurement / Price Book | Price analysis | Adds intelligence only after trusted procurement data exists |
| 5 | Central Kitchen / Prep List | Prep suggestion | Extends AI into kitchen operations after procurement AI is stable |
| 6 | Procurement, Central Kitchen, HR | AI Action Logs | Adds traceability inside each owning module |
| 7 | Procurement, Central Kitchen, HR | AI Memory | Adds module-specific retained learning after stable outputs exist |
| 8 | HR | HR insights | Restores HR-specific intelligence in its own module context |
| 9 | Procurement, Central Kitchen, HR | AI insights dashboards | Adds module-level AI reporting after enough reliable history accumulates |

## Architecture Implication

The approved structure means future implementation should follow a **module-owned AI pattern**. Procurement pages own Procurement AI. Central Kitchen pages own kitchen AI. HR pages own HR AI. Shared technical services may exist underneath, but the product structure, navigation, permissions, logging, and reporting should stay attached to the relevant business module rather than surfacing an independent AI section.
