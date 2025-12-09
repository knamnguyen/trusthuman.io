# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Development Commands

- `pnpm dev` - Run all apps in development with Turbo watch mode
- `pnpm dev:next` - Run only Next.js app in development mode
- `extension:package` - Build Chrome extension (auto-increments version)
- `extension:deploy-hyperbrowser` - Deploy extension to Hyperbrowser
- `db:studio` - Open Prisma database studio
- Database commands must run from packages/db directory: `pnpm --filter @sassy/db db:push`

## Project-Specific Patterns

- **RIPER-5 Methodology**: This project uses RIPER-5 spec-driven development with strict mode workflows. See `.cursor/rules/riper-5-mode.mdc` for details
- **Service Co-location**: Services live in their domain packages, not grouped by framework (e.g., Stripe service in packages/stripe/, not packages/api/)
- **tRPC Exports**: No build step required - just-in-time exports from packages/api/src/index.ts
- **Environment Variables**: Use `with-env` prefix for all scripts that need root .env access (`pnpm with-env bun scripts/script.ts`)
- **Import Restrictions**: ESLint blocks `process.env` - use `import { env } from '~/env'` instead

## Code Style Guidelines

- **TypeScript**: Avoid `any`, use explicit types, prefer arrow functions over `function` keyword
- **Imports**: ESLint requires `prefer-top-level` for type imports, use `@sassy/` prefix for internal packages
- **Prettier**: Automatic import sorting with specific order: `<TYPES>`, `react`, `next`, `<THIRD_PARTY_MODULES>`, `@sassy/`, `~/`, `^[./]`
- **Environment**: Node 22.11.0+ and pnpm 9.6.0+ required (enforced in package.json engines)

## Architecture Notes

- **Chrome Extension**: Built with Vite, not Webpack; uses `@crxjs/vite-plugin`
- **Next.js**: Uses App Router with server components by default
- **Tailwind v4**: Uses modern CSS features with `@import` syntax, not the older plugin approach
- **Testing**: Bun test runner for packages, no unified test framework across apps
- **Monorepo**: Uses Turbo with workspace-specific scripts and isolated contexts
