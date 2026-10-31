# Connected procurement development plan

Prepared: 2026-10-31. Status: proposed implementation roadmap. This document changes no application behavior.

**Outcome**

Turn the existing requisition, RFQ/bid, contract, PO, goods receipt, budget, and invoice screens into one controlled procurement process, ending in recorded supplier settlement. Every quantity and amount must have an identifiable source, remaining balance, authorized transition, and reversal path.

The target workflows are:

- Competitive goods purchase: requisition → RFQ → supplier quotations → award → PO → receipt and acceptance → matched invoice → payment allocation.
- Repeat purchase: approved requisition → PO, optionally under a contract → receipt → invoice → payment.
- Service purchase: approved requisition → PO → service acceptance → invoice → payment.
- Approved advance: PO → recorded supplier advance → later invoice and advance allocation → balance payment.

Budget checks span these workflows. Contracts govern eligible orders and release limits. Neither is a mandatory sequential step for every purchase.

**Current implementation and gaps**

This baseline comes from inspection of the Prisma schema, Python schemas/routes/services, frontend structure, and test entry points. It is not a full production audit.

| Area | Existing foundation | Work required |
| --- | --- | --- |
| Requisitions | Item rows, approval lifecycle, estimated amounts, text budget codes | Stable item/budget references, downstream allocations, ordered/received balances |
| RFQs and bids | Supplier invitations, item bids, one-supplier award | Quotation versions/terms, source item allocations, award quantities, reliable PO conversion |
| POs | Supplier/RFQ references, item rows, approval/issue actions | Requisition and quotation lineage, contract releases, budget commitments, derived progress |
| Receipts | PO references, accepted/rejected fields, remaining-quantity helper | Enforced source ownership, cumulative limits, line-level inspection, returns, service acceptance |
| Invoice matching | Quantity/rate tolerance checks and match flags | Partial and cumulative matching, mandatory references where required, explained exceptions, safe approval |
| Payments | Invoice `pay` action sets status and timestamp | Payment documents, allocation records, partial payments, advances, reversal |
| Budgets | Limits and check/adjustment helpers | Calls from business transitions, dated/currency-aware allocations, transaction history, reconciliation |
| Contracts | Supplier, value, validity, lifecycle, amendments | Covered items/rates, meaning of value, approved release allocation and consumption |
| Integrity | Audit service, organization identifiers, RBAC | Action-specific authorization, atomic writes, concurrency protection, idempotency, enforced relationships |
| UI and tests | React pages/hooks/types; API and signup smoke scripts; Playwright setup | Connected creation, progress and exception views, domain integration tests, migration rehearsal |

Specific defects to fix as part of this roadmap:

- `invoice_service.py` compares the current invoice quantity to an expected total rather than remaining billable quantity. It does not deduct previous invoices and can use ordered quantity when accepted quantity is zero.
- `gr_service.py` accepts every received unit during the document accept action, overwriting mixed inspection outcomes. It marks a PO completed based on receipt alone.
- PO and invoice action routes admit users with any of several permissions; their services do not enforce the permission for each requested action. Mismatched invoices can follow the ordinary approve transition.
- Several source identifiers are scalar strings without declared Prisma relations, and some related-document reads omit explicit organization scope.
- Creation writes headers and items separately; several document numbers use `count + 1`. These patterns need atomicity and concurrency protection.
- Monetary values currently use floating-point fields. Budget helpers select the current calendar year rather than the transaction's explicit applicable budget period.

**Recommended policy baseline**

These are proposed defaults to make implementation concrete. Record changes in a decision register before affected behavior is built; this plan does not represent approval of accounting policy.

