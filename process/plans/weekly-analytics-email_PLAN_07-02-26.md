# Weekly LinkedIn Analytics Email: COMPLEX PRD

**Date**: February 7, 2026
**Complexity**: COMPLEX (Multi-phase)
**Implementation Approach**: Backend-scheduled with DBOS cron + Loops email integration
**Execution Model**: Phase-by-Phase with Pre-Research and Post-Testing

## Overview

Build an automated weekly email system that sends LinkedIn analytics summaries to all organization members every Tuesday at 10 AM UTC. The email displays 6 key metrics (followers, invites, comments, content reach, profile views, engage reach) in card format, plus a weekly trend chart. The system syncs analytics data from the WXT extension to the backend database, uses DBOS scheduled workflows for reliable weekly delivery, and integrates with Loops email service for sending and managing subscriptions.

**Status**: ⏳ PLANNED (Updated with architectural improvements)

**IMPORTANT**: This plan follows strict **Pre-Phase Research** and **Post-Phase Testing** paradigm at every RFC. Each phase begins with research (existing patterns, similar implementations, potential blockers) and ends with comprehensive testing (acceptance criteria verification, edge cases, error scenarios).

---

## Key Architectural Decisions (Revised)

### ✅ Single Daily Table (No Weekly Aggregates)
**Original plan**: Two tables (LinkedInAnalyticsWeekly + LinkedInAnalyticsDaily)
**Revised approach**: One table (LinkedInAnalyticsDaily only)
**Rationale**: Weekly aggregates computed on-demand via SQL GROUP BY. At current scale (8 weeks * 7 days = 56 records), aggregation is trivial (<100ms). Avoids data redundancy and sync complexity.

### ✅ LinkedInAccount-Centric Data Model
**Original plan**: Analytics tied to Organization (`organizationId` foreign key)
**Revised approach**: Analytics tied to LinkedInAccount (`linkedInAccountId` foreign key)
**Rationale**:
- Analytics persist even if organization disconnects the LinkedIn account
- New organization connecting to same account sees historical data
- More logical: analytics track the account's activity, not the organization's
- Query pattern: `Org → LinkedInAccount → Analytics`

### ✅ Simplified Data Sync
**Original plan**: Extension sends both weekly aggregates and daily breakdown
**Revised approach**: Extension sends only daily records array
**Rationale**: Simpler payload, simpler backend logic, single source of truth. Backend computes weekly aggregates when needed for emails.

---

---

## Quick Links

