# e-procurment

The combined application lives in this repository root: `backend/`, `frontend/`, `docs/`, and local infrastructure. The original applications are archived under `backups/`; runtime code uses Flask, SQLAlchemy and PostgreSQL.

The existing Docker project name `tenderrank-unified` and named PostgreSQL volume are pinned in `compose.yml` to preserve the shared database across folder moves. See [root consolidation](docs/root-consolidation.md) for backups and recovery, and [procurement development plan](docs/procurement-development-plan.md) for the separate nine-phase roadmap.

See [Application structure and navigation](docs/architecture.md) for the domain folders and three-level sidebar. The navigation source is `frontend/src/shared/navigation/navigation.ts`.

**Running local application**

- Frontend: http://127.0.0.1:5175
- Flask API health: http://127.0.0.1:5002/api/v1/health/
- PostgreSQL: localhost:5433, database `tenderrank`, user `eprocure`; password comes from `.env`.
- Redis is internal to the Docker network.

The current local setup runs Vite directly on Windows and Flask/PostgreSQL/Redis in Docker, reducing duplicate container resource use. All browser API calls go through the frontend's `/api` proxy to the shared Flask API.

Run `./start.ps1` from PowerShell to start this configuration again. Docker Desktop must be running. The script reuses an existing frontend on the configured address and opens no terminal windows.

For the all-container development configuration, stop the locally started frontend first with `./stop-frontend.ps1`, then run:

```powershell
docker compose -p tenderrank-unified up -d --build
```

Do not run the local frontend and frontend container on port 5175 simultaneously. Stopping or rebuilding containers does not delete database volumes. Do not remove the PostgreSQL volume when restarting.

**Local accounts**

Workspace: `default`.

| Account | Password | Access |
| --- | --- | --- |
| superadmin@tender.com | superadminpass | Organization administration, tender review, procurement |
| admin@tender.com | adminpass | Procurement officer |
| supplier@tender.com | supplierpass | Supplier portal |
| admin@example.com | admin123 | Imported procurement administrator |

These are the existing demo credentials. Import and repeated startup preserve password hashes; seed does not reset existing passwords. Bcrypt and Werkzeug legacy hashes are supported. TenderRank's previous `super_admin` maps to an administrator within its imported organization, not an unrestricted cross-organization administrator.

**Shared architecture**

- React application with TenderRank's original landing page, login, dashboards, public tender pages, supplier pages and shared presentation components. Existing procurement pages use the shared design tokens and application shell.
- One Flask app factory and API under `/api/v1`. Tendering endpoints use `/api/v1/tendering`; procurement API routes are preserved.
- SQLAlchemy models for procurement, identities, roles, suppliers, tenders, proposals, evaluations and awards. PostgreSQL stores all persistent records.
- Flask-Migrate/Alembic owns versioned schema changes. Container startup applies reviewed migrations; it does not push an unversioned Prisma schema.
- The procurement repository translates its existing service query contracts into SQLAlchemy statements, preserving the established API while avoiding a simultaneous business-rule rewrite. New tendering code uses native SQLAlchemy queries directly.
- Each successful API request commits its SQLAlchemy session once; failed requests roll it back. Source references are checked against the authenticated organization. Attachments require authenticated access through the owning tender/proposal.
- A reviewed tender proposal can create a linked purchase-order draft. The normal purchase-order approval process still applies. This integration does not claim to implement every enhancement in the separate nine-phase procurement roadmap.

**Database history and imported data**

`backend/migrations/versions` contains the initial combined schema and subsequent migrations. The initial procurement import used a data-only PostgreSQL export from the original database, preserving IDs and document relationships. TenderRank's SQLite import creates deterministic UUID mappings, organization membership and shared supplier records.

Local source snapshots are under `data/`; the procurement data export is under `backups/`. Both are ignored by Git, as are secrets, uploads and runtime artifacts. They can contain confidential data and are not application source.

To import a separately supplied TenderRank SQLite snapshot after initializing the destination workspace:

```powershell
docker compose -p tenderrank-unified exec backend flask --app run:app import-tenderrank /import/instance/procurement.sqlite3 --org default
```

The command is repeatable and does not replace existing imported records. Identity collisions are reported instead of silently merging accounts. Import into the isolated destination only; do not rerun the raw PostgreSQL data restore on a populated database.

For future schema changes:

```powershell
docker compose -p tenderrank-unified exec backend flask --app run:app db migrate -m "describe_change"
# Review the generated revision before applying it.
docker compose -p tenderrank-unified exec backend flask --app run:app db upgrade
```

**Evaluation and AI configuration**

Draft tender requirements can be edited and weighted before submission. Evaluators can record evidence and scores against each criterion. The server computes totals and rejects awards with unresolved mandatory failures. Award creation is idempotent per proposal and links the resulting order to the award record.

Hosted AI is disabled by default. No model weights or AI keys are needed to log in, manage procurement, submit proposals or record human evaluations.

To enable AI-assisted evidence assessment, set `AI_PROVIDER`, the provider's exact `AI_MODEL` identifier, and `AI_API_KEY` in `.env`. Available adapters cover GroqCloud, DeepSeek and Moonshot/Kimi; `AI_BASE_URL` supports a custom compatible endpoint. Model availability, licensing, data processing and billing depend on the selected provider. Credentials stay on the server.

Then recreate the backend and start the optional durable worker:

```powershell
docker compose -p tenderrank-unified --profile ai up -d backend worker
```

Evaluation jobs are persisted in PostgreSQL. AI responses must identify every criterion and quote evidence that exists in the document. Suggestions are stored separately for evaluator review; they do not autonomously change approved scores, awards, purchase orders or payments. The provider path has not been live-tested without credentials. The initial adapter accepts text extracted from PDFs/DOCX/TXT; OCR and large-document chunking are separate extensions.

Company website verification and automatic outbound email are not enabled by default. Inquiry approval can provision an organization account and show temporary credentials to the administrator. No email is sent during seed/import or integration checks.

**Verification**

From this directory:

```powershell
docker compose -p tenderrank-unified exec backend python -m pytest tests/test_unification.py -q
docker compose -p tenderrank-unified exec backend python -m tests.api_smoke
docker compose -p tenderrank-unified exec backend python -m tests.signup_smoke
cd frontend
npm run build
node tests/unified-smoke.cjs
```

The database integration tests use an outer PostgreSQL transaction and roll back test records. Live HTTP smoke scripts create and remove their own temporary organization. Browser checks use the demo accounts and test routing, module access, public pages and supplier isolation.

Verified during integration: 8 database/evidence tests, 72 procurement HTTP checks, 13 signup HTTP checks, 19 browser routes across three account types, successful production frontend build, repeatable TenderRank import, and Alembic schema-drift check with no pending operations.
