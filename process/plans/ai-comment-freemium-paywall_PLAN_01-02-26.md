# AI Comment Freemium Paywall System - PLAN

**Feature**: Daily usage limits for AI comment generation with freemium paywall
**Date**: 01-02-26
**Updated**: 01-02-26
**Status**: ⏸️ PAUSED - Code complete, pending db:push and testing
**Type**: SIMPLE (one-session implementation)

---

## Progress Summary

### ✅ Completed
1. Schema: Added `dailyAIcommentsRefreshedAt DateTime?` to LinkedInAccount
2. Created `packages/api/src/utils/ai-quota.ts` with lazy refresh logic
3. Updated feature flags: `freeTierLimit: 5`, `premiumTierLimit: -1`
4. Added quota enforcement to `generateComment` and `generateDynamic`
5. Added `aiComments.quota` query endpoint
6. Prisma client generated

### ⏳ Pending
1. Run `pnpm db:push` to apply schema to database
2. Test locally (free tier hits limit, premium unlimited)
3. Frontend integration (display quota, handle FORBIDDEN errors)

### 🚫 Skipped (Optional)
- Delete old cron job (`/api/cron/reset-daily-comments`)
- Remove `getDailyCommentCount` from user router

---

## Overview

Implement a freemium paywall for AI comment generation that tracks usage at the account level with daily quota limits. Free tier accounts get N comments per day (configurable, default 5), while premium organization accounts with active subscriptions get unlimited usage.

---

## Goals

1. Enforce daily AI comment limits based on organization subscription tier
2. Track usage at LinkedInAccount level (not User level)
3. Reset quotas daily at 12:00 AM UTC using lazy refresh pattern
4. Provide clear error messages when limits are reached
5. Make limits easily configurable via feature flags

---

## Scope

### In Scope
- Add `dailyAIcommentsRefreshedAt` timestamp to LinkedInAccount schema
- Create centralized quota management utility (`ai-quota.ts`)
- Update feature flags configuration for AI comment limits
- Enforce quota checks in both `generateComment` and `generateDynamic` endpoints
- Add quota query endpoint for UI to display remaining usage
- Lazy refresh quota at 12:00 AM UTC daily

### Out of Scope
- UI components to display quota status (frontend work)
- Premium subscription management (already exists)
- User-level quotas (tracking at account level only)
- Rolling 24-hour windows (using fixed midnight UTC reset)
- Cron job-based reset (using lazy refresh instead)

---

## Technical Approach

### Architecture Decision: Lazy Refresh

**Why not cron job?**
- Current cron job `/apps/nextjs/src/app/api/cron/reset-daily-comments/route.ts` resets User.dailyAIcomments
- We need LinkedInAccount.dailyAIcomments reset instead
- Lazy refresh is simpler, more reliable, and doesn't depend on external cron execution
- Lazy refresh happens on first request after midnight UTC

**Lazy Refresh Logic**:
```
On each quota check:
1. Get account's last refresh timestamp (dailyAIcommentsRefreshedAt)
2. Calculate today's 12:00 AM UTC
3. If never refreshed OR last refresh < today's midnight UTC:
   - Reset dailyAIcomments to 0
   - Set dailyAIcommentsRefreshedAt to today's midnight UTC
4. Return current quota status
```

### Quota Calculation

**Premium Check**:
```typescript
// From packages/feature-flags/src/premium.ts
isOrgPremium(org) checks:
- subscriptionTier === "PREMIUM"
- subscriptionExpiresAt exists and is future date
- accountCount <= purchasedSlots (quota compliance)
```

**Limit Determination**:
```typescript
// From packages/feature-flags/src/premium.ts FEATURE_CONFIG
if (isOrgPremium(account.organization)) {
  limit = -1 // unlimited
} else {
  limit = 5 // free tier default
}
```

---

## Implementation Checklist

### 1. Database Schema Changes

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/db/prisma/models/linkedin-account.prisma`

```prisma
model LinkedInAccount {
  // ... existing fields ...
  dailyAIcomments Int @default(0)

  // ADD THIS NEW FIELD:
  dailyAIcommentsRefreshedAt DateTime?

  // ... rest of schema ...
}
```

**Action**: Add `dailyAIcommentsRefreshedAt DateTime?` field after `dailyAIcomments` field (line 22)

---

### 2. Generate Prisma Migration

**Command**:
```bash
cd packages/db
pnpm db:generate
```

**Action**: Generate Prisma client with new schema

---

### 3. Create AI Quota Utility

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/api/src/utils/ai-quota.ts` (NEW FILE)

