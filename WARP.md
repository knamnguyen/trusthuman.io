# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

EngageKit is a T3 Turbo Stack monorepo that contains a Next.js web application, Chrome extension for LinkedIn automation, and shared packages. It uses TypeScript throughout, Turborepo for build orchestration, and modern tools like tRPC, Prisma, Clerk, and Stripe.

## Common Development Commands

### Setup & Installation

```bash
# Install dependencies
pnpm i

# Setup environment variables
cp .env.example .env
# Edit .env with your values

# Generate database client & push schema
pnpm db:generate
pnpm db:push
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start only Next.js app
pnpm dev:next

# Start Chrome extension development
cd apps/chrome-extension && pnpm dev

# Database studio
pnpm db:studio
```

### Building & Testing

```bash
# Build all applications and packages
pnpm build

# Type checking across all packages
pnpm typecheck

# Lint all code
pnpm lint
pnpm lint:fix

# Format code
pnpm format
pnpm format:fix

# Workspace dependency checks
pnpm lint:ws
```

### Database Operations

```bash
# Generate Prisma client (run after schema changes)
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Run migrations (production)
pnpm --filter @sassy/db db:migrate

# Open Prisma Studio
pnpm db:studio
```

### Chrome Extension

```bash
# Build extension for Chrome
cd apps/chrome-extension && pnpm build:chrome

# Build extension for Firefox
cd apps/chrome-extension && pnpm build:firefox

# Run automated build script (increments version, builds, creates zip)
./.claude/build-extension.sh
```

### Package Management

```bash
# Add new UI component using shadcn/ui
pnpm ui-add

# Generate new package
pnpm turbo gen init

# Clean all node_modules
pnpm clean

# Clean build artifacts
pnpm clean:workspaces
```

### Testing & Scripts

```bash
# Test LinkedIn scraping API
cd packages/api && pnpm apify:test --url="https://www.linkedin.com/in/username"

# Sync template
pnpm sync-template
```

## Monorepo Architecture

```
engagekit-turborepo/
├── apps/
│   ├── nextjs/                    # Main Next.js application with App Router
│   └── chrome-extension/          # Chrome/Firefox extension for LinkedIn
├── packages/
│   ├── api/                       # tRPC router definitions & API endpoints
│   ├── db/                        # Prisma schema, client, migrations
│   ├── ui/                        # Shared shadcn/ui components
│   ├── validators/                # Shared Zod validation schemas
│   ├── stripe/                    # Stripe payment integration
│   └── linkedin-scrape-apify/     # LinkedIn scraping service
├── tooling/
│   ├── eslint/                    # Shared ESLint configuration
│   ├── prettier/                  # Shared Prettier configuration
│   ├── tailwind/                  # Shared Tailwind CSS configuration
│   └── typescript/                # Shared TypeScript configuration
└── .claude/                       # Claude AI assistant configurations
```

### Code Sharing Pattern

- All packages export through barrel files (`index.ts`) for clean imports
- Import syntax: `import { SomeComponent } from "@sassy/ui"`
- Packages use Just-In-Time compilation (no build step required)
- Shared configurations in `tooling/` prevent duplication

## Key Architectural Patterns

### Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, Tailwind CSS v4
- **Backend**: tRPC v11 for type-safe APIs, Supabase PostgreSQL
- **Database**: Prisma ORM with edge & node client generation
- **Authentication**: Clerk for user management and auth
- **Payments**: Stripe for subscriptions and payments
- **Extensions**: Chrome Extension API with Manifest v3

### tRPC Integration

```typescript
// Server-side (packages/api)
import { createServerClient } from "@sassy/api";
const trpc = await createServerClient();

// Client-side (apps/nextjs)
import { useTRPC } from "~/trpc/react";
const trpc = useTRPC();

// Usage patterns
const { data, isLoading } = trpc.user.getProfile.useQuery();
const { mutateAsync } = trpc.user.updateProfile.useMutation();
```

### Database Client Generation

Prisma generates two clients:

- **Edge Client** (`@sassy/db-edge`): For Vercel Edge Runtime
- **Node Client** (`@sassy/db-node`): For Node.js environments
- Automatically copied to Next.js app during postinstall

### Environment Variables

Each package requiring environment variables:

1. Uses `dotenv-cli` dependency
2. Has `with-env` script: `"with-env": "dotenv --override -e ../../.env --"`
3. Prefixes commands: `pnpm with-env next dev`

## Development Practices & Workflows

### System Requirements