| Decision | Proposed initial behavior |
| --- | --- |
| Authorization | Approved requisition required for normal purchases; explicit permission and reason for direct-order exceptions |
| Budget reservation | Requisition approval checks availability; PO approval creates the hard commitment. Optional requisition reservations can follow later |
| Budget consumption | Approved invoice recognizes procurement value and replaces its corresponding commitment; payment does not consume it again |
| Budget basis | Non-recoverable purchase cost, with tax/freight treatment explicitly configured; distinguish from accounting expense and cash |
| Budget scope | Organization + dated period + cost center/project + spending category + currency; reject ambiguous overlapping allocations |
| Missing budget | Block a budget-controlled line with no valid allocation; allow an explicit, audited exemption |
| Currency | Initial controlled workflow uses a matching currency across budget, contract, quotation, PO, invoice and allocation; reject unsupported combinations |
| Receiving | Issued PO required; accepted quantities determine fulfillment and ordinary billing eligibility |
| Matching | Zero overbilling and over-receipt tolerance initially; permitted rate/rounding tolerances configured separately |
| Services | Require milestone, quantity, or amount acceptance evidence; do not create warehouse stock |
| Contract values | Explicitly identify ceiling versus estimate versus minimum commitment; enforce ceilings only where applicable |
| Approval duties | Separate create, approve, inspect, override, payment authorization and settlement recording; self-approval blocked by default with a configured, audited exception |
| Historical records | Preserve legacy status and evidence; do not infer acceptance, payment, or accounting postings that cannot be demonstrated |

The first release is a procurement control and supplier settlement register. Full stock valuation, double-entry accounting, automatic bank transfers, tax filing, and foreign-exchange gains/losses require separate integration work. Recording a payment must clearly mean recording externally executed settlement, not initiating a bank transfer.

**Implementation rules shared by all phases**

- Use database decimal values for money and defined precision for quantities/rates. Define rounding and JSON serialization centrally; the browser must not be the authority for financial totals.
- Validate organization, supplier, source-document state, source-item membership, currency, and UOM on the server. Client-provided ordered quantities and source prices are informational only.
- Commit document transitions, allocations, balance changes, and required audit events in one database transaction. Dispatch notifications after commit, using an outbox where delivery reliability matters.
- Protect availability checks and consumption together through supported row locking or conditional/versioned updates. Check actual Prisma Python transaction capabilities before selecting the implementation.
- Add organization-scoped unique document numbering, retry-safe mutation keys, allocation uniqueness constraints, and stale-update detection.
- Make transaction/allocation history authoritative. Cached totals must reconcile to it; never silently clamp an invalid negative balance to zero.
- Preserve submitted commercial snapshots. Corrections use versioned amendments or linked reversals; prohibit deletion of referenced submitted documents.
- Keep lifecycle, receipt, billing, settlement, and exception states separate. Derive progress from valid transactions.
- Apply existing API response conventions and EN/AR/FR translation/Arabic RTL requirements to every delivered phase.
- Deliver backend, frontend, permissions, migration, and meaningful tests together for each usable workflow slice.

**Phase 0 — Freeze the business rules and record the baseline**

Deliverables:

- A transition matrix for each document: actor permission, allowed source state, validations, resulting effects, reversal, and audit evidence.
- A policy register covering the defaults above, approval thresholds, invoice tolerances, return replacement choices, and closed-period treatment.
- A representative data-quality report for missing references, invalid links, duplicate supplier invoices, currencies, manual completed/paid states, and budget balances.
- A compatibility map for existing APIs, frontend types, permissions, seeds, smoke tests and cleanup scripts.
- A clear decision on receipt/stock scope and how an external accounting system will receive procurement events.

Completion evidence: worked examples for partial delivery, partial invoice, advance, return, budget overrun and contract release have agreed expected balances. Establish current test results and environment requirements without changing existing behavior.

**Phase 1 — Build the shared data and transaction foundation**

Depends on Phase 0.

Deliverables:

- Introduce stable organization-scoped item/service, UOM, cost-center/project, and spending-category references. Allow authorized one-off items with explicit specifications and immutable snapshots.
- Add proper source relations and allocation structures. Preserve allocations when compatible request items are combined into one commercial line.
- Add separate lifecycle/progress fields and a shared transition/authorization layer.
- Introduce decimal migration, safe numbering, idempotency, optimistic version checks, atomic creation/transition helpers, and structured business errors.
- Add budget movement and contract release structures now so PO approval can later commit all related effects atomically.
- Define attachment metadata and access checks for quotations, inspection evidence, service acceptance and payment evidence.

Candidate model additions, to finalize in the schema design:

