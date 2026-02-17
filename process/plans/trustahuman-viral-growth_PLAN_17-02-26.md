# TrustAHuman SaaS Platform — Viral Growth Features PRD

**Date**: February 17, 2026
**Complexity**: COMPLEX (Multi-phase)
**Implementation Approach**: Incremental Feature Delivery with Viral Loops
**Execution Model**: Phase-by-Phase with Pre-Research and Post-Testing
**Deployment**: Standalone monorepo → Vercel (Next.js + tRPC + Edge Functions + Cron)
**Infrastructure**: Own Clerk instance, own PostgreSQL database, own Vercel project

## Overview

Transform the existing TrustAHuman Chrome extension MVP into a full SaaS platform with virality built into the core product. The codebase will be forked from the EngageKit turborepo into a **standalone TrustAHuman monorepo** with its own Clerk instance, database, and Vercel deployment. The extension currently captures webcam photos during LinkedIn comment submission, sends them to a server for human verification, and displays results in a sidebar. This plan adds: permanent Human Numbering, public profile pages, shareable Human Cards, a streak system (Duolingo model), Trust Score with decay mechanics, sharing rewards, referral system, embeddable badges, camera mode toggle, and monthly Trust Reports (Spotify Wrapped model). Each feature is designed as a viral loop that drives organic growth.

**Deployment Architecture**: Separate monorepo deployed on Vercel (tRPC API + Next.js web app), not on the EngageKit Hetzner server. Own Clerk app, own database, fully independent infrastructure.

**Status**: ⏳ PLANNED

---

## Quick Links