- **Node.js**: >=22.11.0
- **pnpm**: >=9.6.0 (package manager)
- **PostgreSQL**: Via Supabase (for database)

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure required variables:
   - `DATABASE_URL` & `DIRECT_URL` (Supabase)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`
   - `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`
   - Optional: `GEMINI_API_KEY`, `LOOPS_API_KEY`

### Database Development Workflow

1. **Schema Changes**: Edit `packages/db/prisma/schema.prisma`
2. **Generate Client**: Run `pnpm db:generate`
3. **Development**: Run `pnpm db:push` (skip migrations)
4. **Production**: Run `pnpm --filter @sassy/db db:migrate`
5. **Explore Data**: Run `pnpm db:studio`

### Chrome Extension Release Process

1. **Automated Build**: Run `./.claude/build-extension.sh`
   - Increments version number
   - Builds extension
   - Creates `engagekit-extension.zip`
2. **Manual Steps**:
   - Upload to Chrome Web Store
   - Update any distribution channels

### Code Quality Workflow

1. **Pre-commit**: Format and lint fixes automatically applied
2. **Type Safety**: `pnpm typecheck` validates all TypeScript
3. **Workspace Integrity**: `pnpm lint:ws` validates package dependencies

## Service Co-location Guidelines

### Domain-First Organization

Services should be co-located with their business domain:

✅ **Correct Pattern**:

```typescript
// packages/stripe/src/stripe-service.ts
export class StripeService {
  // Stripe-specific business logic
}

// packages/linkedin-scrape-apify/src/apify-service.ts
export class ApifyService {
  // LinkedIn scraping logic
}
```

❌ **Avoid Framework Grouping**:

```typescript
// packages/api/src/services/stripe-service.ts (❌ Wrong)
// packages/api/src/services/apify-service.ts (❌ Wrong)
```

### Import Patterns

```typescript
// Package exports (packages/domain/src/index.ts)
export { DomainService } from "./domain-service";
export type { DomainServiceConfig } from "./types";

// Usage in API routes
import { DomainService } from "@sassy/domain";

// Usage in standalone scripts
import { DomainService } from "@sassy/domain";
```

### Benefits

- **Reusability**: Services work in both API endpoints and scripts
- **No Duplication**: Single source of truth for business logic
- **Clear Dependencies**: Domain dependencies are explicit
- **Independent Testing**: Services can be tested without API layer

## Third-Party Service Integration

### Data Synchronization Strategy

- **Foreign ID Storage**: Store only IDs from external services
  - Clerk: `{stripeCustomerId: "cus_123"}`
  - Stripe: `{clerkUserId: "user_456"}`
- **Single Source of Truth**: Each service owns its domain data
- **Fresh Data Fetching**: Query live data instead of caching
- **Relationship Integrity**: Use webhooks for ID synchronization only

### Service Ownership

- **Clerk**: User profiles, authentication, basic user info
- **Stripe**: Billing, subscriptions, payment methods
- **Local DB**: Custom features, app-specific user data

## Tailwind CSS v4 Configuration

### Setup

- Uses `@tailwindcss/postcss` for PostCSS integration
- Configuration via CSS `@config` directives in `tooling/tailwind`
- Browser targets: Safari 16.4+, Chrome 111+, Firefox 128+

### Content Detection

```css
@import "tailwindcss";

@config {
  content:
    [ "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"];
}
```

## Turborepo Caching & Tasks

### Key Tasks

- **`build`**: Builds packages with dependency graph
- **`dev`**: Development with watch mode and hot reload
- **`lint`**: ESLint with caching and dependency awareness
- **`typecheck`**: TypeScript validation across packages
- **`format`**: Prettier formatting with caching

### Cache Optimization

- Build outputs cached in `.cache/` directories
- ESLint cache: `.cache/.eslintcache`
- Prettier cache: `.cache/.prettiercache`
- TypeScript cache: `.cache/tsbuildinfo.json`

## Common Patterns & Tips

### Adding New Features

1. **tRPC Endpoints**: Add to `packages/api/src/router/`
2. **Database Changes**: Update `packages/db/prisma/schema.prisma`
3. **UI Components**: Add to `packages/ui/src/components/`
4. **Validation**: Create schemas in `packages/validators/src/`

### Package Dependencies

- **Production**: Apps depend on packages they deploy with
- **Development**: Packages only import types from other packages
- **Workspace**: Use `workspace:*` for internal package references

### Working with Generated Code

- Never edit files in `generated/` directories
- Re-run generation commands after schema changes
- Prisma clients are automatically copied during postinstall

### Chrome Extension Development

- **Hot Reload**: Use `pnpm dev:chrome` for development builds
- **Manifest v3**: Uses service workers instead of background pages
- **Content Scripts**: Interact with LinkedIn DOM directly
- **Authentication**: Integrates with Clerk via extension APIs

## Troubleshooting

### Common Issues

1. **Import Errors**: Run `pnpm db:generate` after schema changes
2. **Type Errors**: Run `pnpm typecheck` to validate all packages
3. **Extension Not Loading**: Check manifest.json and rebuild
4. **Database Errors**: Verify `.env` configuration and connection

### Development Tips

- Use `pnpm dev` to start all services simultaneously
- Check individual package READMEs for specific instructions
- Monitor build outputs for caching and dependency issues
- Use Prisma Studio for database inspection and debugging