| Concept | Responsibility |
| --- | --- |
| Request/source allocation | Quantities carried from request items through RFQ/award/PO items |
| Supplier quotation + items/revisions | One supplier's versioned offer, terms, validity and line prices |
| Award allocation | Selected quotation quantities and documented selection decision |
| Budget line/allocation/movement | Budget attribution, commitment, recognition, release, transfer and reversal |
| Contract item/revision/release | Covered terms and quantities/value consumed by approved orders |
| Receipt acceptance/service acceptance | Submitted evidence and accepted/rejected/pending quantities or milestones |
| Invoice source allocation | Invoice quantities/values consumed from PO and accepted receipt/service sources |
| Match exception/override | Variance details, resolution and authorized override evidence |
| Payment + invoice allocation | Externally executed settlement and its distribution to invoices |
| Advance allocation | Supplier advance balance and later application |
| Purchase return + credit note | Independent physical and financial corrections |

Completion evidence: cross-organization references fail; interrupted creation leaves no orphan header; concurrent numbering is unique; repeated transitions do not duplicate effects; decimal conversion has a reconciliation report.

**Phase 2 — Connect approved requisitions to sourcing and POs**

Depends on Phase 1. Reuse existing RFQ/bid functions and migrate them rather than building a disconnected second quotation system.

Deliverables:

- Create RFQs and POs from eligible approved request quantities. Support splitting one request across orders and combining compatible requests.
- Evolve bids into quotation records with supplier reference, validity, delivery/payment terms, currency, attachments and revision history.
- Add comparison and recorded award decisions, including per-line or split awards. Preserve original offers after award.
- Create POs from the selected offer with server-derived prices, source allocations, due dates and terms. Handle repeat purchases and direct exceptions explicitly.
- Enforce approved supplier status, request capacity, source eligibility, action permissions and commercial amendments.
- Replace manual completion with separate derived fulfillment/billing progress; keep deliberate closing of unfulfilled balances as an authorized action.
- UI: source selectors show remaining quantities, previews show inherited terms, and document pages expose source links and progress.

Completion evidence: a request for 100 units can create orders for 60 and 40; a further allocation is blocked. Concurrent approvals cannot over-order. Expired/unselected quotations cannot silently become order sources. Price changes require the appropriate authorization.

**Phase 3 — Enforce budget and contract controls at commitment**

Depends on Phase 2. Receipt and invoice work can be developed in sequence afterward; do not release controlled PO approval until these effects are atomic.

Deliverables:

- Replace free-text budget attribution with explicit dated budget-line allocations and explicit currency. Support a line split between budgets with allocations that sum to its controlled value.
- At requisition approval, check budget according to policy. At PO approval, recheck and create commitment movements atomically.
- Add period distribution and actual period dates for monthly/quarterly/yearly budgets, revisions, authorized transfers, and defined carry-forward treatment.
- Add contract-covered items/rates, approved amendments with effective dates, and quantity/value ceilings where applicable.
- Validate contract supplier, validity, covered scope and available release capacity at PO approval. Snapshot the applied contract version; future amendments must not rewrite historical POs.
- On PO amendment/closure, adjust only the affected open commitment and eligible contract release balance. Expiry blocks new releases without cancelling existing obligations.
- UI: budget availability previews, warning/block explanations, contract remaining capacity, linked orders and movement history.

Completion evidence: a $10,000 PO reserves $10,000 once; retry does not reserve twice. Two simultaneous POs cannot exceed a STOP budget or contract ceiling. Closing an undelivered balance releases only that balance. Transaction dates, not today's year, select the budget.

**Phase 4 — Deliver partial receiving and service acceptance**

Depends on Phases 2–3.

Deliverables:

- Create receipts from eligible remaining PO quantities; derive supplier, source quantity, UOM and price from the order.
- Record per-line physical receipt, accepted, rejected and pending-inspection quantities. Finalized inspection must account for every received unit.
- Preserve mixed inspection results; acceptance must not overwrite line decisions. Protect cumulative physical receipt/acceptance limits, including concurrent submissions.
- Track rejected goods awaiting return separately from usable/accepted goods. Record replacement obligations explicitly.
- Add quantity-, milestone- or amount-based service acceptance with evidence and authorized acceptance.
- Update PO/request fulfillment from valid acceptance events. Full receipt must not imply full billing or payment.
- UI: partial receipt entry, per-line inspection, expected balance, pending acceptance queue and delivery history.

Completion evidence: of 60 delivered units, 55 can be accepted and 5 rejected; only 55 become ordinarily billable. A later accepted replacement increases fulfillment appropriately. Services never create stock movements.

**Phase 5 — Replace invoice matching with cumulative allocation checks**

