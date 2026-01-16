# Repository Context

## Status Strip

- **Scanned at**: 2026-01-16
- **Repo HEAD**: Current
- **Mode**: User Update

---

## Product & PRD Context

### Overview

**EngageKit** is a LinkedIn engagement automation platform that helps users automatically comment on LinkedIn posts using AI-generated responses. The product consists of:

- A Next.js web dashboard for configuration and analytics
- A Chrome extension for LinkedIn post interaction
- Cloud browser instances (via Hyperbrowser) for automated engagement

### Goals & Success Metrics

- Automate LinkedIn commenting with AI-generated, authentic-sounding responses
- Support multiple LinkedIn accounts per user
- Provide configurable comment styles (free and premium tiers)
- Enable targeting specific profiles/lists for engagement

### Scope

**In Scope:**

- AI-powered comment generation (Gemini API)
- Chrome extension for LinkedIn integration
- Multi-account LinkedIn management
- Target list management
- Blacklist functionality
- Comment style customization
- Freemium subscription model (Stripe)

**Out of Scope:**

- Direct LinkedIn API integration (uses browser automation)
- Mobile app
- Other social platforms

### Features Catalog (MoSCoW)

| Priority | Feature        | Description                                              |
| -------- | -------------- | -------------------------------------------------------- |
| Must     | AI Comments    | Generate contextual comments using Gemini AI             |
| Must     | WXT Extension  | Browser extension for LinkedIn interaction (WXT + React) |
| Must     | Multi-Account  | Support multiple LinkedIn accounts per user              |
| Must     | Auth           | Clerk authentication (web + extension)                   |
| Must     | Payments       | Stripe subscription management                           |
| Should   | Target Lists   | Group profiles for focused engagement                    |
| Should   | Blacklist      | Exclude specific profiles from commenting                |
| Should   | Comment Styles | Free (5) + Premium (10) style presets                    |
| Could    | Manual Approve | Review comments before posting (premium)                 |
| Could    | Language-Aware | Detect post language for responses (premium)             |

### API Surface (tRPC Routers)

| Router                | Purpose                             |
| --------------------- | ----------------------------------- |
| `stripe`              | Subscription and payment management |
| `aiComments`          | AI comment generation               |
| `user`                | User profile and settings           |
| `profileImport`       | LinkedIn profile import runs        |
| `linkedinScrapeApify` | Apify-based profile scraping        |
| `browser`             | Hyperbrowser instance management    |
| `autocomment`         | Auto-commenting runs and history    |
| `targetList`          | Target list CRUD                    |
| `blacklist`           | Blacklisted profiles management     |
| `account`             | LinkedIn account management         |

### Key Database Models

| Model                          | Purpose                              |
| ------------------------------ | ------------------------------------ |
| `User`                         | User accounts with Clerk integration |
| `LinkedInAccount`              | Connected LinkedIn accounts          |
| `AutoCommentRun`               | Comment automation runs              |
| `UserComment`                  | Generated/posted comments            |
| `TargetList` / `TargetProfile` | Target profile lists                 |
| `BlacklistedProfile`           | Excluded profiles                    |
| `CommentStyle`                 | Custom comment styles                |
| `AutoCommentConfig`            | Per-account automation settings      |
| `LinkedInProfile`              | Scraped LinkedIn profile data        |
| `BrowserInstance`              | Hyperbrowser session tracking        |

---

## Tech Stack Overview

| Area                  | Technology                          | Version/Source       |
| --------------------- | ----------------------------------- | -------------------- |
| Runtime               | Node.js                             | >=22.11.0            |
| Package Manager       | pnpm                                | 10.6.3               |
| Monorepo              | Turborepo                           | ^2.3.4               |
| Language              | TypeScript                          | ^5.7.3               |
| Framework (Web)       | Next.js                             | ^15.2.2 (App Router) |
| Framework (Extension) | Vite + React                        | ^6.3.5               |
| React                 | React 19                            | 19.0.0               |
| API                   | tRPC                                | ^11.0.0-rc.824       |
| Database              | PostgreSQL + Prisma                 | ^6.8.2               |
| Auth                  | Clerk                               | ^6.12.5              |
| Payments              | Stripe                              | ^13.9.0              |
| AI                    | Google Gemini                       | @google/genai ^1.5.1 |
| Styling               | Tailwind CSS v4 (Web/UI) / v3 (WXT) | ^4.1.8 / ^3.4.17     |
| UI Components         | shadcn/ui + Radix                   | Various              |
| Browser Automation    | Hyperbrowser SDK                    | ^0.65.0              |
| Scraping              | Apify Client                        | ^2.12.0              |

