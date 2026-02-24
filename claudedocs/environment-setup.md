# Environment Setup

Construction project management SaaS (BuildTrack Pro) built on the T3 stack: Next.js 15, Prisma, tRPC, Better Auth, MUI 7.

## Required Environment Variables

| Variable | Purpose | Required | Example |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon on Vercel) | Yes | `postgresql://USER@localhost:5432/construction?schema=public` |
| `BETTER_AUTH_SECRET` | Signing secret for Better Auth sessions | Yes | Any strong random string |
| `BETTER_AUTH_URL` | Base URL Better Auth uses for callbacks | Yes | `http://localhost:5050` |
| `APP_URL` | Server-side base URL for email links and redirects | Yes (defaults to `http://localhost:5050`) | `https://construction-web-ashen.vercel.app` |
| `RESEND_API_KEY` | Resend transactional email API key | Optional | `re_...` (omit for dev console logging) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token for file uploads | Optional | Provided by Vercel integration |
| `OPENAI_API_KEY` | OpenAI API key for semantic search embeddings | Optional | `sk-proj-...` (get from platform.openai.com) |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI document analysis (image + PDF descriptions) | Optional | `sk-ant-...` (get from console.anthropic.com) |
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

**Setup**

```bash
# 1. Clone and install
git clone <repo-url> && cd cebu-v1
nvm use
npm install          # runs prisma generate via postinstall

# 2. Create local env file
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and BETTER_AUTH_SECRET

# 3. Apply database migrations
npx prisma migrate dev

# 4. Start dev server (Turbopack)
npm run dev          # http://localhost:5050
```

**Notes**
- Email functionality falls back to console logging when `RESEND_API_KEY` is not set.
- Better Auth trusts `localhost:3000`, `localhost:5050`, plus any URL in `BETTER_AUTH_URL` and `APP_URL`.

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
- **Production URL**: https://construction-web-ashen.vercel.app
- **Database**: Neon PostgreSQL (configured via Vercel integration)
- **Build command** (vercel.json): `npx prisma migrate deploy && npx prisma generate && npx next build`
- **Install command**: `npm install`

Database migrations run automatically on every Vercel build. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_URL`, and `RESEND_API_KEY` in the Vercel project environment settings. `BLOB_READ_WRITE_TOKEN` is auto-provisioned by the Vercel Blob integration.
