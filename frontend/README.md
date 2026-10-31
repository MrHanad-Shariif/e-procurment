# E-Procurement frontend

React, TypeScript, Vite, and shadcn/ui (Base UI / Nova). The dashboard adapts
the [shadcn sidebar layout](https://ui.shadcn.com/docs/components/base/sidebar)
to procurement workflows, using the official sidebar, table, tabs, badge,
avatar, and sheet components.

Run `npm install` then `npm run dev`, or use Docker Compose from the project root.
The frontend opens at http://localhost:5173 and calls the Flask API on port 5000.

Public routes are `/` (landing page), `/login`, and `/signup`; the protected
dashboard is `/dashboard`. The theme toggle supports light and dark modes,
starts with the system preference, and remembers the selection across visits.
Signup provisions a new organization with its first administrator, default
roles, and settings. Existing organizations continue to use administrator-created
accounts. Public pages and authentication labels are translated in
`public/locales/{en,fr,ar}/website.json`.

Dashboard totals follow API pagination. Purchase order values exclude cancelled
orders and are separated by currency. Counts and activity reflect the current
user's API permissions. New labels are translated in `public/locales/{en,fr,ar}/dashboard.json`.

Validation:

```bash
npm run build
npm run test:e2e
```

Browser tests require the frontend and seeded backend to be running, plus Google
Chrome. They authenticate with the local seeded admin by default; override with
`TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` as needed. The live checks cover the
dashboard, navigation, mobile drawer, French, and Arabic RTL. A separate fixture
test verifies pagination, filtering, chart controls, and currency calculations
without writing procurement data. Screenshots are saved under `test-results/`.