---

## Monorepo Layout

### Apps

| Package                    | Path                     | Description                                                            |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| `@sassy/nextjs`            | `apps/nextjs`            | Main web dashboard & Landing Page (Next.js 15 App Router, Tailwind v4) |
| `@sassy/wxt-extension`     | `apps/wxt-extension`     | **[NEW]** Product Extension (WXT, Vite, React 19, Tailwind v3)         |
| `@sassy/nextjs-ghost-blog` | `apps/nextjs-ghost-blog` | Ghost blog integration (SEO & Content)                                 |
| `@sassy/chrome-extension`  | `apps/chrome-extension`  | **[LEGACY]** Old extension (Deprecated)                                |

### Packages

| Package                        | Path                             | Description                                                   |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------- |
| `@sassy/api`                   | `packages/api`                   | tRPC API routers and procedures                               |
| `@sassy/db`                    | `packages/db`                    | Prisma schema and database client                             |
| `@sassy/ui`                    | `packages/ui`                    | Shared UI components (shadcn/ui)                              |
| `@sassy/validators`            | `packages/validators`            | Shared Zod schemas                                            |
| `@sassy/linkedin-automation`   | `packages/linkedin-automation`   | Core automation logic (account, comment, feed, post, profile) |
| `@sassy/stripe`                | `packages/stripe`                | Stripe integration                                            |
| `@sassy/feature-flags`         | `packages/feature-flags`         | Feature gating (email-based)                                  |
| `@sassy/actors`                | `packages/actors`                | Apify actors (Playwright)                                     |
| `@sassy/linkedin-scrape-apify` | `packages/linkedin-scrape-apify` | LinkedIn profile scraping client                              |

### Tooling

| Package                  | Path                    | Description                                 |
| ------------------------ | ----------------------- | ------------------------------------------- |
| `@sassy/eslint-config`   | `tooling/eslint`        | Shared ESLint configs (base, nextjs, react) |
| `@sassy/prettier-config` | `tooling/prettier`      | Shared Prettier config                      |
| `@sassy/tsconfig`        | `tooling/typescript`    | Shared TypeScript configs                   |
| `@sassy/tailwind-config` | `tooling/tailwind`      | Shared Tailwind configs (web, native)       |
| `@sassy/sync-template`   | `tooling/sync-template` | Template sync utility                       |
| `@sassy/github`          | `tooling/github`        | GitHub workflows                            |

---

## Package Manager & Scripts

### Global Scripts (Root)

```bash
pnpm dev              # Run all apps in dev mode (turbo watch)
pnpm dev:next         # Run Next.js app only
pnpm build            # Build all packages
pnpm typecheck        # Type-check all packages
pnpm lint             # Lint all packages
pnpm lint:fix         # Lint and auto-fix
pnpm format           # Check formatting
pnpm format:fix       # Fix formatting
pnpm db:push          # Push Prisma schema
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma client
pnpm ui-add           # Add shadcn/ui components
```

### Environment Loading Pattern

All packages use `dotenv-cli` with a `with-env` script:

```bash
"with-env": "dotenv --override -e ../../.env --"
```

This loads the root `.env` file for all package scripts.

---

## TypeScript & Module Resolution

### Base Config (`tooling/typescript/base.json`)

- Target: ES2022
- Module: Preserve (bundler mode)
- Strict mode enabled
- `noUncheckedIndexedAccess: true`
- Incremental builds with `.cache/tsbuildinfo.json`

### Path Aliases

| Alias | Package         | Resolution |
| ----- | --------------- | ---------- |
| `~/*` | `@sassy/nextjs` | `./src/*`  |

### JIT Package Exports

Packages use direct source exports (no build step for internal packages):

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

---

