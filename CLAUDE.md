# TenderRank unified application conventions

This repository root is the canonical combined application. Read `docs/architecture.md` for the folder tree and navigation structure. Original projects are archived under ignored `backups/`; do not introduce runtime dependencies on archives. Preserve the pinned Docker project and volume names in `compose.yml`.

- Frontend: React, TypeScript, Vite, TenderRank UI, react-i18next.
- Backend: Flask, SQLAlchemy, PostgreSQL, Flask-Migrate/Alembic, JWT permissions.
- Infrastructure and start commands: `compose.yml`, `start.ps1`, `README.md`.

## Source organization

- `frontend/src/app`: routes, providers and application composition.
- `frontend/src/features`: identity, public portal, supplier portal, tendering, sourcing, procurement, finance and administration.
- `frontend/src/shared`: layout, navigation, UI, API client, hooks, types, branding, assets and styles.
- `backend/app/domains`: identity, administration, sourcing, procurement, finance and evaluation. Put routes, schemas and services inside their owning domain.
- `backend/app/core`: tenant resolution, access decorators and API response helpers.
- `backend/app/models`: one shared SQLAlchemy model registry and procurement repository.
- `backend/migrations`: reviewed, versioned Alembic migrations. Never use Prisma schema pushes.

## API and data

- Preserve REST endpoints under `/api/v1/` and the `{data, error, meta}` JSON envelope.
- Python names use snake_case; existing procurement JSON contracts use camelCase. Preserve existing contracts during structural refactors.
- Scope queries and source references to the authenticated organization. Backend authorization is authoritative; hiding sidebar links is not access control.
- Use the request-scoped SQLAlchemy session and the existing commit/rollback lifecycle. Do not add independent per-row commits.
- Keep business changes separate from directory moves. Any database schema change requires an Alembic revision.
- AI keys stay server-side. Suggestions require human review before awards or orders.

## UI and navigation

- Keep TenderRank's design tokens and shared shell.
- Business menu hierarchy is section → module → page, configured in `shared/navigation/navigation.ts`.
- Add only real routes with appropriate permissions; empty menu groups must disappear.
- Translate new user-facing labels into English, French and Arabic. Use logical CSS properties for RTL.
- Use strict TypeScript without `any` for new components. Existing imported JSX can be migrated incrementally when touched.
- Follow Prettier for frontend formatting and Ruff for Python formatting, with type hints for new Python functions.

## Verification

Run checks appropriate to the change. Folder moves must pass the frontend build and database integration tests. Sidebar changes must pass `node tests/sidebar-smoke.cjs`, including keyboard, mobile, RTL and permissions. Follow `README.md` for the full regression commands.
