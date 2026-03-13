# Environment Setup

Construction project management SaaS (BuildTrack Pro) built on the T3 stack: Next.js 15, Prisma, tRPC, Better Auth, MUI 7.

## Required Environment Variables

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon on Vercel) | Yes | `postgresql://USER@localhost:5432/construction?schema=public` |
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
- PostgreSQL instance (local or remote)
- 1Password CLI (`brew install 1password-cli`) with CLI integration enabled in the 1Password app

**Getting secrets (1Password)**

All local dev secrets are stored in the `celn` vault under the `construction-local-dev` item (tagged `local-dev`). Retrieve them with:

```bash
# List all fields in the item
op item get construction-local-dev --vault celn

# Get a specific field value
op item get construction-local-dev --vault celn --field DATABASE_URL

# Inject all secrets into a command at runtime (no disk writes)
op run --env-file=.env.template -- npm run dev
```

The `.env.template` file (committed to the repo) contains `op://` references — no real values. The actual `.env.local` (gitignored) is used for direct dev server runs.

**Setup**

```bash
# 1. Clone and install
git clone <repo-url> && cd providence
nvm use
npm install          # runs prisma generate via postinstall

# 2. Create local env file from 1Password
op inject -i .env.template -o .env.local
# APP_URL must be set manually since it depends on your local port:
echo 'APP_URL="http://localhost:5050"' >> .env.local

# 3. Apply database migrations
npx prisma migrate dev

# 4. Start dev server (Turbopack)
npm run dev          # http://localhost:5050
```

**Notes**
- Email functionality falls back to console logging when `RESEND_API_KEY` is not set.
- Better Auth trusts any localhost origin in development, and `APP_URL` in production (see `src/lib/auth.ts`).
- In Conductor, `conductor.json` handles setup automatically — `APP_URL` is set using `$CONDUCTOR_PORT`.

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
- **Database**: Neon PostgreSQL (configured via Vercel integration)
- **Build command** (vercel.json): `npx prisma migrate deploy && npx prisma generate && npx next build`
- **Install command**: `npm install`

Database migrations run automatically on every Vercel build. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `APP_URL`, and `RESEND_API_KEY` in the Vercel project environment settings per environment. `BLOB_READ_WRITE_TOKEN` is auto-provisioned by the Vercel Blob integration. See `claudedocs/vercel.md` for CLI commands.
