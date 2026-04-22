# Vercel Configuration

## Project
- **Team**: CELN (`celn`)
- **Project**: `construction-web`
- **Production URL**: https://celn.app
- **Staging URL**: https://preview.celn.app
- **Dashboard**: https://vercel.com/celn/construction-web

## CLI Usage

Always pass `--scope celn` when using Vercel CLI:

```bash
# List env vars
vercel env ls --scope celn

# Pull env vars locally
vercel env pull .env.preview --environment preview --scope celn --yes
vercel env pull .env.production --environment production --scope celn --yes

# Push a single env var
printf 'value' | vercel env add KEY_NAME environment --scope celn --force

# Remove an env var
vercel env rm KEY_NAME --scope celn --yes

# Deploy
vercel deploy --scope celn
```

## Environment Structure

| Environment | URL | Purpose |
|---|---|---|
| `development` | http://localhost:5050 | Local dev |
| `preview` | https://preview.celn.app | Staging |
| `production` | https://celn.app | Live |

## Per-Environment Managed Vars

These must be set correctly per environment via Vercel CLI:

| Variable | development | preview | production |
|---|---|---|---|
| `APP_URL` | http://localhost:5050 | https://preview.celn.app | https://celn.app |

`APP_URL` is the single source of truth — it drives Better Auth's base URL, trusted origins, invite email links, and password reset links.

## Database Environment Variables

Only two DB vars exist in Vercel — `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` — set per environment:

| Environment | Value | Notes |
|---|---|---|
| Development | `postgresql://construction:construction@localhost:5432/construction` | Local Docker container shared across Conductor workspaces |
| Preview | Neon pooler/direct URLs | Neon integration |
| Production | Neon pooler/direct URLs | Neon integration |

All other Neon `construction_*` / `PG*` vars have been removed from the Development environment to keep `.env.local` clean. Blob store tokens (`BLOB_READ_WRITE_TOKEN`, `BLOB_AVATARS_READ_WRITE_TOKEN`) are auto-provisioned by the Vercel Blob integration.

## Blob Storage

Two Vercel Blob stores back the app:

| Store | Access | Token | Used for |
|---|---|---|---|
| `construction-uploads` | **private** | `BLOB_READ_WRITE_TOKEN` | Document uploads (photos, PDFs, CAD, etc.). Served to clients via the authenticated proxy at `/api/blob/[documentId]`. |
| `construction-avatars` | **public** | `BLOB_AVATARS_READ_WRITE_TOKEN` | User profile pictures. Client reads the public CDN URL directly from `user.image`. |

Document uploads go through `/api/upload` (server function calls `put(..., { access: "private" })` with the default token). Avatar uploads go through `/api/upload/avatar` (server function calls `put(..., { access: "public", token: env.BLOB_AVATARS_READ_WRITE_TOKEN })`). A blob store's `access` mode is immutable at creation — the two-store split is the mechanism for supporting both private documents and public avatars.

## Database Branching

Each environment uses an isolated Neon database branch via the Vercel-Neon integration:
- **Production** → `main` Neon branch
- **Preview deployments** → auto-created `preview/...` Neon branch (forked from `main` at deploy time)

The integration injects the correct `POSTGRES_PRISMA_URL` per deployment automatically — no manual configuration needed. On the free Neon plan branches are limited (10 max), so delete old preview branches from closed PRs as needed.

## Local Env Files

| File | Environment | Git |
|---|---|---|
| `.env.local` | development | gitignored |
| `.env.preview` | preview | gitignored |
| `.env.production` | production | gitignored |

## Getting Local Env Vars

All secrets are managed in Vercel. Pull them locally with:

```bash
# Pull dev env vars
vercel env pull .env.local --environment development --scope celn --yes

# Pull Vercel preview env vars
vercel env pull .env.preview --environment preview --scope celn --yes

# Pull Vercel production env vars
vercel env pull .env.production --environment production --scope celn --yes
```

**Adding a new secret:**
```bash
printf 'value' | vercel env add KEY_NAME development --scope celn --force
```

## PR Checklist

Before merging any PR, verify the following. Skipping these steps has caused production/preview outages in the past.

### Database & Schema
- [ ] **If `prisma/schema.prisma` changed**: a new migration file exists in `prisma/migrations/`. Always create migrations via `npx prisma migrate dev --name <name>` — never use `prisma db push`, which silently skips raw-SQL migrations and causes drift between local and production. See `claudedocs/environment-setup.md` → "Database workflow" for the full rationale.
- [ ] **Migration is additive**: new columns have defaults or are nullable, so existing rows don't break.
- [ ] **Migration file is committed**: check `git status prisma/migrations/` — the `.sql` file must be tracked.

### Environment Variables
- [ ] **If new env vars were added**: they are set in Vercel for all target environments (development, preview, production). Check with `vercel env ls --scope celn`.
- [ ] **If env vars are required**: they are added to `src/env.js` validation schema so the build fails fast with a clear message instead of a runtime crash.

### Build & Types
- [ ] **TypeScript compiles**: `npx tsc --noEmit` passes with no errors.
- [ ] **Build succeeds locally**: `npm run build` completes (or at minimum, no new type errors introduced).

### Auth & Origins
- [ ] **If auth or middleware changed**: trusted origins in `src/lib/auth.ts` still cover `APP_URL`, `VERCEL_URL`, and `VERCEL_BRANCH_URL`.
- [ ] **If new routes were added**: they are either protected by middleware or explicitly listed in the pass-through routes in `src/middleware.ts`.

### Quick Verify Commands
```bash
# Schema changed? Make sure a migration exists:
git diff main --name-only | grep schema.prisma && ls prisma/migrations/ | tail -1

# Type check:
npx tsc --noEmit

# Check for uncommitted migration files:
git status prisma/migrations/
```