```typescript
import type { PrismaClient } from "@sassy/db";
import { isOrgPremium } from "@sassy/feature-flags";
import { FEATURE_CONFIG } from "@sassy/feature-flags";

/**
 * Get UTC midnight for today
 * Example: 2026-02-01 15:30:00 UTC -> 2026-02-01 00:00:00 UTC
 */
function getTodayMidnightUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
}

/**
 * Get UTC midnight for tomorrow
 * Used to show users when their quota resets
 */
function getNextMidnightUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
}

/**
 * Get daily comment limit based on organization premium status
 */
function getLimit(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  purchasedSlots: number;
  accountCount: number;
}): number {
  if (isOrgPremium(org)) {
    return FEATURE_CONFIG.dailyComments.premiumTierLimit; // -1 = unlimited
  }
  return FEATURE_CONFIG.dailyComments.freeTierLimit; // 5
}

export interface QuotaStatus {
  used: number;
  limit: number;
  isPremium: boolean;
  refreshedAt: Date;
  resetsAt: Date;
}

/**
 * Get account's AI comment quota with lazy refresh
 *
 * This function:
 * 1. Checks if quota needs refresh (never refreshed OR last refresh before today's midnight UTC)
 * 2. If needed, resets dailyAIcomments to 0 and updates refreshedAt timestamp
 * 3. Returns current quota status
 *
 * @param db - Prisma client
 * @param accountId - LinkedInAccount ID
 * @returns Quota status with used count, limit, and reset time
 */
export async function getAccountQuota(
  db: PrismaClient,
  accountId: string
): Promise<QuotaStatus> {
  const account = await db.linkedInAccount.findUnique({
    where: { id: accountId },
    select: {
      dailyAIcomments: true,
      dailyAIcommentsRefreshedAt: true,
      organization: {
        select: {
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          purchasedSlots: true,
          // Need _count to calculate accountCount
          _count: {
            select: {
              linkedInAccounts: true,
            },
          },
        },
      },
    },
  });

  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const now = new Date();
  const todayMidnightUTC = getTodayMidnightUTC();
  const lastRefresh = account.dailyAIcommentsRefreshedAt;

  // Needs refresh if never refreshed OR last refresh was before today's midnight UTC
  const needsRefresh = !lastRefresh || lastRefresh < todayMidnightUTC;

  // Prepare org data for premium check
  const orgData = {
    subscriptionTier: account.organization?.subscriptionTier ?? "FREE",
    subscriptionExpiresAt: account.organization?.subscriptionExpiresAt ?? null,
    purchasedSlots: account.organization?.purchasedSlots ?? 0,
    accountCount: account.organization?._count.linkedInAccounts ?? 0,
  };

  if (needsRefresh) {
    // Reset quota and update timestamp
    await db.linkedInAccount.update({
      where: { id: accountId },
      data: {
        dailyAIcomments: 0,
        dailyAIcommentsRefreshedAt: todayMidnightUTC,
      },
    });

    return {
      used: 0,
      limit: getLimit(orgData),
      isPremium: isOrgPremium(orgData),
      refreshedAt: todayMidnightUTC,
      resetsAt: getNextMidnightUTC(),
    };
  }

  // No refresh needed, return current status
  return {
    used: account.dailyAIcomments,
    limit: getLimit(orgData),
    isPremium: isOrgPremium(orgData),
    refreshedAt: lastRefresh,
    resetsAt: getNextMidnightUTC(),
  };
}

/**
 * Increment account's daily AI comment usage
 *
 * IMPORTANT: This does NOT check quota limits - that should be done
 * BEFORE calling this function using getAccountQuota()
 *
 * @param db - Prisma client
 * @param accountId - LinkedInAccount ID
 * @param count - Number of comments to add to usage
 */
export async function incrementAccountUsage(
  db: PrismaClient,
  accountId: string,
  count: number
): Promise<void> {
  await db.linkedInAccount.update({
    where: { id: accountId },
    data: {
      dailyAIcomments: {
        increment: count,
      },
    },
  });
}
```

**Action**: Create new file with complete quota management logic

---

