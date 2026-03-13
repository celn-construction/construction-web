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

## Auto-Provisioned (do not manage manually)

`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, and all `POSTGRES_*` / `PG*` vars are managed by Vercel integrations. Do not overwrite these manually.

## Database Branching

Each environment uses an isolated Neon database branch via the Vercel-Neon integration:
- **Production** → `main` Neon branch
- **Preview deployments** → auto-created `preview/...` Neon branch (forked from `main` at deploy time)

The integration injects the correct `DATABASE_URL` per deployment automatically — no manual configuration needed. On the free Neon plan branches are limited (10 max), so delete old preview branches from closed PRs as needed.

## Local Env Files

| File | Environment | Git |
|---|---|---|
| `.env.local` | development | gitignored |
| `.env.preview` | preview | gitignored |
| `.env.production` | production | gitignored |

## 1Password Secret Management

Local dev secrets are stored in the **`celn` 1Password vault** under the item `construction-local-dev` (tagged `local-dev`). This is the source of truth for all non-Vercel secrets.

**Requires**: 1Password CLI (`brew install 1password-cli`) + CLI integration enabled in the 1Password app (Settings → Developer → Integrate with 1Password CLI).

```bash
# View all local dev secrets
op item get construction-local-dev --vault celn

# Generate .env.local from 1Password (then manually append APP_URL)
op inject -i .env.template -o .env.local

# Pull Vercel preview env vars
vercel env pull .env.preview --environment preview --scope celn --yes

# Pull Vercel production env vars
vercel env pull .env.production --environment production --scope celn --yes
```

**Adding a new secret:**
```bash
# Add a field to the existing item
op item edit construction-local-dev --vault celn "NEW_KEY=value"

# Then update .env.template with the op:// reference
# NEW_KEY=op://celn/construction-local-dev/NEW_KEY
```

**Secret references** use the format `op://vault/item/field`, e.g.:
- `op://celn/construction-local-dev/DATABASE_URL`
- `op://celn/construction-local-dev/OPENAI_API_KEY`