## API & Backend

### tRPC Setup

- **Location**: `packages/api/src/`
- **Router**: `packages/api/src/router/root.ts`
- **Context**: Creates DB connection and handles auth
- **Procedures**: `publicProcedure`, `protectedProcedure`

### Authentication Flow

1. **Next.js**: Uses `@clerk/nextjs` server auth
2. **Chrome Extension**: Passes Bearer token in `Authorization` header
3. **Assumed Account**: JWT-based account impersonation for LinkedIn accounts

### tRPC Client (Next.js)

```typescript
// apps/nextjs/src/trpc/react.tsx
import { useTRPC } from "./react";

const trpc = useTRPC();
```

#### `trpc` vs `trpcStandalone` - Usage Guidelines

**Use `trpc` hooks (React Query integration) for 99% of cases:**

```typescript
const trpc = useTRPC();

// For queries (automatic data fetching)
const { data, isLoading } = trpc.user.getProfile.useQuery();

// For mutations (user-triggered actions)
const createPost = trpc.posts.create.useMutation();
await createPost.mutateAsync({ title: "Hello" });
```

**Benefits:**

- Automatic loading/error states (`isPending`, `isError`, etc.)
- Built-in caching and refetching
- Optimistic updates
- Full TypeScript inference
- Integrated with React lifecycle

**Use `trpcStandalone` only for special cases:**

```typescript
import { trpcStandalone } from "~/trpc/react";

// Direct imperative calls outside React components
const data = await trpcStandalone.user.getProfile.query();
```

**When to use `trpcStandalone`:**

- Server-side code (Server Components, API routes)
- Outside React components (utility functions, middleware)
- Complex loops/conditions where hooks can't be used

**Rule of Thumb:** If you're in a React component → use `trpc` hooks. If you're outside React → use `trpcStandalone`.

---

## Database & Data Layer

### Prisma Configuration

- **Schema**: `packages/db/prisma/schema.prisma`
- **Providers**: PostgreSQL with extensions (uuid-ossp, vector)
- **Outputs**:
  - Node client: `packages/db/generated/node`
  - Edge client: `packages/db/generated/edge`
  - Zod validators: `packages/db/generated/zod-prisma-validators`

### Database Access

```typescript
import { db } from "@sassy/db";
```

### Key Relationships

```
User
     LinkedInAccount[] (1:N)
     ProfileImportRun[] (1:N)
     AutoCommentRun[] (1:N)
     CommentStyle[] (1:N)
     AutoCommentConfig[] (1:N)

LinkedInAccount
     AutoCommentConfig (1:1)
     AutoCommentRun[] (1:N)
     UserComment[] (1:N)
     BlacklistedProfile[] (1:N)
```

---

## Auth & Payments

### Clerk Integration

- **Web**: `@clerk/nextjs` for Next.js app
- **Extension**: `@clerk/chrome-extension` for browser extension
- **Backend**: `@clerk/backend` for token verification

### Stripe Integration

- **Package**: `packages/stripe`
- **Webhooks**: `apps/nextjs/src/app/api/webhooks/stripe/route.ts`
- **Access Types**: FREE, WEEKLY, MONTHLY, YEARLY

---

## UI & Styling

### Tailwind CSS v4

- **Config**: `tooling/tailwind/` (base.ts, web.ts)
- **PostCSS**: `@tailwindcss/postcss` plugin
- **CSS Variables**: HSL-based color system

### shadcn/ui Components

- **Location**: `packages/ui/src/ui/`
- **Add command**: `pnpm ui-add [component]`

### Key UI Exports

```typescript
import { Button } from "@sassy/ui/button";
import { Card } from "@sassy/ui/card";
import { useToast } from "@sassy/ui/hooks/use-toast";
```

---

## Environment Variables

### Required Server Variables