### 4. Update Feature Flags Configuration

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/feature-flags/src/premium.ts`

**Current state** (lines 10-14):
```typescript
dailyComments: {
  isPremium: false,
  freeTierLimit: 100,
  premiumTierLimit: 100,
},
```

**Updated state**:
```typescript
dailyComments: {
  isPremium: false,
  freeTierLimit: 5,        // Free: 5 comments/day
  premiumTierLimit: -1,    // Premium: unlimited (-1 = no limit)
},
```

**Action**: Update `freeTierLimit` from 100 to 5, and `premiumTierLimit` from 100 to -1

---

### 5. Update AI Comments Router - Add Quota Query

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/api/src/router/ai-comments.ts`

**Import section** (add after line 17):
```typescript
import { getAccountQuota, incrementAccountUsage } from "../utils/ai-quota";
```

**Add new procedure** (after `generateDynamic`, around line 169):
```typescript
/**
 * Get current quota status for active account
 * Used by UI to show remaining daily comment limit
 */
quota: accountProcedure.query(async ({ ctx }) => {
  return getAccountQuota(ctx.db, ctx.activeAccount.id);
}),
```

**Action**:
1. Add import statement for quota utilities
2. Add quota query procedure after generateDynamic procedure

---

### 6. Enforce Quota in generateDynamic Endpoint

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/api/src/router/ai-comments.ts`

**Current state** (lines 45-169):
```typescript
generateDynamic: accountProcedure
  .input(generateDynamicInputSchema)
  .output(generateDynamicOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { postContent, adjacentComments, count } = input;
    const accountId = ctx.activeAccount.id;

    // ... existing generation logic ...
  }),
```

**Updated state**:
```typescript
generateDynamic: accountProcedure
  .input(generateDynamicInputSchema)
  .output(generateDynamicOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { postContent, adjacentComments, count } = input;
    const accountId = ctx.activeAccount.id;

    // Check quota BEFORE generating
    const quota = await getAccountQuota(ctx.db, accountId);

    if (!quota.isPremium && quota.used + count > quota.limit) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Daily AI comment limit reached (${quota.used}/${quota.limit}). Resets at ${quota.resetsAt.toISOString()}. Upgrade to premium for unlimited comments.`
      });
    }

    console.log("[generateDynamic] Starting dynamic generation", {
      accountId,
      postContentLength: postContent.length,
      adjacentCommentsCount: adjacentComments?.length ?? 0,
      count,
      quotaUsed: quota.used,
      quotaLimit: quota.limit,
    });

    // ... existing style fetching and generation logic (lines 59-164) ...

    // After successful generation, increment usage
    await incrementAccountUsage(ctx.db, accountId, count);

    console.log("[generateDynamic] Generated comments:", results.length);

    return results;
  }),
```

**Action**:
1. Add quota check at beginning of mutation (after line 50)
2. Add quota logging to existing console.log (update line 52-57)
3. Add usage increment after successful generation (before line 166)

---

### 7. Enforce Quota in generateComment Endpoint

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/api/src/router/ai-comments.ts`

**Current state** (lines 28-33):
```typescript
generateComment: protectedProcedure
  .input(commentGenerationInputSchema)
  .output(commentGenerationOutputSchema)
  .mutation(({ input, ctx }) => {
    return ctx.ai.generateComment(input);
  }),
```

**Problem**: `generateComment` uses `protectedProcedure` which doesn't have `activeAccount` context. We need accountId to check quota.

**Two options**:

**Option A**: Change to `accountProcedure` (recommended if this endpoint is only called from account context)
```typescript
generateComment: accountProcedure
  .input(commentGenerationInputSchema)
  .output(commentGenerationOutputSchema)
  .mutation(async ({ input, ctx }) => {
    // Check quota
    const quota = await getAccountQuota(ctx.db, ctx.activeAccount.id);

    if (!quota.isPremium && quota.used >= quota.limit) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Daily AI comment limit reached (${quota.used}/${quota.limit}). Resets at ${quota.resetsAt.toISOString()}. Upgrade to premium for unlimited comments.`
      });
    }

    // Generate comment
    const result = await ctx.ai.generateComment(input);

    // Increment usage
    await incrementAccountUsage(ctx.db, ctx.activeAccount.id, 1);

    return result;
  }),
```

**Option B**: Add `accountId` to input schema (if this endpoint needs to work without account context)
```typescript
// In packages/api/src/schema-validators.ts
export const commentGenerationInputSchema = z.object({
  postContent: z.string(),
  styleGuide: z.string().optional(),
  maxWords: z.number().optional(),
  creativity: z.number().optional(),
  accountId: z.string(), // ADD THIS
});

// Then in ai-comments.ts
generateComment: protectedProcedure
  .input(commentGenerationInputSchema)
  .output(commentGenerationOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { accountId, ...aiInput } = input;

    const quota = await getAccountQuota(ctx.db, accountId);

    if (!quota.isPremium && quota.used >= quota.limit) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Daily AI comment limit reached (${quota.used}/${quota.limit}). Resets at ${quota.resetsAt.toISOString()}.`
      });
    }

    const result = await ctx.ai.generateComment(aiInput);
    await incrementAccountUsage(ctx.db, accountId, 1);

    return result;
  }),
