# Project Notes

## Codebase Reference
@claudedocs/environment-setup.md
@claudedocs/auth-and-permissions.md
@claudedocs/architecture-and-typescript.md
@claudedocs/testing-guide.md
@claudedocs/components-guide.md
@claudedocs/embeddings.md

## Documentation Update Rules
When making changes that affect these docs, update them in the same task:
- New/modified env vars → update `claudedocs/environment-setup.md`
- Auth, roles, permissions, or middleware changes → update `claudedocs/auth-and-permissions.md`
- Architecture or TypeScript pattern changes → update `claudedocs/architecture-and-typescript.md`
- New tests added or test patterns change → update `claudedocs/testing-guide.md`
- New components, naming/styling changes, or new feature slices → update `claudedocs/components-guide.md`

## Vercel
- Vercel project name: `construction-web`
- Production URL: https://construction-web-ashen.vercel.app
- Database: Neon PostgreSQL (configured via Vercel integration)
