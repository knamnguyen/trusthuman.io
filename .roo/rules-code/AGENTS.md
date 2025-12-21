# Project Coding Rules (Non-Obvious Only)

- Always use `with-env` prefix for scripts requiring root `.env` access (`pnpm with-env bun scripts/script.ts`)
- Import `env` via `import { env } from '~/env'` - ESLint blocks `process.env`
- tRPC uses just-in-time exports - no build step required from packages/api/src/index.ts
- Service co-location principle: services live in domain packages, not grouped by framework
- Chrome extension built with Vite + `@crxjs/vite-plugin`, not Webpack
- Tailwind v4 uses modern `@import` syntax, not plugin approach
- Bun test runner for packages - no unified test framework across apps
- Postinstall script copies Prisma engine: `cp packages/db/generated/node/libquery_engine-rhel-openssl-3.0.x.so.node apps/nextjs/.next/server/`
