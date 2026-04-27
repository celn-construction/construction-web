# Environment Setup

Construction project management SaaS (BuildTrack Pro) built on the T3 stack: Next.js 15, Prisma, tRPC, Better Auth, MUI 7.

## Required Environment Variables

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `POSTGRES_PRISMA_URL` | PostgreSQL connection string (local in dev, Neon on Vercel) | Yes | `postgresql://construction:construction@localhost:5432/construction` |
| `POSTGRES_URL_NON_POOLING` | Direct (non-pooled) PostgreSQL connection for Prisma migrations | Yes | `postgresql://construction:construction@localhost:5432/construction` |
| `BETTER_AUTH_SECRET` | Signing secret for Better Auth sessions | Yes | Any strong random string |
| `APP_URL` | Base URL for Better Auth callbacks, trusted origins, invite links, and password reset links. Must be set per-environment — see `claudedocs/vercel.md`. | Yes (defaults to `http://localhost:3000`) | `https://celn.app` |
| `RESEND_API_KEY` | Resend transactional email API key | Optional | `re_...` (omit for dev console logging) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for the **private** `construction-uploads` store (documents). Served to clients via `/api/blob/[documentId]`. | Optional | Provided by Vercel integration |
| `BLOB_AVATARS_READ_WRITE_TOKEN` | Vercel Blob token for the **public** avatars store. User profile images are served directly from the public CDN URL. Required — without it, the `@vercel/blob` SDK silently falls back to `BLOB_READ_WRITE_TOKEN` (the private documents store) and avatar URLs 403 in the browser. | Yes | Provided by Vercel integration |
| `OPENAI_API_KEY` | OpenAI API key for semantic search embeddings | Optional | `sk-proj-...` (get from platform.openai.com) |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI document analysis (image + PDF descriptions) | Optional | `sk-ant-...` (get from console.anthropic.com) |
| `BETA_ACCESS_CODE` | Beta access code required on sign-up form. Omit to disable the gate. | Optional | `buildtrack-beta-2026` |
| `SENTRY_DSN` | Sentry DSN for server-side error tracking | Optional | `https://xxx@sentry.io/xxx` (auto-provisioned by Vercel-Sentry integration) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error tracking | Optional | Same as `SENTRY_DSN` (auto-provisioned by Vercel-Sentry integration) |
| `SENTRY_ORG` | Sentry organization slug for source map uploads | Optional | `celn-construction` |
| `SENTRY_PROJECT` | Sentry project slug for source map uploads | Optional | `sentry-cinnabar-clock` |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map uploads | Optional | Auto-provisioned by Vercel-Sentry integration |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Google API key with Places API enabled for address autocomplete on project creation. Omit to fall back to plain text input. | Optional | Get from console.cloud.google.com |
| `OPENWEATHERMAP_API_KEY` | OpenWeatherMap API key for job site weather display in header. Omit to hide weather info. | Optional | Get from openweathermap.org/api |
| `NEXT_PUBLIC_APP_URL` | Client-side base URL | Optional | `http://localhost:3000` |
| `NODE_ENV` | Runtime environment | Auto | `development` / `production` / `test` |
| `PORT` | Dev server port | Auto (defaults to `3000`) | `3000` |
| `SKIP_ENV_VALIDATION` | Skip T3 env validation (useful for Docker) | No | `1` |

Validation is defined in `src/env.js` using `@t3-oss/env-nextjs` and Zod. The build will fail if required variables are missing or malformed.

## Local Development

**Prerequisites**
- Node.js 24 (see `.nvmrc`; use `nvm use`)
- npm 11.3+ (declared in `packageManager` field)
- Docker (via OrbStack recommended) — PostgreSQL 17 runs in a container with `pg_trgm` and `vector` extensions
- Vercel CLI (`npm i -g vercel`) — non-DB secrets are managed in Vercel

**Setup**

```bash
# 1. Clone and install
git clone <repo-url> && cd providence
nvm use
npm install          # runs prisma generate via postinstall

# 2. Start local database (Docker via OrbStack)
# Starts existing container, or creates one if first time
docker start construction-postgres 2>/dev/null || \
  docker run -d --name construction-postgres --restart unless-stopped \
    -p 5432:5432 \
    -e POSTGRES_USER=construction \
    -e POSTGRES_PASSWORD=construction \
    -e POSTGRES_DB=construction \
    -v construction-pgdata:/var/lib/postgresql/data \
    pgvector/pgvector:pg17
# Ensure extensions (idempotent)
sleep 2 && docker exec construction-postgres \
  psql -U construction -d construction \
  -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS vector;'

# 3. Pull env vars from Vercel (for non-DB secrets)
vercel env pull .env.local --environment development --scope celn --yes

# 4. Override DB URLs to use local PostgreSQL
# Replace the Neon URLs with local Docker ones:
sed -i '' "s|^POSTGRES_PRISMA_URL=.*|POSTGRES_PRISMA_URL=\"postgresql://construction:construction@localhost:5432/construction\"|" .env.local
sed -i '' "s|^POSTGRES_URL_NON_POOLING=.*|POSTGRES_URL_NON_POOLING=\"postgresql://construction:construction@localhost:5432/construction\"|" .env.local

# APP_URL must be set manually since it depends on your local port:
echo 'APP_URL="http://localhost:3000"' >> .env.local

# 5. Apply database migrations
npx prisma migrate deploy

# 6. Start dev server (Turbopack)
npm run dev          # http://localhost:3000
```