| Variable                | Package     | Purpose                           |
| ----------------------- | ----------- | --------------------------------- |
| `DATABASE_URL`          | db          | Prisma connection string          |
| `DIRECT_URL`            | db          | Direct DB connection (migrations) |
| `CLERK_SECRET_KEY`      | api, nextjs | Clerk backend auth                |
| `CLERK_WEBHOOK_SECRET`  | nextjs      | Clerk webhook verification        |
| `GOOGLE_GENAI_API_KEY`  | nextjs      | Gemini AI API                     |
| `STRIPE_SECRET_KEY`     | stripe      | Stripe API                        |
| `STRIPE_WEBHOOK_SECRET` | nextjs      | Stripe webhook verification       |
| `HYPERBROWSER_API_KEY`  | api         | Browser automation                |
| `APIFY_API_TOKEN`       | api         | Apify scraping                    |
| `LOOPS_API_KEY`         | nextjs      | Email marketing                   |
| `CRON_SECRET`           | nextjs      | Cron job auth                     |

### Required Client Variables

| Variable                            | Package | Purpose            |
| ----------------------------------- | ------- | ------------------ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | nextjs  | Clerk frontend     |
| `NEXT_PUBLIC_CLERK_FRONTEND_API`    | nextjs  | Clerk frontend API |

---

## Linting & Formatting

### ESLint

- **Config**: `tooling/eslint/`
- **Presets**: base, nextjs, react
- **Plugins**: React, React Hooks, Import, JSX-a11y, Turbo

### Prettier

- **Config**: `tooling/prettier/`
- **Workspace reference**: `"prettier": "@sassy/prettier-config"`

---

## Conventions & Rules

### File Naming

- **Files/Dirs**: kebab-case (`auto-comment-config.ts`)
- **Components**: PascalCase (`AutoCommentConfig.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAutoComment.ts`)

### Export Patterns

- Prefer named exports over default exports
- Use barrel exports (`index.ts`) sparingly

### Service Co-location

Services and their related code should be co-located within their domain package:

- Stripe logic in `packages/stripe`
- LinkedIn scraping in `packages/linkedin-scrape-apify`
- Feature flags in `packages/feature-flags`

### Code Style

- Strict TypeScript (no `any`)
- Zod for runtime validation
- tRPC for type-safe APIs
- React Query for data fetching

---

## Security Posture

### Authentication Boundaries

- All tRPC mutations require authentication
- Chrome extension uses Bearer token auth
- Webhooks use secret verification

### Sensitive Data

- LinkedIn credentials encrypted with `LINKEDIN_PASSWORD_SECRET_KEY`
- 2FA secrets encrypted with `LINKEDIN_TWO_FA_SECRET_KEY`
- JWT secrets for account impersonation

---

## Monitoring & Operations

### Deployment

- **Web**: Vercel (Next.js)
- **Extension**: Chrome Web Store / Manual upload
- **Cron**: Vercel Cron (`/api/cron/reset-daily-comments`)

### Analytics

- Vercel Analytics (`@vercel/analytics`)
- Vercel Speed Insights (`@vercel/speed-insights`)

---

## References & Key Files

### Configuration Files

- `pnpm-workspace.yaml` - Workspace definition
- `turbo.json` - Turborepo pipeline config
- `package.json` - Root package manifest

### Rule Files

- `.cursor/rules/riper-5-mode.mdc` - RIPER-5 protocol
- `.cursor/rules/mode-agent-orchestration.mdc` - Agent orchestration
- `.cursor/rules/code-standards.mdc` - Coding conventions
- `.cursor/rules/tech-stack.mdc` - Technical architecture

### Key Source Files

- `packages/api/src/trpc.ts` - tRPC setup and auth middleware
- `packages/api/src/router/root.ts` - API router aggregation
- `packages/db/prisma/schema.prisma` - Database schema
- `apps/nextjs/src/env.ts` - Environment validation
- `apps/nextjs/src/trpc/react.tsx` - React tRPC client

---

## WXT Extension Architecture

### Technical Context

- **Framework**: WXT (Next-gen Web Extension Framework)
- **Build Tool**: Vite
- **UI library**: React 19 + Tailwind CSS v3
- **State Management**: Zustand
- **API**: tRPC (via `@sassy/api`)
- **Authentication**: Clerk (synced with web app)

### Key Features

- **Sidebar Injection**: Injects a React sidebar into LinkedIn pages using Shadow DOM isolation.
- **Tailwind Compatibility**: Uses Tailwind v3 to avoid conflicts with v4 in the UI package (due to PostCSS/Vite limitations in WXT context).
- **Port Configuration**: Deviates from standard Next.js ports to avoid conflicts (Next.js: 3000, WXT: 3002).

