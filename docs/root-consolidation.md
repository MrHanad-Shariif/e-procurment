# Root consolidation

Run all commands from `C:\Users\hanad\e-procurment`. There is one active application: `backend/` and `frontend/`, with `compose.yml`, `.env` and `start.ps1` alongside them. Start it with `./start.ps1`; stop its native frontend with `./stop-frontend.ps1`.

The Docker project remains `tenderrank-unified`. The shared database remains in `tenderrank-unified_postgres_data`; its database is `tenderrank`. Folder renaming does not require a schema migration. Do not run `docker compose down -v` against this project.

Verified pre-move archives and custom-format PostgreSQL dumps are stored in ignored `backups/root-consolidation-20261031-152445/`:

- `legacy-sources.zip`: original procurement and standalone TenderRank source, original configuration, SQLite data and nested Git metadata. Rebuildable dependencies, caches and runtime logs are excluded.
- `active-source-before-move.zip`: combined application source and configuration before relocation.
- `postgres-unified.dump`: full shared database backup.
- `postgres-original.dump`: full original procurement database backup.
- `before-counts.json` and `manifest.json`: migration version, table counts, archive hashes and original environment hash.

These files contain private data and credentials. Keep them out of version control. The repository's own `.git` and `.claude` remain at the root. TenderRank import snapshots and existing uploads remain in `data/` and `backend/uploads/`.

For recovery, extract an archive to a separate directory and restore the chosen dump into a separate empty PostgreSQL database using `pg_restore --no-owner --no-privileges`. Point an isolated application's `DATABASE_URL` at that database; never restore over the working shared database. Reinstall frontend dependencies with `npm ci` inside `frontend/`. Each archive entry was checked against the original file's SHA-256 before retiring its source folder.

The old Docker project `e-procurment` can be stopped without deleting its volumes. Its original PostgreSQL volume is retained as an additional recovery source.

Relocation checks passed: exact migration and table-count comparison before browser logins, eight backend integration/AI tests, Alembic schema-drift check, TypeScript/Vite production build, 19 browser routes across three account types, and the sidebar regression covering disclosure, history, persistence, keyboard, mobile, RTL, translations and permissions. Both PostgreSQL dump catalogs were readable by `pg_restore --list`.