- [Context and Goals](#1-context-and-goals)
- [Execution Brief](#15-execution-brief)
- [Phased Execution Workflow](#175-phased-execution-workflow)
- [Non-Goals and Constraints](#2-non-goals-and-constraints)
- [Architecture Decisions](#3-architecture-decisions-final)
- [High-level Data Flow](#5-high-level-data-flow)
- [Security Posture](#6-security-posture)
- [Database Schema](#10-database-schema-prisma-style)
- [API Surface](#11-api-surface-trpc)
- [Phased Delivery Plan](#13-phased-delivery-plan)
- [Features List](#14-features-list-moscow)
- [RFCs](#15-rfcs)
- [Rules](#16-rules)
- [Verification](#17-verification)

---

## 1. Context and Goals

TrustAHuman is positioned at the convergence of five macro trends: trivial AI bot creation (OpenClaw etc.), peak bot frustration on LinkedIn/X, "AI slop" entering mainstream vocabulary, Dead Internet Theory going mainstream, and Worldcoin validating the "proof of humanity" market. The core positioning is: **"Don't label the bots. Verify the humans."**

The existing MVP (WXT Chrome extension) proves the technical concept: webcam capture → face detection → human verification. This plan builds the SaaS layer that turns individual verifications into a viral growth engine through three interlocking loops:

1. **"Powered By" Loop** (Linktree model): Every public profile has a CTA footer driving signups
2. **"Social Proof" Loop** (Spotify Wrapped model): Milestone events trigger designed-to-share cards
3. **"Status Signal" Loop** (Blue Checkmark model): Extension overlay shows Trust Scores, creating FOMO

**In-scope (12 features)**:
1. Human Numbering System — Sequential permanent number on signup + first verification
2. Public Profile Page — `trustahuman.com/u/username` with Trust Score, heatmap, activity feed
3. Human Card — Beautiful shareable card generated on signup for social sharing
4. Streak System — Day-based consecutive verification tracking (Duolingo model)
5. Trust Score System — 0-100 score with decay, tiers (Bronze/Silver/Gold/Diamond)
6. Sharing Rewards — Share card → earn streak freeze tokens
7. Referral System — Two-sided rewards, tiered milestones, Trust Network
8. Embeddable Badges — Shield/card/widget/markdown badge formats for external sites
9. Camera Mode Toggle — "Capture on submit" vs "Camera always on" extension setting
10. Monthly Trust Report — Auto-generated shareable stats summary
11. **Rich Activity Capture** — Extension captures comment text + full post context (author, headline, URL) on LinkedIn AND X/Twitter, stored for web display
12. **Extension Badge Overlay** — Extension injects Trust badges onto LinkedIn/X profiles and feeds of other verified humans (FOMO loop)

**Out-of-scope (V1)**:
- Enterprise team verification product
- Mobile app
- Blockchain-based attestations
- Paid premium tier (design hooks but don't implement billing)
- AI or Human? quiz game
- Physical metal cards (referral tier 100)

---

## 1.5 Execution Brief

### Phase Group 1: Foundation (RFC-001 to RFC-003)
**What happens**: Create database schema for TrustProfile, Streak, Referral, and ShareEvent models. Implement Human Numbering with atomic sequential assignment. Build Trust Score calculation engine and streak tracking algorithms.

**Test**: Database migrations apply cleanly. Human numbers assigned atomically without gaps. Trust Score calculates correctly from verification data. Streak logic handles edge cases (freeze tokens, decay).

### Phase Group 2: Core Platform (RFC-004 to RFC-005)
**What happens**: Build tRPC API layer with all endpoints for profile, score, streak, referral, and sharing. Create public profile page at `/u/[username]` with Trust Score, verification heatmap, tier badge, streak counter, and CTA footer.

**Test**: All tRPC procedures return correct data. Profile page renders with real data. OG meta tags produce compelling link previews. CTA footer visible on free tier.

### Phase Group 3: Viral Distribution (RFC-006 to RFC-008)
**What happens**: Build Human Card image generation (platform-optimized dimensions). Create embeddable badge endpoints (SVG/PNG). Implement referral system with two-sided rewards and tiered milestones.

**Test**: Cards render correctly at all platform dimensions. Badges are verifiable (click → profile). Referral tracking works end-to-end. Reward distribution is correct.

### Phase Group 4: Engagement Loops (RFC-009 to RFC-010)
**What happens**: Implement sharing rewards (share → streak freeze tokens). Build monthly Trust Report generation (Spotify Wrapped style). Add camera mode toggle to extension.

**Test**: Sharing verification works (URL proof check). Monthly reports generate with accurate stats. Camera mode toggle persists and functions correctly.

### Phase Group 5: Activity Capture & Badge Overlay (RFC-012 to RFC-013)
**What happens**: Build X/Twitter content script support alongside existing LinkedIn. Implement DOM scraping for rich activity capture (comment text + full post context). Build activity feed display on public profile. Implement PlatformLink system and badge overlay injection on LinkedIn/X profiles and feeds.

**Test**: Extension captures comment + post context on both LinkedIn and X. VerifiedActivity stored with correct data. Profile activity feed renders with replicated platform UI. Badge overlay appears on profiles of verified humans when visited by extension users. Batch lookup works efficiently for feeds.

### Phase Group 6: Polish & Launch (RFC-011)
**What happens**: Integration testing, performance optimization, responsive design audit, and launch preparation.

**Test**: All features work end-to-end. Performance targets met. No critical bugs.

### Expected Outcome
- Every user gets a permanent Human # on first verification
- Public profiles are shareable viral units with CTA footers and rich activity feeds
- Human Cards drive social sharing on LinkedIn/X/Instagram
- Streaks and Trust Score create daily engagement habit
- Referral system incentivizes organic growth
- Embeddable badges extend reach to personal websites, GitHub, email signatures
- Monthly Trust Reports create periodic sharing waves
- Camera mode toggle improves extension UX
- Extension captures rich activity context from LinkedIn AND X/Twitter
- Public profile shows replicated LinkedIn/X UI for each verified interaction
- Badge overlay on LinkedIn/X profiles creates FOMO loop for non-users

---

## 1.75 Phased Execution Workflow

**IMPORTANT**: This plan uses a phase-by-phase execution model with built-in approval gates. Each RFC follows this workflow:

### Phase Workflow Pattern

**Step 1: Pre-Phase Research**
- Read existing code patterns in codebase
- Analyze similar implementations
- Identify potential blockers or unknowns
- Present findings to user for review

**Step 2: Detailed Planning**
- Based on research, create detailed implementation steps
- Specify exact files to create/modify
- Define success criteria
- Get user approval before proceeding

**Step 3: Implementation**
- Execute approved plan exactly as specified
- No deviations from approved approach
- Mid-phase check-in if phase is long

**Step 4: Testing**
- Execute specific test scenarios (provided in RFC)
- Verify all acceptance criteria met
- Document any issues or deviations
- Show results to user

**Step 5: Phase Approval**
- User reviews implementation and test results
- User approves to proceed to next phase
- OR user requests changes (loop back to Step 2)

### Example Phase Execution

```
User: "Begin RFC-001: Database Schema"

Assistant (Pre-Phase Research):
- Reading existing HumanVerification model...
- Analyzing User model relations...
- Checking Prisma migration patterns in codebase...
- Findings: Current HumanVerification has basic fields (verified, confidence, faceCount)
- Need new: TrustProfile, Streak, Referral, ShareEvent, HumanNumber models
- Existing User model needs new relations
- Do you approve proceeding with this approach?

User: "Yes, proceed"

Assistant (Detailed Planning):
- Will create 5 new Prisma models in packages/db/prisma/models/
- Files to create: trust-profile.prisma, streak.prisma, referral.prisma
- Files to modify: user.prisma (add relations)
- Migration command: pnpm db:migrate dev
- Ready to implement?

User: "Go ahead"

Assistant (Implementation):
[Creates models, generates migration, applies to database]

Assistant (Testing):
Running post-phase tests:
✓ Migration applied successfully
✓ All models queryable
✓ Human number auto-increment works
✓ Relations resolve correctly
✓ No errors in database logs

Phase RFC-001 complete. Proceed to RFC-002?
```

### Benefits of This Approach

- **User control**: Approve each phase before implementation
- **Early feedback**: Catch issues before significant work done
- **Visibility**: Clear understanding of what's being built
- **Quality**: Testing after each phase ensures incremental quality
- **Flexibility**: Easy to adjust approach based on discoveries

---

## 2. Non-Goals and Constraints

**Non-Goals**:
- Paid subscription billing (design hooks only — premium badge removal, custom card backgrounds)
- Mobile native app
- Face recognition or identity matching (detection only — "is a face present?")
- Blockchain/Web3 attestations
- Multi-language support
- AI content detection (we verify the PERSON, not the content)
- Admin moderation dashboard
- Physical merchandise fulfillment

**Constraints**:
- Standalone monorepo forked from EngageKit turborepo structure (T3 stack: Next.js, tRPC, Prisma, Tailwind)
- Own Clerk instance (TrustAHuman branding, independent user pool and billing)
- Own PostgreSQL database (Supabase or Neon, no shared tables with EngageKit)
- Deployed on Vercel (not Hetzner) — Next.js + tRPC + Edge Functions + Cron
- Extension must remain Chrome MV3 compatible (WXT framework)
- Human numbers must be globally sequential with zero gaps (atomic assignment)
- Public profile pages must be SSR for OG meta tags (Next.js server components)
- Card image generation must work on Vercel serverless (no Puppeteer/Chrome — use @vercel/og or Satori)
- Badge SVGs must be cacheable at CDN edge
- All user-facing data must handle GDPR requirements (deletable, exportable)
- Face detection: keep AWS Rekognition for MVP speed OR migrate to `@vladmandic/human` for cost (decide during RFC-001)

---

## 3. Architecture Decisions (Final)

### AD-001: TrustProfile as Central Model (Own Database)

**Decision**: TrustAHuman has its own database with `TrustProfile` as the central entity. A minimal `User` model synced from Clerk via webhook handles auth identity.

**Rationale**:
- Standalone monorepo with own Clerk instance = own user pool
- `TrustProfile` holds all TrustAHuman-specific data (Human #, score, streak, referrals)
- `User` model is minimal (Clerk ID, email, name, avatar) — synced via Clerk webhook
- 1:1 relationship: `User` ↔ `TrustProfile`
- No EngageKit data in this database at all

**Implications**:
- `User` model created/updated via Clerk webhook on signup/profile change
- `TrustProfile` created on first successful verification (not on Clerk signup)
- All features reference `TrustProfile`, linked to `User` for auth identity
- Clean database with only TrustAHuman tables

### AD-002: Atomic Human Number Assignment via Database Sequence

**Decision**: Use a PostgreSQL sequence (via Prisma `@default(autoincrement())`) for Human Number assignment to guarantee sequential, gap-free numbering.

**Rationale**:
- Application-level counting (e.g., `COUNT(*) + 1`) has race conditions under concurrent signups
- PostgreSQL sequences are atomic and handle concurrency natively
- `autoincrement()` maps to `SERIAL` which creates a sequence under the hood
- Numbers are permanent and never reassigned (even if user deletes account)

**Implications**:
- `humanNumber` is an `Int @default(autoincrement())` on `TrustProfile`
- First user gets Human #1, second gets #2, etc.
- Cannot be reset without database intervention (by design)
- "Founding Human" status derived from `humanNumber <= 1000`

### AD-003: Trust Score as Computed Value (Not Stored)

**Decision**: Trust Score is calculated on-demand from source data (verification count, streak length, account age, network bonus) rather than stored as a denormalized field.

**Rationale**:
- Stored scores become stale and require background jobs to update
- Decay mechanics mean the score changes daily even without user action
- Computing on-read ensures score is always current
- Formula transparency (users can understand why their score is X)
- Easier to tune the algorithm without running migration/backfill

**Exception**: Cache the computed score in Redis/memory for high-traffic public profile pages (invalidate on verification event). For V1, compute on every request (low traffic).

**Implications**:
- `trustScore` is NOT a database column
- tRPC procedure computes it from `TrustProfile` + `HumanVerification` + `Streak` data
- Score formula is a pure function that can be unit tested independently
- Profile pages may have slight compute overhead (~50ms per request)

### AD-004: Card Image Generation with @vercel/og (Satori)

**Decision**: Use `@vercel/og` (which uses Satori under the hood) for server-side card image generation instead of Puppeteer or canvas.

**Rationale**:
- Runs on Vercel Edge Runtime (fast, low-cost, no cold starts)
- JSX-to-image: define card layout as React components
- Produces PNG images with correct dimensions for each social platform
- No headless browser needed (Puppeteer doesn't work on Vercel serverless)
- Used by Vercel itself for OG image generation

**Implications**:
- Card layout defined as JSX (familiar React syntax)
- Limited CSS subset (Satori supports flexbox, not grid)
- Custom fonts must be loaded as ArrayBuffer
- Generated images served from `/api/og/card/[username]` endpoint
- Platform-specific dimensions via query params: `?platform=linkedin|twitter|instagram`

### AD-005: Streak Freeze as Day-Based Tokens (Duolingo Model)

**Decision**: Streak freezes are day-based tokens (1 token = 1 missed day covered), banked up to 7, earned through sharing and referrals.

**Rationale**:
- Duolingo's streak mechanic is the gold standard for daily engagement
- Day-based is simpler to understand than hour-based or partial-day
- Banking up to 7 prevents hoarding while allowing reasonable buffer
- Earning through sharing creates viral loop (share → freeze → continue streak → share more)

**Implications**:
- `streakFreezeTokens` field on `TrustProfile` (Int, max 7)
- Daily cron job checks if user verified today; if not, auto-consume 1 freeze token
- If no tokens and no verification: streak breaks
- Freeze earned: share card (1 token), referral (2 tokens), milestone (3 tokens)

### AD-006: Referral Tracking via Profile URL (Invisible Referral Codes)

**Decision**: Referral tracking is embedded in public profile URLs rather than explicit referral codes.

**Rationale**:
- Every profile view is a potential referral (no extra sharing step)
- Users don't need to copy/paste codes (reduces friction)
- Share cards, badges, and profile links all carry referral attribution automatically
- URL parameter: `?ref=human123` or baked into username path

**Implications**:
- `TrustProfile.referralCode` is auto-generated (e.g., `human-{humanNumber}`)
- All public profile URLs include referral attribution
- New signup checks for `ref` param in URL/cookie and credits referrer
- 30-day attribution window (cookie-based)

### AD-007: Public Profiles as Next.js App Router Pages (SSR)

**Decision**: Public profiles are Next.js server components at `/u/[username]` for SEO and OG meta tag support.

**Rationale**:
- OG meta tags must be in the initial HTML response (not client-rendered)
- SSR ensures link previews work on LinkedIn, X, Slack, Discord
- Server components can fetch data without client-side loading states
- Next.js App Router provides built-in `generateMetadata` for dynamic OG tags

**Implications**:
- New route: `apps/web/src/app/(public)/u/[username]/page.tsx`
- Server component fetches TrustProfile data
- `generateMetadata` produces dynamic OG tags per user
- No authentication required (public page)
- Rate limiting via Vercel's built-in protection

### AD-008: Rich Activity Capture via DOM Scraping

**Decision**: When a user submits a comment/reply on LinkedIn or X, the extension scrapes the surrounding DOM to capture full post context (author name, profile pic, headline, post text snippet, post URL) alongside the comment text. This data is stored server-side so the web profile can display a rich activity feed.

**Rationale**:
- A profile showing "verified 147 times" is abstract; showing "replied to [Jane Smith]'s post about [AI trends] — verified" with real profile pics and links is compelling and shareable
- The web profile becomes a living proof-of-activity feed, not just a score
- Post context makes each verification meaningful and verifiable (visitors can click through to the original post)
- Captures the "what" alongside the "who" — both are needed for trust

**Implications**:
- New `VerifiedActivity` model storing: comment text, post URL, post author (name, pic, headline), platform, timestamp
- Extension needs platform-specific DOM selectors for LinkedIn and X (fragile — requires maintenance as platforms update)
- Extension content scripts needed for both LinkedIn AND X/Twitter (current MVP is LinkedIn-only)
- Comment text stored in plaintext (not as screenshot) for searchability and display
- Must handle DOM structure changes gracefully (fallback to basic capture if scraping fails)
- Privacy consideration: only captures data from public posts/comments the user is actively interacting with

### AD-009: Extension Badge Overlay on LinkedIn/X Profiles

**Decision**: The extension injects Trust badges directly onto LinkedIn and X profile pages and feed items when the viewed person is a verified TrustAHuman user. This is the core FOMO loop.

**Rationale**:
- The "Status Signal" viral loop requires non-users to SEE the badge and feel its absence on their own profile
- Injecting badges on the actual platform (not just on trustahuman.com) maximizes visibility
- Creates in-group effect: TrustAHuman users see a different version of LinkedIn/X (verified humans are highlighted)
- Like how Twitter Blue checkmarks created desire in non-verified users — but earned, not purchased

**Implications**:
- Extension needs content scripts running on LinkedIn profile pages, X profile pages, and feeds on both platforms
- Badge lookup API: `trustProfile.lookupByPlatformUrl` — takes a LinkedIn/X profile URL, returns Trust badge data (or null)
- Batch lookup needed for feeds (many profiles visible at once) — `trustProfile.batchLookup` endpoint
- Must handle rate limiting gracefully (don't spam API on every scroll)
- Badge injection uses platform-specific CSS selectors (fragile, needs maintenance)
- Users must link their LinkedIn/X profile URLs to their TrustProfile for matching
- Badge should be visually consistent across platforms but adapt to each platform's style
- Only visible to users with the extension installed (by design — creates exclusivity)

---

## 4. Architecture Clarification: Standalone TrustAHuman Monorepo

### Current State
TrustAHuman exists as a Chrome extension (`apps/extension/`) inside the EngageKit monorepo with a single tRPC endpoint (`verification.analyzePhoto`) and one database model (`HumanVerification`). It shares Clerk, database, and deployment with EngageKit.

### Why Split from EngageKit
- **Different user bases**: EngageKit = B2B LinkedIn power users; TrustAHuman = consumer-facing general public
- **Shared Clerk is problematic**: Auth UI branding mismatch, TrustAHuman viral growth would spike EngageKit's Clerk MAU billing
- **Shared database is risky**: TrustAHuman going viral could impact EngageKit's database performance
- **Independent scaling**: TrustAHuman needs its own deployment, monitoring, and billing
- **Clean product boundary**: Separate products deserve separate infrastructure

### Target State: Standalone Monorepo
Fork the EngageKit turborepo structure into a new TrustAHuman monorepo:

```
trustahuman/
├── apps/
│   ├── web/                    # Next.js app (public profiles, dashboard, API routes)
│   │   └── src/app/
│   │       ├── (public)/u/[username]/   # Public profile pages
│   │       ├── (dashboard)/             # User dashboard (settings, stats)
│   │       ├── api/og/                  # Card/badge image generation
│   │       └── api/cron/               # Streak + report cron jobs
│   └── extension/              # Chrome extension (WXT, renamed from trustahuman-ext)
│       ├── entrypoints/
│       ├── lib/
│       └── assets/
├── packages/
│   ├── db/                     # Prisma schema + client (own PostgreSQL)
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── models/
│   ├── api/                    # tRPC routers (deployed on Vercel via Next.js)
│   │   └── src/router/
│   ├── ui/                     # Shared UI components (fork relevant parts from @sassy/ui)
│   └── tsconfig/               # Shared TypeScript config
├── tooling/                    # Shared tooling (ESLint, Prettier, etc.)
├── .env                        # TrustAHuman-specific env vars
├── turbo.json
└── package.json
```

### Infrastructure (All Independent)

| Layer | Service | Notes |
|-------|---------|-------|
| Auth | **Own Clerk app** | TrustAHuman branding, own user pool, own billing |
| Database | **Own PostgreSQL** (Supabase or Neon) | No shared tables with EngageKit |
| Web + API | **Vercel** | Next.js + tRPC (NOT Hetzner) |
| Extension | **Chrome Web Store** | Already separate |
| CDN | **Vercel Edge** | Card/badge image caching |
| Cron | **Vercel Cron** | Daily streak + monthly report |
| Storage | **Own S3 bucket** (or Vercel Blob) | Verification photos |

### What Gets Forked from EngageKit
- Monorepo structure (turbo.json, tooling, tsconfig)
- Relevant UI components from `@sassy/ui` (buttons, cards, forms)
- tRPC setup patterns (client, server, router structure)
- Prisma patterns (model organization, migration workflow)
- WXT extension structure (already separate as `apps/extension/`)
- Tailwind config and styling patterns

### What Gets Replaced
- Clerk instance → new TrustAHuman Clerk app
- Database connection → new PostgreSQL instance
- All EngageKit-specific models (Comment, LinkedInAccount, etc.) → removed
- EngageKit-specific routers → removed
- Hetzner deployment → Vercel
- AWS Rekognition → keep OR migrate to `@vladmandic/human` (per webcam-verification plan)

---

## 5. High-level Data Flow

```
                    SIGNUP / FIRST VERIFICATION FLOW
                    ================================

Extension captures webcam → Sends to verification.analyzePhoto
    → If first verification AND no TrustProfile exists:
        → Create TrustProfile (auto-assigns Human #)
        → Initialize streak (day 1)
        → Generate Human Card (async, via @vercel/og)
        → Show "Welcome, Human #X!" in extension sidebar
        → Prompt: "Share your Human Card to earn streak freeze"

                    DAILY VERIFICATION FLOW
                    =======================

Extension captures webcam → Sends to verification.analyzePhoto
    → Update verification count on TrustProfile
    → Check streak: extend or freeze-consume or break
    → Recalculate Trust Score (on next profile view)
    → Check milestones (trigger share card if hit)

                    PUBLIC PROFILE VIEW FLOW
                    ========================

Visitor navigates to trustahuman.com/u/username
    → Next.js SSR: Fetch TrustProfile + compute Trust Score
    → Render: Human #, Trust Score, Tier, Heatmap, Streak, Stats
    → Render: CTA footer ("Prove you're human too")
    → If visitor has ?ref= param: Store referral cookie (30 days)

                    CARD / BADGE GENERATION FLOW
                    ============================

Request to /api/og/card/[username]?platform=linkedin
    → Fetch TrustProfile data
    → Render JSX card layout via @vercel/og (Satori)
    → Return PNG image (cached at CDN edge)
    → Image includes: Human #, name, Trust Score, tier, QR code to profile

Request to /api/badge/[username].svg
    → Fetch TrustProfile data
    → Return SVG badge (cached at CDN edge)
    → Badge links to public profile (with referral tracking)

                    REFERRAL FLOW
                    =============

Existing user shares profile/card → Non-user clicks link
    → Lands on profile page with ?ref=human-X
    → Referral cookie stored (30 days)
    → Non-user signs up + completes first verification
    → System credits referrer:
        → +1 Network Bonus (Trust Score)
        → +2 streak freeze tokens
    → System credits referee:
        → +3 free streak freeze tokens
        → "Invited by Human #X" on their card
    → Check referrer milestones (1, 3, 5, 10, 25, 50, 100)
```

---

## 6. Security Posture

**Authentication**:
- Extension endpoints use existing tRPC procedures (Clerk auth via cookie/token)
- Public profile pages require NO authentication (public by design)
- Profile data endpoints are public (Trust Score, heatmap, etc.)
- Account management endpoints (settings, delete) require authentication
- Card/badge generation endpoints are public but rate-limited

**Privacy**:
- Webcam photos are processed server-side and NOT stored long-term (per existing webcam-verification plan)
- Trust Score is computed from aggregated verification COUNT, not photo data
- Users can delete their TrustProfile (cascades to all related data)
- GDPR data export includes: profile data, verification history, referral history
- No facial recognition or biometric storage (face detection only)

**Anti-Gaming**:
- Trust Score cannot be purchased (earned through behavior only)
- Streak freeze tokens capped at 7 (prevents unlimited hoarding)
- Referral rewards require referee to complete verification (not just signup)
- Network Bonus capped at +15 (prevents referral pyramid gaming)
- Share rewards require URL proof (actual post verification)
- Rate limiting on verification: max 50 verifications per day per user

**Data Integrity**:
- Human Numbers are atomic (PostgreSQL sequence, no gaps possible)
- Trust Score is computed (not stored), so it's always consistent
- Streak tracking uses server-side timestamps (not client-reported)
- All writes go through tRPC procedures with input validation (Zod schemas)

---

## 7. Component Details

### TrustProfile Model (Central Entity)

**Responsibilities**:
- Store permanent user identity (Human #, username, display name)
- Track verification metrics (total count, last verified date)
- Store streak state (current streak, longest streak, freeze tokens)
- Hold referral metadata (referral code, referred by, referral count)
- Store settings (card visibility, badge preferences)

### Trust Score Engine

**Responsibilities**:
- Compute score 0-100 from source data on every read
- Apply decay when inactive (-2/day after 7 days, -5/day after 14 days)
- Apply Network Bonus (+1 per active verified friend, max +15)
- Map score to tier: Bronze (<50), Silver (50-69), Gold (70-89), Diamond (90-100)

**Formula**:
```
baseScore =
    (min(verificationCount, 200) / 200) * 40 +     // Verification frequency (40% weight, caps at 200)
    (min(currentStreak, 90) / 90) * 25 +            // Streak length (25% weight, caps at 90 days)
    (min(accountAgeDays, 365) / 365) * 20 +         // Account age (20% weight, caps at 1 year)
    (min(networkBonus, 15)) * 1                      // Network bonus (up to +15 flat)

decayPenalty =
    if daysSinceLastVerification <= 7: 0
    elif daysSinceLastVerification <= 14: (daysSinceLastVerification - 7) * 2
    else: 14 + (daysSinceLastVerification - 14) * 5

trustScore = max(0, min(100, baseScore - decayPenalty))
```

### Streak System

**Responsibilities**:
- Track consecutive days with at least 1 verified activity
- Auto-consume freeze tokens when user misses a day
- Break streak when no verification AND no freeze tokens
- Track longest streak ever achieved

**Daily Lifecycle** (cron job at midnight UTC):
```
For each active TrustProfile:
    1. Check if user had at least 1 verified activity today
    2. If YES: currentStreak++ (extend streak)
    3. If NO and streakFreezeTokens > 0: consume 1 token (streak maintained)
    4. If NO and streakFreezeTokens == 0: currentStreak = 0 (streak broken)
    5. Update longestStreak = max(longestStreak, currentStreak)
    6. Check milestone thresholds (7, 30, 100, 365 days)
```

### Referral System

**Responsibilities**:
- Generate unique referral codes per user (based on Human #)
- Track referral attribution (30-day cookie window)
- Distribute two-sided rewards on successful referral
- Track milestone progress (1, 3, 5, 10, 25, 50, 100 referrals)
- Maintain "Top Connectors" leaderboard

**Tiered Milestones**:

| Referrals | Reward |
|-----------|--------|
| 1 | "Connector" badge |
| 3 | Custom card background unlock |
| 5 | "Network Builder" badge + 5 streak freezes |
| 10 | "Ambassador" title on profile |
| 25 | 3 months premium (when available) |
| 50 | "Founding Ambassador" lifetime badge |
| 100 | Physical metal card (manual fulfillment) |

---

## 8. Backend Endpoints and Workers

### Cron Jobs

**Daily Streak Processor** (runs at 00:05 UTC):
- Iterates all active TrustProfiles
- Processes streak continuation/freeze/break
- Triggers milestone events
- Updates `lastProcessedDate` to prevent double-processing

**Monthly Trust Report Generator** (runs 1st of each month, 06:00 UTC):
- Generates report data for each active user
- Stores report in `TrustReport` table
- Triggers notification (email + push) when report is ready

### Background Jobs

**Card Image Pre-Generation**:
- On signup/tier change/milestone: pre-render card images for all 3 platform sizes
- Store in CDN cache (invalidate on profile change)
- Async via Vercel serverless function

---

## 9. Infrastructure Deployment

Fully independent infrastructure, deployed fresh:

| Service | Provider | Notes |
|---------|----------|-------|
| Web + API | **Vercel** (Pro plan) | Next.js App Router + tRPC API routes |
| Auth | **Clerk** (new app) | TrustAHuman branding, own user pool |
| Database | **Supabase** or **Neon** (new project) | PostgreSQL, Prisma ORM |
| Image Gen | **Vercel Edge Functions** | @vercel/og for cards/badges |
| Cron | **Vercel Cron** | Daily streak + monthly report (2 jobs) |
| CDN | **Vercel Edge Network** | Auto-caching for generated images |
| Photo Storage | **Vercel Blob** or **AWS S3** (new bucket) | Verification photos |
| Domain | **trustahuman.com** | Custom domain on Vercel |

**Cost estimate at launch** (~1K users):
- Vercel Pro: $20/mo
- Clerk: Free tier (10K MAU)
- Supabase: Free tier (500MB, 50K rows)
- Domain: ~$12/year
- **Total: ~$22/mo**

---

## 10. Database Schema (Prisma-style)

> All models live in `packages/db/prisma/` within the standalone TrustAHuman monorepo. This is a fresh database — no EngageKit tables.

### User Model (Synced from Clerk Webhook)

```prisma
model User {
  id            String    @id           // Clerk user ID
  email         String    @unique
  name          String?
  imageUrl      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  trustProfile  TrustProfile?
  verifications HumanVerification[]
}
```

### TrustProfile Model

```prisma
model TrustProfile {
  id                  String    @id @default(uuid())
  humanNumber         Int       @unique @default(autoincrement())
  userId              String    @unique
  username            String    @unique   // URL-safe, user-chosen
  displayName         String?
  bio                 String?   @db.VarChar(280)
  avatarUrl           String?

  // Verification stats
  totalVerifications  Int       @default(0)
  lastVerifiedAt      DateTime?

  // Streak state
  currentStreak       Int       @default(0)
  longestStreak       Int       @default(0)
  streakFreezeTokens  Int       @default(0)  // max 7
  lastStreakDate      DateTime?              // last date streak was active
  streakProcessedDate DateTime?              // prevent double-processing

  // Referral
  referralCode        String    @unique      // auto-generated: "human-{humanNumber}"
  referredById        String?                // TrustProfile.id of referrer
  referralCount       Int       @default(0)

  // Settings
  isPublic            Boolean   @default(true)
  showOnLeaderboard   Boolean   @default(true)
  cameraMode          String    @default("capture_on_submit") // "capture_on_submit" | "always_on"

  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  referredBy          TrustProfile?  @relation("Referrals", fields: [referredById], references: [id])
  referrals           TrustProfile[] @relation("Referrals")
  verifications       HumanVerification[]
  activities          VerifiedActivity[]
  platformLinks       PlatformLink[]
  shareEvents         ShareEvent[]
  trustReports        TrustReport[]
  referralMilestones  ReferralMilestone[]

  @@index([userId])
  @@index([username])
  @@index([humanNumber])
  @@index([referralCode])
  @@index([referredById])
  @@index([totalVerifications])
  @@index([currentStreak])
}
```

### ShareEvent Model (New)

```prisma
model ShareEvent {
  id              String    @id @default(uuid())
  trustProfileId  String
  platform        String    // "linkedin" | "twitter" | "instagram" | "website" | "other"
  shareType       String    // "card" | "badge" | "report" | "profile"
  proofUrl        String?   // URL where the share was posted (for verification)
  verified        Boolean   @default(false)  // whether proof URL was checked
  rewardGiven     Boolean   @default(false)  // whether streak freeze was awarded
  createdAt       DateTime  @default(now())

  trustProfile    TrustProfile @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  @@index([trustProfileId])
  @@index([createdAt])
}
```

### ReferralMilestone Model (New)

```prisma
model ReferralMilestone {
  id              String    @id @default(uuid())
  trustProfileId  String
  milestone       Int       // 1, 3, 5, 10, 25, 50, 100
  rewardType      String    // "badge" | "card_bg" | "freezes" | "title" | "premium" | "physical"
  rewardValue     String    // badge name, bg id, freeze count, etc.
  achievedAt      DateTime  @default(now())

  trustProfile    TrustProfile @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  @@unique([trustProfileId, milestone])
  @@index([trustProfileId])
}
```

### TrustReport Model (New)

```prisma
model TrustReport {
  id                  String    @id @default(uuid())
  trustProfileId      String
  month               Int       // 1-12
  year                Int

  // Report data (denormalized snapshot)
  verificationsCount  Int
  averageStreak       Int
  longestStreakInMonth Int
  trustScoreStart     Int       // Score at start of month
  trustScoreEnd       Int       // Score at end of month
  percentileRank      Float     // "Top X%"
  networkGrowth       Int       // New referrals this month

  // Card image URLs (pre-generated)
  cardUrlLinkedin     String?
  cardUrlTwitter      String?
  cardUrlInstagram    String?

  generatedAt         DateTime  @default(now())

  trustProfile        TrustProfile @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  @@unique([trustProfileId, month, year])
  @@index([trustProfileId])
  @@index([year, month])
}
```

### HumanVerification Model (Fresh — no legacy data)

```prisma
model HumanVerification {
  id              String    @id @default(uuid())
  userId          String
  trustProfileId  String
  verified        Boolean
  confidence      Float
  faceCount       Int
  rawResponse     Json?
  actionType      String    @default("linkedin_comment")  // "linkedin_comment" | "twitter_reply" | "manual"
  actionUrl       String?
  photoS3Key      String?   // S3 key if photo stored
  createdAt       DateTime  @default(now())

  // Link to rich activity data
  activityId      String?   @unique
  activity        VerifiedActivity? @relation(fields: [activityId], references: [id])

  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  trustProfile    TrustProfile  @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([trustProfileId])
  @@index([trustProfileId, createdAt])
  @@index([createdAt])
}
```

### VerifiedActivity Model (New — Rich Activity Capture)

```prisma
model VerifiedActivity {
  id                  String    @id @default(uuid())
  trustProfileId      String
  platform            String    // "linkedin" | "twitter"

  // The user's comment/reply
  commentText         String    @db.Text
  commentUrl          String?   // Direct link to the comment if available

  // The post being replied to (scraped from DOM)
  postUrl             String    // Link to the original post
  postAuthorName      String?
  postAuthorProfileUrl String?
  postAuthorAvatarUrl String?   // Profile pic URL (may expire — cache on our side)
  postAuthorHeadline  String?   // LinkedIn headline or X bio snippet
  postTextSnippet     String?   @db.VarChar(500) // First ~500 chars of the post
  postImageUrl        String?   // Post thumbnail if any

  // Verification link
  verification        HumanVerification?

  // Metadata
  scrapedAt           DateTime  @default(now())
  createdAt           DateTime  @default(now())

  trustProfile        TrustProfile @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  @@index([trustProfileId])
  @@index([trustProfileId, createdAt])
  @@index([platform])
}
```

### PlatformLink Model (New — Links TrustProfile to LinkedIn/X profiles for badge overlay matching)

```prisma
model PlatformLink {
  id              String    @id @default(uuid())
  trustProfileId  String
  platform        String    // "linkedin" | "twitter"
  platformUrl     String    // Full profile URL (e.g., linkedin.com/in/johndoe)
  platformHandle  String?   // Username/handle on that platform
  verified        Boolean   @default(false) // Whether ownership is verified
  createdAt       DateTime  @default(now())

  trustProfile    TrustProfile @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  @@unique([platform, platformUrl])
  @@unique([platform, platformHandle])
  @@index([trustProfileId])
  @@index([platformUrl])
  @@index([platformHandle])
}
```

---

## 11. API Surface (tRPC)

### New Router: `packages/api/src/router/trust-profile.ts`

#### `trustProfile.create` (mutation)

**Auth**: `protectedProcedure` (Clerk auth required)

**Input**:
```typescript
{
  username: string,      // URL-safe, 3-30 chars, alphanumeric + hyphens
  displayName?: string,
  referralCode?: string, // If referred by another user
}
```

**Output**:
```typescript
{
  id: string,
  humanNumber: number,
  username: string,
  referralCode: string,
  isFoundingHuman: boolean, // humanNumber <= 1000
}
```

**Logic**: Creates TrustProfile, assigns Human #, processes referral if code provided, returns profile data.

#### `trustProfile.getByUsername` (query)

**Auth**: `publicProcedure` (no auth — public profiles)

**Input**: `{ username: string }`

**Output**:
```typescript
{
  humanNumber: number,
  username: string,
  displayName: string | null,
  avatarUrl: string | null,
  bio: string | null,
  trustScore: number,       // Computed
  tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND",
  currentStreak: number,
  longestStreak: number,
  totalVerifications: number,
  isFoundingHuman: boolean,
  isActive: boolean,        // Verified in last 7 days
  createdAt: Date,
  referralCount: number,
  // Heatmap data (365 days)
  verificationHeatmap: { date: string, count: number }[],
}
```

#### `trustProfile.getMyProfile` (query)

**Auth**: `protectedProcedure`

**Output**: Same as `getByUsername` plus private fields (settings, streak freeze tokens, referral code, etc.)

#### `trustProfile.updateSettings` (mutation)

**Auth**: `protectedProcedure`

**Input**: `Partial<{ displayName, bio, avatarUrl, isPublic, showOnLeaderboard, cameraMode }>`

#### `trustProfile.computeTrustScore` (query)

**Auth**: `publicProcedure`

**Input**: `{ username: string }`

**Output**: `{ score: number, tier: string, breakdown: { verification: number, streak: number, age: number, network: number, decay: number } }`

### Streak Endpoints

#### `trustProfile.getStreakStatus` (query)

**Auth**: `protectedProcedure`

**Output**:
```typescript
{
  currentStreak: number,
  longestStreak: number,
  streakFreezeTokens: number,
  lastVerifiedAt: Date | null,
  isStreakActive: boolean,   // Verified today or freeze available
  nextMilestone: number,     // Next streak milestone (7, 30, 100, 365)
}
```

### Sharing Endpoints

#### `trustProfile.recordShare` (mutation)

**Auth**: `protectedProcedure`

**Input**: `{ platform: string, shareType: string, proofUrl?: string }`

**Output**: `{ success: boolean, freezeTokenAwarded: boolean, newFreezeBalance: number }`

**Logic**: Records share event. If proofUrl provided, verify it exists. Award 1 streak freeze token (if under cap of 7).

### Referral Endpoints

#### `trustProfile.processReferral` (mutation)

**Auth**: Internal only (called during signup flow)

**Input**: `{ newProfileId: string, referralCode: string }`

**Logic**: Credits referrer (+1 network bonus, +2 freeze tokens), credits referee (+3 freeze tokens, sets referredById), checks milestones.

#### `trustProfile.getLeaderboard` (query)

**Auth**: `publicProcedure`

**Input**: `{ type: "referrals" | "streak" | "trust_score", limit?: number }`

**Output**: `{ entries: { humanNumber, username, displayName, avatarUrl, value }[] }`

### Report Endpoints

#### `trustProfile.getMonthlyReport` (query)

**Auth**: `protectedProcedure`

**Input**: `{ month: number, year: number }`

**Output**: `TrustReport` data + computed card URLs

### Activity Router: `packages/api/src/router/activity.ts`

#### `activity.record` (mutation)

**Auth**: `protectedProcedure` (called by extension after successful comment submission)

**Input**:
```typescript
{
  platform: "linkedin" | "twitter",
  commentText: string,
  commentUrl?: string,
  postUrl: string,
  postAuthorName?: string,
  postAuthorProfileUrl?: string,
  postAuthorAvatarUrl?: string,
  postAuthorHeadline?: string,
  postTextSnippet?: string,  // First ~500 chars
  postImageUrl?: string,
}
```

**Output**:
```typescript
{
  id: string,
  createdAt: Date,
}
```

**Logic**: Creates VerifiedActivity record linked to user's TrustProfile. Called by extension content script after DOM scraping + successful comment submission. The verification flow then links the HumanVerification to this activity via `activityId`.

#### `activity.getByProfile` (query)

**Auth**: `publicProcedure` (public profiles show activity feed)

**Input**: `{ username: string, limit?: number, cursor?: string }`

**Output**:
```typescript
{
  activities: {
    id: string,
    platform: "linkedin" | "twitter",
    commentText: string,
    postUrl: string,
    postAuthorName: string | null,
    postAuthorAvatarUrl: string | null,
    postAuthorHeadline: string | null,
    postTextSnippet: string | null,
    verified: boolean,         // Has linked HumanVerification
    verifiedAt: Date | null,
    createdAt: Date,
  }[],
  nextCursor: string | null,
}
```

### Badge Overlay Router: `packages/api/src/router/badge-overlay.ts`

#### `badgeOverlay.lookupByPlatformUrl` (query)

**Auth**: `publicProcedure` (extension calls this for profile pages)

**Input**: `{ platformUrl: string }`

**Output**:
```typescript
{
  found: boolean,
  badge: {
    humanNumber: number,
    username: string,
    trustScore: number,
    tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND",
    isFoundingHuman: boolean,
    profileUrl: string, // trustahuman.com/u/username
  } | null,
}
```

**Logic**: Looks up PlatformLink by URL, resolves to TrustProfile, computes Trust Score, returns badge data. Returns `{ found: false, badge: null }` if no match.

#### `badgeOverlay.batchLookup` (query)

**Auth**: `publicProcedure` (extension calls this for feeds — many profiles visible at once)

**Input**: `{ platformUrls: string[] }` (max 50 per request)

**Output**:
```typescript
{
  results: Record<string, {
    humanNumber: number,
    username: string,
    trustScore: number,
    tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND",
    isFoundingHuman: boolean,
    profileUrl: string,
  } | null>,
}
```

**Logic**: Batch lookup of PlatformLinks. Returns map of platformUrl → badge data (or null). Capped at 50 URLs per request for rate limiting.

### Platform Link Router: `packages/api/src/router/platform-link.ts`

#### `platformLink.link` (mutation)

**Auth**: `protectedProcedure`

**Input**: `{ platform: "linkedin" | "twitter", platformUrl: string, platformHandle?: string }`

**Output**: `{ id: string, verified: boolean }`

**Logic**: Creates PlatformLink associating user's TrustProfile with their LinkedIn/X profile URL. Auto-detected from extension context (extension knows which LinkedIn/X profile the user is logged into). Initially unverified; auto-verifies when user submits a verified comment from that platform (proof of access).

#### `platformLink.getMyLinks` (query)

**Auth**: `protectedProcedure`

**Output**: `{ links: { id: string, platform: string, platformUrl: string, platformHandle: string | null, verified: boolean }[] }`

#### `platformLink.unlink` (mutation)

**Auth**: `protectedProcedure`

**Input**: `{ id: string }`

**Logic**: Removes PlatformLink. Badge overlay will no longer show for that platform profile.

### Verification Router: `packages/api/src/router/verification.ts`

#### `verification.analyzePhoto` (mutation)

**Auth**: `protectedProcedure` (Clerk auth required)

**Input**: `{ photoBase64: string, actionType?: string, actionUrl?: string, activityId?: string }`

**Logic**:
```typescript
// 1. Run face detection (AWS Rekognition or @vladmandic/human)
// 2. Store result in HumanVerification table (linked to TrustProfile)
// 3. If activityId provided → link HumanVerification to VerifiedActivity
// 4. If user has TrustProfile → increment totalVerifications, update lastVerifiedAt, extend streak
// 5. If user has no TrustProfile → flag in response: needsProfile: true
// 6. Auto-verify PlatformLink if activity platform matches (proof of access)
// 7. Return verification result
```

**Output**: `{ verified, confidence, faceCount, needsProfile: boolean }`

---

## 12. Real-time Event Model

Not applicable for V1. All data refreshes on page load. Future Phase 2 may add WebSocket for live Trust Score updates in extension overlay.

---

## 13. Phased Delivery Plan

### Current Status

⏳ **RFC-001**: Database Schema & Migrations (PLANNED)
⏳ **RFC-002**: Human Numbering & Signup Flow (PLANNED)
⏳ **RFC-003**: Trust Score Engine & Streak System (PLANNED)
⏳ **RFC-004**: tRPC API Layer (PLANNED)
⏳ **RFC-005**: Public Profile Page + Activity Feed (PLANNED)
⏳ **RFC-006**: Human Card Generation (PLANNED)
⏳ **RFC-007**: Embeddable Badges (PLANNED)
⏳ **RFC-008**: Referral System (PLANNED)
⏳ **RFC-009**: Sharing Rewards & Monthly Trust Report (PLANNED)
⏳ **RFC-010**: Camera Mode Toggle (Extension) (PLANNED)
⏳ **RFC-011**: Integration Testing & Polish (PLANNED)
⏳ **RFC-012**: Rich Activity Capture & X/Twitter Support (PLANNED)
⏳ **RFC-013**: Extension Badge Overlay (PLANNED)

**Immediate Next Steps**: RFC-001 — Database Schema & Migrations

---

## 14. Features List (MoSCoW)

### Must-Have (M)

- [M-001] Sequential Human Number assigned on first verification (permanent, never changes)
- [M-002] "Founding Human" designation for first 1,000 users
- [M-003] Public profile page at `/u/[username]` with Trust Score, heatmap, tier badge
- [M-004] Trust Score 0-100 computed from verification frequency, streak, age, network
- [M-005] Trust Score decay: -2/day after 7 days inactive, -5/day after 14 days
- [M-006] Tier system: Bronze (<50), Silver (50-69), Gold (70-89), Diamond (90-100)
- [M-007] Day-based streak tracking (consecutive days with verification)
- [M-008] Streak freeze tokens (max 7, earned via sharing/referrals)
- [M-009] Verification heatmap (GitHub contribution graph, 52 weeks)
- [M-010] Human Card generation (shareable image with Human #, name, score, QR)
- [M-011] Platform-optimized card dimensions (LinkedIn 1.91:1, Twitter 16:9, Instagram 9:16)
- [M-012] One-tap share buttons on card
- [M-013] Mandatory CTA footer on free tier profiles ("Prove you're human too")
- [M-014] OG meta tags for compelling link previews
- [M-015] Referral tracking via profile URL (invisible referral codes)
- [M-016] Two-sided referral rewards (referrer: +1 network, +2 freezes; referee: +3 freezes)
- [M-017] Camera mode toggle in extension settings
- [M-018] Active/Inactive status (7-day verification window)
- [M-019] Rich activity capture: extension scrapes comment text + post context on LinkedIn AND X/Twitter
- [M-020] VerifiedActivity stored server-side with post author name, avatar, headline, URL, text snippet
- [M-021] Activity feed on public profile page (replicated LinkedIn/X UI showing verified interactions)
- [M-022] Extension content scripts for X/Twitter comment capture (in addition to existing LinkedIn)
- [M-023] PlatformLink: users link their LinkedIn/X profiles to TrustProfile for badge overlay matching
- [M-024] Extension badge overlay on LinkedIn/X profile pages of other verified humans
- [M-025] Batch badge lookup API for feed-level badge display (many profiles visible at once)

### Should-Have (S)

- [S-001] Embeddable SVG badge (small shield, ~150x30px)
- [S-002] Embeddable medium card (300x100px)
- [S-003] Embeddable full widget (300x400px)
- [S-004] Markdown badge for GitHub READMEs
- [S-005] Monthly Trust Report with stats (Spotify Wrapped model)
- [S-006] Pre-rendered monthly report share cards
- [S-007] Referral milestone badges (Connector, Network Builder, Ambassador)
- [S-008] Tiered referral rewards (1/3/5/10/25/50/100 referrals)
- [S-009] "Invited by Human #X" display on referee's card
- [S-010] "Invite 3" nudge after first verification
- [S-011] Public "Top Connectors" leaderboard
- [S-012] Share → earn streak freeze token reward loop
- [S-013] Network Bonus: +1 Trust Score per active referred friend (max +15)
- [S-014] Trust Network visualization (who invited who — future)
- [S-015] Badge overlay in LinkedIn/X feeds (not just profile pages)
- [S-016] Auto-detect and link platform profile from extension context (first activity auto-links)
- [S-017] Graceful fallback when DOM scraping fails (basic capture without post context)

### Could-Have (C)

- [C-001] LinkedIn banner generator (1584x396) with Trust Score
- [C-002] Custom card background unlock at 3 referrals
- [C-003] "Social Verifier" badge for posting on LinkedIn/X with URL proof
- [C-004] "Web Verified" badge for embedding badge on personal website
- [C-005] QR code on Human Card linking to profile
- [C-006] Year badges ("Verified Since 2026")
- [C-007] Email notification when monthly report is ready
- [C-008] Push notification for streak at risk
- [C-009] Cache post author avatar images on our CDN (LinkedIn/X avatar URLs may expire)
- [C-010] Badge overlay click → mini tooltip with Trust Score details before navigating to profile

### Won't-Have (W)

- [W-001] Paid premium tier with custom branding
- [W-002] Physical metal card at 100 referrals
- [W-003] Team/enterprise verification
- [W-004] AI or Human? quiz game
- [W-005] Cross-device verification correlation
- [W-006] Real-time WebSocket updates
- [W-007] Multi-language localization

---

## 15. RFCs

### RFC-001: Database Schema & Migrations

**Summary**: Set up the TrustAHuman database from scratch in the standalone monorepo. Create all models: User (Clerk sync), TrustProfile, HumanVerification, VerifiedActivity, PlatformLink, ShareEvent, ReferralMilestone, TrustReport.

**Dependencies**: Standalone monorepo scaffolded, PostgreSQL database provisioned, Clerk app created

**Stage 0: Pre-Phase Research & Monorepo Setup**
1. Fork/duplicate EngageKit monorepo structure (turbo.json, tooling, tsconfig)
2. Strip all EngageKit-specific code (apps/nextjs, EngageKit routers, EngageKit models)
3. Set up `apps/web/` (fresh Next.js app) and keep `apps/extension/` (rename from trustahuman-ext)
4. Set up `packages/db/` with fresh Prisma config pointing to new PostgreSQL instance
5. Set up `packages/api/` with fresh tRPC router structure
6. Configure new Clerk app (TrustAHuman branding, webhook for user sync)
7. Set up environment variables (.env) for new services
8. Verify monorepo builds clean (`pnpm install && pnpm build`)

**Stage 1: Create User Model (Clerk Sync)**
1. Create `packages/db/prisma/models/user.prisma`
2. Minimal model: id (Clerk ID), email, name, imageUrl, timestamps
3. Set up Clerk webhook handler in `apps/web/src/app/api/webhooks/clerk/route.ts`
4. Webhook creates/updates User on Clerk events (user.created, user.updated)

**Stage 2: Create TrustProfile Model**
1. Create `packages/db/prisma/models/trust-profile.prisma`
2. Define all fields per schema specification above
3. Set up `autoincrement()` for `humanNumber`
4. Define self-referencing `Referrals` relation
5. Add all necessary indexes

**Stage 3: Create HumanVerification, VerifiedActivity & Supporting Models**
1. Create `HumanVerification` model (fresh, no legacy data, with optional `activityId` link)
2. Create `VerifiedActivity` model (rich activity capture: comment text, post context, platform)
3. Create `PlatformLink` model (links TrustProfile to LinkedIn/X profiles for badge overlay)
4. Create `ShareEvent` model
5. Create `ReferralMilestone` model
6. Create `TrustReport` model
7. Define all relations and indexes

**Stage 4: Migration**
1. Generate Prisma migration: `pnpm db:migrate dev --name initial_schema`
2. Review generated SQL for correctness
3. Verify `humanNumber` creates a PostgreSQL sequence
4. Test migration on local database
5. Verify all models are queryable
6. Seed with test data (optional)

**Post-Phase Testing**:
- ✓ Monorepo builds clean with no EngageKit remnants
- ✓ Clerk webhook creates User records
- ✓ Migration applies cleanly to fresh database
- ✓ `TrustProfile` can be created with auto-incrementing `humanNumber`
- ✓ First profile gets `humanNumber = 1`, second gets `2`
- ✓ `User` ↔ `TrustProfile` 1:1 relation works
- ✓ `TrustProfile` ↔ `HumanVerification` relation works
- ✓ Self-referencing `Referrals` relation works
- ✓ All indexes visible in schema

**Acceptance Criteria**:
- [ ] Standalone monorepo scaffolded and building clean
- [ ] Clerk app configured with webhook
- [ ] 8 models created (User, TrustProfile, HumanVerification, VerifiedActivity, PlatformLink, ShareEvent, ReferralMilestone, TrustReport)
- [ ] Initial migration applies cleanly to fresh database
- [ ] Human Number auto-increment works atomically
- [ ] All relations resolve correctly
- [ ] All indexes created
- [ ] Extension tRPC client configured to point to new Vercel API

**What's Functional Now**: Standalone monorepo with fresh database ready for all features

**Ready For**: RFC-002 (Human Numbering & Signup Flow)

---

### RFC-002: Human Numbering & Signup Flow

**Summary**: Implement the signup flow that creates a TrustProfile with permanent Human Number on first successful verification. Handle username selection, Founding Human designation, and referral attribution at signup.

**Dependencies**: RFC-001 (Database Schema)

**Stage 0: Pre-Phase Research**
1. Read existing `verification.analyzePhoto` procedure
2. Understand how extension communicates with tRPC
3. Review Clerk user creation flow
4. Identify where to hook TrustProfile creation

**Stage 1: Username Validation**
1. Create `trustProfile.checkUsername` query (public)
   - Input: `{ username: string }`
   - Output: `{ available: boolean }`
   - Validation: 3-30 chars, alphanumeric + hyphens, no consecutive hyphens, no leading/trailing hyphens
2. Create username blacklist (admin, api, app, www, trust, human, etc.)

**Stage 2: TrustProfile Creation**
1. Create `trustProfile.create` mutation (protected)
2. Implement atomic Human Number assignment (rely on `autoincrement()`)
3. Generate referral code: `human-{humanNumber}`
4. If `referralCode` provided in input: look up referrer, set `referredById`
5. Compute `isFoundingHuman` from `humanNumber <= 1000`
6. Return created profile with Human #

**Stage 3: Integration with Verification Flow**
1. Modify `verification.analyzePhoto` to check for TrustProfile after verification
2. If no TrustProfile exists and verification succeeds: flag in response (`needsProfile: true`)
3. Extension shows "Create your Human identity" prompt
4. After TrustProfile creation: link all existing HumanVerifications to new profile

**Stage 4: Extension UI for Signup**
1. Add "Welcome, Human #X" screen in extension sidebar after profile creation
2. Show Human # prominently
3. Show "Founding Human" badge if applicable
4. Show "Share your Human Card" CTA

**Post-Phase Testing**:
- ✓ Username validation works (valid/invalid/taken)
- ✓ Human #1 assigned to first profile, #2 to second (sequential)
- ✓ Concurrent signups don't produce duplicate numbers
- ✓ Founding Human correctly identified (<=1000)
- ✓ Referral attribution works at signup
- ✓ Extension shows welcome screen after creation
- ✓ Existing verifications linked to new profile

**Acceptance Criteria**:
- [ ] Username validation endpoint works correctly
- [ ] Human Numbers assigned sequentially with no gaps
- [ ] Founding Human designation works for first 1,000
- [ ] Referral code generated and unique
- [ ] Referral attribution at signup works
- [ ] Extension sidebar shows welcome screen
- [ ] All existing verifications linked to profile

**What's Functional Now**: Users can create TrustProfiles with permanent Human Numbers

**Ready For**: RFC-003 (Trust Score Engine & Streak System)

---

### RFC-003: Trust Score Engine & Streak System

**Summary**: Implement the Trust Score calculation algorithm and day-based streak system with freeze tokens. These are the core engagement mechanics that drive daily usage.

**Dependencies**: RFC-002 (Human Numbering & Signup)

**Stage 1: Trust Score Pure Function**
1. Create `packages/api/src/lib/trust-score.ts`
2. Implement `computeTrustScore(params)` pure function:
   - Input: `{ verificationCount, currentStreak, accountAgeDays, networkBonus, daysSinceLastVerification }`
   - Output: `{ score, tier, breakdown }`
3. Implement score formula per AD-003
4. Implement decay calculation
5. Implement tier mapping
6. Write comprehensive unit tests:
   - New user (0 verifications): score ≈ 0
   - Active user (50 verifications, 30-day streak): score ≈ 50-60
   - Power user (200+ verifications, 90-day streak, old account): score ≈ 85-100
   - Decayed user (30 days inactive): score drops significantly
   - Network bonus adds correctly (capped at +15)

**Stage 2: Streak Logic**
1. Create `packages/api/src/lib/streak.ts`
2. Implement `processStreak(profile)` function:
   - Check if user verified today
   - If yes: increment `currentStreak`
   - If no + freeze tokens > 0: consume token, maintain streak
   - If no + no tokens: break streak (set to 0)
   - Update `longestStreak` if current exceeds it
3. Implement `awardStreakFreeze(profileId, amount, reason)` helper
4. Write unit tests for all streak scenarios:
   - Normal day (verified): streak extends
   - Missed day with freeze: streak maintained, token consumed
   - Missed day without freeze: streak broken
   - Multiple missed days: sequential freeze consumption
   - Token cap enforcement (max 7)

**Stage 3: Verification Count Tracker**
1. Modify `verification.analyzePhoto` to update TrustProfile on successful verification:
   - Increment `totalVerifications`
   - Update `lastVerifiedAt`
   - Extend streak (call `processStreak`)
2. Ensure idempotency (don't double-count if retried)
3. Test with real verification flow

**Stage 4: Daily Cron Job Setup**
1. Create Vercel cron configuration in `vercel.json`
2. Create cron handler: `apps/web/src/app/api/cron/daily-streak/route.ts`
3. Implement batch processing of all active profiles
4. Handle edge cases: timezone boundaries, server clock drift
5. Add `streakProcessedDate` check to prevent double-processing
6. Logging for monitoring

**Post-Phase Testing**:
- ✓ Trust Score computes correctly for all user types
- ✓ Decay applies correctly after 7 and 14 days
- ✓ Tier assignment is correct at boundaries (49→Bronze, 50→Silver, etc.)
- ✓ Streak extends on verification day
- ✓ Freeze token consumed when day missed
- ✓ Streak breaks when no tokens and no verification
- ✓ Token cap at 7 enforced
- ✓ Cron job processes all profiles without errors

**Acceptance Criteria**:
- [ ] Trust Score formula produces expected values for test cases
- [ ] Decay mechanics work correctly
- [ ] Tier mapping is accurate at all boundaries
- [ ] Streak extends/freezes/breaks correctly
- [ ] Freeze tokens earned and consumed correctly
- [ ] Cron job runs daily and processes all profiles
- [ ] No double-processing possible
- [ ] Comprehensive unit tests pass

**What's Functional Now**: Trust Score and Streak engine ready for API layer

**Ready For**: RFC-004 (tRPC API Layer)

---

### RFC-004: tRPC API Layer

**Summary**: Create all tRPC endpoints needed for the platform: profile CRUD, Trust Score queries, streak status, sharing, referral, and leaderboard.

**Dependencies**: RFC-003 (Trust Score Engine & Streak System)

**Stage 1: Router Setup**
1. Create `packages/api/src/router/trust-profile.ts`
2. Set up router with proper procedure types (public vs protected)
3. Define Zod schemas for all inputs/outputs
4. Register in `packages/api/src/router/root.ts`

**Stage 2: Profile Endpoints**
1. Implement `trustProfile.create` (protected)
2. Implement `trustProfile.getByUsername` (public)
3. Implement `trustProfile.getMyProfile` (protected)
4. Implement `trustProfile.updateSettings` (protected)
5. Implement `trustProfile.checkUsername` (public)

**Stage 3: Trust Score & Streak Endpoints**
1. Implement `trustProfile.computeTrustScore` (public) — uses pure function from RFC-003
2. Implement `trustProfile.getStreakStatus` (protected)
3. Implement `trustProfile.getVerificationHeatmap` (public) — 365-day activity data

**Stage 4: Sharing & Referral Endpoints**
1. Implement `trustProfile.recordShare` (protected)
2. Implement `trustProfile.processReferral` (internal — called during signup)
3. Implement `trustProfile.getLeaderboard` (public)
4. Implement `trustProfile.getMyReferrals` (protected)

**Stage 5: Report Endpoints**
1. Implement `trustProfile.getMonthlyReport` (protected)
2. Implement `trustProfile.getLatestReport` (protected)

**Stage 6: Testing**
1. Test all endpoints via manual tRPC calls
2. Verify public endpoints don't require auth
3. Verify protected endpoints reject unauthenticated requests
4. Test with accounts that have 0 verifications (empty states)
5. Verify TypeScript types are inferred correctly in client

**Post-Phase Testing**:
- ✓ All endpoints callable and return correct data
- ✓ Public endpoints work without auth
- ✓ Protected endpoints require Clerk auth
- ✓ Username uniqueness enforced
- ✓ Trust Score computation returns expected values
- ✓ Streak status reflects current state
- ✓ Heatmap returns 365 days of data
- ✓ Leaderboard returns top entries sorted correctly

**Acceptance Criteria**:
- [ ] All endpoints registered and callable
- [ ] Input validation works (Zod schemas)
- [ ] Auth enforcement correct (public vs protected)
- [ ] All TypeScript types inferred correctly
- [ ] Empty state handling works
- [ ] Error responses are clear and helpful

**What's Functional Now**: Full API layer ready for frontend consumption

**Ready For**: RFC-005 (Public Profile Page)

---

### RFC-005: Public Profile Page

**Summary**: Build the public-facing profile page at `/u/[username]` — the core viral unit. Server-rendered for OG meta tags, with Trust Score, verification heatmap, tier badge, streak counter, Human #, rich activity feed (replicated LinkedIn/X UI), and mandatory CTA footer.

**Dependencies**: RFC-004 (tRPC API Layer)

**Stage 0: Pre-Phase Research**
1. Review Next.js App Router route group patterns in existing codebase
2. Understand existing `(public)` or unauthenticated route patterns
3. Review `generateMetadata` usage for OG tags
4. Identify existing UI components that can be reused (from `@sassy/ui`)

**Stage 1: Route Setup**
1. Create route: `apps/web/src/app/(public)/u/[username]/page.tsx`
2. Create layout: `apps/web/src/app/(public)/u/[username]/layout.tsx` (minimal, no auth sidebar)
3. Create loading state: `apps/web/src/app/(public)/u/[username]/loading.tsx`
4. Create not-found: `apps/web/src/app/(public)/u/[username]/not-found.tsx`

**Stage 2: Server Component & Data Fetching**
1. Implement server component that calls `trustProfile.getByUsername`
2. Handle profile not found (redirect to not-found)
3. Handle private profiles (show minimal info)
4. Compute Trust Score server-side

**Stage 3: generateMetadata for OG Tags**
1. Implement dynamic `generateMetadata`:
   ```typescript
   title: `Human #${humanNumber} — ${displayName} | TrustAHuman`
   description: `${displayName} has been verified as human ${totalVerifications} times. Trust Score: ${trustScore}/100. What's YOUR Trust Score?`
   openGraph: {
     images: [`/api/og/card/${username}?platform=default`]
   }
   ```
2. Test OG previews with LinkedIn, Twitter, Slack debuggers

**Stage 4: Profile UI Components**
1. Create `_components/trust-profile/` directory
2. **HumanNumberBadge**: Large display of Human # with Founding Human designation
3. **TrustScoreGauge**: Circular or arc gauge showing 0-100 score with tier color
4. **TierBadge**: Bronze/Silver/Gold/Diamond visual badge
5. **VerificationHeatmap**: GitHub-style 52-week calendar grid
6. **StreakCounter**: Current streak with fire icon + longest streak
7. **StatsRow**: Total verifications, account age, active/inactive status
8. **CTAFooter**: "Prove you're human too — trustahuman.com" (mandatory on free tier)
9. **ActivityFeed**: Paginated list of verified activities with replicated LinkedIn/X card UI (uses `activity.getByProfile` query)

**Stage 5: Heatmap Implementation**
1. Create heatmap grid component (7 rows × 52 columns)
2. Color intensity based on daily verification count
3. Tooltip on hover showing date + count
4. Responsive: fewer weeks on mobile

**Stage 6: CTA Footer**
1. Sticky footer with "Prove you're human too" message
2. Link to trustahuman.com homepage (with referral attribution)
3. Mandatory on free tier, removable on paid (design hook, don't implement billing)
4. Visually distinct but not obnoxious

**Stage 7: Responsive Design**
1. Mobile-first layout (stacks vertically)
2. Tablet: 2-column sections
3. Desktop: full-width hero + grid layout
4. Test on common device sizes

**Post-Phase Testing**:
- ✓ Profile page renders correctly at `/u/[username]`
- ✓ 404 shown for non-existent usernames
- ✓ OG meta tags render correctly (test with ogp.me debugger)
- ✓ Trust Score, tier, heatmap, streak all display correctly
- ✓ CTA footer visible and links correctly
- ✓ Referral code in CTA link
- ✓ Responsive on mobile/tablet/desktop
- ✓ Page loads in <2 seconds (SSR)
- ✓ Active/inactive status reflects 7-day window
- ✓ Activity feed renders with LinkedIn/X card UI
- ✓ Activity feed pagination works (cursor-based)

**Acceptance Criteria**:
- [ ] Profile page at `/u/[username]` works
- [ ] OG meta tags produce compelling link previews
- [ ] Trust Score gauge displays correctly
- [ ] Tier badge shows correct tier
- [ ] Heatmap renders 52 weeks of data
- [ ] Streak counter shows current/longest
- [ ] Activity feed shows verified interactions with platform-specific styling
- [ ] CTA footer mandatory on free tier
- [ ] Human # prominently displayed
- [ ] Founding Human designation visible for #1-1000
- [ ] Active/inactive status correct
- [ ] Responsive design works
- [ ] SSR page load < 2s

**What's Functional Now**: Public profiles serve as shareable viral units

**Ready For**: RFC-006 (Human Card Generation)

---

### RFC-006: Human Card Generation

**Summary**: Generate beautiful, platform-optimized Human Card images for social sharing. Uses @vercel/og (Satori) for server-side JSX-to-image rendering. Cards include Human #, name, Trust Score, tier, mini-heatmap, QR code, and CTA.

**Dependencies**: RFC-005 (Public Profile Page)

**Stage 0: Pre-Phase Research**
1. Research @vercel/og API and Satori JSX limitations
2. Understand supported CSS properties (flexbox yes, grid no)
3. Review existing OG image generation patterns in codebase
4. Test Satori rendering capabilities locally

**Stage 1: Card Layout Design (JSX)**
1. Create `apps/web/src/app/api/og/card/[username]/route.tsx`
2. Design card layout as JSX:
   - Header: Human # + Founding Human badge (if applicable)
   - Name + avatar
   - Trust Score (large number) + tier badge
   - Mini heatmap (simplified, last 12 weeks)
   - Current streak counter
   - QR code pointing to profile URL
   - CTA: "Are you human? Prove it. → trustahuman.com"
3. Use flexbox layout (Satori limitation)
4. Holographic/gradient background aesthetic

**Stage 2: Platform Dimensions**
1. LinkedIn: 1200×628 (1.91:1) — `?platform=linkedin`
2. Twitter/X: 1600×900 (16:9) — `?platform=twitter`
3. Instagram Stories: 1080×1920 (9:16) — `?platform=instagram`
4. Default: 1200×630 (standard OG) — `?platform=default`
5. Each platform has optimized text sizes and element placement

**Stage 3: QR Code Generation**
1. Generate QR code pointing to `trustahuman.com/u/{username}?ref=human-{number}`
2. Render QR as SVG within Satori JSX
3. Use lightweight QR library compatible with Edge Runtime (e.g., `qr-code-styling` or custom)

**Stage 4: Font & Asset Loading**
1. Load custom font as ArrayBuffer (required by Satori)
2. Use system-safe font stack as fallback
3. Pre-load avatar images as base64 or fetch via URL

**Stage 5: Caching Strategy**
1. Set `Cache-Control: public, max-age=3600, s-maxage=86400` (1 hour client, 24 hour CDN)
2. Invalidate cache on Trust Score change or tier change
3. Query param `?v={timestamp}` for manual cache busting

**Stage 6: Share Integration**
1. Add share buttons to extension sidebar (after verification)
2. Add share buttons to profile page
3. One-tap share: opens platform with pre-filled text + card image URL
4. LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={cardUrl}`
5. Twitter: `https://twitter.com/intent/tweet?text={text}&url={profileUrl}`

**Post-Phase Testing**:
- ✓ Card generates at all 4 platform dimensions
- ✓ Human #, name, score, tier, heatmap, QR all render correctly
- ✓ QR code scans and leads to correct profile URL with referral
- ✓ CDN caching works (second request served from cache)
- ✓ Share buttons open correct platform with pre-filled content
- ✓ Cards look good when actually shared to LinkedIn/Twitter

**Acceptance Criteria**:
- [ ] Card generates for all 4 platforms at correct dimensions
- [ ] All data (Human #, name, score, tier, heatmap, QR) renders correctly
- [ ] QR code functional and includes referral tracking
- [ ] Gradient/holographic aesthetic looks professional
- [ ] CDN caching reduces load on image generation
- [ ] Share buttons work for LinkedIn and Twitter
- [ ] CTA text visible on card

**What's Functional Now**: Users can generate and share Human Cards on social media

**Ready For**: RFC-007 (Embeddable Badges)

---

### RFC-007: Embeddable Badges

**Summary**: Create multiple badge formats (shield, card, widget, markdown) that users can embed on external websites. All badges are live (fetch current data), verifiable (click → profile), and include referral tracking.

**Dependencies**: RFC-006 (Human Card Generation)

**Stage 1: SVG Badge Endpoint (Small Shield)**
1. Create `apps/web/src/app/api/badge/[username]/route.ts`
2. Generate SVG badge (~150×30px):
   ```
   [✓ Human #42 | Trust: 87 | Gold]
   ```
3. Dynamic data fetched from TrustProfile
4. Color coded by tier (bronze/silver/gold/diamond)
5. Cache headers: 1 hour CDN cache
6. Clickable: wraps in `<a>` linking to profile (when embedded as `<img>` in HTML, provide embed snippet with link)

**Stage 2: Medium Card Badge (300×100px)**
1. Create endpoint: `/api/badge/[username]/card.svg`
2. Includes: avatar, Human #, name, Trust Score, tier, mini streak indicator
3. Designed for blog sidebars, about pages

**Stage 3: Full Widget (300×400px)**
1. Create endpoint: `/api/badge/[username]/widget.svg` (or PNG via @vercel/og)
2. Includes: full profile summary — avatar, Human #, name, Trust Score gauge, tier, streak, heatmap preview, CTA
3. Designed for dedicated trust sections on personal websites

**Stage 4: Markdown Badge**
1. Provide copy-paste markdown: `[![Trust Score](trustahuman.com/api/badge/username.svg)](trustahuman.com/u/username)`
2. Works in GitHub READMEs, GitBook, any markdown renderer
3. SVG format ensures crisp rendering at any DPI

**Stage 5: Embed Code Generator**
1. Add "Get your badge" section to profile page
2. Show all badge formats with previews
3. One-click copy for each format (HTML embed, Markdown, URL)
4. All embed codes include referral tracking in the link URL

**Post-Phase Testing**:
- ✓ Shield badge renders correctly as SVG
- ✓ Medium card renders correctly
- ✓ Full widget renders correctly
- ✓ Markdown badge works in GitHub README
- ✓ All badges show current data (not stale)
- ✓ All badges link to profile with referral tracking
- ✓ Embed code generator provides correct snippets
- ✓ CDN caching works for badges

**Acceptance Criteria**:
- [ ] 3 badge sizes available (shield, card, widget)
- [ ] Markdown badge format works
- [ ] All badges dynamically fetch current data
- [ ] All badges link to profile with referral code
- [ ] Embed code generator on profile page
- [ ] CDN caching with 1-hour TTL
- [ ] Tier-appropriate color coding

**What's Functional Now**: Users can embed live Trust badges on external websites

**Ready For**: RFC-008 (Referral System)

---

### RFC-008: Referral System

**Summary**: Implement two-sided referral rewards, tiered milestones, and Trust Network mechanics. Every profile view is a referral opportunity via URL attribution.

**Dependencies**: RFC-007 (Embeddable Badges) — badges carry referral links

**Stage 1: Referral Attribution**
1. Implement referral cookie middleware for public profile pages
2. When visitor arrives with `?ref=human-X`: store referral code in cookie (30-day expiry)
3. On signup: check for referral cookie, pass to `trustProfile.create`
4. Validate referral code exists and isn't self-referral

**Stage 2: Two-Sided Reward Distribution**
1. After new user completes first verification (not just signup):
   - **Referrer**: +1 to `referralCount`, +2 streak freeze tokens, +1 network bonus (reflected in Trust Score)
   - **Referee**: +3 streak freeze tokens, `referredById` set, "Invited by Human #X" badge on card
2. Rewards are one-time per referral pair (prevent gaming)
3. Handle edge case: referrer's profile deleted → still credit referee

**Stage 3: Tiered Milestone Tracking**
1. After each successful referral, check milestone thresholds:
   - 1: Award "Connector" badge
   - 3: Unlock custom card background
   - 5: Award "Network Builder" badge + 5 extra streak freezes
   - 10: Award "Ambassador" title (displayed on profile)
   - 25: Flag for premium credit (manual for V1)
   - 50: Award "Founding Ambassador" lifetime badge
   - 100: Flag for physical card fulfillment (manual for V1)
2. Create `ReferralMilestone` record for each achieved milestone
3. Display badges on profile page

**Stage 4: "Invite 3" Post-Verification Nudge**
1. After first verification, show modal/prompt in extension: "You're verified! Invite 3 friends to build your Trust Network"
2. Provide shareable link (profile URL with referral code)
3. Show progress: "0/3 friends invited"
4. Dismissable but persists in sidebar

**Stage 5: Top Connectors Leaderboard**
1. Implement `trustProfile.getLeaderboard` for `type: "referrals"`
2. Public page or section showing top 50 referrers
3. Display: rank, Human #, username, referral count
4. Updated in real-time (query-based, not cached)

**Post-Phase Testing**:
- ✓ Referral cookie set on profile visit with `?ref=`
- ✓ Referral attributed on signup + first verification
- ✓ Referrer receives +2 freeze tokens and +1 network bonus
- ✓ Referee receives +3 freeze tokens
- ✓ "Invited by Human #X" shows on referee's profile
- ✓ Milestone badges awarded at correct thresholds
- ✓ Self-referral blocked
- ✓ Duplicate referral pair blocked
- ✓ Leaderboard shows top referrers
- ✓ "Invite 3" nudge appears after first verification

**Acceptance Criteria**:
- [ ] Referral attribution works via URL cookies (30-day window)
- [ ] Two-sided rewards distributed correctly
- [ ] All 7 milestone tiers trigger correctly
- [ ] Self-referral prevented
- [ ] Duplicate referral prevented
- [ ] "Invite 3" nudge appears in extension
- [ ] Leaderboard displays top referrers
- [ ] Network Bonus reflected in Trust Score computation

**What's Functional Now**: Referral system drives organic user acquisition

**Ready For**: RFC-009 (Sharing Rewards & Monthly Trust Report)

---

### RFC-009: Sharing Rewards & Monthly Trust Report

**Summary**: Implement the sharing reward loop (share → streak freeze token) and monthly Trust Report generation (Spotify Wrapped model). These create recurring engagement and periodic viral sharing waves.

**Dependencies**: RFC-008 (Referral System)

**Stage 1: Share Recording & Verification**
1. Implement `trustProfile.recordShare` mutation
2. Accept share event: platform, type, optional proof URL
3. If proof URL provided: basic URL validation (exists, contains trustahuman reference)
4. Award 1 streak freeze token per verified share (cap at 7 total)
5. Prevent spam: max 1 freeze reward per platform per day

**Stage 2: Share Buttons Integration**
1. Add share buttons to:
   - Profile page (share this profile)
   - Human Card view (share card)
   - Extension sidebar (share after verification)
2. Track which shares include proof URLs
3. "Social Verifier" badge for first share with proof URL

**Stage 3: Monthly Report Data Generation**
1. Create cron handler: `apps/web/src/app/api/cron/monthly-report/route.ts`
2. Schedule: 1st of each month at 06:00 UTC
3. For each active TrustProfile:
   - Count verifications in past month
   - Calculate average streak in month
   - Record longest streak in month
   - Capture Trust Score at start and end
   - Compute percentile rank ("Top X%")
   - Count new referrals in month
4. Store in `TrustReport` model

**Stage 4: Report Card Image Generation**
1. Create report-specific card endpoint: `/api/og/report/[username]/[month]-[year]`
2. Design: monthly stats laid out attractively
   - "Your month in numbers" header
   - Verification count (large number)
   - "Top X% of verified humans"
   - Streak stats
   - Trust Score trend (arrow up/down)
   - Platform-optimized (LinkedIn, Twitter, Instagram)
3. Pre-generate card URLs and store in `TrustReport`

**Stage 5: Report Delivery**
1. Show "New Trust Report" notification in extension sidebar
2. Link to report page on profile: `/u/[username]/report/[month]-[year]`
3. Report page shows full stats with share buttons
4. Share buttons open platform with card image + pre-filled text:
   - "I was in the top 8% of verified humans this month. What's your Trust Score? trustahuman.com"

**Post-Phase Testing**:
- ✓ Share recording works for all platforms
- ✓ Proof URL validation works
- ✓ Streak freeze token awarded on verified share
- ✓ Spam prevention: max 1 per platform per day
- ✓ Monthly report generates for all active users
- ✓ Report data is accurate (matches manual calculation)
- ✓ Report card images render correctly at all platform dimensions
- ✓ Share buttons on report page work

**Acceptance Criteria**:
- [ ] Share recording tracks platform and type
- [ ] Streak freeze awarded on verified share
- [ ] Monthly report cron generates correctly
- [ ] Report data is accurate
- [ ] Report cards render for all platforms
- [ ] Report page is shareable with proper OG tags
- [ ] Extension shows "New Report" notification

**What's Functional Now**: Sharing rewards loop and monthly viral sharing waves

**Ready For**: RFC-010 (Camera Mode Toggle)

---

### RFC-010: Camera Mode Toggle (Extension)

**Summary**: Add a camera mode setting to the extension: "Capture on submit" (default, current behavior — camera activates per comment) vs "Camera always on" (persistent stream, one macOS notification per session).

**Dependencies**: None (can run in parallel with other RFCs)

**Stage 1: Settings Store**
1. Add `cameraMode` to extension's Zustand store or Chrome storage
2. Default: `"capture_on_submit"`
3. Persist across sessions via `chrome.storage.local`

**Stage 2: Settings UI**
1. Add settings section in extension sidebar
2. Toggle between "Capture on submit" and "Camera always on"
3. Description for each mode:
   - Capture on submit: "Camera activates each time you submit a comment. More private, but macOS shows a notification each time."
   - Camera always on: "Camera stays on while extension is active. Single notification per session. Camera indicator visible."

**Stage 3: Persistent Stream Mode**
1. When "always on" mode is selected:
   - Create offscreen document on extension load (not per capture)
   - Start `getUserMedia` stream and keep it alive
   - On capture: take frame from existing stream (no new `getUserMedia` call)
   - Destroy offscreen document only when mode changes or browser closes
2. This eliminates repeated macOS "Reactions" notifications

**Stage 4: Sync with TrustProfile**
1. If user has a TrustProfile, sync `cameraMode` setting to server
2. `trustProfile.updateSettings({ cameraMode })` mutation
3. New devices pick up server-side preference

**Post-Phase Testing**:
- ✓ Setting persists across extension reload
- ✓ "Capture on submit" mode works as current behavior
- ✓ "Camera always on" mode keeps stream alive
- ✓ Only 1 macOS notification in "always on" mode per session
- ✓ Camera indicator visible when stream is active
- ✓ Mode toggle UI is clear and accessible
- ✓ Setting syncs to TrustProfile on server

**Acceptance Criteria**:
- [ ] Toggle UI in extension sidebar
- [ ] Default mode is "Capture on submit"
- [ ] "Camera always on" reduces macOS notifications to 1 per session
- [ ] Stream properly cleaned up on mode change/browser close
- [ ] Setting persists in Chrome storage
- [ ] Setting syncs to server if TrustProfile exists

**What's Functional Now**: Users can choose their preferred camera behavior

**Ready For**: RFC-012 (Rich Activity Capture & X/Twitter Support)

---

### RFC-012: Rich Activity Capture & X/Twitter Support

**Summary**: Extend the extension to capture rich activity context (comment text + full post context) on both LinkedIn and X/Twitter. Build X/Twitter content scripts. Store VerifiedActivity server-side. Display activity feed on public profile page with replicated platform UI.

**Dependencies**: RFC-001 (Database: VerifiedActivity model), RFC-004 (activity router), RFC-005 (profile page to add activity feed)

**Stage 0: Pre-Phase Research**
1. Analyze current LinkedIn content script DOM selectors for comment capture
2. Research X/Twitter DOM structure for comment/reply areas
3. Identify stable selectors for post context (author name, avatar, headline, post text)
4. Research X/Twitter CSP restrictions that may affect content scripts
5. Document LinkedIn vs X DOM differences and shared abstractions

**Stage 1: DOM Scraping Utilities**
1. Create shared scraping abstraction: `extension/lib/scrapers/types.ts`
   ```typescript
   interface ScrapedPostContext {
     platform: "linkedin" | "twitter";
     commentText: string;
     commentUrl?: string;
     postUrl: string;
     postAuthorName?: string;
     postAuthorProfileUrl?: string;
     postAuthorAvatarUrl?: string;
     postAuthorHeadline?: string;
     postTextSnippet?: string;
     postImageUrl?: string;
   }
   ```
2. Create `extension/lib/scrapers/linkedin.ts` — LinkedIn-specific DOM selectors
   - Scrape post author from `.feed-shared-actor` or similar
   - Scrape post text from `.feed-shared-update-v2__description`
   - Scrape author profile pic, headline
   - Handle various post types (articles, reposts, polls)
3. Create `extension/lib/scrapers/twitter.ts` — X/Twitter-specific DOM selectors
   - Scrape tweet author from `[data-testid="User-Name"]` or similar
   - Scrape tweet text from `[data-testid="tweetText"]`
   - Scrape author avatar, handle
   - Handle reply chains (identify parent tweet)
4. Both scrapers return `ScrapedPostContext` or `null` on failure (graceful fallback)

**Stage 2: X/Twitter Content Script**
1. Add X/Twitter content script in `extension/entrypoints/twitter-content.ts`
   - Match patterns: `*://twitter.com/*`, `*://x.com/*`
2. Detect comment/reply submission on X (monitor DOM for reply textarea submit)
3. Trigger webcam capture on reply submission (same flow as LinkedIn)
4. Scrape post context using twitter scraper
5. Register in WXT manifest: `content_scripts` for twitter.com/x.com

**Stage 3: Activity Recording Flow**
1. After successful comment submission + webcam capture:
   - Call `activity.record` tRPC mutation with scraped post context
   - Receive `activityId` in response
   - Pass `activityId` to `verification.analyzePhoto` to link verification → activity
2. Update LinkedIn content script to also call `activity.record` (currently only does verification)
3. Handle scraping failures: if DOM scraping returns null, still proceed with verification but skip activity recording (basic fallback)

**Stage 4: Activity Feed on Profile Page**
1. Add activity feed section to public profile page (`/u/[username]`)
2. Call `activity.getByProfile` tRPC query with cursor-based pagination
3. Render each activity as a mini-card replicating platform UI:
   - LinkedIn style: Post author (avatar + name + headline) → post snippet → user's comment → "Verified ✓" badge
   - X/Twitter style: Tweet author (@handle + avatar) → tweet text → user's reply → "Verified ✓" badge
4. Platform icon (LinkedIn/X) on each card
5. "View original" link on each activity card
6. Lazy-load more activities on scroll (infinite scroll or "Load more" button)

**Post-Phase Testing**:
- ✓ LinkedIn scraper captures post author, text, URL correctly
- ✓ X/Twitter scraper captures tweet author, text, URL correctly
- ✓ Extension triggers webcam capture on X/Twitter reply submission
- ✓ `activity.record` stores VerifiedActivity with all fields
- ✓ `verification.analyzePhoto` correctly links to VerifiedActivity via activityId
- ✓ Profile page activity feed renders with correct platform-specific UI
- ✓ Graceful fallback when DOM scraping fails (verification still works)
- ✓ Cursor-based pagination works for activity feed

**Acceptance Criteria**:
- [ ] LinkedIn DOM scraper captures post context correctly
- [ ] X/Twitter DOM scraper captures tweet context correctly
- [ ] X/Twitter content script detects reply submission
- [ ] VerifiedActivity stored with comment text + post context
- [ ] HumanVerification linked to VerifiedActivity
- [ ] Profile page shows rich activity feed with replicated platform UI
- [ ] Graceful fallback on scraping failure
- [ ] Both LinkedIn and X work end-to-end

**What's Functional Now**: Extension captures rich activity on LinkedIn AND X/Twitter; profile shows verified interaction feed

**Ready For**: RFC-013 (Extension Badge Overlay)

---

### RFC-013: Extension Badge Overlay

**Summary**: Implement badge injection on LinkedIn and X/Twitter profile pages and feeds. When a TrustAHuman extension user visits another verified human's LinkedIn/X profile, they see a Trust badge. Also show badges next to verified humans in feeds.

**Dependencies**: RFC-001 (Database: PlatformLink model), RFC-004 (badge overlay router), RFC-012 (X/Twitter content scripts exist)

**Stage 0: Pre-Phase Research**
1. Analyze LinkedIn profile page DOM structure (where to inject badge)
2. Analyze X/Twitter profile page DOM structure
3. Research stable injection points that survive LinkedIn/X DOM updates
4. Analyze feed item DOM structure on both platforms
5. Research extension badge/overlay patterns from other extensions (LinkedIn Sales Navigator, etc.)
6. Document rate limiting strategy for badge lookups

**Stage 1: PlatformLink Auto-Detection & Linking**
1. Extension auto-detects user's own LinkedIn profile URL when they're on LinkedIn
   - Read from DOM: `linkedin.com/in/[handle]` visible in profile dropdown or URL
   - Call `platformLink.link` mutation with detected URL
2. Same for X/Twitter: detect `twitter.com/[handle]` or `x.com/[handle]`
3. Auto-verify PlatformLink when user performs a verified activity on that platform (proof of access)
4. Show "Linked" status in extension settings/sidebar for each platform

**Stage 2: Profile Page Badge Injection**
1. Create `extension/entrypoints/badge-overlay-content.ts` (runs on LinkedIn/X profile pages)
2. On page load: extract viewed profile's platform URL
3. Call `badgeOverlay.lookupByPlatformUrl` API
4. If match found: inject Trust badge into profile page
   - **LinkedIn**: Inject near the name/headline area (e.g., next to "1st" connection badge)
   - **X/Twitter**: Inject near the display name / verified badge area
5. Badge design: small shield with tier color + Human # + Trust Score
   - Bronze: copper tones, Silver: silver, Gold: gold, Diamond: blue/purple gradient
6. Badge click → opens `trustahuman.com/u/[username]` in new tab
7. Cache lookup results in extension local storage (5-minute TTL) to avoid repeated API calls

**Stage 3: Feed Badge Injection**
1. Create feed observer using `MutationObserver` to detect new feed items loading
2. For each visible feed item: extract author's profile URL
3. Batch collect profile URLs (debounce 300ms) → call `badgeOverlay.batchLookup` API
4. For matched profiles: inject small badge next to author name in feed item
   - **LinkedIn feed**: Next to poster's name in feed card
   - **X/Twitter feed**: Next to @handle in tweet
5. Badge in feed is smaller than profile badge (just tier icon + score)
6. Handle scroll events efficiently: only process newly visible feed items
7. Rate limit: max 1 batch request per 2 seconds, max 50 URLs per batch

**Stage 4: Performance & Caching**
1. Extension-level cache: `Map<platformUrl, BadgeData | null>` with 5-minute TTL
2. Skip lookup for URLs already in cache (hit or miss)
3. Background refresh: when cache entry is >4 minutes old, refresh on next access
4. Debounce feed lookups: collect URLs for 300ms then batch
5. Track API call count per minute (client-side rate limiting)
6. Total extension memory budget: <10MB for badge cache

**Post-Phase Testing**:
- ✓ PlatformLink auto-detected and linked for LinkedIn
- ✓ PlatformLink auto-detected and linked for X/Twitter
- ✓ Badge appears on LinkedIn profile of verified human
- ✓ Badge appears on X/Twitter profile of verified human
- ✓ Badge does NOT appear for non-verified profiles
- ✓ Feed badges appear next to verified humans in LinkedIn feed
- ✓ Feed badges appear next to verified humans in X/Twitter feed
- ✓ Batch lookup handles 50 URLs efficiently (<500ms response)
- ✓ Cache prevents redundant API calls
- ✓ Badge click navigates to TrustAHuman profile
- ✓ No significant page slowdown from badge injection

**Acceptance Criteria**:
- [ ] PlatformLink auto-detected from extension context
- [ ] Badge injected on LinkedIn profile pages of verified humans
- [ ] Badge injected on X/Twitter profile pages of verified humans
- [ ] Feed badge injection works on LinkedIn feed
- [ ] Feed badge injection works on X/Twitter feed
- [ ] Batch lookup handles 50 URLs per request
- [ ] Client-side cache reduces API calls
- [ ] Badge click opens TrustAHuman profile
- [ ] No visible page performance impact
- [ ] Graceful handling when API is unavailable

**What's Functional Now**: Extension shows Trust badges on LinkedIn/X profiles and feeds — the core FOMO viral loop

**Ready For**: RFC-011 (Integration Testing & Polish)

---

### RFC-011: Integration Testing & Polish

**Summary**: End-to-end testing of all features, performance optimization, responsive design audit, and launch preparation.

**Dependencies**: RFC-001 through RFC-013

**Stage 1: End-to-End Flow Testing**
1. Test complete signup flow: Install extension → Verify face → Create TrustProfile → Get Human # → See welcome screen
2. Test profile sharing: View profile → Share card → Verify share → Get freeze token
3. Test referral flow: Share profile URL → Friend clicks → Friend signs up → Friend verifies → Both get rewards
4. Test streak flow: Verify Day 1 → Verify Day 2 → Miss Day 3 (freeze consumed) → Verify Day 4
5. Test decay: Don't verify for 8 days → Trust Score drops by decay
6. Test monthly report generation (manual trigger)
7. Test rich activity: Comment on LinkedIn → verify → check VerifiedActivity stored → check activity feed on profile
8. Test X/Twitter: Reply on X → verify → check VerifiedActivity → activity feed shows X-style card
9. Test badge overlay: Link LinkedIn profile → visit other verified human's LinkedIn → see badge
10. Test feed badges: Scroll LinkedIn feed → verified humans show badges
11. Test PlatformLink auto-detection: Extension auto-links current LinkedIn/X profile

**Stage 2: Performance Optimization**
1. Profile page load time target: <2s (SSR)
2. Card generation time target: <500ms
3. Badge generation time target: <200ms
4. Trust Score computation time target: <100ms
5. Optimize database queries (add missing indexes if needed)
6. Verify CDN caching for generated images

**Stage 3: Responsive Design Audit**
1. Test profile page on mobile (375px, 390px)
2. Test profile page on tablet (768px, 1024px)
3. Test profile page on desktop (1280px, 1920px)
4. Test extension sidebar with new UI elements
5. Fix any layout issues

**Stage 4: Cross-Browser Testing**
1. Test extension on Chrome (latest)
2. Test profile page on Chrome, Firefox, Safari, Edge
3. Test card/badge rendering across browsers
4. Verify OG meta tags work on LinkedIn, Twitter, Slack

**Stage 5: Security Audit**
1. Verify no PII leakage in public endpoints
2. Test rate limiting on card/badge generation
3. Verify referral anti-gaming measures
4. Test GDPR data export and deletion
5. Verify no XSS in user-provided content (username, displayName, bio)

**Stage 6: Launch Checklist**
1. Verify all M (Must-Have) features functional
2. Verify S (Should-Have) features that were implemented
3. Create "Founding Human" countdown (show remaining spots out of 1,000)
4. Prepare extension update for Chrome Web Store
5. Set up monitoring for Trust Score computation, cron jobs, image generation

**Acceptance Criteria**:
- [ ] All end-to-end flows pass
- [ ] Performance targets met
- [ ] Responsive design works on all device sizes
- [ ] Cross-browser compatibility confirmed
- [ ] No security vulnerabilities found
- [ ] All Must-Have features functional
- [ ] Extension ready for Chrome Web Store update
- [ ] Monitoring in place

**What's Functional Now**: Complete TrustAHuman SaaS platform ready for launch

**Ready For**: Production Launch

---

## 16. Rules (for this project)

### Tech Stack

- **Monorepo**: Standalone TrustAHuman repo (forked from EngageKit turborepo structure), Turborepo
- **Frontend (Web)**: React 19, Next.js (App Router), TypeScript, Tailwind CSS — `apps/web/`
- **Frontend (Extension)**: WXT framework, React 19, Zustand, Tailwind CSS — `apps/extension/`
- **API**: tRPC with Zod validation — `packages/api/` (deployed via Next.js API routes on Vercel)
- **Database**: Prisma ORM, PostgreSQL (Supabase or Neon) — `packages/db/`
- **Authentication**: Own Clerk app (TrustAHuman branding, independent from EngageKit)
- **Image Generation**: @vercel/og (Satori) for cards/badges
- **Deployment**: Vercel (NOT Hetzner) — Next.js + tRPC + Edge Functions + Cron

### Code Standards

- Follow existing codebase conventions (domain co-location, named exports)
- TypeScript strict mode, no `any` types
- Functional components with hooks
- tRPC procedures return plain objects (not Prisma models directly)
- Pure functions for business logic (Trust Score, streak) — easy to test
- Zod schemas for all tRPC inputs
- All user-facing text sanitized (XSS prevention)

### Architecture Patterns

- **TrustProfile as product boundary**: All TrustAHuman features reference TrustProfile, not User
- **Compute on read**: Trust Score computed on every request (not stored)
- **Server rendering**: Public profile pages are SSR for OG meta tags
- **Edge generation**: Card/badge images generated at edge for low latency
- **Invisible referral**: Referral tracking embedded in URLs, no explicit codes

### Performance Targets

- Profile page SSR: <2s
- Card image generation: <500ms
- Badge SVG generation: <200ms
- Trust Score computation: <100ms
- Database queries: <200ms each
- Daily cron job: <5 minutes for 10K users

### Security

- Public endpoints: rate-limited, no auth required
- Protected endpoints: Clerk auth enforced
- No raw SQL (Prisma only)
- User content sanitized (username, displayName, bio)
- Webcam photos processed and discarded (not stored long-term)
- GDPR compliant: data exportable and deletable

---

## 17. Verification (Comprehensive Review)

### Gap Analysis

**Missing Specifications**:
- Exact font and color palette for card generation → resolve during RFC-006 Stage 0
- QR code library compatible with Edge Runtime → research during RFC-006
- Vercel cron job limits on free tier (2 cron jobs) → may need to combine daily streak + monthly report into single cron with conditional logic
- Email notification delivery mechanism for monthly reports → defer to Should-Have, use extension notification for V1
- Exact LinkedIn/X DOM selectors for scraping → resolve during RFC-012 Stage 0 (will need maintenance as platforms update)
- Badge overlay visual design (exact colors, size, placement) → resolve during RFC-013 Stage 2
- Avatar URL caching strategy (LinkedIn/X avatar URLs may expire) → defer to Phase 2 (C-009)

**Ambiguities Resolved**:
- Human Number is `autoincrement()` on `TrustProfile` (PostgreSQL sequence)
- Trust Score is computed, not stored (AD-003)
- "Founding Human" is `humanNumber <= 1000` (derived, not a separate flag)
- Referral cookie window: 30 days
- Streak freeze cap: 7 tokens
- Share reward: 1 freeze per verified share, max 1 per platform per day

### Quality Assessment

| Criteria | Score | Reason |
|----------|-------|--------|
| **Completeness** | 94/100 | All 12 features specified with clear mechanics; DOM scraping fragility is acknowledged with fallback strategy |
| **Clarity** | 90/100 | Architecture decisions explicit; formula documented; some UI details left to implementation judgment |
| **Feasibility** | 95/100 | All features implementable with existing stack; @vercel/og may have CSS limitations for complex card designs |
| **Viral Mechanics** | 95/100 | Three interlocking loops well-designed; proven models (Duolingo, Spotify Wrapped, Linktree) |
| **Performance** | 85/100 | Compute-on-read for Trust Score works at low scale; may need caching layer at >10K users |
| **Security** | 90/100 | Anti-gaming measures in place; referral spam prevention; rate limiting needed on image generation |
| **Maintainability** | 88/100 | Clean separation via TrustProfile model; pure functions for business logic; cron jobs need monitoring |

---

## 18. Change Management (for updates mid-flight)

**Change Request Process**:
1. Classify change (New feature, Modify existing, Remove, Scope change)
2. Analyze impact (which RFCs affected, timeline, dependencies)
3. Determine strategy (Immediate, Schedule for next RFC, Defer to Phase 2)
4. Update this plan (modify affected RFC sections, update status strip)
5. Document decision and rationale
6. Track risks

**Example Change Scenarios**:
- User requests additional badge format mid-implementation → Schedule for RFC-007 if not started, defer if completed
- Trust Score formula needs tuning after testing → Immediate fix (pure function, easy to modify)
- Vercel cron limitations discovered → Combine cron handlers into single endpoint with conditional logic
- Extension store review rejects camera permissions → Research alternative approaches, update RFC-010
- LinkedIn/X updates DOM breaking scrapers → Update selectors in RFC-012, fallback to basic capture
- LinkedIn/X blocks badge injection → Research alternative overlay approaches in RFC-013

---

## 19. Ops Runbook

### Deployment

**Pre-Deployment Checklist**:
- [ ] All RFCs 001-013 completed
- [ ] Database migrations applied to staging
- [ ] Cron jobs tested on staging
- [ ] Card/badge generation tested
- [ ] Extension built and tested locally
- [ ] Performance benchmarks met

**Deployment Steps**:
1. Create Vercel project linked to TrustAHuman monorepo
2. Configure environment variables (Clerk keys, database URL, S3/Blob keys)
3. Connect custom domain (trustahuman.com)
4. Apply database migrations to production PostgreSQL
5. Deploy `apps/web/` to Vercel
6. Enable cron jobs in Vercel dashboard
7. Submit extension update to Chrome Web Store (pointing to new API URL)
8. Monitor error logs for 24 hours
9. Verify card/badge CDN caching

**Rollback Plan**:
- Fresh database, no shared state — rollback is just redeploy
- Revert Vercel deployment via dashboard if critical bug
- Extension can be rolled back via Chrome Web Store
- Cron jobs can be disabled in Vercel dashboard

### Monitoring

**Metrics**:
- Trust Score computation latency
- Card/badge generation success rate
- Cron job execution duration and errors
- Profile page load time
- Referral conversion rate
- Daily active verified users

**Alerts**:
- Cron job failure
- Image generation error rate >1%
- Database connection errors
- Trust Score computation timeout (>1s)

---

## 20. Acceptance Criteria (Versioned)

### V1.0 (MVP Launch)

**Core Identity**:
- [ ] Human Number assigned sequentially on first verification
- [ ] Founding Human designation for #1-1000
- [ ] Username chosen by user with validation
- [ ] Public profile at `/u/[username]`

**Trust Score & Streaks**:
- [ ] Trust Score 0-100 computed from formula
- [ ] Decay applies after 7 days (-2/day) and 14 days (-5/day)
- [ ] Tier assignment: Bronze/Silver/Gold/Diamond
- [ ] Day-based streak tracking
- [ ] Streak freeze tokens (max 7)
- [ ] Daily cron job processes streaks

**Viral Distribution**:
- [ ] Human Card generated at 4 platform dimensions
- [ ] Share buttons for LinkedIn and Twitter
- [ ] At least 1 embeddable badge format (shield SVG)
- [ ] CTA footer on free tier profiles
- [ ] OG meta tags produce compelling previews

**Referral**:
- [ ] Referral attribution via URL cookies (30 days)
- [ ] Two-sided rewards on successful referral
- [ ] At least 3 milestone tiers implemented

**Rich Activity Capture**:
- [ ] Extension captures comment text + post context on LinkedIn
- [ ] Extension captures comment text + tweet context on X/Twitter
- [ ] VerifiedActivity stored with author name, avatar, headline, URL
- [ ] Profile activity feed renders with replicated platform UI
- [ ] Graceful fallback when DOM scraping fails

**Badge Overlay**:
- [ ] PlatformLink auto-detected from extension context
- [ ] Badge injected on LinkedIn/X profile pages of verified humans
- [ ] Feed badges visible for verified humans in LinkedIn/X feeds
- [ ] Batch lookup handles 50 URLs per request efficiently

**Extension**:
- [ ] Camera mode toggle (capture on submit / always on)
- [ ] Welcome screen after TrustProfile creation
- [ ] Streak status visible in sidebar
- [ ] X/Twitter content script detects reply submission and triggers verification

---

## 21. Future Work

### Phase 2 (Post-Launch)
- Paid premium tier (custom branding, badge removal, advanced analytics)
- Email notifications for streak risk and monthly reports
- "AI or Human?" viral quiz game
- Trust Network visualization graph
- Additional embeddable formats (LinkedIn banner, full widget)
- Badge overlay mini-tooltip (hover to see Trust Score details before navigating)
- Cache post author avatar images on our CDN (LinkedIn/X URLs may expire)

### Phase 3 (Scale)
- Enterprise team verification product
- API for third-party websites to check verification status
- Mobile companion app
- Additional social platforms (Reddit, YouTube, TikTok)
- Physical card fulfillment for 100-referral milestone

---

## Implementation Checklist (Complete Workflow)

**RFC-001: Monorepo Setup & Database Schema** (~4 hours)
- [ ] Fork/scaffold standalone monorepo (strip EngageKit code)
- [ ] Set up `apps/web/` (fresh Next.js) and `apps/extension/`
- [ ] Set up `packages/db/` with fresh Prisma + new PostgreSQL
- [ ] Set up `packages/api/` with fresh tRPC structure
- [ ] Configure new Clerk app + webhook handler
- [ ] Create all 8 models (User, TrustProfile, HumanVerification, VerifiedActivity, PlatformLink, ShareEvent, ReferralMilestone, TrustReport)
- [ ] Generate and apply initial migration
- [ ] Configure extension tRPC client to point to new API

**RFC-002: Human Numbering & Signup** (~3 hours)
- [ ] Create username validation endpoint
- [ ] Create TrustProfile creation endpoint
- [ ] Implement atomic Human # assignment
- [ ] Integrate with verification flow
- [ ] Add extension welcome screen

**RFC-003: Trust Score & Streak Engine** (~4 hours)
- [ ] Implement Trust Score pure function + tests
- [ ] Implement streak logic + tests
- [ ] Modify verification flow to update TrustProfile
- [ ] Create daily cron job for streak processing
- [ ] Configure Vercel cron

**RFC-004: tRPC API Layer** (~5 hours)
- [ ] Create trust-profile router
- [ ] Implement all profile endpoints
- [ ] Implement Trust Score & streak endpoints
- [ ] Implement sharing & referral endpoints
- [ ] Implement report endpoints
- [ ] Create activity router (record, getByProfile)
- [ ] Create badge-overlay router (lookupByPlatformUrl, batchLookup)
- [ ] Create platform-link router (link, getMyLinks, unlink)
- [ ] Register all routers in root.ts

**RFC-005: Public Profile Page + Activity Feed** (~7 hours)
- [ ] Create route structure
- [ ] Implement server component + data fetching
- [ ] Implement generateMetadata for OG tags
- [ ] Build all profile UI components
- [ ] Build verification heatmap
- [ ] Build activity feed section (replicated LinkedIn/X UI per activity)
- [ ] Build CTA footer
- [ ] Responsive design

**RFC-006: Human Card Generation** (~4 hours)
- [ ] Set up @vercel/og endpoint
- [ ] Design card layout (JSX)
- [ ] Implement 4 platform dimensions
- [ ] Add QR code generation
- [ ] Implement CDN caching
- [ ] Add share buttons

**RFC-007: Embeddable Badges** (~3 hours)
- [ ] Create shield SVG endpoint
- [ ] Create medium card endpoint
- [ ] Create full widget endpoint
- [ ] Add markdown badge format
- [ ] Build embed code generator

**RFC-008: Referral System** (~4 hours)
- [ ] Implement referral cookie middleware
- [ ] Implement two-sided reward distribution
- [ ] Implement milestone tracking
- [ ] Build "Invite 3" nudge in extension
- [ ] Build leaderboard

**RFC-009: Sharing Rewards & Monthly Report** (~4 hours)
- [ ] Implement share recording + verification
- [ ] Implement freeze token reward for shares
- [ ] Create monthly report cron job
- [ ] Build report card image generation
- [ ] Build report page + share buttons

**RFC-010: Camera Mode Toggle** (~2 hours)
- [ ] Add settings to extension store
- [ ] Build toggle UI
- [ ] Implement persistent stream mode
- [ ] Sync setting to server

**RFC-012: Rich Activity Capture & X/Twitter Support** (~6 hours)
- [ ] Build shared scraping abstraction (ScrapedPostContext type)
- [ ] Build LinkedIn DOM scraper (post author, text, avatar, headline)
- [ ] Build X/Twitter DOM scraper (tweet author, text, avatar, handle)
- [ ] Create X/Twitter content script (reply detection, webcam trigger)
- [ ] Integrate activity.record call in both LinkedIn and X content scripts
- [ ] Link HumanVerification to VerifiedActivity via activityId
- [ ] Build activity feed section on public profile page
- [ ] Test graceful fallback when DOM scraping fails

**RFC-013: Extension Badge Overlay** (~6 hours)
- [ ] Implement PlatformLink auto-detection from extension context
- [ ] Build badge overlay content script for LinkedIn profile pages
- [ ] Build badge overlay content script for X/Twitter profile pages
- [ ] Implement feed badge injection (MutationObserver + batch lookup)
- [ ] Implement client-side badge cache (5-min TTL)
- [ ] Implement rate limiting for badge lookups
- [ ] Design badge UI (tier-colored shield + score)
- [ ] Test on both LinkedIn and X/Twitter

**RFC-011: Integration Testing & Polish** (~5 hours)
- [ ] End-to-end flow testing (including activity capture + badge overlay)
- [ ] Performance optimization
- [ ] Responsive design audit
- [ ] Cross-browser testing
- [ ] Security audit
- [ ] Launch checklist

**Total Estimated Time**: ~57 hours (8-9 working days)

---

## Cursor + RIPER-5 Guidance

### Cursor Plan Mode

**Import Checklist**: Copy RFC implementation checklists directly into Cursor Plan mode for step-by-step execution.

**Workflow**:
1. Start with RFC-001 (Database Schema)
2. Execute each checklist item sequentially within each RFC
3. After each RFC, update status strip in this plan file (⏳ → 🚧 → ✅)
4. Reattach this plan to future sessions for context
5. If scope changes mid-flight, pause and run Change Management section

### RIPER-5 Mode

**Mode Sequence**:
1. **RESEARCH**: ✅ Complete (viral research synthesis, codebase analysis)
2. **INNOVATE**: ✅ Complete (viral loops, feature mechanics designed with user)
3. **PLAN**: ✅ **THIS DOCUMENT** is the output of PLAN mode
4. **EXECUTE**: Request user approval, then enter EXECUTE mode
5. **REVIEW**: After implementation, validate against this plan

**EXECUTE Mode Instructions**:
- Implement EXACTLY as planned in RFCs
- Do not add features not in this plan (no scope creep)
- If deviation needed: STOP, return to PLAN mode, update this file
- Mid-implementation check-in after RFC-005 (Public Profile Page)
- This plan is the single source of truth

---

**Next Step**: Review this plan, approve for execution, then begin with `ENTER EXECUTE MODE` → starts at RFC-001: Database Schema & Migrations.
