# Project Architecture Rules (Non-Obvious Only)

- RIPER-5 enforces strict mode-based workflows - architecture decisions must go through RESEARCH → INNOVATE → PLAN phases
- Service co-location breaks traditional layer separation - domain services live in packages/, not api/
- Monorepo packages have isolated contexts - scripts must use `with-env` prefix to access root .env
- tRPC just-in-time exports eliminate build step complexity - all types available at runtime
- Chrome extension + Next.js dual architecture requires different build tools (Vite vs Next.js)
- Turbo cache strategy: workspace isolation prevents cross-package pollution but requires explicit dependencies
- Database operations scoped to packages/db/ - no direct root access to prevent context issues
- Environment validation via t3-oss/env-nextjs - single source of truth in apps/nextjs/src/env.ts
