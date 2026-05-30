---
name: find-bugs-on-sentry
description: "Find and triage real bugs in Sentry production errors from the past 24 hours, classify them by priority (P0–P3), filter noise, and produce an actionable bug list ranked by fix urgency. Trigger on /find-bugs-on-sentry, or whenever the user asks about Sentry issues, production errors, recent bugs, error reports, what broke overnight, finding bugs on Sentry, morning triage, or wants to know which production errors are real bugs worth fixing"
category: workflow
complexity: standard
mcp-servers: [sentry]
---

# /find-bugs-on-sentry — Sentry Bug Triage

> **Context Framework Note**: This behavioral instruction activates when users type `/find-bugs-on-sentry` or ask about recent Sentry errors. It produces a prioritized bug list from the last 24 hours of production errors, distinguishing real bugs from noise based on this project's specific risk surface.

## Triggers
- `/find-bugs-on-sentry` command
- "Find bugs on Sentry", "check Sentry", "any new bugs?", "what broke?", "morning triage"
- Questions about recent production errors, error reports, error trends
- Need for a prioritized backlog of bugs to fix
- Pre-standup or pre-deploy bug review

## Usage
```
/find-bugs-on-sentry [--env production|preview] [--hours N] [--include-noise]
```

Defaults: `--env production`, `--hours 24`, noise filtered out (use `--include-noise` to see what was dismissed and why).

## Project Context

**Sentry project**: `sentry-cinnabar-clock` (org: `celn-construction`)
**App framework**: Next.js 15 App Router + tRPC + Prisma + Better Auth
**Critical surfaces** (errors here are usually real bugs):
- tRPC routers in `src/server/api/routers/`
- Better Auth flow (`/api/auth/*`, sign-in, sign-up, OTP verification)
- Blob upload/proxy (`/api/upload`, `/api/blob/*`)
- Bryntum Gantt sync (`gantt.sync` mutation)
- Prisma writes (especially transactions)
- AI features: `document.aiSearch` (OpenAI), document analysis (Anthropic)
- Onboarding wizard, organization/project creation

## Behavioral Flow

### Step 1: Fetch issues from Sentry

Use the `sentry:seer` skill (or Sentry MCP directly) to pull issues. **Do not invent Sentry data — always fetch it live.**

Query the Sentry MCP with something equivalent to:

> "List all unresolved issues from the `sentry-cinnabar-clock` project in the `production` environment with events in the past 24 hours. For each issue include: title, culprit/transaction, event count, unique user count, first seen, last seen, level (error/warning/fatal), release, and the issue URL."

If preview is requested (`--env preview`), filter to that environment instead. If authentication is required, run `mcp__sentry__authenticate` and tell the user to complete the OAuth flow in their browser before proceeding.

### Step 2: Classify each issue

Apply the priority rubric below to **every** issue. For each, record:
- **Priority**: P0 / P1 / P2 / P3 / NOISE
- **Reason**: one sentence explaining the classification
- **Surface**: which subsystem (tRPC `xRouter`, Better Auth, Blob, Gantt, Prisma, UI, etc.)
- **Likely root cause**: a guess from the stack trace + title, not a hallucination — say "unclear from stack" if you can't tell
- **Recommended action**: file path(s) to read, related migration to check, or "monitor only"

### Priority Rubric

This rubric encodes how *this* codebase fails. Use the **highest** priority that matches.

#### P0 — Drop everything (fix today)
- Anything in **auth flow** (`/api/auth/*`, sign-in, sign-up, OTP, password reset) affecting any users in the last hour
- **Payment / billing** errors (none yet in this codebase, but reserve)
- **Data-loss risk**: failed Prisma transactions on writes, partial document uploads with orphaned blob, lost Gantt edits
- **Database-down indicators**: connection refused, pool exhausted, `P1001`, `P1008`, `P2024`
- **Regression in core path** (sign-in, project create, document upload, Gantt save) introduced by the latest release
- **>100 unique users** affected in 24h regardless of surface

