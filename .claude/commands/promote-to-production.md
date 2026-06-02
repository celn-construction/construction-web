---
name: promote-to-production
description: "Safely promote the preview branch to main (production) for the construction-web app on Vercel + Neon. Runs gated pre-flight checks — build/typecheck/tests, migration drift, destructive-migration detection, backward-compat review, env-var parity — takes a production DB snapshot and records a rollback target, then overwrites main with preview and verifies the deploy. Trigger on /promote-to-production, or when the user says promote to production, push preview to main, ship to prod, release to production, go live, or deploy preview to production."
category: workflow
complexity: high
mcp-servers: []
---

# /promote-to-production — Safe Preview → Main Release

> **Context Framework Note**: This activates when the user types `/promote-to-production` or asks to ship `preview` to production. It runs a gated promotion of `preview` → `main` for the `construction-web` Vercel project, designed so that **no breaking change reaches production** — especially no breaking database migration. It is read-only and abortable until the explicit promote step.

## Triggers
- `/promote-to-production`
- "Promote to production", "push preview to main", "ship to prod", "release to production", "go live", "deploy preview to production"

## Usage
```
/promote-to-production [--dry-run] [--skip-snapshot] [--force-with-lease]
```
- `--dry-run` (default behavior up to the promote step): run every gate and report, but **do not** touch `main`. Always start here.
- `--skip-snapshot`: only when production DB is confirmed empty/disposable. Discouraged.
- `--force-with-lease`: proceed with the overwrite after gates pass (still requires explicit human confirmation).

---

## The single rule that governs this skill

On push to `main`, the Vercel build runs `prisma migrate deploy && prisma generate && next build` (see `vercel.json`). **`migrate deploy` runs during the build, before the new code goes live — and the OLD production deployment keeps serving traffic against the just-migrated database** until Vercel aliases the new build.

> **Every migration must be backward-compatible with the currently-running (old) code, not just the new code.**

Consequences this skill enforces:
- A migration that drops/renames a column the **old** code still reads, or adds a required column the old code's INSERTs don't populate, breaks production *during the deploy window* even if the new code is perfect.
- Prisma migrations are **forward-only** (no auto down-migrations). "Rollback" = roll back the *code* (Vercel Instant Rollback) while the DB stays migrated. That only works if the migration was backward-compatible. **A destructive migration destroys your clean rollback path.**
- Therefore: destructive/breaking schema changes must use **expand-and-contract** across multiple deploys (see appendix), and a **Neon snapshot taken right before promotion** is the real recovery net for a partial/destructive DDL failure.

---

## Project Context

| Fact | Value |
|---|---|
| Vercel team / scope | CELN — always `--scope celn` |
| Vercel project | `construction-web` |
| Production branch / URL | `main` → https://celn.app |
| Staging branch / URL | `preview` → https://preview.celn.app |
| Branch model | `local → preview → main`. `preview` is the **only source of truth**; `main` is a downstream mirror. Nothing is authored on `main`. |
| Databases | **Separate Neon branch per environment.** Promoting code does NOT move data. `main` has its own production DB; `preview` has its own. |
| Build command | `npx prisma migrate deploy && npx prisma generate && npx next build` (`vercel.json`) |
| Migration rule | Always `prisma migrate dev`/`deploy`, **never `db push`**. Additive only (nullable or defaulted). Raw-SQL migrations self-provision `vector`/`pg_trgm`. |
| Hard-required env (build fails without) | `BRYNTUM_NPM_TOKEN` (install-time, licensed Bryntum private registry), `BLOB_AVATARS_READ_WRITE_TOKEN` (`.min(1)` in `src/env.js`) |
| Reference docs | `claudedocs/release-workflow.md`, `claudedocs/vercel.md`, `claudedocs/environment-setup.md` |

---

## Phase 0 — Preconditions

Run and confirm before any gate:

```bash
git fetch origin --quiet
# Workspace migrations must equal preview's (this branch must accurately represent what main will receive)
git diff --stat origin/preview -- prisma/migrations/   # empty = identical to preview
```

If the current branch's `prisma/migrations/` differs from `origin/preview`, stop — the gates below would check the wrong migration set. Re-run from a workspace synced to `preview`.

---

## Phase 1 — Pre-flight gates (all BLOCKING; abort on any failure)

Run these in order. Report a clear ✅/❌ per gate. **Do not proceed to Phase 2 unless every gate passes or the user explicitly accepts a documented risk.**