### Migration from Chrome Extension

- The `apps/chrome-extension` is deprecated.
- All new development happens in `apps/wxt-extension`.
- Core automation logic is shared via `packages/linkedin-automation`.

---

## Tool Migration & Standalone Bundles

### nextjs-ghost-blog Architecture

The `apps/nextjs-ghost-blog` app uses a hybrid build system:

- **Next.js**: Handles the main app (pages, routing, SSR)
- **Vite**: Builds standalone component/tool bundles for embedding via script tags

### Tool Migration Pattern

When migrating tools from `engagekit-blog` to `apps/nextjs-ghost-blog`:

1. **Create tool directory**: `src/tools/{tool-name}/`
2. **Update imports**: Replace `@/components/ui/*` → `@sassy/ui/*` and `@/lib/utils` → `@sassy/ui/utils`
3. **Create mount function**: `src/tools/{tool-name}/index.tsx` with:
   - `mount{ToolName}()` function
   - Component export
   - Auto-mount logic for standalone bundles
   - Use `ek-component-container` class for CSS scoping
4. **Add dependencies**: Include required packages in `package.json` (e.g., TipTap, sonner, runes)
5. **Vite auto-discovery**: Tools are automatically discovered by `vite.config.tools.js` which scans `src/tools/` for `index.tsx` files

### TipTap Integration

When using TipTap editor in standalone bundles:

- Set `immediatelyRender: false` in `useEditor` config to prevent hydration issues
- Required for React 19 compatibility in standalone bundle contexts
- Example:

```typescript
const editor = useEditor({
  immediatelyRender: false,
  extensions: [StarterKit, Underline, Placeholder],
  // ...
});
```

### Toaster in Standalone Bundles

For standalone tool bundles:

- Use `Toaster` from `sonner` directly (not from `@sassy/ui/toast`)
- The UI package's Toaster depends on `next-themes` which isn't available in standalone contexts
- Include `<Toaster />` in the tool component itself
- Example:

```typescript
import { Toaster } from 'sonner';

export function MyTool() {
  return (
    <>
      <Toaster />
      {/* Tool content */}
    </>
  );
}
```

### Tool Structure

```
apps/nextjs-ghost-blog/src/tools/{tool-name}/
├── index.tsx              # Mount function and exports
├── {tool-name}-tool.tsx   # Main tool component
├── editor-panel.tsx        # Editor components (if applicable)
├── preview-panel.tsx       # Preview components (if applicable)
├── toolbar.tsx            # Toolbar components
├── icons.tsx              # Icon definitions
├── utils.ts              # Utility functions
└── preview/               # Preview sub-components
    ├── preview-header.tsx
    ├── user-info.tsx
    └── ...
```

---

## Open Questions

1. ~~**Ghost Blog Integration**: `apps/nextjs-ghost-blog` appears to be in progress - purpose and timeline unclear~~ ✅ In progress - migrating embeddable components/tools from Vite app to Next.js
2. **Hyperbrowser vs Extension**: Relationship between cloud browser instances and Chrome extension for commenting
3. **Feature Flags Migration**: Current email-based feature flags may need migration to a proper feature flag service

---

## Appendix: Feature Flag Configuration

### Free Tier Features

- maxPosts: 10 per run
- dailyComments: 100 per day
- customStyleGuide: Yes

### Premium Tier Features

- maxPosts: 100 per run
- duplicateAuthorCheck
- postAgeFilter
- blacklistAuthor
- commentAsCompanyPage
- languageAwareComment
- skipCompanyPages
- skipPromotedPosts
- skipFriendsActivities
- manualApprove

### Comment Style Presets

**Free:**

- Positive
- Professional
- Contrarian
- Learning
- Hustling

**Premium:**

- Pragmatic Engineer
- Data-Driven Marketer
- Visionary Product Manager
- Seasoned VC
- Scrappy Bootstrapper
- UX/UI Obsessive
- Ecosystem Connector
- Academic Turned Founder
- Sales-Led Founder
- HR/People Ops Leader
