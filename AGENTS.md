# AGENTS.md

## Layout
- The actual app is in `sources/`; run all npm, Prisma, and Docker commands from that directory, not the workspace root.
- `chuc-nang-du-an.md` is an early plan (Vite/localStorage) and does not describe the implemented Next.js/MySQL app. Use `sources/README.md` and executable code for current behavior.
- Follow the generated Next.js rules in `sources/AGENTS.md` when working under `sources/`; consult the bundled Next.js docs it references rather than relying on older Next.js conventions.

## Commands
```sh
npm install                 # postinstall also runs prisma generate
npm run dev
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Focused tests:
```sh
node --import tsx --test scripts/tests/time.test.ts
npm run test:booking
npm run test:admin
npm run test:jobs
```
Add `--test-name-pattern="<pattern>"` before the test file to run matching tests in one file.

## Database and test safety
- Booking, admin, and jobs tests require MySQL 8, `TEST_DATABASE_URL` in `sources/.env`, and a migrated + seeded test database:
  ```sh
  npm run db:migrate:test
  npm run db:seed:test
  ```
- These integration tests delete orders and modify departures/admins. Use only a disposable test database; never point `TEST_DATABASE_URL` at development or production data.
- Prefer the `db:*:dev` / `db:*:test` scripts. Their `with-db.mjs` wrapper overrides `DATABASE_URL`; unscoped Prisma and `db:*` commands use the configured `DATABASE_URL` directly and can mutate production.
- `npm run jobs:expire` mutates data (`npm run jobs:expire -- --dry-run` to preview). `npm run jobs:reconcile` only reports unless given `-- --fix`.

## Implementation constraints
- API route handlers in `app/api/` delegate booking operations to `server/booking/`; keep capacity, pricing, state-transition, and audit logic in that service layer rather than duplicating it in handlers.
- `cacheComponents: true` is enabled. Route handlers must not export `runtime` or `dynamic`; request-time GET handlers use `await connection()` from `next/server`.
- Booking invariants covered by tests: infants consume seats but are free, prices come from the server, capacity updates are atomic, and `clientRequestId` makes creation idempotent. Date cutoffs use Vietnam time, not server-local/UTC calendar dates.