```

**Recommended**: Use Option A (change to accountProcedure) unless there's a specific reason this endpoint needs to work without account context.

**Action**:
1. Change `protectedProcedure` to `accountProcedure`
2. Add quota check before generation
3. Add usage increment after generation
4. Add TRPCError import at top of file if not already present

---

### 8. Add TRPCError Import

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/api/src/router/ai-comments.ts`

**Current imports** (lines 1-17):
```typescript
import {
  commentGenerationInputSchema,
  commentGenerationOutputSchema,
  generateDynamicInputSchema,
  generateDynamicOutputSchema,
} from "../schema-validators";
import {
  accountProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";
import {
  DEFAULT_CREATIVITY,
  DEFAULT_MAX_WORDS,
  DEFAULT_STYLE_GUIDE,
} from "../utils/ai-service/constants";
import { truncateToWords } from "../utils/text-utils";
```

**Add TRPCError import**:
```typescript
import { TRPCError } from "@trpc/server";
```

**Action**: Add TRPCError import after line 1

---

### 9. Optional: Deprecate Old Cron Job

**File**: `/Users/zihaolam/Projects/engagekit.io/apps/nextjs/src/app/api/cron/reset-daily-comments/route.ts`

**Current state**: Resets `User.dailyAIcomments` (wrong table)

**Options**:
1. **Delete the file** (recommended) - lazy refresh handles quota resets
2. **Update to reset LinkedInAccount.dailyAIcomments** - keep as backup to lazy refresh
3. **Leave as-is** - continues resetting User table (harmless but unused)

**Recommendation**: Delete the file since:
- User.dailyAIcomments is no longer used for quota enforcement
- LinkedInAccount.dailyAIcomments is reset via lazy refresh
- Simpler system with one refresh mechanism

**Action**: Delete `/Users/zihaolam/Projects/engagekit.io/apps/nextjs/src/app/api/cron/reset-daily-comments/route.ts` (optional)

---

### 10. Optional: Remove Old User Quota Endpoint

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/api/src/router/user.ts`

**Current state** (lines 22-27):
```typescript
/**
 * Get the current user's daily AI comment count
 * Used by extension to display daily limits
 */
