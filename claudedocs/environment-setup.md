# Environment Setup

Construction project management SaaS (BuildTrack Pro) built on the T3 stack: Next.js 15, Prisma, tRPC, Better Auth, MUI 7.

## Required Environment Variables

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `construction_POSTGRES_PRISMA_URL` | PostgreSQL connection string (local in dev, Neon on Vercel) | Yes | `postgresql://USER@localhost:5432/construction` |
| `construction_POSTGRES_URL_NON_POOLING` | Direct (non-pooled) PostgreSQL connection for Prisma migrations | Yes | `postgresql://USER@localhost:5432/construction` |
| `BETTER_AUTH_SECRET` | Signing secret for Better Auth sessions | Yes | Any strong random string |
| `APP_URL` | Base URL for Better Auth callbacks, trusted origins, invite links, and password reset links. Must be set per-environment — see `claudedocs/vercel.md`. | Yes (defaults to `http://localhost:5050`) | `https://celn.app` |
| `RESEND_API_KEY` | Resend transactional email API key | Optional | `re_...` (omit for dev console logging) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token for file uploads | Optional | Provided by Vercel integration |
| `OPENAI_API_KEY` | OpenAI API key for semantic search embeddings | Optional | `sk-proj-...` (get from platform.openai.com) |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI document analysis (image + PDF descriptions) | Optional | `sk-ant-...` (get from console.anthropic.com) |
| `BETA_ACCESS_CODE` | Beta access code required on sign-up form. Omit to disable the gate. | Optional | `buildtrack-beta-2026` |
| `NEXT_PUBLIC_APP_URL` | Client-side base URL | Optional | `http://localhost:5050` |
| `NODE_ENV` | Runtime environment | Auto | `development` / `production` / `test` |
| `PORT` | Dev server port | Auto (defaults to `5050`) | `5050` |
| `SKIP_ENV_VALIDATION` | Skip T3 env validation (useful for Docker) | No | `1` |

Validation is defined in `src/env.js` using `@t3-oss/env-nextjs` and Zod. The build will fail if required variables are missing or malformed.

## Local Development

**Prerequisites**
- Node.js 24 (see `.nvmrc`; use `nvm use`)
- npm 11.3+ (declared in `packageManager` field)
- PostgreSQL 14+ running locally with `pg_trgm` and `vector` extensions
- Vercel CLI (`npm i -g vercel`) — non-DB secrets are managed in Vercel

**Setup**

```bash
# 1. Clone and install
git clone <repo-url> && cd providence
nvm use
npm install          # runs prisma generate via postinstall

# 2. Create local database (if not already done)
createdb construction
psql -d construction -c "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS vector;"

# 3. Pull env vars from Vercel (for non-DB secrets)
vercel env pull .env.local --environment development --scope celn --yes

# 4. Override DB URLs to use local PostgreSQL
# Replace the Neon URLs with local ones:
sed -i '' "s|^construction_POSTGRES_PRISMA_URL=.*|construction_POSTGRES_PRISMA_URL=\"postgresql://$USER@localhost:5432/construction\"|" .env.local
sed -i '' "s|^construction_POSTGRES_URL_NON_POOLING=.*|construction_POSTGRES_URL_NON_POOLING=\"postgresql://$USER@localhost:5432/construction\"|" .env.local

# APP_URL must be set manually since it depends on your local port:
echo 'APP_URL="http://localhost:5050"' >> .env.local

# 5. Apply database migrations
npx prisma db push

# 6. Start dev server (Turbopack)
npm run dev          # http://localhost:5050
```

**Notes**
- Local dev uses a local PostgreSQL database for speed. Vercel deployments (preview/production) use Neon via the Vercel-Neon integration.
- Email functionality falls back to console logging when `RESEND_API_KEY` is not set.
- Better Auth trusts any localhost origin in development, and `APP_URL` in production (see `src/lib/auth.ts`).
- In Conductor, `conductor.json` handles setup automatically — `APP_URL` and local DB URLs are set automatically.

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbo` | Start dev server with Turbopack |
| `build` | `prisma migrate deploy && prisma generate && next build` | Production build (runs migrations first) |
| `start` | `next start` | Start production server |
| `preview` | `next build && next start` | Build and preview locally |
| `db:generate` | `prisma migrate dev` | Create and apply a new migration |
| `db:migrate` | `prisma migrate deploy` | Apply pending migrations (production) |
| `db:push` | `prisma db push` | Push schema without migration files |
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

Database migrations run automatically on every Vercel build. Set `construction_POSTGRES_PRISMA_URL`, `BETTER_AUTH_SECRET`, `APP_URL`, and `RESEND_API_KEY` in the Vercel project environment settings per environment. `BLOB_READ_WRITE_TOKEN` is auto-provisioned by the Vercel Blob integration. See `claudedocs/vercel.md` for CLI commands.
