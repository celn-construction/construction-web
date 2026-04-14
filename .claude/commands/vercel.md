---
name: vercel
description: "Diagnose Vercel deployment issues using CLI, env validation, and project documentation"
category: workflow
complexity: standard
mcp-servers: []
---

# /vercel - Vercel Deployment Diagnostics

> **Context Framework Note**: This behavioral instruction activates when users type `/vercel`. It provides structured deployment diagnostics for the `construction-web` Vercel project using CLI tools, env validation, and project documentation.

## Triggers
- Deployment failures or build errors on Vercel
- Environment variable misconfiguration (missing, wrong value, wrong environment)
- Auth/CORS/origin errors on preview or production deployments
- Prisma migration failures during Vercel builds
- Questions about Vercel project configuration or environment setup
- Preview branch issues (stale DB, missing env vars)

## Usage
```
/vercel [issue-description] [--env preview|production|development] [--check-env] [--check-build] [--check-auth] [--logs]
```

## Project Context

**Team**: CELN (`celn`) — ALWAYS use `--scope celn` with Vercel CLI
**Project**: `construction-web`
**Production URL**: https://celn.app
**Staging URL**: https://preview.celn.app
**Database**: Neon PostgreSQL (preview/production via Vercel-Neon integration)

### Environment URLs
| Environment | APP_URL | Database |
|---|---|---|
| development | `http://localhost:3000` (or dynamic Conductor port) | Local PostgreSQL |
| preview | `https://preview.celn.app` | Neon preview branch |
| production | `https://celn.app` | Neon main branch |

## Behavioral Flow

### Step 1: Gather Deployment State
Run these diagnostic commands to understand current state:

```bash
# Current branch and git status
git branch --show-current
git status --short

# Vercel env vars for target environment
vercel env ls --scope celn

# Latest deployment status (if URL provided)
vercel inspect <deployment-url> --scope celn

# Deployment logs (if investigating a specific failure)
vercel logs <deployment-url> --scope celn
```

Also read these project files for reference:
- `claudedocs/vercel.md` — CLI commands, environment structure, per-env managed vars
- `claudedocs/environment-setup.md` — Required/optional vars, validation schema

### Step 2: Validate Environment Variables
Cross-reference Vercel env vars against the T3 validation schema in `src/env.js`.

**Required vars** (build will fail without these):
| Variable | Validation | Notes |
|---|---|---|
| `POSTGRES_PRISMA_URL` | `z.string().url()` | Auto-provisioned by Vercel-Neon integration (DO NOT set manually) |
| `POSTGRES_URL_NON_POOLING` | `z.string().url()` | Auto-provisioned by Vercel-Neon integration (DO NOT set manually) |
| `APP_URL` | `z.string().url()` | MUST match environment: `https://celn.app` (prod), `https://preview.celn.app` (preview) |
| `BETTER_AUTH_SECRET` | Must exist | Signing secret for sessions |

**Optional vars** (features degrade without these):
| Variable | Purpose | Source |
|---|---|---|
| `RESEND_API_KEY` | Transactional email | Vercel env settings |
| `BLOB_READ_WRITE_TOKEN` | File uploads | Auto-provisioned by Vercel Blob integration |
| `OPENAI_API_KEY` | Semantic search embeddings | Vercel env settings |
| `ANTHROPIC_API_KEY` | AI document analysis | Vercel env settings |
| `BETA_ACCESS_CODE` | Sign-up gate | Vercel env settings |

**Validation rules** (`src/env.js`):
- Empty strings are treated as undefined (`emptyStringAsUndefined: true`)
- All URL vars must be valid URLs (Zod `.url()`)
- `SKIP_ENV_VALIDATION=1` bypasses all checks (used for Docker only)

### Step 3: Check Build Configuration
Validate `vercel.json` build pipeline:

```json
{
  "framework": "nextjs",
  "buildCommand": "npx prisma migrate deploy && npx prisma generate && npx next build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

**Build pipeline order**: `npm install` -> `prisma migrate deploy` -> `prisma generate` -> `next build`

Check for:
- Prisma migration files in `prisma/migrations/` are committed
- `prisma/schema.prisma` is valid and committed
- `package.json` has `"postinstall": "prisma generate"` (runs on `npm install`)
- No TypeScript errors: `npx tsc --noEmit`

### Step 4: Check Auth & Trusted Origins
Read `src/lib/auth.ts` and verify trusted origins logic:

```typescript
trustedOrigins: (request: Request) => {
  const origin = request.headers.get("origin") ?? "";
  // Development: trusts any localhost:* port
  if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return [origin];
  }
  // Production/Preview: trusts APP_URL + VERCEL_URL + VERCEL_BRANCH_URL
  return [
    process.env.APP_URL ?? "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "",
  ].filter(Boolean);
}
```

**Key checks**:
- `APP_URL` is set correctly for the environment
- `VERCEL_URL` and `VERCEL_BRANCH_URL` are auto-injected by Vercel (don't need manual config)
- `baseURL` in auth config uses `process.env.APP_URL`
- Session cookies: `better-auth.session_token` (localhost) / `__Secure-better-auth.session_token` (HTTPS)

### Step 5: Diagnose & Report
Summarize findings in a structured report:

```
## Deployment Diagnostic Report