#### P1 — Fix this week
- Errors in any tRPC router that's part of normal usage (`project.*`, `document.*`, `gantt.*`, `member.*`, `invitation.*`)
- **Blob proxy / upload errors** (`/api/upload`, `/api/blob/[documentId]`, `/api/upload/avatar`) — these break the document viewer and avatars
- **Bryntum Gantt sync failures** (`gantt.sync` mutation) — silent data loss; users don't realize their edits weren't saved
- **AI feature errors** (`document.aiSearch`, embedding generation, AI description) when affecting >5 users — degrades search but doesn't lose data
- **Prisma errors** that aren't `P2025` (not-found): `P2002` (unique constraint), `P2003` (FK violation), `P2034` (write conflict)
- **New errors** (first seen in last 24h) in our own code affecting >10 users
- **Reproducible** errors with clear stack traces pointing to `src/`

#### P2 — Fix when convenient
- Known issues with workarounds in place
- Errors affecting <10 users in non-core features (notifications, weather widget, project switcher animations)
- UI-only errors (React hydration warnings, ResizeObserver loop, layout effect warnings)
- Validation errors (`ZodError`) from user input — usually means form validation is missing on the client, not a backend bug
- `P2025` Prisma not-found errors — usually means stale frontend state, low impact
- Rate-limit errors from third parties (OpenAI 429, Anthropic 529) — handle gracefully but not urgent