**Notes**
- Local dev uses a shared PostgreSQL 17 Docker container (`construction-postgres`) on **port 5432** with `pgvector/pgvector:pg17` image. The container is shared across all Conductor workspaces via a named container and volume (`construction-pgdata`). Vercel deployments (preview/production) use Neon via the Vercel-Neon integration.
- Email functionality falls back to console logging when `RESEND_API_KEY` is not set.
- Better Auth trusts any localhost origin in development, and `APP_URL` in production (see `src/lib/auth.ts`).
- In Conductor, `conductor.json` handles setup and run automatically. The `setup` script starts Docker, pulls env vars, overrides DB URLs, installs dependencies, and applies migrations. The `run` script re-applies migrations (`prisma migrate deploy`) and regenerates the Prisma client (`prisma generate`) on every workspace start before launching `next dev`, so a workspace can never start with a stale client or unapplied migrations.

### Database workflow: always use `prisma migrate`, never `prisma db push`

This project uses Prisma's **migration files** as the single source of truth for the schema. Always go through `prisma migrate dev` / `prisma migrate deploy` — never `prisma db push`.

**Why this matters**: `db push` only syncs the declarative `schema.prisma`. It silently skips anything that lives only in raw SQL files — custom Postgres functions, generated columns, GIN indexes, triggers, extensions. Several migrations in this project rely on raw SQL (e.g. `hybrid_document_search()` for hybrid search, `Document.searchVector` as a GENERATED column, GIN trigram indexes). A DB managed via `db push` will look fine in `prisma studio` but features that depend on those bits silently fail or return empty results — and you won't notice until you exercise the affected code path.

**Workflow:**

| Action | Command |
|---|---|
| Apply existing migrations to a fresh local DB | `npx prisma migrate deploy` |
| Create a new migration after editing `schema.prisma` | `npx prisma migrate dev --name <descriptive_name>` |
| Add raw SQL (function, generated column, custom index) | Create the migration with `--create-only`, then edit the generated `migration.sql` before running `npx prisma migrate dev` |
| Inspect what's pending vs applied | `npx prisma migrate status` |
| Open the data browser | `npx prisma studio` |

**If a workspace was set up via the old `db push` flow** and you suspect drift (missing functions, indexes, or generated columns), check with `npx prisma migrate status`. If it reports migrations as not applied even though the schema looks correct, the DB needs to be baselined: apply any missing raw-SQL bits manually, then mark each migration applied with `npx prisma migrate resolve --applied <name>` until status is clean. The simpler reset (if you have no important local data) is `docker volume rm construction-pgdata`, restart the container, then `npx prisma migrate deploy`.

### Cross-workspace drift hazards (shared Postgres)

Because every Conductor workspace shares one `construction-postgres` container, the database is mutable shared state while `prisma/schema.prisma`, `prisma/migrations/`, and `generated/prisma/` are per-workspace (each branch's view). A migration applied in workspace A is permanently visible to every other workspace, even ones whose branch doesn't have that migration file. Two rules avoid the worst failure modes:

1. **Never delete a migration file after it has been applied to the shared DB.** If a schema change needs to be undone, write a new migration that reverses it. Deleting an applied migration leaves an orphan row in `_prisma_migrations` plus orphan column changes — and any other workspace that re-runs `prisma migrate dev` will then see drift it can't reconcile against files on disk.
2. **When a workspace starts behaving strangely after a pull, run `npx prisma migrate status` first.** It compares files on disk to `_prisma_migrations` rows and surfaces drift before runtime errors do. Do this before assuming the dev server is broken.

The `run` script in `conductor.json` already applies `prisma migrate deploy && prisma generate` on every workspace start, so the common path (`git pull` → restart) self-heals. These two rules cover the cases the `run` script can't.

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbo` | Start dev server with Turbopack |
| `build` | `prisma migrate deploy && prisma generate && next build` | Production build (runs migrations first) |
| `start` | `next start` | Start production server |
| `preview` | `next build && next start` | Build and preview locally |
| `db:generate` | `prisma migrate dev` | Create and apply a new migration (use this when changing `schema.prisma`) |
| `db:migrate` | `prisma migrate deploy` | Apply pending migrations to a fresh DB (used by Vercel build and local first-run) |
| `db:push` | `prisma db push` | **Avoid.** Skips raw-SQL migrations and causes silent drift. See "Database workflow" above |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Run tests in watch mode |
| `typecheck` | `tsc --noEmit` | Type-check without emitting files |
| `postinstall` | `prisma generate` | Auto-generate Prisma client on install |

## Deployment

- **Platform**: Vercel
- **Project name**: `construction-web`
- **Production URL**: https://celn.app
- **Staging URL**: https://preview.celn.app
- **Database**: Local PostgreSQL (dev), Neon PostgreSQL (preview/production via Vercel integration)
- **Build command** (vercel.json): `npx prisma migrate deploy && npx prisma generate && npx next build`
- **Install command**: `npm install`

Database migrations run automatically on every Vercel build. Set `POSTGRES_PRISMA_URL`, `BETTER_AUTH_SECRET`, `APP_URL`, and `RESEND_API_KEY` in the Vercel project environment settings per environment. `BLOB_READ_WRITE_TOKEN` is auto-provisioned by the Vercel Blob integration. See `claudedocs/vercel.md` for CLI commands.
