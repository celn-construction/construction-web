# Release Workflow

How code moves from a developer's machine to production. Read this before promoting `preview` to `main`.

---

## Branch Model

```
local feature branch  →  preview  →  main (production)
```

| Branch | Role | Database | Auto-deploys to |
|---|---|---|---|
| `lawrence1470/*` (local) | Feature work. One branch per change. | Shared local Docker Postgres (see `environment-setup.md`) | Vercel preview URL per PR |
| `preview` | **Source of truth.** Integration/staging branch. Everything lands here first. | Its own Neon branch | https://preview.celn.app |
| `main` | **Production mirror.** A copy of `preview` at a chosen point. | Its **own, separate** Neon branch — never shared with preview | https://celn.app |

### Two rules that define this model

1. **`preview` is the only source of truth.** `main` never originates changes. Nothing is ever authored on `main` and pulled back into `preview`. When `main` and `preview` differ, `preview` is correct by definition.
2. **`main` and `preview` have completely separate databases.** They are independent Neon branches. A migration applied to one does not touch the other. Data does not flow between them. Promoting code does **not** copy data.

---

## Day-to-day flow

1. Branch off `preview` locally (`lawrence1470/<topic>`).
2. Open a PR into `preview`. CI runs (`test.yml`, `schema-drift.yml`); Vercel builds a preview deployment against its own Neon branch.
3. Merge into `preview`. Changes are now live on https://preview.celn.app and exercised against preview data.
4. When `preview` is validated and ready to ship, **promote `preview` → `main`** (below).

---

## Promoting `preview` → `main`

> **Use the `/promote-to-production` command** (`.claude/commands/promote-to-production.md`) to run this safely. It enforces the gated, migration-safe pre-flight (build/typecheck/tests, migration drift, destructive-migration detection, backward-compat review, env parity), takes a production DB snapshot, records a rollback target, then performs the overwrite and verifies the deploy. The steps below are the manual equivalent.

`main` is overwritten to match `preview` exactly. This is **not** a conflict-resolved merge — there is nothing to reconcile, because `main` holds no unique work.

```bash
git fetch origin
# Make main identical to preview. Force is expected and correct here —
# main is a downstream mirror, not an independent line of development.
git push origin origin/preview:main --force-with-lease
```

`--force-with-lease` (rather than bare `--force`) aborts if someone pushed to `main` unexpectedly — a safety net, since by our model nobody should ever push to `main` directly.

On push, Vercel auto-builds `main` and deploys to https://celn.app. The build command (`vercel.json`) runs `prisma migrate deploy` first, so **pending migrations apply to main's own production database during the build.**

### What does NOT need to happen
- ❌ No merge-conflict resolution. We overwrite, not merge.
- ❌ No cherry-picking workflow files off `main`. Every GitHub workflow already exists on `preview` (`preview`'s `schema-drift.yml` supersedes the old `db-migration-check.yml`; the digest/Neon-cleanup workflows are present on both). Scheduled and `workflow_dispatch` workflows run from the default branch (`main`) and arrive there via the overwrite.

---

## Database: the part promotion does NOT automate

Because `main` has its own database, promoting code does not promote data or schema state — `prisma migrate deploy` simply runs the repo's migrations against main's DB during the Vercel build. Before promoting, verify:

1. **Snapshot main's production Neon branch** (a restore point). Promotion can apply **destructive migrations** — e.g. `consolidate_roles` (`UPDATE`s role values), `drop_schedule_version_revision` (drops tables), `drop_gantt_task_version` / `drop_slot_approver` (drop columns). These run against whatever data main holds.
2. **Confirm main's migration history is clean** against main's DB URL:
   ```bash
   # Against the production (main) Neon connection string:
   npx prisma migrate status
   ```
   Expect only additive pending migrations, no drift. Postgres extensions self-provision — migrations include `CREATE EXTENSION IF NOT EXISTS vector` / `pg_trgm`.
3. **Know whether main's DB has real data.** If it's effectively empty (e.g. it has only ever served a placeholder page), destructive migrations are low-risk. If real accounts/projects exist, review the role-consolidation and table-drop migrations deliberately before promoting.

The two databases drifting in *schema* is normal and temporary between a `preview` merge and the next `main` promotion. They should never drift in *migration files* — the repo's `prisma/migrations/` is the single source for both; only the timing of `migrate deploy` differs per branch.

---

## Environment variables

Set per-environment in Vercel (`vercel env ls --scope celn`). Each environment points at its own database and resources:

- `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` — **different per environment** (main → production Neon branch, preview → preview Neon branch).
- `APP_URL` — `https://celn.app` (production) vs `https://preview.celn.app` (preview). Drives Better Auth origins and email links.
- `BRYNTUM_NPM_TOKEN` — required at **install** time on every environment (licensed Bryntum package from the private registry). A missing token fails the build before it starts.
- `BLOB_AVATARS_READ_WRITE_TOKEN` — required (`.min(1)` in `src/env.js`); build hard-fails without it.

See `claudedocs/vercel.md` for the full per-environment matrix and the pre-merge checklist.

---

## Pre-promotion checklist

- [ ] `preview` is green (CI + manual validation on https://preview.celn.app).
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` succeeds locally.
- [ ] Production (main) env vars verified present, especially `BRYNTUM_NPM_TOKEN`, `BLOB_AVATARS_READ_WRITE_TOKEN`, `APP_URL=https://celn.app`.
- [ ] Snapshot of main's production Neon branch taken.
- [ ] `prisma migrate status` against main's DB is clean (additive pending only, no drift).
- [ ] Destructive migrations reviewed if main holds real data.
- [ ] `git push origin origin/preview:main --force-with-lease`.
- [ ] Watch the Vercel build (migrations apply) and smoke-test https://celn.app: sign-up → OTP → onboarding → create project → Gantt loads → document upload/AI search → Mapbox/weather. Watch Sentry.
