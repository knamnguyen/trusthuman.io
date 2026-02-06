# Fair Use Score - Implementation Plan

**Date:** 06-02-26
**Complexity:** Simple
**Status:** ⏳ PLANNED

## Overview

Add a Fair Use Score feature to the LinkedIn Chrome extension's Account Tab. This feature helps users visualize their LinkedIn commenting activity over the past 14 days and provides a safety score to prevent account restrictions. The feature addresses LinkedIn's adaptive rate limiting and pattern detection systems documented in the user guidelines.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Assumptions and Constraints](#assumptions-and-constraints)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Risks and Mitigations](#risks-and-mitigations)
- [Integration Notes](#integration-notes)

## Goals and Success Metrics

**Goals:**
- Help users visualize their LinkedIn commenting activity patterns over 14 days
- Provide a Fair Use Score indicating safety level (green/yellow/red)
- Enable manual fetch of comment history (no auto-fetch to avoid excessive data loading)
- Reuse existing comment fetcher infrastructure with time-based pagination

**Success Metrics:**
- Users can manually trigger a 14-day comment history fetch
- Activity graph displays daily comment counts clearly
- Fair Use Score accurately reflects LinkedIn safety guidelines (10-50 comments/day range)
- Loading states provide clear feedback during fetch operations
- Feature integrates seamlessly into existing Account Tab layout

---

## Execution Brief

**IMPORTANT:** This is a SIMPLE (one-session) plan - implement continuously without approval gates. The steps below are ordered for logical implementation flow.

### Implementation Flow

**Phase 1: Comment Fetcher Extension**
- Modify `linkedin-comments-fetcher.ts` to support time-based pagination (14 days instead of 2 pages)
- Keep existing LinkedIn API patterns (GraphQL queryId, auth headers, pagination tokens)

**Phase 2: Data Layer (Hook + Store)**
- Create `useCommentHistory` hook for fetching and processing 14-day comment data
- Group comments by date (YYYY-MM-DD format) with counts
- Manage loading/error states

**Phase 3: UI Components**
- Build `ActivityGraphCard.tsx` component with manual fetch button
- Create simple bar graph visualization (no external charting library)
- Display Fair Use Score with color indicator
- Add states: idle, loading, loaded, error

**Phase 4: Integration**
- Add `ActivityGraphCard` at TOP of Account Tab (before Welcome Card)
- Test end-to-end flow with real LinkedIn data

### Post-Implementation Testing

After completing all implementation steps, verify:

1. **Fetch Test:** Click fetch button → loading state → data displays
2. **Graph Test:** Bar graph shows 14 days with correct counts
3. **Score Test:** Fair Use Score reflects safe/warning/danger zones
4. **Error Test:** Handle network errors gracefully
5. **State Test:** Loading spinner, error messages, empty state all work
6. **Integration Test:** Component fits naturally in Account Tab layout

### Expected Outcome
- Functional activity graph showing 14-day comment history
- Accurate Fair Use Score calculation
- Clear loading and error states
- Manual fetch UX (no auto-fetch on tab open)

---

## Scope

**In-Scope:**
- Extend `fetchMemberComments()` to support 14-day time window (modify `MAX_PAGES` logic)
- Create `ActivityGraphCard.tsx` component with simple bar graph
- Create `useCommentHistory.ts` hook for data fetching and grouping
- Calculate Fair Use Score V1 (simple algorithm based on daily average and spikiness)
- Manual fetch trigger (icon button, no auto-fetch)
- Loading, error, empty, and loaded states
- Integration at top of Account Tab

**Out-of-Scope:**
- Auto-fetch on tab open (too much data)
- Database persistence of history (client-side only for V1)
- Advanced charting libraries (use simple CSS bars)
- Real-time updates or polling
- Historical trend analysis beyond 14 days
- Reputation score estimation (future feature)
- Warm-up protocol enforcement (future feature)

## Assumptions and Constraints

**Assumptions:**
- `fetchMemberComments()` can be extended without breaking existing usage (save-profile tab)
- LinkedIn API returns `time: number` (Unix timestamp) for all comments
- 14 days = reasonable data volume (estimate 700+ comments max if 50/day)
- Pagination delay of 300ms is sufficient for rate limiting
- GraphQL queryId extraction continues to work
- Auth headers from storage remain valid during fetch

**Constraints:**
- Must NOT auto-fetch (user initiates manually via button)
- Must reuse existing LinkedIn API patterns (no new endpoints)
- Must work with existing auth store (no new auth logic)
- Must support 14-day window (LinkedIn safety guideline reference)
- Client-side only (no database changes)
- Use existing UI components from `@sassy/ui`

## Functional Requirements

### 1. Extended Comment Fetcher

**File:** `apps/wxt-extension/entrypoints/linkedin.content/save-profile/linkedin-comments-fetcher.ts`

**Changes:**
- Add optional `timeWindowDays` parameter to `fetchMemberComments(profileUrn: string, timeWindowDays?: number)`
- Default behavior: `timeWindowDays = undefined` → use existing `MAX_PAGES = 2` logic (backward compatible)
- New behavior: `timeWindowDays = 14` → fetch until oldest comment is older than 14 days
- Stop conditions:
  - If `timeWindowDays` provided: Stop when `comment.time < (now - 14 days in milliseconds)`
  - If `timeWindowDays` not provided: Stop at `MAX_PAGES = 2` (existing behavior)
  - Always stop if `hasMore = false` (no more pagination)
- Maintain existing pagination logic (paginationToken, 300ms delay, deduplication via seenUrns)
- Return array of `CommentData[]` as before

**Time Calculation:**
```typescript
const now = Date.now();
const cutoffTime = now - (timeWindowDays * 24 * 60 * 60 * 1000);
// Stop when comment.time < cutoffTime
```

### 2. Comment History Hook

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/use-comment-history.ts`

**Purpose:** Fetch 14-day comment history and group by date

**Interface:**
```typescript
interface CommentHistoryData {
  // Daily counts: { "2026-02-06": 12, "2026-02-05": 8, ... }
  dailyCounts: Record<string, number>;
  // Total comments in 14-day window
  totalComments: number;
  // Date range
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface UseCommentHistoryReturn {
  data: CommentHistoryData | null;
  isLoading: boolean;
  error: Error | null;
  fetch: () => Promise<void>;
}

export function useCommentHistory(): UseCommentHistoryReturn
```

**Implementation:**
- Use `useState` for data, isLoading, error
- `fetch()` function:
  1. Get current LinkedIn profile URN from `useAccountStore().currentLinkedIn.profileUrn`
  2. Call `fetchMemberComments(profileUrn, 14)`
  3. Filter comments where `time !== null`
  4. Group by date using `new Date(time).toISOString().split('T')[0]` (YYYY-MM-DD)
  5. Create `dailyCounts` object with counts per date
  6. Fill in missing dates with 0 (ensure all 14 days present)
  7. Return `CommentHistoryData`
- Handle errors: network failures, missing auth, no profile URN

### 3. Activity Graph Card Component

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/ActivityGraphCard.tsx`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Activity Graph               [Fetch 🔄] │ <- CardHeader with title and fetch button
├─────────────────────────────────────────┤
│                                         │
│  [Simple Bar Graph - 14 days]          │ <- Daily comment counts as bars
│                                         │
│  Fair Use Score: [Green/Yellow/Red]    │ <- Score indicator
│  Daily Avg: 12 | Spikiness: Low        │ <- Metrics
│                                         │
└─────────────────────────────────────────┘
```

**States:**
1. **Idle:** "Click fetch button to load 14-day activity"
2. **Loading:** Spinner with "Fetching comment history..."
3. **Loaded:** Bar graph + Fair Use Score + metrics
4. **Error:** Error message with retry button

**Bar Graph:**
- Simple CSS-based bar chart (no external library)
- X-axis: Last 14 days (show date labels, rotate if needed)
- Y-axis: Comment count (max value = highest daily count)
- Bar height: `(count / maxCount) * 100%`
- Bar colors: Green (0-30), Yellow (31-40), Red (41+) based on daily count
- Tooltip on hover: "Feb 5: 12 comments"

**Fair Use Score Algorithm (V1 - Simple):**
```typescript
function calculateFairUseScore(dailyCounts: Record<string, number>): {
  score: 'safe' | 'warning' | 'danger';
  dailyAverage: number;
  spikiness: 'low' | 'medium' | 'high';
  maxDaily: number;
} {
  const counts = Object.values(dailyCounts);
  const total = counts.reduce((sum, c) => sum + c, 0);
  const dailyAverage = total / 14;
  const maxDaily = Math.max(...counts);

  // Spikiness = ratio of max to average
  const spikeRatio = dailyAverage > 0 ? maxDaily / dailyAverage : 0;
  const spikiness = spikeRatio > 3 ? 'high' : spikeRatio > 2 ? 'medium' : 'low';

  // Score based on daily average and max
  let score: 'safe' | 'warning' | 'danger';
  if (dailyAverage <= 30 && maxDaily <= 40) {
    score = 'safe';
  } else if (dailyAverage <= 40 && maxDaily <= 50) {
    score = 'warning';
  } else {
    score = 'danger';
  }

  return { score, dailyAverage: Math.round(dailyAverage), spikiness, maxDaily };
}
```

**Score Display:**
- Safe (Green): "Your activity looks natural and safe"
- Warning (Yellow): "Approaching LinkedIn's comfort zone - consider slowing down"
- Danger (Red): "High risk of detection - reduce activity immediately"

**Components Used:**
- `Card`, `CardHeader`, `CardTitle`, `CardContent` from `@sassy/ui/card`
- `Button` from `@sassy/ui/button`
- `Badge` from `@sassy/ui/badge`
- `Loader2`, `RefreshCw`, `AlertCircle` from `lucide-react`

### 4. Integration into Account Tab

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/AccountTab.tsx`

**Changes:**
- Import `ActivityGraphCard`
- Add at TOP of component return, before existing Welcome Card
- Order: `ActivityGraphCard` → Welcome Card → OrgAccountsCard → CurrentLinkedInCard → Help Card

**Example:**
```tsx
return (
  <div id="ek-account-tab" className="flex flex-col gap-4 px-4">
    {/* NEW: Activity Graph at top */}
    <ActivityGraphCard />

    {/* Existing cards below */}
    <Card>
      <CardHeader>
        <CardTitle>Welcome back, {user?.firstName || "User"}!</CardTitle>
        ...
```

## Non-Functional Requirements

- **Performance:** Fetch should complete in <10 seconds for 14 days of data (depends on API)
- **UX:** Clear loading states, error handling with retry option
- **Responsive:** Graph scales down on small viewports
- **Accessibility:** Semantic HTML, aria-labels on interactive elements
- **Code Quality:** TypeScript strict mode, clean component structure
- **Reusability:** Comment fetcher extension doesn't break existing usage

## Acceptance Criteria

1. ✅ `fetchMemberComments()` supports optional `timeWindowDays` parameter
2. ✅ Backward compatibility: existing 2-page fetch still works in save-profile tab
3. ✅ `useCommentHistory()` hook fetches 14 days and groups by date
4. ✅ `ActivityGraphCard` displays at top of Account Tab
5. ✅ Manual fetch button triggers data load (no auto-fetch)
6. ✅ Loading state shows spinner with clear message
7. ✅ Bar graph displays all 14 days with correct counts
8. ✅ Bar colors reflect safety thresholds (green/yellow/red)
9. ✅ Fair Use Score displays with correct color and message
10. ✅ Daily average, max daily, and spikiness metrics shown
11. ✅ Error state displays with retry button
12. ✅ Empty state (no comments) handled gracefully
13. ✅ Graph is responsive and readable on small screens
14. ✅ No TypeScript errors
15. ✅ No console errors during fetch or render

## Implementation Checklist

### Step 1: Extend Comment Fetcher for Time-Based Pagination

**File:** `apps/wxt-extension/entrypoints/linkedin.content/save-profile/linkedin-comments-fetcher.ts`

**Actions:**
- Update `fetchMemberComments` signature: `export async function fetchMemberComments(profileUrn: string, timeWindowDays?: number): Promise<CommentData[]>`
- Add time cutoff calculation at start of function:
  ```typescript
  const now = Date.now();
  const usePagination = timeWindowDays === undefined;
  const cutoffTime = timeWindowDays ? now - (timeWindowDays * 24 * 60 * 60 * 1000) : 0;
  ```
- Modify while loop condition:
  ```typescript
  while (hasMore && (usePagination ? pageCount < MAX_PAGES : true)) {
  ```
- Add time-based stop condition inside loop after parsing comments:
  ```typescript
  if (!usePagination && pageComments.length > 0) {
    // Check if we've reached cutoff time
    const oldestCommentTime = Math.min(
      ...pageComments.filter(c => c.time !== null).map(c => c.time as number)
    );
    if (oldestCommentTime < cutoffTime) {
      hasMore = false;
      console.log(`Reached cutoff time: ${new Date(cutoffTime).toISOString()}`);
    }
  }
  ```
- Update final console log to show time window if used:
  ```typescript
  console.log(
    `Fetched ${allComments.length} comments ${timeWindowDays ? `in ${timeWindowDays} days` : `across ${pageCount} pages`}`
  );
  ```

**Verification:**
- Existing calls `fetchMemberComments(profileUrn)` still work (2 pages)
- New calls `fetchMemberComments(profileUrn, 14)` fetch 14 days

---

### Step 2: Create Comment History Hook

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/use-comment-history.ts`

**Actions:**
- Create new file with imports:
  ```typescript
  import { useState } from "react";
  import { fetchMemberComments } from "../save-profile/linkedin-comments-fetcher";
  import { useAccountStore } from "../stores";
  import type { CommentData } from "../save-profile/saved-profile-store";
  ```
- Define interfaces:
  ```typescript
  export interface CommentHistoryData {
    dailyCounts: Record<string, number>;
    totalComments: number;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
  }

  interface UseCommentHistoryReturn {
    data: CommentHistoryData | null;
    isLoading: boolean;
    error: Error | null;
    fetch: () => Promise<void>;
  }
  ```
- Implement hook:
  ```typescript
  export function useCommentHistory(): UseCommentHistoryReturn {
    const [data, setData] = useState<CommentHistoryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { currentLinkedIn } = useAccountStore();

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profileUrn = currentLinkedIn.profileUrn;
        if (!profileUrn) {
          throw new Error("No LinkedIn profile URN available");
        }

        // Fetch 14 days of comments
        const comments = await fetchMemberComments(profileUrn, 14);

        // Filter comments with valid timestamps
        const validComments = comments.filter(c => c.time !== null);

        // Group by date (YYYY-MM-DD)
        const dailyCounts: Record<string, number> = {};
        for (const comment of validComments) {
          const date = new Date(comment.time!).toISOString().split('T')[0];
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        }

        // Generate all 14 dates (fill missing with 0)
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 13); // 14 days total

        for (let i = 0; i < 14; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          if (!(dateStr in dailyCounts)) {
            dailyCounts[dateStr] = 0;
          }
        }

        const result: CommentHistoryData = {
          dailyCounts,
          totalComments: validComments.length,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        };

        setData(result);
      } catch (e) {
        console.error("Failed to fetch comment history:", e);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    };

    return { data, isLoading, error, fetch };
  }
  ```

**Verification:**
- Hook compiles without TypeScript errors
- Returns correct interface

---

### Step 3: Create Fair Use Score Calculation

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/ActivityGraphCard.tsx`

**Actions:**
- Create new file with imports:
  ```typescript
  import { useState } from "react";
  import { RefreshCw, Loader2, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
  import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
  import { Button } from "@sassy/ui/button";
  import { Badge } from "@sassy/ui/badge";
  import { useCommentHistory } from "./use-comment-history";
  import type { CommentHistoryData } from "./use-comment-history";
  ```
- Define Fair Use Score calculation function:
  ```typescript
  interface FairUseScore {
    score: 'safe' | 'warning' | 'danger';
    dailyAverage: number;
    spikiness: 'low' | 'medium' | 'high';
    maxDaily: number;
  }

  function calculateFairUseScore(data: CommentHistoryData): FairUseScore {
    const counts = Object.values(data.dailyCounts);
    const total = counts.reduce((sum, c) => sum + c, 0);
    const dailyAverage = total / 14;
    const maxDaily = Math.max(...counts);

    // Spikiness = ratio of max to average
    const spikeRatio = dailyAverage > 0 ? maxDaily / dailyAverage : 0;
    const spikiness = spikeRatio > 3 ? 'high' : spikeRatio > 2 ? 'medium' : 'low';

    // Score based on daily average and max
    let score: 'safe' | 'warning' | 'danger';
    if (dailyAverage <= 30 && maxDaily <= 40) {
      score = 'safe';
    } else if (dailyAverage <= 40 && maxDaily <= 50) {
      score = 'warning';
    } else {
      score = 'danger';
    }

    return { score, dailyAverage: Math.round(dailyAverage), spikiness, maxDaily };
  }
  ```

**Verification:**
- Function returns correct score for test data

---

### Step 4: Create Bar Graph Component

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/ActivityGraphCard.tsx` (continued)

**Actions:**
- Add bar graph sub-component:
  ```typescript
  function SimpleBarGraph({ data }: { data: CommentHistoryData }) {
    const counts = Object.entries(data.dailyCounts).sort(([a], [b]) => a.localeCompare(b));
    const maxCount = Math.max(...counts.map(([, count]) => count), 1);

    return (
      <div className="space-y-2">
        <div className="flex items-end justify-between gap-1" style={{ height: '120px' }}>
          {counts.map(([date, count]) => {
            const heightPercent = (count / maxCount) * 100;
            const barColor = count <= 30 ? 'bg-green-500' : count <= 40 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <div key={date} className="flex flex-col items-center flex-1 min-w-0">
                <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                  <div
                    className={`w-full ${barColor} rounded-t transition-all hover:opacity-80`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${date}: ${count} comments`}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  ```

**Verification:**
- Bars render at correct heights
- Colors reflect thresholds
- Date labels are readable

---

### Step 5: Create Score Display Component

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/ActivityGraphCard.tsx` (continued)

**Actions:**
- Add score display sub-component:
  ```typescript
  function FairUseScoreDisplay({ data }: { data: CommentHistoryData }) {
    const score = calculateFairUseScore(data);

    const scoreConfig = {
      safe: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle,
        message: 'Your activity looks natural and safe',
      },
      warning: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: AlertTriangle,
        message: "Approaching LinkedIn's comfort zone - consider slowing down",
      },
      danger: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertCircle,
        message: 'High risk of detection - reduce activity immediately',
      },
    };

    const config = scoreConfig[score.score];
    const Icon = config.icon;

    return (
      <div className={`mt-4 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${config.color} mt-0.5`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${config.color}`}>Fair Use Score</span>
              <Badge variant={score.score === 'safe' ? 'default' : score.score === 'warning' ? 'secondary' : 'destructive'}>
                {score.score.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{config.message}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Daily Avg: <strong>{score.dailyAverage}</strong></span>
              <span>Max Daily: <strong>{score.maxDaily}</strong></span>
              <span>Spikiness: <strong>{score.spikiness}</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

**Verification:**
- Score displays with correct color and icon
- Message matches score level
- Metrics are accurate

---

### Step 6: Create Main ActivityGraphCard Component

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/ActivityGraphCard.tsx` (continued)

**Actions:**
- Add main component:
  ```typescript
  export function ActivityGraphCard() {
    const { data, isLoading, error, fetch } = useCommentHistory();

    const handleFetch = () => {
      fetch();
    };

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">14-Day Activity Graph</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFetch}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Fetch comment history"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Idle state */}
          {!data && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click the refresh button to load your 14-day activity
              </p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Fetching comment history...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-red-600 mb-3">{error.message}</p>
              <Button variant="outline" size="sm" onClick={handleFetch}>
                Retry
              </Button>
            </div>
          )}

          {/* Loaded state */}
          {data && !isLoading && (
            <>
              <SimpleBarGraph data={data} />
              <FairUseScoreDisplay data={data} />
            </>
          )}
        </CardContent>
      </Card>
    );
  }
  ```

**Verification:**
- All states render correctly
- Fetch button triggers hook
- Component is self-contained

---

### Step 7: Integrate into Account Tab

**File:** `apps/wxt-extension/entrypoints/linkedin.content/account-tab/AccountTab.tsx`

**Actions:**
- Add import at top:
  ```typescript
  import { ActivityGraphCard } from "./ActivityGraphCard";
  ```
- Add component at top of return statement (before Welcome Card):
  ```typescript
  return (
    <div id="ek-account-tab" className="flex flex-col gap-4 px-4">
      {/* NEW: Activity Graph at top */}
      <ActivityGraphCard />

      {/* Existing Welcome Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Welcome back, {user?.firstName || "User"}!</CardTitle>
            ...
  ```

**Verification:**
- ActivityGraphCard appears at top of Account Tab
- Existing cards remain in correct order below
- No layout issues

---

### Step 8: End-to-End Testing

**Actions:**
- Open extension on LinkedIn profile page
- Navigate to Account Tab
- Verify ActivityGraphCard displays at top with idle state
- Click refresh button
- Verify loading state shows spinner
- Wait for fetch to complete
- Verify bar graph displays 14 days with correct data
- Verify Fair Use Score displays with appropriate color/message
- Check daily metrics are accurate
- Test error state by disconnecting network
- Verify error message and retry button work
- Test with different activity levels (low, medium, high)

**Verification Checklist:**
- ✅ Component renders in correct position
- ✅ Idle state displays call-to-action
- ✅ Loading state shows spinner with message
- ✅ Bar graph displays all 14 days
- ✅ Bar heights and colors are correct
- ✅ Fair Use Score matches expected value
- ✅ Score color and message are appropriate
- ✅ Metrics (daily avg, max, spikiness) are accurate
- ✅ Error state handles network failures
- ✅ Retry button works
- ✅ No TypeScript errors in console
- ✅ No runtime errors in console

---

## Risks and Mitigations

**Risk 1:** LinkedIn API may rate limit 14-day fetches
- **Mitigation:** Use existing 300ms delay, add warning in UI about fetch time, user initiates manually (no auto-fetch)

**Risk 2:** Comment timestamps may be inconsistent or null
- **Mitigation:** Filter out comments with `time === null`, handle empty data gracefully

**Risk 3:** Bar graph may not be readable on small screens
- **Mitigation:** Use responsive CSS, truncate date labels, test on mobile viewport

**Risk 4:** Fair Use Score algorithm may be inaccurate
- **Mitigation:** Label as "V1" in code, plan for refinement based on user feedback, reference user guidelines thresholds

**Risk 5:** Fetching 14 days may take too long
- **Mitigation:** Show clear loading state, add progress indicator if needed, consider caching (future enhancement)

**Risk 6:** Modifying fetchMemberComments may break save-profile tab
- **Mitigation:** Make timeWindowDays optional (backward compatible), test existing usage

## Integration Notes

- **Comment Fetcher:** Optional parameter maintains backward compatibility
- **Auth Headers:** Reuse existing auth store, no new auth logic
- **LinkedIn API:** Continue using GraphQL queryId pattern from existing code
- **UI Components:** Use `@sassy/ui` components for consistency
- **Store Pattern:** Hook-based state (no Zustand store needed for V1)
- **Account Tab:** Add at top, preserve existing card order
- **Time Calculation:** Use Unix timestamps (milliseconds), convert to YYYY-MM-DD for grouping
- **Date Formatting:** Use native `Date` API, no external library

---

**End of Plan**

---

## IMPLEMENTATION CHECKLIST (Summary)

1. ✅ Extend `fetchMemberComments()` with optional `timeWindowDays` parameter in `linkedin-comments-fetcher.ts`
2. ✅ Create `use-comment-history.ts` hook with fetch/group logic
3. ✅ Create `ActivityGraphCard.tsx` with `calculateFairUseScore()` function
4. ✅ Implement `SimpleBarGraph` sub-component in `ActivityGraphCard.tsx`
5. ✅ Implement `FairUseScoreDisplay` sub-component in `ActivityGraphCard.tsx`
6. ✅ Implement main `ActivityGraphCard` component with states (idle/loading/error/loaded)
7. ✅ Integrate `ActivityGraphCard` at top of `AccountTab.tsx`
8. ✅ Test end-to-end: fetch → load → display → score calculation

---

**Next Steps:**
Review this plan carefully. When ready to implement, say "ENTER EXECUTE MODE" and I will route to the execute-agent to begin implementation following this specification with 100% fidelity.