**Environment**: [preview|production]
**Branch**: [current git branch]
**Status**: [healthy|issues found]

### Environment Variables
- [x] Required vars present
- [ ] APP_URL mismatch: expected X, got Y

### Build Configuration
- [x] vercel.json valid
- [x] Prisma migrations committed

### Auth Configuration
- [x] Trusted origins correct
- [ ] Issue: VERCEL_BRANCH_URL not being used

### Recommendations
1. ...
2. ...
```

## Common Failure Patterns

### 1. Build fails: "Invalid environment variables"
**Cause**: Missing required var in Vercel project settings
**Fix**: Check `src/env.js` for required vars, then:
```bash
vercel env ls --scope celn
# Add missing var:
printf 'value' | vercel env add VAR_NAME preview --scope celn --force
```

### 2. Auth 403 / CORS errors on preview deployments
**Cause**: `APP_URL` doesn't match the preview deployment URL, or trusted origins don't include the preview URL
**Fix**: Verify `APP_URL` is `https://preview.celn.app` for preview environment. The `VERCEL_URL` and `VERCEL_BRANCH_URL` are auto-injected by Vercel and should be handled by `src/lib/auth.ts` trusted origins logic.

### 3. Prisma migration fails during build
**Cause**: `POSTGRES_PRISMA_URL` not set, Neon branch doesn't exist, or migration files not committed
**Fix**:
```bash
# Check if DB URL is set
vercel env ls --scope celn | grep POSTGRES
# Verify migration files are committed
git status prisma/migrations/
```

### 4. Preview database is stale / missing data
**Cause**: Neon preview branches are forked from `main` at deploy time. If `main` has changed since, the preview branch is stale.
**Fix**: Delete and recreate the preview deployment, or reset the Neon branch from the Neon dashboard.

### 5. Blob uploads fail (BLOB_READ_WRITE_TOKEN missing)
**Cause**: Vercel Blob integration not connected to the project
**Fix**: Connect Vercel Blob storage in the Vercel project dashboard → Integrations → Blob

### 6. Email not sending (RESEND_API_KEY missing)
**Cause**: `RESEND_API_KEY` not set for the environment
**Fix**:
```bash
printf 're_...' | vercel env add RESEND_API_KEY preview --scope celn --force
printf 're_...' | vercel env add RESEND_API_KEY production --scope celn --force
```

### 7. Neon branch limit reached (max 10 on free plan)
**Cause**: Too many open preview deployments with auto-created Neon branches
**Fix**: Delete old preview branches from closed PRs in the Neon dashboard

## Tool Coordination
- **Bash**: Vercel CLI commands (`vercel env ls`, `vercel inspect`, `vercel logs`)
- **Read**: Project config files (`vercel.json`, `src/env.js`, `src/lib/auth.ts`, `claudedocs/*.md`)
- **Grep**: Search for env var usage, error patterns in build logs

## Documentation References
- `claudedocs/vercel.md` — Full Vercel configuration reference
- `claudedocs/environment-setup.md` — All env vars with validation rules
- `claudedocs/auth-and-permissions.md` — Auth system, trusted origins, session cookies
- `src/env.js` — T3 Zod validation schema (source of truth for required vars)
- `src/lib/auth.ts` — Better Auth config with trusted origins logic
- `vercel.json` — Build configuration

## Examples

### Diagnose a failed preview deployment
```
/vercel preview deployment failing with 500 errors --env preview --logs
# 1. Run vercel env ls --scope celn to check preview env vars
# 2. Run vercel logs <url> --scope celn to see build/runtime errors
# 3. Cross-reference env vars against src/env.js
# 4. Check auth trusted origins for preview URL
```

### Check env vars before deploying
```
/vercel --check-env --env production
# 1. List all Vercel env vars for production
# 2. Compare against src/env.js required vars
# 3. Verify APP_URL is https://celn.app
# 4. Flag any missing or misconfigured vars
```

### Debug auth issues on preview
```
/vercel sign-in not working on preview branch --check-auth
# 1. Read src/lib/auth.ts trusted origins logic
# 2. Check APP_URL value for preview environment
# 3. Verify VERCEL_URL and VERCEL_BRANCH_URL are handled
# 4. Check session cookie configuration
```

### Investigate build failure
```
/vercel build failed on latest push --check-build --logs
# 1. Check vercel.json build command
# 2. Verify Prisma migrations are committed
# 3. Run npx tsc --noEmit locally to check for type errors
# 4. Pull and inspect build logs
```

## Boundaries

**Will:**
- Run Vercel CLI diagnostics with `--scope celn`
- Cross-reference env vars against `src/env.js` validation schema
- Check auth trusted origins configuration
- Reference project documentation for expected configuration
- Provide actionable fix recommendations

**Will Not:**
- Modify Vercel env vars without explicit user confirmation
- Deploy to production without user approval
- Delete Neon database branches without confirmation
- Expose secret values in diagnostic output (show existence only, not values)