#### P3 — Monitor only
- Recurring, accepted issues (e.g., a known third-party flake we've decided to live with)
- Errors with <3 events and <3 users in 24h that aren't in critical surfaces
- Stale-deploy `ChunkLoadError` after a release (user just needs to refresh — auto-resolves)
- Warning-level events that aren't errors

#### NOISE — Filter out
Do not include these in the main list (mention in summary count only, expand with `--include-noise`):
- `ResizeObserver loop limit exceeded` — browser quirk, harmless
- `Non-Error promise rejection captured` with no stack
- Errors from browser extensions (stack trace contains `chrome-extension://`, `moz-extension://`, `safari-extension://`)
- `AbortError` from cancelled fetches (user navigated away mid-request)
- `NetworkError` / `Failed to fetch` when the client is offline (user's network, not ours)
- Better Auth `INVALID_OTP` / `INVALID_PASSWORD` — expected when users type wrong code
- `TRPCError: UNAUTHORIZED` from expired sessions on background tabs
- Errors with `level: "info"` or `level: "debug"` (someone left a `Sentry.captureMessage` lying around — note it but don't triage)
- Crawler / bot errors (user-agent contains `bot`, `crawler`, `spider`, `headlesschrome` without our test header)

**Important**: if an error matches a NOISE pattern but its event count spiked dramatically in 24h (>10x baseline), treat it as P2 — something changed.

### Step 3: Cross-reference recent code

For any P0 or P1, take a quick look at the suspected file path to confirm the error is real (the line might already be fixed in an unreleased commit, or the function may have been renamed). Don't write a fix — just confirm the code still looks consistent with the stack trace. Note this in the "Recommended action" line.

If the issue's release tag matches a release older than `HEAD`, mention that the fix may already be deployed.

### Step 4: Output the prioritized report

Use this exact structure so the report is scannable:

```markdown
# Sentry Triage — Production, Last 24h

**Generated**: <ISO timestamp>
**Issues fetched**: N total · M after noise filter
**Highest priority**: P0 / P1 / P2 / P3 / none
**Filtered noise**: K issues (run with `--include-noise` to see)

---

## P0 — Fix today (X issues)

### 1. <Issue title>
- **Surface**: tRPC `gantt.sync` / Better Auth / Blob proxy / etc.
- **Impact**: <event count> events · <user count> users · first seen <relative>
- **Release**: <release tag>
- **Likely cause**: <one sentence>
- **Action**: read `src/server/api/routers/gantt.ts:142`, check migration `2026XXXX_...`
- **Link**: <sentry URL>

### 2. ...

---

## P1 — Fix this week (X issues)

(same structure)

---

## P2 — Fix when convenient (X issues)

(same structure, but condensed to 2-3 lines each)

---

## P3 — Monitor (X issues)

Just title + event/user count + link. One line each.

---

## Summary

- **Recommended order**: 1, 2, 3 (P0s), then 4, 5 (P1s) ...
- **Patterns noticed**: e.g. "3 of 5 P1s are in the blob proxy — likely the same root cause"
- **Suggested next step**: e.g. "start with #1: read `src/server/api/routers/gantt.ts`"
```

If there are zero P0 and P1 issues, lead with: "**No urgent bugs in the last 24h.** N issues filtered as noise; M low-priority issues below."

## Classification Examples

**Example 1 — clear P0**
```
Title: PrismaClientKnownRequestError: Transaction failed: P2034
Surface: tRPC project.create
Users: 47 · Events: 89 · Release: v0.4.1 (latest)
Classification: P0 — auth/onboarding-critical surface (project.create runs on first onboarding), data-loss risk (transaction failed), affecting 47 users in 24h on the latest release. This breaks new user onboarding.
```

**Example 2 — clear P1**
```
Title: TypeError: Cannot read properties of undefined (reading 'blobUrl')
Surface: /api/blob/[documentId]
Users: 12 · Events: 34 · Release: v0.4.1
Classification: P1 — blob proxy error, document viewer is broken for affected users. 12 users in 24h, new since latest release. Read src/app/api/blob/[documentId]/route.ts.
```

**Example 3 — NOISE**
```
Title: ResizeObserver loop limit exceeded
Users: 84 · Events: 312 · Release: v0.4.1
Classification: NOISE — known browser quirk, no functional impact. Event count is high but flat over time (no spike).
```

**Example 4 — P2 that looks scarier than it is**
```
Title: TRPCError: NOT_FOUND on document.getById
Surface: tRPC document.getById
Users: 6 · Events: 9
Classification: P2 — Prisma P2025 wrapped in TRPCError. Usually means user clicked a link to a deleted document from cached UI state. Low impact, fix by invalidating doc list cache on delete.
```

## Common Patterns

### Pattern 1 — Spike after a release
If multiple new issues all share the same `release` tag and were first seen within an hour of each other, treat them as a regression cluster — surface this prominently in the summary and recommend rolling back.

### Pattern 2 — Cascading errors
If you see a P0 database error AND a bunch of P1s in dependent surfaces (tRPC routers, blob proxy, etc.), the P1s are probably caused by the P0. Note this in the summary so the user doesn't try to fix them separately.

### Pattern 3 — User-induced noise spike
A 10x spike in an otherwise-noise error usually means a malicious bot or a buggy crawler hit the site. Check the user-agent distribution in Sentry before classifying as P2.

### Pattern 4 — Already-fixed
If an issue's last `seen` is older than the latest deploy, it's probably fixed. Demote by one priority level and note "fix may be deployed; verify by checking event count over next 24h".

## Tool Coordination

- **Skill `sentry:seer`**: primary mechanism for fetching Sentry data via natural language
- **Sentry MCP (`mcp__sentry__*`)**: fallback if `sentry:seer` isn't available; use `authenticate` / `complete_authentication` to set up access first
- **Read**: peek at file paths suggested in stack traces to confirm code still matches
- **Bash (`git log`)**: cross-check release tags against recent commits to identify likely regression-introducing changes

## Documentation References

- `claudedocs/environment-setup.md` — Sentry env vars and project slugs
- `claudedocs/vercel.md` — production URLs and environment structure
- `claudedocs/trpc-guide.md` — tRPC error handling conventions (`TRPCError` codes)
- `claudedocs/auth-and-permissions.md` — auth flow surfaces and middleware behavior

## Boundaries

**Will:**
- Fetch live Sentry data and classify every issue
- Apply the priority rubric consistently, with reasoning shown
- Filter known noise patterns by default, surface filtered counts in summary
- Cross-reference suspected file paths to confirm relevance
- Recommend a fix order and identify regression clusters

**Will Not:**
- Invent Sentry issues or hallucinate event counts — always fetch live
- Write code fixes (this skill is triage only; user can ask for a fix per issue afterward)
- Resolve, ignore, or comment on Sentry issues from the CLI without explicit user instruction
- Page anyone, post to Slack, or send notifications
- Treat warning-level events as bugs unless they have an associated stack trace
