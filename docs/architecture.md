# Application structure and navigation

The application uses domain folders directly under the `e-procurment` repository root. Files belonging to a business module live together; application wiring, shared UI and database infrastructure remain separate. Original applications are archived under ignored `backups/` and are not runtime dependencies.

```text
e-procurment/
├── backend/
│   ├── app/
│   │   ├── __init__.py          Flask application factory and blueprint registration
│   │   ├── config.py           Runtime configuration
│   │   ├── extensions.py       SQLAlchemy, migrations, JWT, localization, rate limiting
│   │   ├── cli.py              Seed and legacy import commands
│   │   ├── api/                Health endpoint
│   │   ├── core/               Tenant resolution, response envelope, access decorators
│   │   ├── models/             Shared SQLAlchemy mappings and repository
│   │   └── domains/
│   │       ├── identity/       Authentication and organization creation
│   │       ├── administration/ Users, roles, settings, audit, notifications, dashboards
│   │       ├── sourcing/       Suppliers, RFQs, tenders, proposals and awards
│   │       ├── procurement/    Requisitions, orders, goods receipts and invoices
│   │       ├── finance/        Budgets and contracts
│   │       └── evaluation/     AI provider integration
│   ├── migrations/             Versioned database history
│   ├── tests/                  Database and HTTP integration checks
│   └── worker.py               Evaluation worker entry point
├── frontend/
│   ├── src/
│   │   ├── main.tsx            Browser entry point
│   │   ├── index.css           Global stylesheet entry
│   │   ├── app/
│   │   │   ├── App.tsx         Routes and application composition
│   │   │   ├── providers/      Authentication and organization contexts
│   │   │   ├── pages/          Application-wide fallback pages
│   │   │   └── legacy/         Preserved original presentation references
│   │   ├── features/
│   │   │   ├── identity/       Login, password change, signup and access components
│   │   │   ├── portal/         Landing page, public tenders, contact and application pages
│   │   │   ├── supplier-portal/Company profiles and supplier dashboard
│   │   │   ├── tendering/      Tender lifecycle, proposal review, rankings and controls
│   │   │   ├── sourcing/       RFQs and supplier management
│   │   │   ├── procurement/    Requisitions, orders, receiving and invoices
│   │   │   ├── finance/        Budgets and contracts
│   │   │   └── administration/ Users, roles, settings, communications and dashboards
│   │   └── shared/
│   │       ├── navigation/    Three-level menu configuration, sidebar and breadcrumbs
│   │       ├── layout/        Application shell, top bar and public navigation
│   │       ├── brand/         TenderRank logo and theme controls
│   │       ├── ui/            Shared components used by the imported page families
│   │       ├── lib/           One API client, i18n initialization and utilities
│   │       ├── hooks/         Cross-feature browser hooks
│   │       ├── types/         Shared API and domain interfaces
│   │       ├── assets/        Common static assets
│   │       └── styles/        TenderRank design tokens and base styles
│   ├── public/locales/        English, French and Arabic resources
│   └── tests/                 Browser regression and navigation checks
├── docs/                      Architecture and operating documentation
├── compose.yml                Local infrastructure
├── start.ps1                  Local startup
└── stop-frontend.ps1           Stop only the frontend owned by the startup script
```

A backend domain has `routes/`, `schemas/` and `services/` when those layers are needed. Cross-domain SQLAlchemy models stay in `app/models/` so one database and one Alembic registry remain authoritative. Models and schema migrations were not changed by this folder reorganization.

Frontend business modules use `pages/` and `hooks/`, with `components/` or `services/` for feature-specific code. Imports use the existing `@/` alias. The two imported UI component families remain under `shared/ui/` because their component APIs differ; both use the TenderRank theme. Existing public URLs and API prefixes are preserved.

**Three-level sidebar**

The sidebar is configured in `frontend/src/shared/navigation/navigation.ts`. Business navigation is exactly **section → module → page**. Overview and the public portal are direct shortcuts.

```text
Overview
Sourcing
├── Suppliers → Supplier directory / Add supplier
├── Quotations → All RFQs / Create RFQ
├── Tenders → Tender register / Create tender / Approval queue
└── Evaluation → Supplier rankings
Procurement
├── Requisitions → All requisitions / Create requisition
├── Purchase orders → All purchase orders / Create purchase order
├── Receiving → All goods receipts / Record goods receipt
└── Purchase invoices → All purchase invoices / Create purchase invoice
Finance
├── Budgets → Budget overview / Create budget
└── Contracts → Contract register / Create contract
Administration
├── People & access → Users / Roles & permissions
├── Organization → Company profile / Workspace settings / Email settings
└── Communications → Messages / Inquiries
Public portal
```

Supplier accounts see a separate reduced tree:

```text
Overview
Supplier portal
├── Opportunities → Open tenders
└── Company → Company profile
Public portal
```

- Pages are filtered using the authenticated user's permissions; empty modules and sections disappear.
- One section and one module can be expanded at a time. This prevents the old long list from returning.
- The active URL selects the most specific page, opens its parents and supplies the breadcrumb. Detail URLs and existing aliases keep their parent module selected.
- User-specific expansion preferences are stored locally. Overview starts compact for a new user; direct links open the relevant branch.
- In the collapsed desktop rail, selecting a section expands the sidebar and opens that section.
- Buttons support keyboard disclosure. Mobile uses a focus-managed drawer which closes after navigation or Escape.
- Labels are translated in `navigation.json` for EN/FR/AR; indentation and borders use logical properties for RTL.
- Unread messages and pending inquiries appear as badges within Communications.

When adding a page, register its real route first, then add a leaf with its required permission to `navigation.ts` and translations to all three locale files. Do not create placeholder links or duplicate destinations under different labels. The sidebar is a navigation aid; backend authorization remains authoritative.

**Checks after structural changes**

```powershell
cd frontend
npm run build
node tests/sidebar-smoke.cjs
node tests/unified-smoke.cjs
cd ..
docker compose -p tenderrank-unified exec backend python -m pytest tests/test_unification.py tests/test_ai_service.py -q
```