getDailyCommentCount: protectedProcedure.query(
  ({ ctx }) => ctx.user.dailyAIcomments,
),
```

**Options**:
1. **Delete the procedure** - no longer needed since quota is at account level
2. **Deprecate with comment** - mark as deprecated but keep for backwards compatibility
3. **Leave as-is** - harmless but will return stale data

**Recommendation**: Delete since:
- Frontend should use new `aiComments.quota` endpoint instead
- User.dailyAIcomments is no longer accurate for quota enforcement
- Cleaner codebase with one source of truth

**Action**: Remove `getDailyCommentCount` procedure from user router (lines 22-27) (optional)

---

### 11. Optional: Remove dailyAIcomments from User Schema

**File**: `/Users/zihaolam/Projects/engagekit.io/packages/db/prisma/models/user.prisma`

**Current state** (line 17):
```prisma
dailyAIcomments   Int                @default(0)
```

**Recommendation**: Keep field for now to avoid migration complexity. Can be removed in future cleanup.

**Reason**:
- Removing requires migration that drops column
- May break existing code that references it
- Not causing issues by existing
- Can schedule removal in future schema cleanup sprint

**Action**: No action needed (keep field)

---

## Acceptance Criteria

### Functional Requirements

1. **Free Tier Limits**
   - [ ] Free tier account can generate exactly 5 comments per day
   - [ ] 6th comment generation attempt throws FORBIDDEN error
   - [ ] Error message includes current usage, limit, and reset time

2. **Premium Tier**
   - [ ] Premium organization account can generate unlimited comments
   - [ ] No quota errors for premium accounts regardless of usage

3. **Quota Reset**
   - [ ] Quota resets at 12:00 AM UTC daily
   - [ ] First request after midnight UTC triggers lazy refresh
   - [ ] Quota counter resets to 0 after refresh

4. **Account-Level Tracking**
   - [ ] Each LinkedInAccount has independent quota
   - [ ] Multiple accounts in same org have separate limits
   - [ ] Usage is tracked at LinkedInAccount, not User

5. **Quota Query Endpoint**
   - [ ] `aiComments.quota` returns accurate used/limit/isPremium
   - [ ] `resetsAt` field shows next midnight UTC timestamp
   - [ ] Response includes refreshedAt timestamp

6. **Premium Expiry**
   - [ ] Premium org that expires mid-day loses unlimited access
   - [ ] Quota limits enforced on next request after expiry

### Error Handling

1. **Quota Exceeded**
   - [ ] Error code is FORBIDDEN
   - [ ] Error message is user-friendly and actionable
   - [ ] Error message includes reset time in ISO format

2. **Missing Account**
   - [ ] getAccountQuota throws clear error if account not found
   - [ ] Error is logged with account ID

3. **Concurrent Requests**
   - [ ] Prisma increment is atomic (no race conditions)
   - [ ] Multiple parallel requests don't bypass quota

### Configuration

1. **Feature Flags**
   - [ ] freeTierLimit = 5
   - [ ] premiumTierLimit = -1 (unlimited)
   - [ ] Changes to feature flags immediately affect new requests

---

## Dependencies

### Existing Systems
- `isOrgPremium()` function from `@sassy/feature-flags` (already exists)
- `FEATURE_CONFIG.dailyComments` from `@sassy/feature-flags` (needs update)
- LinkedInAccount.dailyAIcomments field (already exists)
- LinkedInAccount.organization relation (already exists)
- accountProcedure context with activeAccount (already exists)

### New Dependencies
- None (no new packages required)

---

## Risks & Mitigation

### Risk 1: Timezone Confusion
**Issue**: UTC midnight may not align with user's local timezone
**Mitigation**:
- Use consistent UTC timestamps everywhere
- Display reset time in ISO format so frontend can localize
- Document that reset is UTC-based

### Risk 2: Lazy Refresh Not Triggering
**Issue**: If account goes unused, quota never refreshes
**Mitigation**:
- This is by design - quota only matters when user tries to generate
- First request after midnight will refresh before checking
- No stale quota state possible

### Risk 3: Race Condition on Concurrent Requests
**Issue**: Multiple parallel requests might bypass quota check
**Mitigation**:
- Prisma increment is atomic at database level
- Quota check happens BEFORE generation starts
- Worst case: slightly over quota (e.g., 6 instead of 5) if 2 requests race
- Acceptable tradeoff for simplicity

### Risk 4: Premium Status Check Performance
**Issue**: getAccountQuota joins to organization table on every request
**Mitigation**:
- Organization data is small and indexed
- Query uses select to only fetch needed fields
- Could add Redis cache in future if needed

### Risk 5: generateComment Breaking Change
**Issue**: Changing to accountProcedure may break existing callers
**Mitigation**:
- Grep codebase for generateComment usage before changing
- If needed, use Option B (add accountId to input) instead
- Test all call sites after implementation

---

## Integration Notes

### Frontend Integration
After backend implementation, frontend should:
1. Call `aiComments.quota` on page load to display remaining comments
2. Show upgrade CTA when quota is low or exhausted
3. Display reset time to user ("Resets at X")
4. Handle FORBIDDEN errors gracefully with modal/toast

### Chrome Extension Integration
If extension uses AI comments:
1. Extension must pass x-account-id header (already implemented)
2. Extension should call quota endpoint before showing comment UI
3. Handle quota errors by prompting upgrade

### Migration Path
No data migration needed:
1. New field `dailyAIcommentsRefreshedAt` defaults to null
2. First request for each account will trigger refresh
3. Existing `dailyAIcomments` values will be reset on first use

---

## Testing Checklist

### Unit Tests
- [ ] Test getTodayMidnightUTC() returns correct UTC midnight
- [ ] Test getNextMidnightUTC() returns tomorrow's midnight
- [ ] Test getLimit() returns correct limit based on org status
- [ ] Test getAccountQuota() refreshes when needed
- [ ] Test getAccountQuota() doesn't refresh when not needed
- [ ] Test incrementAccountUsage() correctly increments counter

### Integration Tests
- [ ] Test generateDynamic enforces quota for free tier
- [ ] Test generateDynamic allows unlimited for premium
- [ ] Test generateComment enforces quota
- [ ] Test quota endpoint returns correct status
- [ ] Test quota resets at midnight UTC
- [ ] Test premium expiry revokes unlimited access

### Manual Testing
- [ ] Create free tier account, generate 5 comments, verify 6th fails
- [ ] Create premium account, generate >100 comments, verify no errors
- [ ] Wait for midnight UTC, verify quota resets (or mock clock)
- [ ] Test error message readability
- [ ] Test quota endpoint in API playground

---

## Rollout Plan

### Phase 1: Backend Implementation
1. Add schema field and generate migration
2. Create ai-quota.ts utility
3. Update feature flags
4. Add quota procedure
5. Enforce quota in generateDynamic and generateComment
6. Deploy to staging

### Phase 2: Testing
1. Run automated tests
2. Manual testing on staging
3. Verify quota reset behavior
4. Test premium vs free tier

### Phase 3: Production Deploy
1. Deploy to production
2. Monitor error rates (expect spike in FORBIDDEN errors)
3. Monitor quota query performance
4. Collect user feedback

### Phase 4: Frontend Update (Separate PR)
1. Add quota display UI
2. Add upgrade CTAs
3. Handle quota errors gracefully

---

## Success Metrics

### Technical Metrics
- Zero 500 errors from quota system
- getAccountQuota response time < 100ms p95
- No race condition bugs reported
- Lazy refresh works 100% of time

### Business Metrics
- Track % of users hitting free tier limit
- Track upgrade conversions after hitting limit
- Monitor premium account usage patterns
- Measure AI comment generation volume

---

## Future Enhancements

### Phase 2 (Future)
1. **Usage Analytics Dashboard**
   - Show org-wide AI comment usage
   - Identify power users
   - Forecast quota needs

2. **Flexible Quota Windows**
   - Support rolling 24-hour windows
   - Support weekly/monthly quotas

3. **Per-Feature Quotas**
   - Separate quotas for different AI features
   - Different limits for different comment types

4. **Redis Caching**
   - Cache quota status for 5 minutes
   - Reduce database queries

5. **Quota Alerts**
   - Email when 80% quota used
   - Slack notifications for org admins

---

## Notes

### Why Account-Level Not User-Level?
- Users can have multiple LinkedIn accounts
- Each account operates independently
- Usage should be tracked per LinkedIn identity
- Aligns with organization billing structure

### Why Lazy Refresh Not Cron?
- Simpler: no external dependencies
- More reliable: doesn't depend on cron execution
- Faster: refresh happens in same request as check
- Scalable: only refreshes accounts that are used

### Why Fixed Midnight UTC Not Rolling 24h?
- Simpler to understand for users
- Easier to implement (no per-user timestamps)
- Standard industry practice (e.g., Twitter, ChatGPT)
- More predictable behavior

---

## Related Files

### Modified Files
1. `/Users/zihaolam/Projects/engagekit.io/packages/db/prisma/models/linkedin-account.prisma`
2. `/Users/zihaolam/Projects/engagekit.io/packages/feature-flags/src/premium.ts`
3. `/Users/zihaolam/Projects/engagekit.io/packages/api/src/router/ai-comments.ts`

### New Files
1. `/Users/zihaolam/Projects/engagekit.io/packages/api/src/utils/ai-quota.ts`

### Optional Deletions
1. `/Users/zihaolam/Projects/engagekit.io/apps/nextjs/src/app/api/cron/reset-daily-comments/route.ts`
2. `getDailyCommentCount` procedure in `/Users/zihaolam/Projects/engagekit.io/packages/api/src/router/user.ts`

---

## Approval

This plan is ready for review. Once approved, proceed with:

**"ENTER EXECUTE MODE"**

to begin implementation.
