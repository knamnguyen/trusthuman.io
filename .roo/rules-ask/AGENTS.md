# Project Documentation Rules (Non-Obvious Only)

- "packages/" contains business logic services, not just libraries (service co-location principle)
- RIPER-5 methodology dominates project structure - see `.cursor/rules/riper-5-mode.mdc` for workflows
- Environment variables documented in `apps/nextjs/src/env.ts` - this is the single source of truth
- tRPC routers live in `packages/api/src/router/` - API documentation is in the router files
- Process plans stored in `process/plans/` with date stamps: `[feature]_PLAN_[dd-mm-yy].md`
- Database schema in `packages/db/prisma/schema.prisma` - migrations and types generated here
- Chrome extension source in `apps/chrome-extension/src/` - counterintuitive location for web app developers
- Test data for LinkedIn scraping in `packages/api/client-data/` (JSON datasets for development)