Depends on Phases 3–4.

Deliverables:

- Create invoices from eligible sources for the same organization/supplier/currency, including several receipts or POs in one invoice. Retain header references only as compatibility summaries.
- Distinguish bill registration, validation, approval and payment hold. Check normalized supplier invoice references within the appropriate organization/supplier scope; define explicit handling for missing references and legitimate duplicates.
- Compute remaining billable quantities/amounts using prior active allocations and linked adjustments. Underbilling in a partial invoice is valid; exceeding remaining eligible quantity is an exception.
- Match PO price, accepted quantity/service value, currency, discounts, freight, tax and rounding using explicit tolerances. Return actionable line-level reasons.
- Require a dedicated override permission, reason and evidence for eligible exceptions; source ownership and already-consumed quantities are non-overridable integrity rules.
- Revalidate at approval against current allocations, avoiding stale-match approvals. Claim billable capacity atomically at approval; drafts do not consume it.
- On approval, move the corresponding PO commitment into recognized procurement value. Handle price/tax variances as explicit budget movements and enforce available budget for increases.
- UI: three-way comparison, previous invoices, remaining eligibility, exception resolution and budget effects.

Completion evidence: after accepting 60 units and invoicing 30, another invoice for 30 passes and one for 31 fails at zero tolerance. Missing goods acceptance cannot fall back to ordered quantity. A creator cannot approve or override without the required permissions.

**Phase 6 — Add payments, advances and supplier outstanding balances**

Depends on Phase 5.

Deliverables:

- Introduce payment documents: supplier, currency, amount, execution date, method, external reference, evidence, authorization and reversal lifecycle.
- Record confirmed external payments and allocate them across approved, payable invoices. Support several payments per invoice and one payment across several invoices.
- Support approved PO/supplier advances, unallocated advance balances and later application to invoices without recording a second cash payment.
- Derive unpaid/partially paid/paid from valid allocations and credits; replace the old `pay` action with the payment workflow.
- Prevent allocations above payment capacity or invoice outstanding, including concurrent requests. Separate authorization from recording execution and optional reconciliation.
- UI: payment entry, allocation selector, advance application, supplier statement, invoice outstanding and overdue queues.

Completion evidence: a $6,000 invoice paid $4,000 shows $2,000 outstanding. A $3,000 advance is applied once. Reversing a payment restores the correct outstanding without changing procurement budget consumption.

**Phase 7 — Complete reversals, returns, credits and closeout**

Depends on Phases 4–6. Design reversal hooks and tests in the earlier phases; complete cross-document handling here before production release.

Deliverables:

- Record purchase returns against receipt lines, with quantities, reasons, rejected/accepted source, and replacement versus final-return decision.
- Record supplier credit notes against invoice allocations. Handle quantity credits, price-only credits, refunds, paid invoices and residual supplier credit separately.
- Reverse approved invoices/payments through authorized linked documents; resolve downstream dependencies and closed-period restrictions.
- Add PO/request closing of remaining quantities, controlled amendment/reapproval, contract termination effects and reconciliation views.
- Define whether a credit restores order billing capacity or closes entitlement. Define replacement acceptance separately so returning rejected goods does not duplicate the outstanding requirement.
- Do not automatically reopen budget or contract capacity for a return: apply the documented cancellation/replacement/credit policy and effective period.

Completion evidence: returning goods does not silently erase an invoice or create an assumed supplier credit. Credits and refunds reconcile after payment. Each reversal restores only the affected allocations, once, with original evidence retained.

**Phase 8 — Reporting, migration and controlled release**

Depends on all earlier phases. Build migration scripts incrementally with their schema changes, then rehearse the complete upgrade here.

Deliverables:

- A procurement trace view from request to sourcing, orders, acceptance, invoices, credits and settlements.
- Queues/reports: unordered requests, overdue orders, pending inspection, accepted-but-unbilled goods, invoice exceptions, overdue invoices, advances, budget movements and contract consumption.
- Audit views explain approvals, changes, exceptions, source allocations and reversals. Dashboards use the same authoritative calculations as validation.
- Additive versioned migrations: expand schema → deploy compatible reads/writes → validate/backfill → enforce constraints → retire legacy behavior later.
- A migration report for Float-to-Decimal differences, orphan source strings, legacy completed/paid states, unsupported currencies, duplicates and budget opening balances.
- Backfill only demonstrable relationships. Place unresolved historical records in a review queue; record authorized opening balances with provenance. Never create fictional payments from `paidAt` alone.
- Organization-level rollout controls prevent mixing legacy mutations with new balance rules. Rollback must not reactivate legacy writes against newly controlled records.
- Rehearse backup/restore and migration on a copy. Reconcile document counts, totals, commitments, releases, billable capacity and outstanding before and after.
- Run API regression, domain integration/concurrency tests, frontend build/lint and browser workflows, including EN/FR/Arabic RTL and permission-specific actions.

Completion evidence: all release scenarios below pass; migration exceptions are resolved or explicitly quarantined; one pilot organization reconciles before broader activation.

**Required release scenarios**

1. $20,000 budget; approved request estimate $11,000; PO $10,000. PO commitment is $10,000 and available budget is $10,000 under the recommended no-request-reservation policy.
2. Receive 60 units; accept 55, reject 5. Accepted balance is 55, and 45 units of acceptable fulfillment remain.
3. Invoice 30 accepted units at $100. Recognized purchases are $3,000, open commitment is $7,000 and available budget remains $10,000. Further 25-unit invoice is eligible; a 26-unit invoice exceeds current eligibility.
4. Pay $2,000 against the $3,000 invoice. Outstanding is $1,000; budget balances are unchanged by payment.
5. Complete replacement and remaining deliveries, invoice and settlement. Fulfillment, billing and settlement each reach completion independently.
6. Repeat source selection, approval, payment allocation and reversal with the same retry key. No effect is duplicated; changed payload with the same key is rejected.
7. Submit competing orders, receipts, invoices and payments simultaneously. No budget, contract, quantity or settlement capacity is over-consumed.
8. Attempt cross-organization references, wrong-source item references and unauthorized approval/override/payment actions. All fail without partial writes.
9. Test a price variance, tax/freight adjustment, budget STOP/WARN/IGNORE behavior, period boundary and unsupported currency.
10. Test a contract expiry, effective amendment, release ceiling, service milestone, supplier advance, physical return, price credit, refund and reversal after partial payment.
11. Upgrade representative legacy data, compare balances, inspect unresolved records and rehearse rollback/restore.

**Work packaging and completion criteria**

Implement phases as small reviewable changes, normally: schema/migration → domain rules and APIs → connected UI → end-to-end verification. Keep intermediate changes behind rollout controls where the workflow is incomplete.

Every business-rule change needs relevant database-backed tests; reserve browser tests for user journeys and permission visibility. In this repository, extend the existing API smoke coverage and Playwright setup, and add focused domain integration tests for cumulative balances, transaction rollback, concurrency and reversals. Update seed permissions and test cleanup for new relations.

Start with Phase 0, followed by Phase 1. The first demo milestone is an approved request converted into a traceable PO with correct remaining quantities. The next is a budget- and contract-controlled order. The full release requires partial acceptance, matching, settlement, reversals and migration verification through Phase 8. Estimate calendar delivery after Phase 0 establishes data quality, team capacity and accounting/inventory integration scope.

**Reference material**

ERPNext is a workflow reference. The transaction model, budget policy, approval boundaries and migration rules above are proposals for this repository, not claims that ERPNext implements each rule identically.

- [Buying workflow](https://docs.frappe.io/erpnext/buying)
- [Material Request](https://docs.frappe.io/erpnext/material-request)
- [Request for Quotation](https://docs.frappe.io/erpnext/request-for-quotation)
- [Supplier Quotation](https://docs.frappe.io/erpnext/supplier-quotation)
- [Purchase Order](https://docs.frappe.io/erpnext/purchase-order)
- [Purchase Receipt](https://docs.frappe.io/erpnext/purchase-receipt)
- [Purchase Invoice](https://docs.frappe.io/erpnext/purchase-invoice)
- [Payment Entry](https://docs.frappe.io/erpnext/payment-entry)
- [Budget](https://docs.frappe.io/erpnext/budget)
- [Blanket Order](https://docs.frappe.io/erpnext/blanket-order)
- [Contract](https://docs.frappe.io/erpnext/contract)
- [Purchase-cycle accounting effects](https://docs.frappe.io/erpnext/purchase-cycle-ledger-impact)
