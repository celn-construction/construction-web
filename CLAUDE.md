# Project Notes

## Codebase Reference
@claudedocs/environment-setup.md
@claudedocs/auth-and-permissions.md
@claudedocs/architecture-and-typescript.md
@claudedocs/testing-guide.md
@claudedocs/components-guide.md
@claudedocs/embeddings.md
@claudedocs/trpc-guide.md
@claudedocs/vercel.md
@claudedocs/csi-codes.md

## Documentation Update Rules
When making changes that affect these docs, update them in the same task:
- New/modified env vars → update `claudedocs/environment-setup.md`
- Auth, roles, permissions, or middleware changes → update `claudedocs/auth-and-permissions.md`
- Architecture or TypeScript pattern changes → update `claudedocs/architecture-and-typescript.md`
- New tests added or test patterns change → update `claudedocs/testing-guide.md`
- New components, naming/styling changes, or new feature slices → update `claudedocs/components-guide.md`
- tRPC routers, procedures, or data-fetching pattern changes → update `claudedocs/trpc-guide.md`
- Vercel env vars, deployments, or project config changes → update `claudedocs/vercel.md`
- CSI code list changes, data sources, or selector behavior → update `claudedocs/csi-codes.md`

## Vercel
- See `claudedocs/vercel.md` for full Vercel configuration reference
- Team: CELN (`celn`) — always use `--scope celn` with Vercel CLI
- Production URL: https://celn.app
- Staging URL: https://preview.celn.app