### Gate 1 — "Nothing valuable lives only on main" (protects the overwrite)
The overwrite is only safe because `main` holds no unique work. Verify:
```bash
git log --oneline origin/preview..origin/main        # commits on main NOT on preview
```
For each commit shown, confirm it is **superseded by preview** or is a GitHub workflow file that **also exists on preview** (preview's `schema-drift.yml` supersedes any `db-migration-check.yml`; digest/Neon workflows exist on both). If a workflow exists *only* on `main` and is still wanted, **cherry-pick it into `preview` first** — never pull it from `main` into the merge. If anything unique and valuable is found → **ABORT** and reconcile into `preview` first.

### Gate 2 — Build, typecheck, tests green on the preview tree
```bash
npx tsc --noEmit
npm run test
npm run build      # catches missing required env / Bryntum-license / build-time failures locally
```
Any failure → ❌ ABORT.

### Gate 3 — Migration drift check against PRODUCTION (read-only)
```bash
vercel env pull .env.production --environment production --scope celn --yes
set -a; source .env.production; set +a
npx prisma migrate status        # expect: pending = clean additive suffix, NO drift, no failed migrations
```
- ✅ Healthy: "Following migrations have not yet been applied:" listing a clean suffix.
- ❌ Drift / "modified after applied" / a failed migration → ABORT. (Recovery: see appendix "Failed-migration recovery".)
- **Delete `.env.production` immediately after** (prod secrets must not linger): `rm -f .env.production`.

### Gate 4 — Destructive / breaking migration detection
Identify migrations new to production and lint their SQL. New files = those on `preview` but not `main`:
```bash
git diff --name-only origin/main...origin/preview -- 'prisma/migrations/**/migration.sql'
```
Grep each new `migration.sql` against this rule set (case-insensitive). **Any match is BLOCKING** — it does not auto-abort, but requires the user to confirm the change was shipped via expand-and-contract (old code tolerates it) or that production data makes it safe:

| Pattern | Implies | Safe path |
|---|---|---|
| `DROP\s+COLUMN` | Data loss + old-code break | Expand-and-contract: drop only after no live code reads it |
| `DROP\s+TABLE` | Data loss + old-code break | Backup + multi-deploy |
| `RENAME\s+(COLUMN\|TO)` | Breaking mid-deploy (Prisma can't detect renames) | Expand-and-contract (add new → backfill → drop old) |
| `ALTER\s+COLUMN.*\bTYPE\b` | Possible table rewrite / cast failure | New typed column → backfill → swap → drop |
| `SET\s+NOT\s+NULL`, or `NOT NULL` on a new column **without** `DEFAULT` | Migration may fail on existing rows; old INSERTs break | Add nullable + default, backfill, then enforce |
| `ADD\s+CONSTRAINT.*UNIQUE`, `CREATE\s+UNIQUE\s+INDEX` **without** `CONCURRENTLY` | Fails on dup data + heavy lock | `CREATE UNIQUE INDEX CONCURRENTLY` then attach |
| `CREATE\s+INDEX` **without** `CONCURRENTLY` | Write-blocking lock on large tables | `CREATE INDEX CONCURRENTLY` |
| `DROP\s+TYPE`, `ALTER\s+TYPE` (enum) | Enum-value break | Add new value first; remove old only when unused |

Convenience scan:
```bash
for f in $(git diff --name-only origin/main...origin/preview -- 'prisma/migrations/**/migration.sql'); do
  echo "── $f"
  git show "origin/preview:$f" | grep -inE 'drop[[:space:]]+(column|table)|rename[[:space:]]+(column|to)|alter[[:space:]]+column.*type|set[[:space:]]+not[[:space:]]+null|add[[:space:]]+constraint.*unique|create[[:space:]]+(unique[[:space:]]+)?index|drop[[:space:]]+type|alter[[:space:]]+type' || echo "  (clean)"
done
```
> Note: the grep is a fast first pass. For authoritative lock/rewrite analysis, run **Squawk** (`squawkhq.com`) over the new `.sql` files. **Mitigating fact for this project:** if a destructive migration's target tables are empty in production (verify with row counts — see Gate 4b), the operation is a structural no-op with no data-loss risk.

### Gate 4b — Production data check (sizes the destructive risk)
If Gate 4 found destructive ops, confirm whether production actually holds data in the affected tables (read-only row counts via the generated client against the prod URL, or `prisma studio`). Empty tables → destructive migrations are no-ops → downgrade severity. Real data → require explicit expand-and-contract confirmation before proceeding.

### Gate 5 — Backward-compat assertion (old code × new schema)
Confirm the **old** code (`main`) does not depend on anything the new migrations remove, and the migrations add nothing required that old code won't populate, for the deploy overlap window. For any destructive change, confirm the multi-deploy expand-and-contract sequence was followed across prior `preview` merges. This is the human-judgment gate that Gates 4/4b inform.

### Gate 6 — Env-var parity
```bash
vercel env ls production --scope celn
```
Every var the new code requires must exist in **Production** and be declared in `src/env.js` (so the build fails fast, not at runtime). Spot-check the hard-required ones: `BRYNTUM_NPM_TOKEN`, `BLOB_AVATARS_READ_WRITE_TOKEN`, `APP_URL=https://celn.app`. Missing/required-but-absent → ❌ ABORT.

---

## Phase 2 — Recovery net (before touching main)

### Step A — Snapshot the production Neon branch (BLOCKING unless `--skip-snapshot`)
Take a Neon snapshot / branch of the production DB and **record the snapshot ID**. This is the recovery path for a partial or destructive DDL failure — far more reliable than hand-patching with `prisma migrate resolve`. (Neon supports instant/branch restore + PITR.) Skip only when Gate 4b proved the prod DB is empty.

### Step B — Record the current production deployment (rollback target)
```bash
vercel ls construction-web --scope celn --prod    # note the current Ready production deployment URL/ID
```
Save it — Vercel Instant Rollback to this deployment is the one-command code rollback (valid only because migrations are backward-compatible).

---

## Phase 3 — Promote

Only after every gate passes **and the user explicitly confirms**. Per the project model, `main` is a downstream mirror overwritten by `preview`:

```bash
git push origin origin/preview:main --force-with-lease
```
- `--force-with-lease` (never bare `--force`) aborts if `main` moved unexpectedly since the last fetch — a guard, since nobody should push to `main` directly.
- **If `main` has branch protection that blocks force-push**, do not disable it. Instead open a fast-forward PR `preview → main` and let required checks run. (A plain merge is also fine since `main` carries no unique commits — Gate 1 proved this.)

Vercel auto-builds `main`; the build runs `prisma migrate deploy` against production's own Neon branch, then deploys to https://celn.app.

**If `migrate deploy` fails mid-build:** the build fails, the deployment never goes live, and the **old deployment keeps serving** (good). But the failed migration blocks all future `migrate deploy` runs until resolved — see appendix.

---

## Phase 4 — Post-deploy verification

1. Watch the build (`vercel ls … --prod`, Vercel dashboard, or Sentry) until the new deployment is Ready.
2. Smoke-test https://celn.app: sign-up → OTP → onboarding → create org/project → Gantt loads (Bryntum license OK) → document upload + AI search → Mapbox/weather render. Watch Sentry for new errors.
3. **On failure:**
   - Code-level issue → `vercel rollback <recorded deployment>` (Instant Rollback; code-only, safe because migrations were backward-compatible).
   - Database-level issue → restore the Neon snapshot from Step A.

---

## Appendix A — Expand-and-Contract (for destructive changes)

Never ship a rename/drop/type-change/NOT-NULL in a single deploy. Split across deploys so the schema is always compatible with whatever code is currently live:

| Deploy | Migration | Code |
|---|---|---|
| **A — Expand** | Add new column (nullable / defaulted); keep old | Dual-write (old + new), read old |
| **B — Migrate** | Backfill new from old (transactional script) | — |
| **C — Contract** | Drop old column | Read/write new only — deployed **before** the drop |

Each of A/B/C is a separate `preview` → `main` promotion. The drop (C) only ships once no live code references the old column.

## Appendix B — Failed-migration recovery

If `migrate deploy` failed on the production DB:
1. Inspect: `npx prisma migrate status` (against prod URL) shows the failed migration.
2. Easiest reliable path: **restore the Neon snapshot** (Phase 2A), fix the migration, re-promote.
3. Manual path: `npx prisma migrate resolve --rolled-back "<migration_name>"`, manually undo any partially-applied SQL (make migrations idempotent with `IF [NOT] EXISTS`), fix root cause, re-run `migrate deploy`. Or finish the SQL by hand and `--applied "<migration_name>"`.
4. Generate recovery SQL with `prisma migrate diff` + `prisma db execute` for complex states.

## Appendix C — Hygiene
- Always `rm -f .env.production` after pulling prod credentials for a gate. Never commit it (it's gitignored, but delete it anyway).
- This skill is read-only and abortable through the end of Phase 1. The first irreversible action is the Phase 3 push.
