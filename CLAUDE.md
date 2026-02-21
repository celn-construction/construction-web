# Project Notes

## Codebase Reference
@claudedocs/codebase-overview.md
@claudedocs/environment-setup.md
@claudedocs/auth-and-permissions.md
@claudedocs/data-flows.md
@claudedocs/architecture-and-typescript.md
@claudedocs/testing-guide.md
@claudedocs/components-guide.md

## Documentation Update Rules
When making changes that affect these docs, update them in the same task:
- New/modified tRPC routers or data flows → update `claudedocs/data-flows.md`
- New/modified env vars → update `claudedocs/environment-setup.md`
- Auth, roles, permissions, or middleware changes → update `claudedocs/auth-and-permissions.md`
- New directories, major files, or tech stack changes → update `claudedocs/codebase-overview.md`
- Architecture or TypeScript pattern changes → update `claudedocs/architecture-and-typescript.md`
- New tests added or test patterns change → update `claudedocs/testing-guide.md`
- New components, naming/styling changes, or new feature slices → update `claudedocs/components-guide.md`

## Vercel
- Vercel project name: `construction-web`
- Production URL: https://construction-web-ashen.vercel.app
- Database: Neon PostgreSQL (configured via Vercel integration)