- [Context and Goals](#1-context-and-goals)
- [Execution Brief](#15-execution-brief)
- [Architecture Decisions](#3-architecture-decisions-final)
- [Database Schema](#11-database-schema-prisma-style)
- [API Surface](#12-api-surface-trpc)
- [Phased Delivery Plan](#14-phased-delivery-plan)
- [RFCs](#16-rfcs)
- [Implementation Checklist](#implementation-checklist)

---

## 1. Context and Goals

EngageKit users track their LinkedIn engagement through the WXT browser extension. Currently, analytics data lives only in the extension's local storage. This weekly email feature transforms passive data into proactive user engagement by:

1. **Driving habit formation**: Regular email reminders encourage consistent LinkedIn activity
2. **Demonstrating value**: Weekly summaries show tangible ROI from using EngageKit
3. **Increasing retention**: Users who see growth metrics are more likely to stay engaged
4. **Enabling team visibility**: All organization members receive the same email for shared LinkedIn accounts

**In-scope**:
- Database schema for storing LinkedIn analytics (daily granularity only, weekly computed on-demand)
- Analytics tied to LinkedInAccount (persists even if org disconnects)
- Extension data sync endpoint (POST analytics data after fetch)
- DBOS scheduled workflow (runs every Tuesday at 10 AM UTC)
- Loops email integration (send email, manage subscriptions)
- UserEmailPreferences table (feature-specific opt-out)
- Email template (6 metric cards + weekly chart, ChromeStats style)
- Test email button in analytics tab (preview functionality)
- Backfill support (sync historical data from extension local storage)
- Organization-level distribution (all org members get same LinkedIn account analytics)
- Webhook endpoint (sync Loops unsubscribe events to database)

**Out-of-scope (V1)**:
- Real-time email triggers (only weekly scheduled)
- Per-user analytics (only per-organization LinkedIn account)
- Email customization (users can't choose metrics or frequency)
- Mobile app integration (extension-only for data sync)
- Advanced charts (only simple line chart for weekly trends)
- A/B testing email content
- In-app email preview (test button only)

---

## 1.5 Execution Brief

### Phase 1-3: Database Foundation (Schema, Migration, Indexes)
**What happens:** Create `LinkedInAnalyticsDaily` table (single table, tied to LinkedInAccount not Organization), add `UserEmailPreferences` table, generate Prisma migrations, apply to database, add composite indexes for query performance. Weekly aggregates computed on-demand via SQL GROUP BY.

**Test:** Tables visible in database, migrations applied successfully, indexes exist, test aggregation query (GROUP BY week) performs well (<100ms), no errors in Prisma schema validation.

### Phase 4-6: Extension Data Sync (tRPC Endpoint, Backfill Logic, Integration)
**What happens:** Create tRPC mutation for syncing analytics data from extension, implement upsert logic for daily/weekly records, add backfill support for historical data, integrate sync call into extension's data fetch flow.

**Test:** Extension calls sync endpoint after fetch, data appears in database, backfill works for historical data, no duplicate records created.

### Phase 7-8: DBOS Workflow (Cron Job, Query Logic)
**What happens:** Create DBOS scheduled workflow that runs every Tuesday at 10 AM UTC, query organizations with new analytics data (lastSyncedAt > lastEmailSentAt), fetch all org members with email preferences enabled.

**Test:** Workflow triggers on schedule, queries return correct organizations, logs show execution, no errors in DBOS runtime.

### Phase 9-11: Loops Integration (Email Template, Send Logic, Webhook)
**What happens:** Create Loops email template with 6 metric cards and chart, implement email sending logic via Loops API, set up "Weekly Analytics" mailing list, create webhook endpoint to handle unsubscribe events.

**Test:** Email sends successfully, template renders correctly, mailing list created, webhook receives and processes unsubscribe events.

### Phase 12-13: Test Email Feature (UI Button, Preview Logic)
**What happens:** Add "Send Test Email" button to analytics tab in extension sidebar, implement test email logic (sends to current user only with current week's data), add loading/success/error states.

**Test:** Button visible in analytics tab, clicking sends test email to user, loading state appears, success toast shown, test email received in inbox.

### Phase 14-15: Email Preference Management (UI Toggle, API Integration)
**What happens:** Add email preference toggle in app settings, create tRPC mutations for updating preferences, sync with Loops mailing list API (add/remove user), implement preference checks in cron job.

**Test:** Toggle works in UI, preference saved to database, Loops API synced, cron job respects preferences.

### Expected Outcome
- Every Tuesday at 10 AM UTC, organizations with new LinkedIn analytics data receive emails
- All members of each organization get the same email with their shared LinkedIn account metrics
- Email shows 6 metric cards (followers, invites, comments, content reach, profile views, engage reach)
- Email includes weekly trend chart (last 8 weeks)
- Users can unsubscribe via Loops link (synced to database)
- Users can toggle preference in app settings
- Extension syncs data to backend after every fetch
- Test email button allows preview before weekly send

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
- Mid-phase check-in if phase is long (>2 hours)

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
User: "Begin RFC-001: Database Schema Design"

Assistant (Pre-Phase Research):
- Reading existing Prisma schema patterns...
- Analyzing Organization model relationships...
- Findings: Organization has linkedInUrl, users belong to organizations
- Recommended: Add two tables (weekly + daily) for time-series data
- Do you approve proceeding with this approach?

User: "Yes, proceed"

Assistant (Detailed Planning):
- Will create LinkedInAnalyticsWeekly and LinkedInAnalyticsDaily models
- Files to modify: packages/db/prisma/models/analytics.prisma (new file)
- Migration command: pnpm db:migrate dev
- Expected migration time: <1 minute
- Ready to implement?

User: "Go ahead"

Assistant (Implementation):
[Creates schema file, generates migration, applies to database]

Assistant (Testing):
Running post-phase tests:
✓ Migration applied successfully
✓ Tables visible in database
✓ Relationships correct (Organization foreign key)
✓ Indexes created
✓ No errors in Prisma schema validation

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
- Daily or hourly email digests (only weekly)
- Real-time notifications (email is batch-only)
- Per-user customization (frequency, metrics, design)
- Email analytics tracking (open rates, click rates)
- Social sharing buttons in email
- PDF attachment of full report
- Historical email archive in app
- Email reply handling
- Multi-language support (English only)

**Constraints**:
- Must use existing Prisma schema (Organization, User models)
- Must use DBOS for cron jobs (existing pattern in codebase)
- Must use Loops email service (already integrated)
- Extension fetches data every 2 hours minimum (data sync frequency)
- Email must be CAN-SPAM compliant (Loops handles this)
- Database storage: Estimate ~1KB per org per week (52KB/year) - acceptable
- Send time: Tuesday 10 AM UTC (not configurable in V1)
- Chart: Last 8 weeks only (balance detail vs email size)

---

## 3. Architecture Decisions (Final)

### AD-001: Backend-Scheduled Approach (DBOS Cron vs Extension-Triggered)

**Decision**: Use DBOS scheduled workflow (backend cron job) instead of extension-triggered emails.

**Rationale**:
- **Reliability**: Extension must be active for triggering; cron job always runs
- **Consistency**: All emails sent at same time (Tuesday 10 AM UTC) for predictability
- **Scalability**: Backend handles queuing and rate limiting; extension would struggle at scale
- **Testability**: Easier to test cron job logic than extension background scripts
- **Monitoring**: Centralized logging and error tracking via DBOS

**Alternatives Considered**:
- **Extension-triggered**: User must have extension active on Saturday; high failure rate expected
- **Hybrid**: Extension checks if email needed, backend sends; adds unnecessary complexity

**Implications**:
- Extension must sync data to backend after every fetch
- Need tRPC mutation for data sync
- Database becomes source of truth for analytics (not extension local storage)
- Requires database storage for time-series data

### AD-002: Single Daily Table (No Weekly Aggregates)

**Decision**: Store analytics data in ONE table: `LinkedInAnalyticsDaily` (granular only). Compute weekly aggregates on-demand via SQL GROUP BY.

**Rationale**:
- **Simplicity**: No data redundancy, single source of truth
- **Scale is small**: Aggregating 56 daily records (8 weeks * 7 days) is trivial for PostgreSQL (<100ms)
- **Simpler sync logic**: Extension sends array of daily records, backend does one batch upsert
- **No inconsistency risk**: Can't have mismatched weekly vs daily data
- **Future-proof**: If we add daily emails later, granular data already exists
- **Premature optimization avoided**: Don't need pre-computed aggregates at current scale

**Alternatives Considered**:
- **Two tables (weekly + daily)**: Rejected due to redundancy and added complexity (original plan, revised after review)
- **Single weekly table**: Can't generate daily charts or support future daily emails
- **JSON column**: Loses Prisma type safety and query performance

**Implications**:
- Extension sends only daily breakdown in sync call (simpler payload)
- Email generation computes weekly aggregates via SQL: `SELECT SUM(...) GROUP BY DATE_TRUNC('week', date)`
- Chart generation queries same table with date range filter
- If performance becomes issue at scale (unlikely), can add materialized view or weekly cache table later

### AD-003: LinkedInAccount-Centric Data Model

**Decision**: Analytics data tied to `LinkedInAccount` entity (not `Organization`).

**Rationale**:
- **Data persistence**: Analytics survive even if organization disconnects/deletes LinkedIn account
- **Account portability**: If new org connects to same LinkedIn account, they see historical data
- **Logical correctness**: Analytics track the LinkedIn account's activity, not the organization's
- **No orphaned data**: When org changes, analytics don't get lost or require complex migration
- **Clearer semantics**: `LinkedInAccount.analytics` makes more sense than `Organization.analytics`

**Query Pattern**:
```typescript
// To get analytics for an organization:
Organization → LinkedInAccount → LinkedInAnalyticsDaily

// Example:
const org = await db.organization.findUnique({
  where: { id: orgId },
  include: {
    linkedInAccounts: {
      include: { analyticsDaily: true }
    }
  }
});
```

**Alternatives Considered**:
- **Organization-centric**: Rejected because analytics become orphaned when org disconnects account (original plan, revised after review)
- **Dual relationship (both Org and Account)**: Overcomplicated, violates single source of truth

**Implications**:
- Extension sync includes `linkedInAccountId` (extension knows which account it's tracking)
- Email workflow queries: Org → LinkedInAccount → Analytics (one extra join)
- Database schema uses `linkedInAccountId` foreign key
- If org has multiple LinkedIn accounts (future), each has separate analytics

### AD-004: Organization-Level Email Distribution

**Decision**: Send same email to all users in an organization (not per-user analytics).

**Rationale**:
- **Data model alignment**: LinkedIn accounts belong to organizations, not individual users
- **Team collaboration**: All members see same metrics, fostering shared accountability
- **Simpler logic**: Query once per org, send to all members (vs complex per-user aggregation)
- **Reduced noise**: Users in same org don't get duplicate emails with same data

**Implications**:
- Email query pattern: `Organization → Users` (one-to-many)
- Email preferences stored per user (some org members may unsubscribe)
- Cron job must handle partial delivery (some users subscribed, others not)
- Email content identical for all org members (personalization limited to user's name in greeting)

### AD-005: Loops Mailing Lists for Feature-Specific Unsubscribe

**Decision**: Use Loops mailing lists to enable feature-specific unsubscribe (separate from global account emails).

**Rationale**:
- **User experience**: Users can opt out of weekly reports without losing account-critical emails (password resets, billing)
- **Compliance**: CAN-SPAM Act requires clear unsubscribe mechanism; Loops handles compliance
- **Future extensibility**: Can add more mailing lists for different email types (daily digest, monthly report)
- **Webhook sync**: Loops notifies backend when user unsubscribes; we update `UserEmailPreferences` table

**Alternatives Considered**:
- **Global unsubscribe only**: Too aggressive; users lose all communications
- **Manual unsubscribe form in app**: Requires building UI + backend logic; Loops already handles this

**Implications**:
- Must create "Weekly Analytics" mailing list in Loops dashboard
- Must add users to mailing list on signup (via `loops.createContact()`)
- Must create webhook endpoint to receive unsubscribe events from Loops
- Cron job queries `UserEmailPreferences.weeklyAnalytics = true` before sending

### AD-006: Extension Data Sync Timing (Immediate After Fetch)

**Decision**: Extension syncs data to backend immediately after every fetch (not debounced/batched).

**Rationale**:
- **Data freshness**: Backend has latest data for potential same-day test emails
- **Simplicity**: No complex debounce/batch logic; fire-and-forget API call
- **Low frequency**: Fetches happen every 2+ hours; not a performance concern
- **Error recovery**: If sync fails, next fetch will retry (eventual consistency)

**Implications**:
- tRPC endpoint must be idempotent (upsert, not insert)
- Extension must handle sync failures gracefully (log error, don't block UI)
- Database records updated multiple times per day per org (acceptable with upsert)

### AD-007: Email Template Design (HTML with Inline CSS)

**Decision**: Use Loops visual email editor with HTML template (inline CSS, no external stylesheets).

**Rationale**:
- **Email client compatibility**: Inline styles work across Gmail, Outlook, Apple Mail
- **Loops integration**: Visual editor generates HTML automatically; we provide variable placeholders
- **ChromeStats inspiration**: Card-based layout with clean metrics is proven pattern
- **Mobile responsive**: Loops templates are mobile-optimized by default

**Alternatives Considered**:
- **React Email**: Requires building custom renderer; overkill for simple template
- **Plain text**: Boring; doesn't convey value visually
- **Embedded chart images**: Complex to generate server-side; use Loops variable interpolation instead

**Implications**:
- Email content passed as variables to Loops API (not HTML string)
- Chart must be data-driven (Loops doesn't support custom JS; use simple HTML table or Loops chart feature)
- Design must be tested across email clients (Gmail, Outlook, Apple Mail)

---

## 4. Architecture Clarification: Extension → Backend Data Flow

### Why Sync to Backend?

**Current State**:
- Extension stores analytics in `chrome.storage.local` (per-browser, per-user)
- No server-side persistence
- No visibility for other org members
- No way to send emails without extension active

**Benefits of Backend Sync**:
- ✅ Centralized data: All org members see same metrics
- ✅ Reliable emails: Backend cron job always runs (no dependency on extension)
- ✅ Historical tracking: Database persists data even if extension uninstalled
- ✅ Future features: Enables web dashboard, mobile app, API access

### Data Sync Flow

```
User visits LinkedIn → Extension fetches metrics
         ↓
Extension stores in chrome.storage.local (local copy)
         ↓
Extension calls tRPC.analytics.syncAnalyticsData({
  linkedInAccountId, // Extension knows which LinkedIn account it's tracking
  dailyData: [
    { date: "2026-02-01", followers: 50, invites: 5, ... },
    { date: "2026-02-02", followers: 52, invites: 6, ... },
    // ... historical data on first sync (backfill)
  ]
})
         ↓
Backend upserts LinkedInAnalyticsDaily records (batch, idempotent)
         ↓
Extension continues (doesn't wait for response)
```

### Backfill Strategy

**First Sync** (user installs extension or we deploy this feature):
- Extension reads full history from `chrome.storage.local` (may have months of data)
- Extension transforms to daily records array
- Extension sends ALL historical daily data in one sync call (large payload, but one-time)
- Backend batch upserts all daily records (may take 5-10 seconds for heavy users)
- Subsequent syncs only send new daily records since last sync (fast, incremental)

**Backfill Payload Example**:
```typescript
{
  linkedInAccountId: "linkedin_account_123",
  dailyData: [
    { date: "2026-01-20", followers: 45, invites: 3, comments: 2, ... },
    { date: "2026-01-21", followers: 45, invites: 4, comments: 1, ... },
    { date: "2026-01-22", followers: 46, invites: 3, comments: 3, ... },
    // ... 60+ days of historical data
  ]
}
```

**Subsequent Sync** (incremental):
```typescript
{
  linkedInAccountId: "linkedin_account_123",
  dailyData: [
    { date: "2026-02-07", followers: 52, invites: 6, comments: 4, ... }
    // Only new data since last sync
  ]
}
```

---

## 5. High-level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXTENSION (Browser)                         │
│  - User visits LinkedIn                                         │
│  - Extension fetches metrics (every 2+ hours)                   │
│  - Stores in chrome.storage.local                               │
│  - Calls tRPC.analytics.syncWeeklyData()                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Next.js + DBOS)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ tRPC Mutation: analytics.syncWeeklyData                   │ │
│  │  - Validates organizationId                               │ │
│  │  - Upserts LinkedInAnalyticsWeekly record                 │ │
│  │  - Upserts LinkedInAnalyticsDaily records (batch)         │ │
│  │  - Updates lastSyncedAt timestamp                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ DBOS Scheduled Workflow: weeklyAnalyticsEmailWorkflow     │ │
│  │  - Runs every Tuesday 10 AM UTC                           │ │
│  │  - Queries orgs with new data (lastSyncedAt > last email)│ │
│  │  - For each org:                                          │ │
│  │    - Fetch weekly metrics (LinkedInAnalyticsWeekly)       │ │
│  │    - Fetch 8-week chart data (LinkedInAnalyticsDaily)     │ │
│  │    - Get all org users with emailPreferences = true       │ │
│  │    - Call Loops API to send email to each user           │ │
│  │  - Update lastAnalyticsEmailAt timestamp                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOOPS EMAIL SERVICE                        │
│  - Receives email request via API                               │
│  - Renders template with variables                              │
│  - Sends to recipient's email address                           │
│  - Handles unsubscribe clicks                                   │
│  - Sends webhook to backend on unsubscribe                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND WEBHOOK ENDPOINT                      │
│  - POST /api/webhooks/loops/unsubscribe                         │
│  - Receives: { email, mailingListId, event: "unsubscribed" }   │
│  - Updates UserEmailPreferences.weeklyAnalytics = false         │
│  - Logs event for audit trail                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Security Posture

**Authentication**:
- tRPC sync endpoint uses `orgProcedure` (validates organization ownership)
- Only users in organization can sync data for that org's LinkedIn account
- DBOS workflow runs server-side (no user auth needed)
- Webhook endpoint validates Loops signature (HMAC verification)

**Data Privacy**:
- Analytics data only visible to organization members
- Email addresses from `User` table (already verified via Clerk)
- No PII in analytics data (counts and metrics only)
- LinkedIn account data already public (profile URLs, names)

**Rate Limiting**:
- tRPC sync endpoint: Inherit Next.js rate limiting (Vercel default: 100 req/10s per IP)
- DBOS workflow: Runs once per week (no rate limit concern)
- Loops API: 100 emails/second rate limit (we'll batch send with delays)
- Webhook endpoint: Validate signature to prevent abuse

**SQL Injection**:
- All queries use Prisma ORM (parameterized queries, no raw SQL)
- User input limited to `organizationId` (validated via Prisma lookup)

**Email Spam Prevention**:
- Users must explicitly enable weekly emails (opt-in via signup or settings)
- Loops handles CAN-SPAM compliance (unsubscribe link, physical address)
- Frequency capped at once per week (no spam risk)
- Cron job checks `lastAnalyticsEmailAt` to prevent duplicates

**Webhook Security**:
- Verify Loops signature before processing (HMAC with secret key)
- Reject requests with invalid signatures
- Log all webhook events for audit trail

---

## 7. Component Details

### Database Models

**Location**: `packages/db/prisma/models/analytics.prisma` (new file)

**LinkedInAnalyticsDaily**

**Responsibilities**:
- Store daily granular metrics for chart generation and weekly aggregates
- Enable historical trend analysis
- Support backfill from extension local storage
- Tied to LinkedInAccount (persists even if org disconnects)
- Weekly aggregates computed on-demand via SQL GROUP BY

**Schema**:
```prisma
model LinkedInAnalyticsDaily {
  id                String          @id @default(cuid())
  linkedInAccountId String
  linkedInAccount   LinkedInAccount @relation(fields: [linkedInAccountId], references: [id], onDelete: Cascade)

  date              DateTime        @db.Date // Single day

  // Daily metrics
  followers         Int             @default(0)
  invites           Int             @default(0)
  comments          Int             @default(0)
  contentReach      Int             @default(0)
  profileViews      Int             @default(0)
  engageReach       Int             @default(0)

  // Metadata
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([linkedInAccountId, date])
  @@index([linkedInAccountId, date])
}
```

**Weekly Aggregation Query** (computed on-demand):
```typescript
// Get current week metrics
const currentWeek = await db.linkedInAnalyticsDaily.aggregate({
  where: {
    linkedInAccountId,
    date: {
      gte: weekStartDate, // Saturday
      lte: weekEndDate    // Friday
    }
  },
  _sum: {
    followers: true,
    invites: true,
    comments: true,
    contentReach: true,
    profileViews: true,
    engageReach: true
  }
});

// Result: { _sum: { followers: 150, invites: 20, ... } }
```

**UserEmailPreferences**

**Responsibilities**:
- Store per-user email subscription preferences
- Enable feature-specific opt-out (not global)
- Track when user last received analytics email

**Schema**:
```prisma
model UserEmailPreferences {
  userId               String   @id
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  weeklyAnalytics      Boolean  @default(true) // Opt-in by default
  lastAnalyticsEmailAt DateTime?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

**Existing Model Changes**:

Add relations to existing models:

```prisma
// packages/db/prisma/models/linkedin-account.prisma
model LinkedInAccount {
  // ... existing fields
  analyticsDaily LinkedInAnalyticsDaily[]
}

// packages/db/prisma/models/user.prisma
model User {
  // ... existing fields
  emailPreferences UserEmailPreferences?
}
```

**Why LinkedInAccount not Organization:**
- Analytics persist even if org disconnects the LinkedIn account
- New org connecting to same account sees historical data
- More logical: analytics track the account's activity, not the organization's
- Query pattern: `Org → LinkedInAccount → Analytics`

### tRPC Procedures

**Location**: `packages/api/src/router/analytics.ts` (new file)

**syncAnalyticsData Mutation** (renamed from syncWeeklyData)

**Responsibilities**:
- Accept daily analytics data from extension
- Upsert daily records (batch, idempotent)
- Handle backfill (historical data)
- No weekly table (aggregated on-demand)

**Input Schema**:
```typescript
z.object({
  linkedInAccountId: z.string(), // Which LinkedIn account these analytics belong to
  dailyData: z.array(
    z.object({
      date: z.string(), // ISO date (YYYY-MM-DD)
      followers: z.number(),
      invites: z.number(),
      comments: z.number(),
      contentReach: z.number(),
      profileViews: z.number(),
      engageReach: z.number()
    })
  )
})
```

**Output**:
```typescript
{
  success: boolean;
  dailyRecordsUpserted: number;
  linkedInAccountId: string;
}
```

**sendTestEmail Mutation**

**Responsibilities**:
- Generate test email for current week
- Send to current user only
- Use same email template as cron job
- Validate user has access to organization (which owns the LinkedIn account)

**Input Schema**:
```typescript
z.object({
  linkedInAccountId: z.string() // Which LinkedIn account to generate test email for
})
```

**Output**:
```typescript
{
  success: boolean;
  emailSentTo: string; // User's email address
  linkedInAccountId: string;
}
```

**updateEmailPreference Mutation**

**Responsibilities**:
- Update user's email preferences
- Sync with Loops mailing list API
- Add or remove user from "Weekly Analytics" mailing list

**Input Schema**:
```typescript
z.object({
  weeklyAnalytics: z.boolean()
})
```

**Output**:
```typescript
{
  success: boolean;
  preference: boolean; // Updated value
}
```

### DBOS Scheduled Workflow

**Location**: `packages/api/src/workflows/email.workflows.ts` (new file)

**weeklyAnalyticsEmailWorkflow**

**Responsibilities**:
- Run every Tuesday at 10 AM UTC
- Query organizations with new data
- For each org, fetch metrics and users
- Send emails via Loops API
- Update lastAnalyticsEmailAt timestamps
- Handle errors gracefully (retry, log)

**Decorator**:
```typescript
@Scheduled({ cron: "0 10 * * 2" }) // Tuesday 10 AM UTC
```

**Workflow Logic**:
```typescript
static async weeklyAnalyticsEmailWorkflow(ctxt: ScheduledWorkflowContext) {
  // 1. Query organizations with LinkedIn accounts that have new analytics data
  const orgsToEmail = await ctxt.invoke(getOrganizationsWithNewData);

  // 2. For each org, compute aggregates and send emails to all members
  for (const org of orgsToEmail) {
    await ctxt.invoke(sendAnalyticsEmailToOrg, org.id, org.linkedInAccountId);
  }

  // 3. Log completion
  ctxt.logger.info(`Sent analytics emails to ${orgsToEmail.length} organizations`);
}
```

**Helper Steps**:
- `getOrganizationsWithNewData()`: Query pattern: Org → LinkedInAccount → LinkedInAnalyticsDaily (check for data within last 7 days)
- `sendAnalyticsEmailToOrg(orgId, linkedInAccountId)`: Compute weekly aggregates, fetch users, send emails
- `computeWeeklyMetrics(linkedInAccountId)`: Use SQL aggregate query (GROUP BY week)
- `sendEmailToUser(userId, metrics, chartData)`: Call Loops API

**Query Pattern**:
```typescript
// Find orgs with new analytics data
const orgs = await db.organization.findMany({
  where: {
    linkedInAccounts: {
      some: {
        analyticsDaily: {
          some: {
            date: { gte: sevenDaysAgo }
          }
        }
      }
    }
  },
  include: {
    linkedInAccounts: {
      where: {
        analyticsDaily: {
          some: {
            date: { gte: sevenDaysAgo }
          }
        }
      },
      include: {
        analyticsDaily: {
          where: { date: { gte: eightWeeksAgo } },
          orderBy: { date: 'asc' }
        }
      }
    },
    users: {
      where: {
        emailPreferences: { weeklyAnalytics: true }
      }
    }
  }
});
```

### Loops Email Template

**Location**: Loops dashboard (visual editor)

**Template Name**: `weekly-analytics-summary`

**Variables** (passed to Loops API):
```typescript
{
  userName: string;          // "Hi John,"
  orgName: string;           // "Acme Corp"
  weekStart: string;         // "February 3"
  weekEnd: string;           // "February 9"

  // 6 metric cards
  followers: number;
  followersChange: string;   // "+5" or "-2" or "0"
  invites: number;
  invitesChange: string;
  comments: number;
  commentsChange: string;
  contentReach: number;
  contentReachChange: string;
  profileViews: number;
  profileViewsChange: string;
  engageReach: number;
  engageReachChange: string;

  // Chart data (last 8 weeks)
  chartWeeks: string[];      // ["Jan 20", "Jan 27", "Feb 3", ...]
  chartFollowers: number[];
  chartInvites: number[];
  chartComments: number[];
  chartContentReach: number[];
  chartProfileViews: number[];
  chartEngageReach: number[];
}
```

**Layout** (ChromeStats-inspired):
```
┌──────────────────────────────────────────────────────────┐
│  Hi {{userName}},                                        │
│                                                          │
│  Here's your LinkedIn performance for {{orgName}}       │
│  Week of {{weekStart}} - {{weekEnd}}                    │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐│
│  │ Followers      │  │ Invites        │  │ Comments   ││
│  │ {{followers}}  │  │ {{invites}}    │  │ {{comments}││
│  │ {{change}} ↑   │  │ {{change}} ↑   │  │ {{change}} ││
│  └────────────────┘  └────────────────┘  └────────────┘│
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐│
│  │ Content Reach  │  │ Profile Views  │  │ Engage     ││
│  │ {{reach}}      │  │ {{views}}      │  │ {{engage}} ││
│  │ {{change}} ↑   │  │ {{change}} ↑   │  │ {{change}} ││
│  └────────────────┘  └────────────────┘  └────────────┘│
├──────────────────────────────────────────────────────────┤
│  Weekly Trend (Last 8 Weeks)                             │
│  [Simple HTML table or Loops chart component]            │
│  Weeks on X-axis, metrics on Y-axis                      │
├──────────────────────────────────────────────────────────┤
│  Keep up the great work! 🚀                              │
│                                                          │
│  [Unsubscribe] (Loops automatically adds)                │
└──────────────────────────────────────────────────────────┘
```

### Webhook Endpoint

**Location**: `apps/nextjs/src/app/api/webhooks/loops/unsubscribe/route.ts`

**Responsibilities**:
- Receive POST requests from Loops on unsubscribe events
- Verify HMAC signature for security
- Update UserEmailPreferences.weeklyAnalytics = false
- Log event for audit trail

**Request Body** (from Loops):
```json
{
  "event": "unsubscribe",
  "email": "user@example.com",
  "mailingListId": "cm_weekly_analytics_123",
  "timestamp": "2026-02-07T10:00:00Z",
  "signature": "sha256_hmac_signature"
}
```

**Response**:
```json
{
  "success": true
}
```

---

## 8. Backend Endpoints and Workers

All backend logic is tRPC procedures and DBOS workflows (no dedicated REST API).

---

## 9. Infrastructure Deployment

**No infrastructure changes required** - deploys with existing Next.js app on Vercel.

**Environment Variables** (add to `.env`):
```
LOOPS_API_KEY=<existing>
LOOPS_WEEKLY_ANALYTICS_MAILING_LIST_ID=cm_xyz123
LOOPS_WEBHOOK_SECRET=<generate_random_string>
```

**Loops Dashboard Setup**:
1. Create "Weekly Analytics" mailing list
2. Copy mailing list ID to env var
3. Create webhook subscription (POST to `/api/webhooks/loops/unsubscribe`)
4. Generate webhook secret, add to env var
5. Create email template `weekly-analytics-summary`

---

## 10. Database Schema (Prisma-style)

See [Component Details](#7-component-details) section above for full schema.

**Migration Commands**:
```bash
# Generate migration
pnpm db:migrate dev --name add-weekly-analytics-tables

# Apply to staging
pnpm db:migrate deploy

# Apply to production (Vercel automatic via prisma.yml)
```

**Suggested Indexes** (already included in schema above):
```prisma
@@unique([organizationId, weekStartDate]) // Prevent duplicate weeks
@@index([organizationId, lastSyncedAt])   // For "new data" query
@@unique([organizationId, date])          // Prevent duplicate days
```

---

## 11. API Surface (tRPC)

See [Component Details](#7-component-details) section above for full tRPC procedures.

**New Router**: `packages/api/src/router/analytics.ts`

**Procedures**:
1. `syncWeeklyData` (mutation) - Extension syncs analytics data
2. `sendTestEmail` (mutation) - Send test email to current user
3. `updateEmailPreference` (mutation) - Update user's email preferences

---

## 12. Real-time Event Model

**Not applicable** - this is batch-scheduled email, not real-time.

---

## 13. Phased Delivery Plan

### Current Status

⏳ **Phase 1**: Database Schema & Migrations (PLANNED)
⏳ **Phase 2**: tRPC Sync Endpoint (PLANNED)
⏳ **Phase 3**: Extension Integration (Data Sync) (PLANNED)
⏳ **Phase 4**: DBOS Scheduled Workflow (PLANNED)
⏳ **Phase 5**: Loops Email Template (PLANNED)
⏳ **Phase 6**: Email Sending Logic (PLANNED)
⏳ **Phase 7**: Webhook Endpoint (Unsubscribe Handling) (PLANNED)
⏳ **Phase 8**: Test Email Button (Extension UI) (PLANNED)
⏳ **Phase 9**: Email Preference Toggle (App Settings) (PLANNED)
⏳ **Phase 10**: Testing & QA (PLANNED)

**Immediate Next Steps**: Phase 1 - Database Schema & Migrations

---

## 14. Features List (MoSCoW)

### Must-Have (M)

- [M-001] LinkedInAnalyticsWeekly table with 6 metrics
- [M-002] LinkedInAnalyticsDaily table for granular data
- [M-003] UserEmailPreferences table with weeklyAnalytics field
- [M-004] tRPC syncWeeklyData mutation (extension → backend)
- [M-005] Backfill support for historical data
- [M-006] DBOS scheduled workflow (Tuesday 10 AM UTC)
- [M-007] Query logic for orgs with new data
- [M-008] Loops email template with 6 metric cards
- [M-009] Weekly trend chart (last 8 weeks)
- [M-010] Email sending logic via Loops API
- [M-011] Loops mailing list creation ("Weekly Analytics")
- [M-012] Webhook endpoint for unsubscribe events
- [M-013] Test email button in analytics tab
- [M-014] Email preference toggle in app settings
- [M-015] Organization-level email distribution (all members)

### Should-Have (S)

- [S-001] Error handling and retry logic in DBOS workflow
- [S-002] Logging and monitoring for email sends
- [S-003] Email preview in test email (shows actual template)
- [S-004] Success/error toasts for test email
- [S-005] Database indexes for query performance
- [S-006] Rate limiting on sync endpoint (prevent abuse)

### Could-Have (C)

- [C-001] Email analytics tracking (open rates, click rates)
- [C-002] Custom email frequency (daily, weekly, monthly)
- [C-003] Metric selection (users choose which metrics to include)
- [C-004] Historical email archive in app
- [C-005] Email reply handling (e.g., "reply to pause emails")
- [C-006] Mobile app integration (push notifications)

### Won't-Have (W)

- [W-001] Real-time email triggers (immediate on data change)
- [W-002] Per-user analytics (only per-organization)
- [W-003] Social sharing buttons in email
- [W-004] PDF attachment of full report
- [W-005] Multi-language support
- [W-006] A/B testing email content

---

## 15. RFCs

### RFC-001: Database Schema & Migrations

**Summary**: Create `LinkedInAnalyticsDaily` table (single table, tied to LinkedInAccount) and `UserEmailPreferences` table with proper relationships and indexes. Weekly aggregates computed on-demand via SQL GROUP BY.

**Dependencies**: None

**Stages**:

**Stage 0: Pre-Phase Research** ⚠️ **CRITICAL: START EVERY RFC WITH RESEARCH**
1. Read existing Prisma schema organization patterns
2. Review LinkedInAccount model (packages/db/prisma/models/linkedin-account.prisma)
3. Review User model (packages/db/prisma/models/user.prisma)
4. Understand migration workflow (pnpm db:migrate dev)
5. Identify any existing analytics tables (avoid naming conflicts)
6. Research PostgreSQL aggregate query performance (SUM, GROUP BY on ~56 records)
7. **Present findings and proposed schema to user for approval BEFORE proceeding**

**Stage 1: Schema Design**
1. Create `packages/db/prisma/models/analytics.prisma` (new file)
2. Define `LinkedInAnalyticsDaily` model:
   - Fields: id, linkedInAccountId (NOT organizationId), date, 6 metrics, timestamps
   - Relations: LinkedInAccount (many-to-one)
   - Unique constraint: [linkedInAccountId, date]
   - Index: [linkedInAccountId, date]
   - **Why LinkedInAccount**: Analytics persist even if org disconnects account
3. Define `UserEmailPreferences` model:
   - Fields: userId (PK), weeklyAnalytics, lastAnalyticsEmailAt, timestamps
   - Relations: User (one-to-one)
4. Add JSDoc comments explaining each field and design rationale

**Stage 2: Existing Model Updates**
1. Modify `packages/db/prisma/models/linkedin-account.prisma`:
   - Add `analyticsDaily LinkedInAnalyticsDaily[]` relation
2. Modify `packages/db/prisma/models/user.prisma`:
   - Add `emailPreferences UserEmailPreferences?` relation
3. Verify no circular dependency issues
4. Run `pnpm prisma validate` to check schema correctness

**Stage 3: Migration Generation**
1. Run `pnpm db:migrate dev --name add-weekly-analytics-tables`
2. Review generated SQL migration file
3. Verify indexes created correctly
4. Check for any warnings or errors in migration output

**Stage 4: Database Application & Aggregation Testing**
1. Apply migration to local database
2. Verify tables exist: `psql` → `\dt` (list tables)
3. Verify indexes: `\d+ LinkedInAnalyticsDaily` (show indexes)
4. Test inserting sample record (manual SQL or Prisma Studio)
5. Test unique constraints (try inserting duplicate date for same linkedInAccountId)
6. **Test aggregation query performance**:
   - Insert 60 days of sample data for test account
   - Run weekly aggregation query: `SELECT SUM(...) GROUP BY DATE_TRUNC('week', date)`
   - Measure execution time (should be <100ms)
   - Verify aggregated totals correct

**Post-Phase Testing**: ⚠️ **CRITICAL: END EVERY RFC WITH COMPREHENSIVE TESTING**
1. Open Prisma Studio: `pnpm db:studio`
2. Verify LinkedInAnalyticsDaily and UserEmailPreferences tables visible
3. Check relationships render correctly (LinkedInAccount → analyticsDaily)
4. Insert test daily record via Studio for a LinkedIn account
5. Insert 56 daily records (8 weeks) for performance testing
6. Test weekly aggregation query via Prisma Client:
   ```typescript
   const weeklyMetrics = await prisma.linkedInAnalyticsDaily.aggregate({
     where: { linkedInAccountId: "test_id", date: { gte: weekStart, lte: weekEnd } },
     _sum: { followers: true, invites: true, ... }
   });
   ```
7. Verify aggregation returns correct totals
8. Measure query execution time (console.time/console.timeEnd)
9. Run `pnpm prisma validate` to ensure schema valid
10. No errors in terminal output

**Acceptance Criteria**:
- [ ] LinkedInAnalyticsDaily table created with linkedInAccountId (NOT organizationId)
- [ ] UserEmailPreferences table created
- [ ] Relations to LinkedInAccount and User correct
- [ ] Unique constraints prevent duplicate records [linkedInAccountId, date]
- [ ] Indexes exist for query optimization
- [ ] Migration applied without errors
- [ ] Prisma Studio shows tables correctly
- [ ] Weekly aggregation query works (<100ms for 56 records)
- [ ] Aggregated totals mathematically correct
- [ ] Schema validation passes

**What's Functional Now**: Database ready to store daily analytics data with on-demand weekly aggregation

**Ready For**: RFC-002 (tRPC Sync Endpoint)

---

### RFC-002: tRPC Sync Endpoint

**Summary**: Create tRPC mutation for extension to sync daily analytics data to backend (single table, no weekly aggregates).

**Dependencies**: RFC-001 (Database Schema)

**Stages**:

**Stage 0: Pre-Phase Research** ⚠️ **START WITH RESEARCH**
1. Read existing tRPC router patterns (`packages/api/src/router/*.ts`)
2. Understand authentication: Check if `accountProcedure` or `orgProcedure` is appropriate
   - Research how extension identifies the linkedInAccountId
   - Verify organization ownership via LinkedInAccount → Organization relationship
3. Review Zod schema patterns for input validation
4. Identify how extension currently calls tRPC (check existing mutations in extension code)
5. Research Prisma batch upsert patterns (performance considerations for 60+ records)
6. **Present proposed endpoint design, auth strategy, and batch upsert approach to user for approval**

**Stage 1: Router Scaffolding**
1. Create `packages/api/src/router/analytics.ts` (new file)
2. Import dependencies: `z` (Zod), `protectedProcedure` or appropriate auth procedure, `db` (Prisma)
3. Define input schema for `syncAnalyticsData` (renamed from syncWeeklyData):
   ```typescript
   z.object({
     linkedInAccountId: z.string(),
     dailyData: z.array(
       z.object({
         date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date format
         followers: z.number().int().min(0),
         invites: z.number().int().min(0),
         comments: z.number().int().min(0),
         contentReach: z.number().int().min(0),
         profileViews: z.number().int().min(0),
         engageReach: z.number().int().min(0)
       })
     )
   })
   ```
4. Define output schema (success, count, linkedInAccountId)
5. Register router in `packages/api/src/router/root.ts`

**Stage 2: Batch Upsert Logic Implementation**
1. Create helper function `batchUpsertDailyAnalytics()`:
   ```typescript
   async function batchUpsertDailyAnalytics(
     linkedInAccountId: string,
     dailyData: Array<{ date: string; followers: number; ... }>
   ) {
     // Use Prisma transaction for atomic batch upsert
     const results = await db.$transaction(
       dailyData.map(day =>
         db.linkedInAnalyticsDaily.upsert({
           where: {
             linkedInAccountId_date: {
               linkedInAccountId,
               date: new Date(day.date)
             }
           },
           update: {
             followers: day.followers,
             invites: day.invites,
             comments: day.comments,
             contentReach: day.contentReach,
             profileViews: day.profileViews,
             engageReach: day.engageReach
           },
           create: {
             linkedInAccountId,
             date: new Date(day.date),
             followers: day.followers,
             invites: day.invites,
             comments: day.comments,
             contentReach: day.contentReach,
             profileViews: day.profileViews,
             engageReach: day.engageReach
           }
         })
       )
     );
     return results.length;
   }
   ```
2. Add error handling (try-catch, log errors, return partial success if possible)
3. Consider pagination for very large backfills (>100 records)

**Stage 3: Sync Mutation Implementation**
1. Write `syncAnalyticsData` mutation:
   ```typescript
   syncAnalyticsData: protectedProcedure
     .input(syncAnalyticsDataSchema)
     .mutation(async ({ ctx, input }) => {
       // Validate user has access to this LinkedIn account
       const account = await db.linkedInAccount.findFirst({
         where: {
           id: input.linkedInAccountId,
           organizationId: ctx.user.organizationId // Verify ownership
         }
       });

       if (!account) {
         throw new TRPCError({
           code: 'FORBIDDEN',
           message: 'You do not have access to this LinkedIn account'
         });
       }

       // Batch upsert daily records
       const count = await batchUpsertDailyAnalytics(
         input.linkedInAccountId,
         input.dailyData
       );

       return { success: true, dailyRecordsUpserted: count, linkedInAccountId: input.linkedInAccountId };
     })
   ```
2. Add comprehensive error handling (catch Prisma errors, return user-friendly messages)
3. Add logging (log sync attempts, record counts, errors)

**Stage 4: Unit Testing**
1. Write unit tests for `batchUpsertDailyAnalytics` helper:
   - Test with empty array (should return 0)
   - Test with single record (should create)
   - Test with duplicate date (should update, not create new)
   - Test with invalid linkedInAccountId (should fail)
2. Test Zod schema validation:
   - Valid input passes
   - Invalid date format rejected
   - Negative numbers rejected
   - Missing required fields rejected

**Post-Phase Testing**: ⚠️ **COMPREHENSIVE TESTING REQUIRED**
1. **Manual testing via tRPC playground or extension**:
   ```typescript
   await trpc.analytics.syncAnalyticsData.mutate({
     linkedInAccountId: "test_linkedin_account_id",
     dailyData: [
       { date: "2026-02-07", followers: 50, invites: 5, comments: 3, contentReach: 200, profileViews: 80, engageReach: 150 }
     ]
   });
   ```
2. **Create test**: Check database for inserted record (Prisma Studio)
3. **Update test**: Call again with updated metrics, verify upsert updates existing record (not duplicate)
4. **Batch test**: Send 30 daily records, verify all upserted in single transaction
5. **Authorization test**: Try syncing with linkedInAccountId from different organization (should fail with 403)
6. **Validation test**: Send malformed input (invalid date, negative number), verify rejection with 400
7. **Performance test**: Send 60 records (8 weeks backfill), measure execution time (<2 seconds acceptable)
8. **Idempotency test**: Call same mutation twice with identical data, verify no errors (idempotent)
9. **Error handling test**: Simulate database connection failure, verify graceful error response

**Acceptance Criteria**:
- [ ] tRPC mutation callable from extension
- [ ] Validates user has access to linkedInAccountId via organization ownership
- [ ] Upserts daily records in batch (no duplicates)
- [ ] Batch upsert atomic (all succeed or all fail within transaction)
- [ ] Returns success status and count
- [ ] Handles errors gracefully with user-friendly messages
- [ ] Unit tests pass (100% coverage for helpers)
- [ ] Authorization prevents cross-organization access
- [ ] Idempotent (can call multiple times with same data safely)
- [ ] Performance acceptable (<2s for 60 records)

**What's Functional Now**: Extension can sync daily analytics data to backend with LinkedInAccount relationship

**Ready For**: RFC-003 (Extension Integration)

---

### RFC-003: Extension Integration (Data Sync)

**Summary**: Integrate data sync call into extension's data fetch flow.

**Dependencies**: RFC-002 (tRPC Sync Endpoint)

**Stages**:

**Stage 0: Pre-Phase Research**
1. Read extension's data fetch logic (`useDataFetcher.ts`)
2. Understand when fetches happen (every 2 hours, on LinkedIn page load)
3. Review how extension currently calls tRPC (existing examples)
4. Understand chrome.storage.local structure (how data is stored)
5. Present proposed integration points to user

**Stage 1: Data Transformation Helper**
1. Create helper function `transformLocalStorageToSyncPayload()`:
   - Input: chrome.storage.local analytics data
   - Output: `{ weeklyData, dailyData }` matching tRPC schema
2. Calculate week boundaries (Saturday to Friday)
3. Aggregate daily data into weekly totals
4. Handle partial weeks (current week may be incomplete)
5. Add unit tests for transformation

**Stage 2: Backfill Logic**
1. Create helper function `shouldBackfill()`:
   - Check if this is first sync (no lastSyncTimestamp in storage)
   - Return boolean
2. Create helper function `getHistoricalData()`:
   - Read full chrome.storage.local history
   - Transform all historical weeks/days
   - Limit to last 6 months (avoid huge payloads)
3. Store `lastBackfillTimestamp` to prevent re-backfilling

**Stage 3: Sync Integration**
1. Find where data fetch completes in extension code
2. Add async call to `syncAnalyticsData()` after fetch:
   ```typescript
   const syncAnalyticsData = async () => {
     const needsBackfill = await shouldBackfill();
     const payload = needsBackfill
       ? await getHistoricalData()
       : await getCurrentWeekData();

     await trpc.analytics.syncWeeklyData.mutate(payload);
     await updateLastSyncTimestamp();
   };
   ```
3. Fire-and-forget pattern (don't block UI on sync)
4. Add error handling (log errors, don't show to user)

**Stage 4: Testing**
1. Test first sync with backfill (check all historical data syncs)
2. Test subsequent sync (only current week)
3. Test sync failure (network error, API down)
4. Verify extension UI not blocked during sync
5. Check database records after multiple fetches

**Post-Phase Testing**:
1. Install extension fresh (trigger backfill)
2. Check database for historical records (last 6 months)
3. Visit LinkedIn again (trigger incremental sync)
4. Check database for updated current week record
5. Simulate network failure (verify graceful degradation)
6. Check chrome.storage.local for lastSyncTimestamp

**Acceptance Criteria**:
- [ ] Sync called after every data fetch
- [ ] Backfill works on first sync (historical data)
- [ ] Incremental sync works on subsequent fetches
- [ ] Errors logged but don't break extension
- [ ] UI not blocked during sync
- [ ] lastSyncTimestamp stored correctly
- [ ] Database records created/updated

**What's Functional Now**: Extension syncs analytics to backend automatically

**Ready For**: RFC-004 (DBOS Scheduled Workflow)

---

### RFC-004: DBOS Scheduled Workflow

**Summary**: Create DBOS workflow that runs every Tuesday at 10 AM UTC to send emails.

**Dependencies**: RFC-003 (Extension Integration)

**Stages**:

**Stage 0: Pre-Phase Research**
1. Read existing DBOS workflow (`dailyQuotaResetWorkflow`)
2. Understand `@Scheduled` decorator syntax (cron format)
3. Review DBOS step pattern (`ctxt.invoke()`)
4. Understand DBOS logging (`ctxt.logger`)
5. Present proposed workflow structure to user

**Stage 1: Workflow Scaffolding**
1. Create `packages/api/src/workflows/email.workflows.ts` (new file)
2. Import dependencies: `Scheduled`, `ScheduledWorkflowContext`, `db`
3. Define workflow class: `EmailWorkflows`
4. Add `@Scheduled({ cron: "0 10 * * 2" })` decorator (Tuesday 10 AM UTC)
5. Create skeleton workflow method:
   ```typescript
   @Scheduled({ cron: "0 10 * * 2" })
   static async weeklyAnalyticsEmailWorkflow(ctxt: ScheduledWorkflowContext) {
     ctxt.logger.info("Starting weekly analytics email workflow");
   }
   ```

**Stage 2: Query Logic - Organizations with New Data**
1. Create DBOS step `getOrganizationsWithNewData()`:
   ```typescript
   const orgs = await db.organization.findMany({
     where: {
       analyticsWeekly: {
         some: {
           lastSyncedAt: {
             gt: // 7 days ago or lastAnalyticsEmailAt
           }
         }
       },
       linkedInUrl: { not: null } // Only orgs with LinkedIn accounts
     },
     include: {
       analyticsWeekly: {
         orderBy: { weekStartDate: 'desc' },
         take: 1 // Most recent week
       },
       users: {
         where: {
           emailPreferences: {
             weeklyAnalytics: true // Only subscribed users
           }
         },
         include: { emailPreferences: true }
       }
     }
   });
   ```
2. Filter orgs where `lastSyncedAt > (lastAnalyticsEmailAt ?? 7 days ago)`
3. Return list of organizations with users

**Stage 3: Email Sending Logic**
1. Create DBOS step `sendAnalyticsEmailToOrg(orgId)`:
   - Fetch current week metrics (LinkedInAnalyticsWeekly)
   - Fetch previous week metrics (for change calculation)
   - Fetch 8 weeks of daily data (for chart)
   - Transform data into Loops template variables
   - For each user in org:
     - Call Loops API to send email
     - Update user's lastAnalyticsEmailAt timestamp
2. Add error handling (catch per-org, don't fail entire workflow)
3. Add retry logic (if Loops API fails, retry 3 times with exponential backoff)

**Stage 4: Workflow Integration**
1. Wire up workflow method:
   ```typescript
   static async weeklyAnalyticsEmailWorkflow(ctxt: ScheduledWorkflowContext) {
     const orgs = await ctxt.invoke(getOrganizationsWithNewData);
     ctxt.logger.info(`Found ${orgs.length} organizations to email`);

     for (const org of orgs) {
       await ctxt.invoke(sendAnalyticsEmailToOrg, org.id);
     }

     ctxt.logger.info("Weekly analytics email workflow complete");
   }
   ```
2. Register workflow in DBOS config
3. Test workflow locally (trigger manually via DBOS CLI)

**Post-Phase Testing**:
1. Trigger workflow manually: `dbos invoke weeklyAnalyticsEmailWorkflow`
2. Check logs for "Found X organizations" message
3. Verify query returns correct orgs (only those with new data)
4. Check database for updated lastAnalyticsEmailAt timestamps
5. Verify workflow completes without errors
6. Test with no orgs to email (should log "Found 0 organizations")

**Acceptance Criteria**:
- [ ] Workflow runs on Tuesday 10 AM UTC schedule
- [ ] Queries organizations with new data correctly
- [ ] Filters out orgs without LinkedIn accounts
- [ ] Filters out users who unsubscribed
- [ ] Handles errors per-org (doesn't fail entire workflow)
- [ ] Logs progress and completion
- [ ] Updates lastAnalyticsEmailAt timestamps
- [ ] Can be triggered manually for testing

**What's Functional Now**: Scheduled workflow ready to send emails (pending Loops integration)

**Ready For**: RFC-005 (Loops Email Template)

---

### RFC-005: Loops Email Template

**Summary**: Design and create Loops email template with 6 metric cards and chart.

**Dependencies**: RFC-004 (DBOS Workflow)

**Stages**:

**Stage 0: Pre-Phase Research**
1. Review ChromeStats email design (reference for inspiration)
2. Explore Loops visual email editor capabilities
3. Understand Loops template variables syntax ({{ variable }})
4. Review Loops chart component (if available)
5. Present proposed template design to user (mockup/sketch)

**Stage 1: Template Structure**
1. Log into Loops dashboard
2. Create new template: "weekly-analytics-summary"
3. Define template structure:
   - Header: Greeting and date range
   - Section 1: 6 metric cards (2 rows x 3 columns)
   - Section 2: Weekly trend chart
   - Footer: Encouragement message + unsubscribe link (auto-added by Loops)
4. Set up mobile responsive layout (cards stack vertically)

**Stage 2: Metric Cards Design**
1. Create card component (Loops visual editor):
   - Border: 2px solid black (neobrutalist style)
   - Background: Light color (cream/white)
   - Padding: 16px
   - Shadow: 4px offset (hard shadow)
2. Card content:
   - Metric label (e.g., "Followers")
   - Large number: `{{ followers }}`
   - Change indicator: `{{ followersChange }}` with arrow (↑ or ↓)
   - Color: green for positive, red for negative, gray for zero
3. Replicate for all 6 metrics (followers, invites, comments, contentReach, profileViews, engageReach)

**Stage 3: Chart Implementation**
1. Research Loops chart options:
   - Option A: Use Loops native chart component (if available)
   - Option B: HTML table with styled cells (fallback)
   - Option C: Link to chart image (generated server-side)
2. Implement chosen option:
   - X-axis: Last 8 week labels ({{ chartWeeks }} array)
   - Y-axis: Metric values (6 lines, one per metric)
   - Legend: Color-coded metric names
3. Ensure mobile responsive (chart scales or scrolls)

**Stage 4: Template Variables**
1. Define all variables in Loops template:
   - `userName`, `orgName`, `weekStart`, `weekEnd`
   - 6 metrics: `followers`, `invites`, `comments`, `contentReach`, `profileViews`, `engageReach`
   - 6 changes: `followersChange`, `invitesChange`, ... (format: "+5" or "-2")
   - Chart arrays: `chartWeeks`, `chartFollowers`, `chartInvites`, ...
2. Add fallback values for testing (e.g., `{{ followers | default: 0 }}`)
3. Test template preview in Loops editor

**Stage 5: Mobile Optimization**
1. Test template on mobile devices (Loops preview feature)
2. Ensure cards stack vertically (not horizontal overflow)
3. Reduce font sizes if needed
4. Verify chart is readable on small screens
5. Test unsubscribe link accessibility

**Post-Phase Testing**:
1. Send test email from Loops dashboard (use sample data)
2. Check inbox on desktop email client (Gmail, Outlook)
3. Check inbox on mobile email client (iOS Mail, Gmail app)
4. Verify all variables render correctly
5. Click unsubscribe link (ensure it works)
6. Forward email to colleagues for feedback

**Acceptance Criteria**:
- [ ] Template created in Loops dashboard
- [ ] 6 metric cards display correctly
- [ ] Change indicators show +/- with colors
- [ ] Chart displays last 8 weeks (or alternative visualization)
- [ ] Mobile responsive (cards stack, chart readable)
- [ ] Unsubscribe link works
- [ ] Template preview looks professional
- [ ] All variables mapped correctly

**What's Functional Now**: Email template ready to receive data

**Ready For**: RFC-006 (Email Sending Logic)

---

### RFC-006: Email Sending Logic

**Summary**: Implement Loops API integration to send emails from DBOS workflow.

**Dependencies**: RFC-005 (Loops Email Template)

**Stages**:

**Stage 0: Pre-Phase Research**
1. Review existing Loops integration (`packages/shared/src/email/sendEmail.ts`)
2. Read Loops API documentation (transactional emails endpoint)
3. Understand Loops rate limits (100 emails/second)
4. Review error handling patterns for API calls
5. Present proposed integration approach to user

**Stage 1: Loops API Helper**
1. Create helper function `sendWeeklyAnalyticsEmail()`:
   ```typescript
   async function sendWeeklyAnalyticsEmail(params: {
     userEmail: string;
     userName: string;
     orgName: string;
     weekStart: string;
     weekEnd: string;
     metrics: { /* 6 metrics */ };
     changes: { /* 6 changes */ };
     chartData: { /* 8 weeks */ };
   }) {
     // Call Loops API
     const response = await fetch("https://app.loops.so/api/v1/transactional", {
       method: "POST",
       headers: {
         "Authorization": `Bearer ${process.env.LOOPS_API_KEY}`,
         "Content-Type": "application/json"
       },
       body: JSON.stringify({
         transactionalId: "weekly-analytics-summary",
         email: params.userEmail,
         dataVariables: { /* map params to template variables */ }
       })
     });

     if (!response.ok) {
       throw new Error(`Loops API error: ${response.statusText}`);
     }

     return response.json();
   }
   ```
2. Add retry logic (3 attempts with exponential backoff)
3. Add logging (success, failure, retry attempts)

**Stage 2: Change Calculation**
1. Create helper function `calculateChanges()`:
   ```typescript
   function calculateChanges(current: Metrics, previous: Metrics) {
     return {
       followersChange: formatChange(current.followers - previous.followers),
       invitesChange: formatChange(current.invites - previous.invites),
       // ... other metrics
     };
   }

   function formatChange(diff: number): string {
     if (diff > 0) return `+${diff}`;
     if (diff < 0) return `${diff}`; // Already has minus sign
     return "0";
   }
   ```
2. Handle edge case: no previous week data (show "N/A")

**Stage 3: Chart Data Preparation**
1. Create helper function `prepareChartData()`:
   ```typescript
   async function prepareChartData(orgId: string) {
     // Fetch last 8 weeks of daily data
     const dailyRecords = await db.linkedInAnalyticsDaily.findMany({
       where: {
         organizationId: orgId,
         date: { gte: /* 8 weeks ago */ }
       },
       orderBy: { date: 'asc' }
     });

     // Group by week
     const weeklyBuckets = groupByWeek(dailyRecords);

     // Format for Loops template
     return {
       chartWeeks: weeklyBuckets.map(w => formatWeekLabel(w.weekStart)),
       chartFollowers: weeklyBuckets.map(w => w.followers),
       // ... other metrics
     };
   }
   ```

**Stage 4: Integration with DBOS Workflow**
1. Update `sendAnalyticsEmailToOrg()` step from RFC-004:
   ```typescript
   async function sendAnalyticsEmailToOrg(orgId: string) {
     // Fetch current and previous week metrics
     const [currentWeek, previousWeek] = await fetchWeeklyMetrics(orgId);

     // Calculate changes
     const changes = calculateChanges(currentWeek, previousWeek);

     // Prepare chart data
     const chartData = await prepareChartData(orgId);

     // Get org and users
     const org = await db.organization.findUnique({
       where: { id: orgId },
       include: {
         users: {
           where: {
             emailPreferences: { weeklyAnalytics: true }
           }
         }
       }
     });

     // Send email to each user
     for (const user of org.users) {
       try {
         await sendWeeklyAnalyticsEmail({
           userEmail: user.email,
           userName: user.name ?? "there",
           orgName: org.name,
           weekStart: formatDate(currentWeek.weekStartDate),
           weekEnd: formatDate(currentWeek.weekEndDate),
           metrics: currentWeek,
           changes,
           chartData
         });

         // Update lastAnalyticsEmailAt
         await db.userEmailPreferences.update({
           where: { userId: user.id },
           data: { lastAnalyticsEmailAt: new Date() }
         });

         logger.info(`Sent analytics email to ${user.email}`);
       } catch (error) {
         logger.error(`Failed to send email to ${user.email}:`, error);
         // Continue to next user (don't fail entire org)
       }
     }
   }
   ```

**Post-Phase Testing**:
1. Trigger workflow manually with test org
2. Check logs for "Sent analytics email to X" messages
3. Check inbox for received emails
4. Verify all data renders correctly (metrics, changes, chart)
5. Check database for updated lastAnalyticsEmailAt timestamps
6. Test error handling (simulate Loops API failure)

**Acceptance Criteria**:
- [ ] Loops API integration works
- [ ] Emails sent to all subscribed users in org
- [ ] Metrics display correctly in email
- [ ] Change indicators accurate (+/- from previous week)
- [ ] Chart data accurate (last 8 weeks)
- [ ] lastAnalyticsEmailAt updated after send
- [ ] Errors logged but don't break workflow
- [ ] Retry logic works (3 attempts)

**What's Functional Now**: DBOS workflow sends real emails via Loops

**Ready For**: RFC-007 (Webhook Endpoint)

---

### RFC-007: Webhook Endpoint (Unsubscribe Handling)

**Summary**: Create webhook endpoint to receive Loops unsubscribe events and sync to database.

**Dependencies**: RFC-006 (Email Sending Logic)

**Stages**:

**Stage 0: Pre-Phase Research**
1. Review Loops webhook documentation (event types, payload format)
2. Understand HMAC signature verification (security)
3. Review existing webhook patterns in codebase (if any)
4. Understand Next.js route handler pattern (`route.ts`)
5. Present proposed webhook design to user

**Stage 1: Route Handler Setup**
1. Create `apps/nextjs/src/app/api/webhooks/loops/unsubscribe/route.ts`
2. Implement POST handler:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';

   export async function POST(req: NextRequest) {
     // Parse request body
     const body = await req.json();

     // Verify signature
     // Update database
     // Return success
   }
   ```
3. Add error handling (400 for invalid payload, 401 for invalid signature, 500 for internal errors)

**Stage 2: Signature Verification**
1. Create helper function `verifyLoopsSignature()`:
   ```typescript
   import crypto from 'crypto';

   function verifyLoopsSignature(
     payload: string,
     signature: string,
     secret: string
   ): boolean {
     const expectedSignature = crypto
       .createHmac('sha256', secret)
       .update(payload)
       .digest('hex');

     return crypto.timingSafeEqual(
       Buffer.from(signature),
       Buffer.from(expectedSignature)
     );
   }
   ```
2. Get signature from request header: `x-loops-signature`
3. Verify before processing (reject if invalid)

**Stage 3: Database Update Logic**
1. Parse webhook payload:
   ```typescript
   const { event, email, mailingListId, timestamp } = body;
   ```
2. Validate event type (only process "unsubscribe")
3. Find user by email:
   ```typescript
   const user = await db.user.findUnique({
     where: { email },
     include: { emailPreferences: true }
   });
   ```
4. Update or create UserEmailPreferences:
   ```typescript
   await db.userEmailPreferences.upsert({
     where: { userId: user.id },
     update: { weeklyAnalytics: false },
     create: { userId: user.id, weeklyAnalytics: false }
   });
   ```
5. Log event for audit trail

**Stage 4: Loops Dashboard Setup**
1. Log into Loops dashboard
2. Navigate to Webhooks settings
3. Add webhook subscription:
   - URL: `https://yourdomain.com/api/webhooks/loops/unsubscribe`
   - Events: Check "Unsubscribe"
   - Secret: Generate random string, add to `.env` as `LOOPS_WEBHOOK_SECRET`
4. Test webhook (Loops has built-in test feature)

**Stage 5: Testing**
1. Create test user in database
2. Add user to "Weekly Analytics" mailing list
3. Send test email via Loops
4. Click unsubscribe link in email
5. Check webhook endpoint receives POST request
6. Verify database updated (weeklyAnalytics = false)
7. Check logs for audit trail entry

**Post-Phase Testing**:
1. Trigger unsubscribe event from real email
2. Check webhook endpoint logs (Vercel logs or local console)
3. Verify signature validation works (test with invalid signature, should reject)
4. Check database for updated preference
5. Trigger workflow again (user should not receive email)
6. Test with non-existent email (should log error but return 200)

**Acceptance Criteria**:
- [ ] Webhook endpoint created at correct path
- [ ] Verifies Loops signature (rejects invalid)
- [ ] Updates UserEmailPreferences.weeklyAnalytics = false
- [ ] Handles "unsubscribe" event type
- [ ] Logs all webhook events
- [ ] Returns 200 OK to Loops (prevent retries)
- [ ] Gracefully handles errors (user not found, etc.)
- [ ] Webhook registered in Loops dashboard

**What's Functional Now**: Unsubscribe events sync from Loops to database

**Ready For**: RFC-008 (Test Email Button)

---

### RFC-008: Test Email Button (Extension UI)

**Summary**: Add "Send Test Email" button to analytics tab for preview functionality.

**Dependencies**: RFC-007 (Webhook Endpoint) - technically can be done earlier, but best to test full flow

**Stages**:

**Stage 0: Pre-Phase Research**
1. Read analytics tab component code (`AnalyticsTab.tsx`)
2. Understand existing button patterns in extension UI
3. Review how extension calls tRPC mutations (existing examples)
4. Identify where to place button (top right of analytics section?)
5. Present proposed UI placement to user

**Stage 1: tRPC Mutation**
1. Create `sendTestEmail` mutation in `analytics.ts` router:
   ```typescript
   sendTestEmail: orgProcedure
     .mutation(async ({ ctx }) => {
       const org = ctx.activeOrganization;
       const user = ctx.user;

       // Fetch current week metrics (same logic as workflow)
       const metrics = await getCurrentWeekMetrics(org.id);
       const previousMetrics = await getPreviousWeekMetrics(org.id);
       const changes = calculateChanges(metrics, previousMetrics);
       const chartData = await prepareChartData(org.id);

       // Send test email to current user only
       await sendWeeklyAnalyticsEmail({
         userEmail: user.email,
         userName: user.name ?? "there",
         orgName: org.name,
         weekStart: formatDate(metrics.weekStartDate),
         weekEnd: formatDate(metrics.weekEndDate),
         metrics,
         changes,
         chartData
       });

       return { success: true, emailSentTo: user.email };
     });
   ```
2. Reuse helper functions from RFC-006 (sendWeeklyAnalyticsEmail, calculateChanges, prepareChartData)

**Stage 2: UI Button Component**
1. Add button to analytics tab UI:
   ```tsx
   <Button
     variant="outline"
     size="sm"
     onClick={handleSendTestEmail}
     disabled={isLoading}
   >
     {isLoading ? "Sending..." : "Send Test Email"}
   </Button>
   ```
2. Place button in top right corner of analytics section
3. Use existing Button component from UI library

**Stage 3: Click Handler**
1. Implement `handleSendTestEmail`:
   ```tsx
   const sendTestEmail = trpc.analytics.sendTestEmail.useMutation({
     onSuccess: (data) => {
       toast.success(`Test email sent to ${data.emailSentTo}!`);
     },
     onError: (error) => {
       toast.error(`Failed to send test email: ${error.message}`);
     }
   });

   const handleSendTestEmail = () => {
     sendTestEmail.mutate();
   };
   ```
2. Show loading state (disable button, show spinner)
3. Show success toast (green, "Test email sent!")
4. Show error toast (red, error message)

**Stage 4: Conditional Rendering**
1. Only show button if:
   - User is authenticated
   - Organization has LinkedIn account connected
   - Analytics data exists (not empty state)
2. Add tooltip: "Send a preview email to yourself"
3. Add keyboard shortcut (optional): Cmd+Shift+E

**Post-Phase Testing**:
1. Open extension analytics tab
2. Click "Send Test Email" button
3. Verify loading state appears
4. Check inbox for test email
5. Verify email content matches analytics tab data
6. Test error handling (disconnect network, click button)
7. Verify success toast appears

**Acceptance Criteria**:
- [ ] Button visible in analytics tab
- [ ] Button placement intuitive (top right)
- [ ] Click triggers test email mutation
- [ ] Loading state shows during send
- [ ] Success toast displays on success
- [ ] Error toast displays on failure
- [ ] Test email received in inbox
- [ ] Email content accurate (matches current week)
- [ ] Button disabled if no analytics data

**What's Functional Now**: Users can preview weekly email before Tuesday send

**Ready For**: RFC-009 (Email Preference Toggle)

---

### RFC-009: Email Preference Toggle (App Settings)

**Summary**: Add UI toggle in app settings for users to opt-in/out of weekly emails.

**Dependencies**: RFC-008 (Test Email Button)

**Stages**:

**Stage 0: Pre-Phase Research**
1. Find app settings page location (`apps/nextjs/src/app/...`)
2. Review existing settings patterns (toggle components)
3. Understand how settings are saved (tRPC mutations?)
4. Review Loops API for adding/removing users from mailing lists
5. Present proposed settings UI to user

**Stage 1: tRPC Mutation**
1. Create `updateEmailPreference` mutation:
   ```typescript
   updateEmailPreference: protectedProcedure
     .input(z.object({
       weeklyAnalytics: z.boolean()
     }))
     .mutation(async ({ ctx, input }) => {
       const userId = ctx.user.id;
       const userEmail = ctx.user.email;

       // Update database
       await db.userEmailPreferences.upsert({
         where: { userId },
         update: { weeklyAnalytics: input.weeklyAnalytics },
         create: { userId, weeklyAnalytics: input.weeklyAnalytics }
       });

       // Sync with Loops mailing list
       const mailingListId = process.env.LOOPS_WEEKLY_ANALYTICS_MAILING_LIST_ID;
       if (input.weeklyAnalytics) {
         // Add to mailing list
         await fetch("https://app.loops.so/api/v1/contacts/update", {
           method: "PUT",
           headers: {
             "Authorization": `Bearer ${process.env.LOOPS_API_KEY}`,
             "Content-Type": "application/json"
           },
           body: JSON.stringify({
             email: userEmail,
             mailingLists: { [mailingListId]: true }
           })
         });
       } else {
         // Remove from mailing list
         await fetch("https://app.loops.so/api/v1/contacts/update", {
           method: "PUT",
           headers: {
             "Authorization": `Bearer ${process.env.LOOPS_API_KEY}`,
             "Content-Type": "application/json"
           },
           body: JSON.stringify({
             email: userEmail,
             mailingLists: { [mailingListId]: false }
           })
         });
       }

       return { success: true, preference: input.weeklyAnalytics };
     });
   ```

**Stage 2: Settings UI Component**
1. Create settings section in app:
   ```tsx
   <SettingsSection title="Email Notifications">
     <SettingItem
       label="Weekly Analytics Summary"
       description="Receive a weekly email every Tuesday with your LinkedIn analytics"
       control={
         <Switch
           checked={emailPreferences?.weeklyAnalytics ?? true}
           onCheckedChange={handleToggle}
           disabled={isUpdating}
         />
       }
     />
   </SettingsSection>
   ```
2. Use existing Switch component from UI library
3. Add description text below label

**Stage 3: Toggle Handler**
1. Fetch current preference on page load:
   ```tsx
   const { data: emailPreferences } = trpc.user.getEmailPreferences.useQuery();
   ```
2. Implement toggle handler:
   ```tsx
   const updatePreference = trpc.user.updateEmailPreference.useMutation({
     onSuccess: () => {
       toast.success("Email preference updated!");
     },
     onError: (error) => {
       toast.error(`Failed to update: ${error.message}`);
     }
   });

   const handleToggle = (checked: boolean) => {
     updatePreference.mutate({ weeklyAnalytics: checked });
   };
   ```
3. Show loading state (disable switch during update)

**Stage 4: Initial State Setup**
1. Create `getEmailPreferences` query:
   ```typescript
   getEmailPreferences: protectedProcedure
     .query(async ({ ctx }) => {
       const userId = ctx.user.id;

       const preferences = await db.userEmailPreferences.findUnique({
         where: { userId }
       });

       // Default to true (opt-in) if no record exists
       return preferences ?? { weeklyAnalytics: true };
     });
   ```
2. Handle users without preferences record (default to enabled)

**Stage 5: Loops Initial Setup**
1. On user signup, create UserEmailPreferences record:
   ```typescript
   // In signup flow (wherever that is)
   await db.userEmailPreferences.create({
     data: {
       userId: newUser.id,
       weeklyAnalytics: true // Opt-in by default
     }
   });

   // Add to Loops mailing list
   await loops.createContact({
     email: newUser.email,
     mailingLists: {
       [process.env.LOOPS_WEEKLY_ANALYTICS_MAILING_LIST_ID]: true
     }
   });
   ```

**Post-Phase Testing**:
1. Navigate to app settings page
2. Verify toggle shows current preference
3. Toggle to "off", verify success toast
4. Check database (weeklyAnalytics should be false)
5. Check Loops dashboard (user removed from mailing list)
6. Toggle back to "on", verify success toast
7. Check database and Loops (should be re-added)
8. Trigger workflow (user should not receive email when toggled off)

**Acceptance Criteria**:
- [ ] Settings section visible in app
- [ ] Toggle shows current preference on load
- [ ] Toggle updates database on change
- [ ] Toggle syncs with Loops mailing list
- [ ] Success toast on successful update
- [ ] Error toast on failure
- [ ] Loading state during update (switch disabled)
- [ ] New users default to opt-in (true)
- [ ] Workflow respects preference (no email when false)

**What's Functional Now**: Users can manage weekly email subscription in app

**Ready For**: RFC-010 (Testing & QA)

---

### RFC-010: Testing & Quality Assurance

**Summary**: Comprehensive testing coverage for weekly analytics email feature.

**Dependencies**: RFC-009 (Email Preference Toggle)

**Stages**:

**Stage 1: Unit Tests**
1. Test database models (LinkedInAnalyticsWeekly, LinkedInAnalyticsDaily, UserEmailPreferences)
2. Test helper functions:
   - `calculateChanges()` (metrics diff calculation)
   - `prepareChartData()` (weekly grouping)
   - `transformLocalStorageToSyncPayload()` (extension data transformation)
   - `verifyLoopsSignature()` (HMAC verification)
3. Test upsert logic (weekly and daily analytics)
4. Ensure 100% coverage for critical functions

**Stage 2: tRPC Integration Tests**
1. Test `syncWeeklyData` mutation:
   - Valid data creates records
   - Duplicate data updates existing
   - Invalid org ID fails with 403
   - Malformed input fails with 400
2. Test `sendTestEmail` mutation:
   - Sends email to current user
   - Fails gracefully if no analytics data
3. Test `updateEmailPreference` mutation:
   - Updates database correctly
   - Syncs with Loops API
   - Handles Loops API failures

**Stage 3: DBOS Workflow Tests**
1. Test `weeklyAnalyticsEmailWorkflow`:
   - Queries correct organizations (new data + subscribed users)
   - Sends emails to all subscribed users
   - Updates lastAnalyticsEmailAt timestamps
   - Handles errors per-org (doesn't fail entire workflow)
2. Test with various scenarios:
   - No orgs to email (should log and exit)
   - Some users unsubscribed (only email subscribed)
   - Loops API failure (should retry 3 times)
   - Previous week data missing (should handle gracefully)

**Stage 4: Extension Integration Tests**
1. Test data sync flow:
   - Extension fetches data → calls sync endpoint → database updated
   - Backfill on first sync (historical data)
   - Incremental sync on subsequent fetches
   - Sync failure doesn't break extension
2. Test "Send Test Email" button:
   - Click sends email
   - Loading state appears
   - Success toast on success
   - Error toast on failure

**Stage 5: End-to-End Tests (Manual QA)**
1. **Scenario 1: New User Signup**
   - Sign up new user
   - Verify UserEmailPreferences created (weeklyAnalytics = true)
   - Verify user added to Loops mailing list
2. **Scenario 2: Extension Data Sync**
   - Install extension
   - Visit LinkedIn
   - Verify data synced to database
   - Check backfill (historical weeks present)
3. **Scenario 3: Weekly Email Send**
   - Wait until Tuesday 10 AM UTC (or trigger manually)
   - Verify email received
   - Verify content accurate (metrics, changes, chart)
   - Verify all org members received email
4. **Scenario 4: Unsubscribe**
   - Click unsubscribe in email
   - Verify database updated (weeklyAnalytics = false)
   - Wait until next Tuesday
   - Verify email NOT received
5. **Scenario 5: Re-subscribe**
   - Toggle preference in app settings to "on"
   - Verify database updated (weeklyAnalytics = true)
   - Verify Loops mailing list synced
   - Wait until next Tuesday
   - Verify email received again
6. **Scenario 6: Test Email**
   - Click "Send Test Email" in analytics tab
   - Verify email received immediately
   - Verify content matches current week

**Stage 6: Email Client Testing**
1. Test email rendering on:
   - Gmail (web + mobile app)
   - Outlook (web + desktop)
   - Apple Mail (macOS + iOS)
   - Yahoo Mail
   - ProtonMail
2. Verify:
   - Cards display correctly
   - Chart renders (or fallback works)
   - Change indicators show colors
   - Unsubscribe link works
   - Mobile responsive (cards stack)

**Stage 7: Performance Testing**
1. Test with large dataset:
   - Org with 6 months of analytics data
   - Sync endpoint performance (<500ms)
   - Workflow execution time (<5 minutes for 100 orgs)
2. Test Loops rate limiting:
   - Send 100 test emails rapidly
   - Verify no failures (batch with delays if needed)
3. Test database query performance:
   - "Organizations with new data" query (<1s)
   - Chart data query (8 weeks) (<500ms)

**Stage 8: Error Handling Tests**
1. Test failure scenarios:
   - Loops API down (should retry, then log error)
   - Database connection lost (should throw, DBOS retries)
   - Extension network failure (should log, continue)
   - Invalid webhook signature (should reject)
2. Verify graceful degradation (feature doesn't break app)

**Stage 9: Security Testing**
1. Test authorization:
   - User can't sync data for other org's accounts
   - User can't send test email for other org
   - Webhook rejects invalid signatures
2. Test SQL injection:
   - Pass malicious input to sync endpoint
   - Verify Prisma parameterization prevents injection
3. Test email spam prevention:
   - Verify frequency cap (only Tuesday)
   - Verify unsubscribe works immediately

**Stage 10: Bug Fixing**
1. Document all bugs found in Stages 1-9
2. Prioritize bugs (critical, major, minor)
3. Fix critical bugs immediately
4. Fix major bugs before launch
5. Create tickets for minor bugs (post-launch)

**Post-Phase Testing**:
1. Run full test suite: `pnpm test`
2. Check coverage report (target: >80%)
3. Run E2E tests: `pnpm test:e2e`
4. Manual QA on staging environment
5. Load test with 100 organizations
6. Security audit (check OWASP top 10)

**Acceptance Criteria**:
- [ ] Unit tests pass with >80% coverage
- [ ] tRPC integration tests pass
- [ ] DBOS workflow tests pass
- [ ] Extension integration tests pass
- [ ] Manual E2E scenarios pass
- [ ] Email renders correctly on all major clients
- [ ] Performance meets targets (<500ms sync, <5min workflow)
- [ ] No critical bugs found
- [ ] Security audit passes

**What's Functional Now**: Weekly analytics email feature fully tested and production-ready

**Ready For**: Production Deployment

---

## 16. Rules (for this project)

### Tech Stack

- **Backend**: Next.js 15 (App Router), TypeScript, tRPC, Prisma ORM, PostgreSQL
- **Scheduled Jobs**: DBOS workflows
- **Email**: Loops email service
- **Extension**: WXT framework, React, TypeScript, chrome.storage.local
- **Authentication**: Clerk (existing)

### Code Standards

- Follow existing codebase conventions
- Use TypeScript strict mode
- No `any` types (use `unknown` if necessary)
- Prefer functional patterns (avoid classes except DBOS workflows)
- Use Zod for input validation (all tRPC endpoints)
- Destructure props in function signatures
- Use named exports (no default exports except route.ts)

### Architecture Patterns

- **Data Flow**: Extension → tRPC → Database → DBOS Workflow → Loops
- **Error Handling**: Try-catch at every API boundary, log errors, don't throw to user
- **Idempotency**: All sync endpoints must be idempotent (use upsert, not insert)
- **Organization-Centric**: Data belongs to organizations, not individual users
- **Opt-In**: Users opt-in to emails by default, can opt-out anytime

### Performance

- Sync endpoint: <500ms for typical payload
- DBOS workflow: <5 minutes for 100 organizations
- Email send: <200ms per email (Loops API)
- Database queries: <1s for "new data" org query

### Security

- All tRPC endpoints require authentication
- Validate organization ownership before sync
- Verify Loops webhook signatures (HMAC)
- No raw SQL (use Prisma only)
- Rate limit sync endpoint (prevent abuse)

### Documentation

- JSDoc comments for all public functions
- README section for weekly email feature
- Inline comments for complex logic (change calculation, backfill)
- Type definitions serve as documentation

---

## 17. Verification (Comprehensive Review)

### Gap Analysis

**Missing Specifications**:
- Chart rendering in email: Loops native chart vs HTML table vs image link?
  - **Resolution**: Use Loops visual editor capabilities; if no native chart, use styled HTML table with inline CSS
- Timezone handling: User's local timezone vs UTC?
  - **Resolution**: All times in UTC (Tuesday 10 AM UTC); users see formatted dates in email (no time shown)
- What if extension syncs data at 9:59 AM Tuesday (right before cron)?
  - **Resolution**: Workflow checks `lastSyncedAt > (lastEmailSentAt ?? 7 days ago)`, so will include in this week's email

**Ambiguities Resolved**:
- Email preference: Confirmed Loops mailing lists for feature-specific opt-out
- Data granularity: Confirmed dual storage (weekly + daily)
- Organization distribution: Confirmed all org members get same email
- Backfill strategy: Extension sends historical data on first sync

### Improvement Recommendations

1. **Add retry queue**: If Loops API fails after 3 retries, add to queue for later retry (prevent data loss)
2. **Add email preview**: Before test email sends, show preview in extension (not just send blindly)
3. **Add A/B testing**: Track email open rates, test different subject lines
4. **Add custom frequency**: Allow users to choose daily/weekly/monthly (V2 feature)

### Quality Assessment

| Criteria | Score | Reason |
|----------|-------|--------|
| **Completeness** | 95/100 | All must-have features specified; minor details (exact email copy) left to implementation |
| **Clarity** | 90/100 | Clear architecture and data flow; some Loops-specific details require trial-and-error |
| **Feasibility** | 95/100 | All features implementable with existing stack; Loops chart may require fallback |
| **Performance** | 85/100 | Database queries optimized; concern about Loops rate limiting at scale (100+ orgs) |
| **Maintainability** | 90/100 | Modular design with clear separation; DBOS pattern well-established |
| **Security** | 90/100 | Strong authentication; webhook signature verification; minor concern about Loops API key exposure |
| **User Experience** | 85/100 | Email is valuable; concern about inbox fatigue if metrics don't change week-to-week |

---

## 18. Change Management (for updates mid-flight)

**Change Request Process**:
1. Classify change (New feature, Modify existing, Remove, Scope change, Technical debt)
2. Analyze impact (Components affected, Timeline impact, Dependencies, UX impact)
3. Determine strategy (Immediate, Schedule for next phase, Defer to post-launch)
4. Update plan sections (RFCs, Database Schema, API Surface)
5. Communicate to user (document decision and rationale)
6. Track risks (add to Risks section)

**Example Change Scenarios**:
- User requests daily email frequency mid-implementation → Defer to post-launch (out of scope for V1)
- Loops native chart component doesn't exist → Immediate fix (use HTML table fallback)
- Performance testing reveals slow sync endpoint → Schedule for next phase (optimize query, add caching)

---

## 19. Ops Runbook

### Deployment

**Pre-Deployment Checklist**:
- [ ] All RFCs completed
- [ ] Tests passing (unit, integration, E2E)
- [ ] Database migrations applied to staging
- [ ] Loops email template created
- [ ] Loops mailing list created
- [ ] Loops webhook configured
- [ ] Environment variables set (LOOPS_API_KEY, LOOPS_MAILING_LIST_ID, LOOPS_WEBHOOK_SECRET)
- [ ] Manual QA signed off

**Deployment Steps**:
1. Create feature branch: `feature/weekly-analytics-email`
2. Implement RFCs 1-10 in order
3. Submit PR with screenshots and test results
4. Code review (2 approvals required)
5. Merge to main
6. Deploy to staging (Vercel preview)
7. Run smoke tests on staging
8. Deploy to production (Vercel production)
9. Monitor logs for 24 hours

**Rollback Plan**:
- Revert PR if critical bug discovered
- Database migrations are additive (safe to keep)
- Disable DBOS workflow if email spam occurs
- No data loss risk (read-only feature, except user preferences)

### Monitoring

**Metrics to Track**:
- Email send success rate (Loops API)
- DBOS workflow execution time
- Sync endpoint latency (p50, p95, p99)
- Database query performance
- Unsubscribe rate (track via webhook logs)

**Alerts**:
- DBOS workflow failure (notify Slack)
- Loops API error rate >5% (notify email)
- Sync endpoint timeout >500ms (notify Slack)
- Database connection errors (notify PagerDuty)

**Logs to Monitor**:
- DBOS workflow logs (check for "Sent analytics emails to X organizations")
- Loops webhook logs (check for unsubscribe events)
- Sync endpoint logs (check for errors, high latency)

### Maintenance

**Weekly Tasks**:
- Review DBOS workflow logs (any failures?)
- Check Loops dashboard (email deliverability, bounce rate)
- Monitor unsubscribe rate (>10% indicates problem)

**Monthly Tasks**:
- Review database storage (analytics tables growing as expected?)
- Audit Loops mailing list (users in sync with database?)
- Performance benchmarking (sync endpoint, workflow)

**Quarterly Tasks**:
- Email template refresh (update design if needed)
- User feedback review (survey users about email value)
- Cost analysis (Loops usage, database storage)

---

## 20. Acceptance Criteria (Versioned)

### V1.0 (MVP Launch)

**Functional Requirements**:
- [ ] Extension syncs analytics to backend after every fetch
- [ ] Backfill works on first sync (historical data)
- [ ] LinkedInAnalyticsWeekly table stores 6 metrics per week
- [ ] LinkedInAnalyticsDaily table stores daily granular data
- [ ] DBOS workflow runs every Tuesday at 10 AM UTC
- [ ] Workflow queries orgs with new data (lastSyncedAt > lastEmailSentAt)
- [ ] Workflow sends emails to all subscribed org members
- [ ] Email displays 6 metric cards with change indicators
- [ ] Email displays weekly trend chart (last 8 weeks)
- [ ] Loops mailing list "Weekly Analytics" created
- [ ] Unsubscribe link works (syncs to database)
- [ ] Test email button sends preview to current user
- [ ] Email preference toggle in app settings
- [ ] UserEmailPreferences table tracks subscription status

**Non-Functional Requirements**:
- [ ] Sync endpoint latency <500ms (p95)
- [ ] DBOS workflow completes <5 minutes for 100 orgs
- [ ] Email sends <200ms per email (Loops API)
- [ ] Database queries <1s for "new data" org query
- [ ] Email renders correctly on Gmail, Outlook, Apple Mail
- [ ] Mobile responsive (cards stack vertically)
- [ ] Unsubscribe works within 5 minutes (webhook processes quickly)

**User Experience**:
- [ ] Test email button shows loading state
- [ ] Success toast on test email send
- [ ] Error toast on test email failure
- [ ] Email preference toggle updates immediately
- [ ] Success toast on preference update
- [ ] Email subject line: "Your LinkedIn Week in Review - [Org Name]"
- [ ] Email from name: "EngageKit"
- [ ] Unsubscribe link prominent in footer

---

## 21. Future Work

### Post-V1 Enhancements

**Phase 2 (Q2 2026)**:
- Custom email frequency (daily, weekly, monthly)
- Metric selection (users choose which metrics to include)
- Email analytics tracking (open rates, click rates)
- A/B testing email content (subject lines, card design)
- Email preview in app (before test send)

**Phase 3 (Q3 2026)**:
- Historical email archive (view past emails in app)
- Email reply handling ("reply PAUSE to pause emails for 1 month")
- Mobile app integration (push notification alternative)
- Per-user analytics (not just per-organization)
- Social sharing buttons in email ("Share on LinkedIn")

**Phase 4 (Q4 2026)**:
- Multi-language support (Spanish, French, German)
- PDF attachment (full report)
- Custom branding (white-label for enterprise)
- Third-party integrations (Slack, Discord notifications)
- Advanced charts (year-over-year comparison)

### Technical Debt

- Add retry queue for Loops API failures (beyond 3 retries)
- Optimize chart data query (cache 8-week data, regenerate daily)
- Extract email template to code (use React Email instead of Loops editor)
- Add E2E tests for full workflow (staging environment)
- Implement rate limiting on sync endpoint (prevent abuse)

---

## 22. Implementation Checklist (Complete Workflow)

**Phase 1: Database Schema** (1 hour)
- [ ] **PRE-PHASE RESEARCH**: Review LinkedInAccount model, existing patterns, Prisma best practices
- [ ] Create `analytics.prisma` model file
- [ ] Define LinkedInAnalyticsDaily model (linkedInAccountId, NOT organizationId)
- [ ] Define UserEmailPreferences model
- [ ] Update LinkedInAccount model (add analyticsDaily relation)
- [ ] Update User model (add emailPreferences relation)
- [ ] Generate migration: `pnpm db:migrate dev`
- [ ] Apply migration to local database
- [ ] **POST-PHASE TESTING**: Verify tables, test weekly aggregation query, measure performance

**Phase 2: tRPC Sync Endpoint** (2 hours)
- [ ] **PRE-PHASE RESEARCH**: Review auth procedures, extension tRPC patterns, batch upsert strategies
- [ ] Create `analytics.ts` router file
- [ ] Define Zod input schema for syncAnalyticsData (simplified: only dailyData array)
- [ ] Implement batchUpsertDailyAnalytics helper (single table upsert)
- [ ] Write syncAnalyticsData mutation (linkedInAccountId auth)
- [ ] Register router in root.ts
- [ ] **POST-PHASE TESTING**: Test via playground, verify idempotency, test authorization, measure batch performance

**Phase 3: Extension Integration** (3 hours)
- [ ] Create transformLocalStorageToSyncPayload helper
- [ ] Implement shouldBackfill logic
- [ ] Implement getHistoricalData helper
- [ ] Add syncAnalyticsData call after fetch
- [ ] Test backfill on fresh install
- [ ] Test incremental sync on subsequent fetches
- [ ] Add error handling (log errors, don't break UI)
- [ ] Store lastSyncTimestamp in chrome.storage.local

**Phase 4: DBOS Workflow** (3 hours)
- [ ] Create `email.workflows.ts` file
- [ ] Define weeklyAnalyticsEmailWorkflow method
- [ ] Add @Scheduled decorator (Tuesday 10 AM UTC)
- [ ] Implement getOrganizationsWithNewData step
- [ ] Implement sendAnalyticsEmailToOrg step
- [ ] Add error handling (per-org, don't fail workflow)
- [ ] Register workflow in DBOS config
- [ ] Test workflow manually (dbos invoke)

**Phase 5: Loops Email Template** (2 hours)
- [ ] Log into Loops dashboard
- [ ] Create "weekly-analytics-summary" template
- [ ] Design 6 metric cards (2 rows x 3 columns)
- [ ] Add change indicators (+/- with colors)
- [ ] Add weekly trend chart (or HTML table)
- [ ] Define template variables
- [ ] Test template preview
- [ ] Send test email to self

**Phase 6: Email Sending Logic** (3 hours)
- [ ] Create sendWeeklyAnalyticsEmail helper
- [ ] Implement calculateChanges helper
- [ ] Implement prepareChartData helper
- [ ] Implement formatWeekLabel helper
- [ ] Update sendAnalyticsEmailToOrg step to call Loops API
- [ ] Add retry logic (3 attempts, exponential backoff)
- [ ] Update lastAnalyticsEmailAt timestamps
- [ ] Test workflow sends real emails

**Phase 7: Webhook Endpoint** (2 hours)
- [ ] Create webhook route handler (route.ts)
- [ ] Implement verifyLoopsSignature helper
- [ ] Parse webhook payload (event, email, mailingListId)
- [ ] Update UserEmailPreferences (weeklyAnalytics = false)
- [ ] Log webhook events for audit trail
- [ ] Register webhook in Loops dashboard
- [ ] Test webhook (Loops test feature)
- [ ] Verify database updated on unsubscribe

**Phase 8: Test Email Button** (2 hours)
- [ ] Create sendTestEmail mutation
- [ ] Reuse email helpers from RFC-006
- [ ] Add button to analytics tab UI
- [ ] Implement handleSendTestEmail handler
- [ ] Show loading state (disable button, spinner)
- [ ] Show success toast on success
- [ ] Show error toast on failure
- [ ] Test button click sends email

**Phase 9: Email Preference Toggle** (2 hours)
- [ ] Create updateEmailPreference mutation
- [ ] Sync preference with Loops mailing list API
- [ ] Create getEmailPreferences query
- [ ] Add toggle to app settings page
- [ ] Implement handleToggle handler
- [ ] Show loading state during update
- [ ] Show success toast on update
- [ ] Test toggle updates database and Loops

**Phase 10: Testing & QA** (4 hours)
- [ ] Write unit tests for all helpers
- [ ] Write tRPC integration tests
- [ ] Write DBOS workflow tests
- [ ] Run full test suite: `pnpm test`
- [ ] Manual E2E testing (all scenarios)
- [ ] Email client testing (Gmail, Outlook, Apple Mail)
- [ ] Performance testing (large datasets)
- [ ] Security testing (authorization, injection, signatures)
- [ ] Fix all critical bugs
- [ ] Document known issues (minor bugs)

**Total Estimated Time**: 24-28 hours (3-4 days)

---

## 23. Cursor + RIPER-5 Guidance

### Cursor Plan Mode

**Import Checklist**: Copy RFC implementation checklists directly into Cursor Plan mode for step-by-step execution.

**Workflow**:
1. Start with RFC-001 (Database Schema)
2. Execute each checklist item sequentially
3. After each RFC, update status strip in this plan file
4. Reattach this plan to future sessions for context
5. If scope changes mid-flight, pause and run Change Management section

### RIPER-5 Mode

**Mode Sequence**:
1. **RESEARCH**: ✅ Already complete (database schema analysis, extension patterns, DBOS examples, Loops integration reviewed)
2. **INNOVATE**: ✅ Already complete (backend-scheduled vs extension-triggered explored, dual-table storage approach decided)
3. **PLAN**: 🚧 **YOU ARE HERE** - This plan document is the output of PLAN mode
4. **EXECUTE**: Request user approval of this plan, then enter EXECUTE mode
5. **REVIEW**: After implementation, validate against this plan and flag deviations

**EXECUTE Mode Instructions**:
- Implement EXACTLY as planned in RFCs
- Do not add features not specified (no scope creep)
- If deviation needed, STOP and return to PLAN mode (update this file)
- Mid-implementation check-in at ~50% (after RFC-005 Loops Template)
- Use this plan as single source of truth

**Scope Change Protocol**:
- If user requests new feature mid-execution: Pause, classify change (see Change Management section), update plan, resume
- If technical blocker discovered: Document in Known Issues, propose solution, get approval before proceeding

---

**Next Step**: Review this plan, approve for execution, then enter EXECUTE mode with `ENTER EXECUTE MODE` command.
