# LinkedIn Analytics Viewer - Plan

**Date:** 02-01-26
**Complexity:** Simple
**Status:** ⏳ PLANNED

## Overview

Add LinkedIn profile analytics viewing capability to the extension's Analytics tab (Tab 1 - currently MAIL placeholder). The feature fetches the HTML page from `https://www.linkedin.com/analytics/profile-views/`, parses embedded JSON data from `<code>` tags, and displays profile view statistics (total view count and period). The GraphQL endpoint returns null data, so the implementation uses HTML fetching + DOM parsing approach.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Scope](#scope)
- [Assumptions and Constraints](#assumptions-and-constraints)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Risks and Mitigations](#risks-and-mitigations)
- [Integration Notes](#integration-notes)
- [Cursor + RIPER-5 Guidance](#cursor--riper-5-guidance)

## Goals and Success Metrics

**Goals:**
- Display LinkedIn profile analytics (view count + period) in Tab 1 (Analytics)
- Fetch data from HTML page using intercepted auth cookies
- Parse embedded JSON from `<code>` tags in HTML response
- Provide clear UI showing analytics data with error handling

**Success Metrics:**
- Analytics tab displays "12,227 views in last 90 days" (from sample data)
- Data auto-refreshes when tab is opened
- Error states display clearly when auth fails or data unavailable
- Loading states provide user feedback during fetch
- Integration matches existing tab patterns (AccountTab, ExploreTab, ShareTab)

## Scope

**In-Scope:**
- Create `linkedin-profile-view-fetcher-personal.ts` - Fetch HTML and parse embedded JSON
- Create `analytics-store.ts` - Zustand store for analytics state management
- Create `AnalyticsTab.tsx` - UI component displaying analytics data
- Update `sidebar-store.ts` - Change Tab 1 from MAIL to ANALYTICS
- Update `LinkedInSidebar.tsx` - Integrate AnalyticsTab component
- Type definitions for analytics data structures
- Error handling for missing auth, failed fetches, parsing errors
- Loading states during data fetching
- Manual refresh button in UI

**Out-of-Scope:**
- Historical trend charts or graphs
- Detailed viewer demographics (requires premium LinkedIn)
- Export/download analytics data
- Comparison across time periods
- Notifications for analytics milestones
- GraphQL endpoint usage (returns null data per user clarification)

## Assumptions and Constraints

**Assumptions:**
- Auth cookies are already intercepted by background script (`apps/wxt-extension/entrypoints/background/index.ts` lines 163-184)
- LinkedIn embeds analytics data in `<code>` tags within HTML response
- Sample data structure at line 275 in `sample-response.html` is representative
- User wants to see default 90-day view (not customizable periods)
- HTML page URL `https://www.linkedin.com/analytics/profile-views/` is stable
- Data location pattern in `<code id="bpr-guid-*">` is consistent

**Constraints:**
- Must use HTML fetching approach (GraphQL endpoint returns null data)
- Must reuse existing auth interception from background script
- Must follow existing store patterns (Zustand)
- Must match existing tab UI patterns (Card components, loading states)
- Must handle premium vs non-premium LinkedIn accounts gracefully
- Single data point display (total views + period), not time-series data

## Functional Requirements

1. **Data Fetching**
   - Fetch HTML from `https://www.linkedin.com/analytics/profile-views/`
   - Use intercepted auth cookies from `storage.getItem<LinkedInAuth>("local:auth")`
   - Include required headers: `cookie`, `csrf-token`, `x-li-page-instance`, `x-li-track`
   - Parse HTML response to extract `<code>` tag JSON data
   - Handle network errors, auth failures, and rate limiting

2. **Data Parsing**
   - Extract JSON from `<code>` tags (id pattern: `bpr-guid-*`)
   - Parse nested `included` array for analytics entities
   - Find analytics view data (type contains `edgeinsightsanalytics` or `WVMP`)
   - Extract total view count and period (default 90 days)
   - Handle missing or malformed JSON gracefully

3. **State Management (analytics-store.ts)**
   - Store analytics data: `{ viewCount: number | null; period: number | null; lastFetched: Date | null }`
   - Store loading state: `isLoading: boolean`
   - Store error state: `error: string | null`
   - Action: `fetchAnalytics()` - triggers fetch and parse
   - Action: `clearError()` - resets error state
   - Auto-fetch on store initialization (first mount)

4. **UI Display (AnalyticsTab.tsx)**
   - **Loading State**: Skeleton loader matching AccountTab pattern
   - **Success State**: Card displaying view count and period
   - **Error State**: Card with error message and retry button
   - **Empty State**: Message when no analytics data available
   - **Refresh Button**: Manual trigger to re-fetch data
   - **Last Updated**: Display timestamp of last fetch

5. **Tab Integration**
   - Update `SIDEBAR_TABS.MAIL` to `SIDEBAR_TABS.ANALYTICS` in sidebar-store.ts
   - Replace Mail icon with appropriate analytics icon (TrendingUp or BarChart3)
   - Update LinkedInSidebar.tsx Tab 1 rendering to use AnalyticsTab component
   - Remove "Mail content coming soon..." placeholder

## Non-Functional Requirements

- **Performance**: Data fetch completes within 3 seconds under normal network conditions
- **Error Handling**: All fetch/parse errors display user-friendly messages
- **Type Safety**: Full TypeScript coverage with strict mode compliance
- **Code Quality**: Follow existing patterns from linkedin-comments-fetcher.ts and use-linkedin-profile.ts
- **Accessibility**: Card components use semantic HTML and ARIA labels
- **Consistency**: Match existing tab styling (AccountTab, ExploreTab, ShareTab)
- **Logging**: Console logs for debugging fetch/parse process (can be removed in production)

## Acceptance Criteria

1. ✅ Tab 1 shows "Analytics" label and icon (not "Mail")
2. ✅ Opening Analytics tab auto-fetches analytics data
3. ✅ Successfully displays view count (e.g., "12,227") and period ("90 days")
4. ✅ Loading state shows skeleton loader while fetching
5. ✅ Error state displays clear message when:
   - Auth headers missing
   - Fetch request fails
   - HTML parsing fails
   - No analytics data found
6. ✅ Refresh button manually triggers data re-fetch
7. ✅ "Last updated" timestamp updates after successful fetch
8. ✅ Store persists data across tab switches (no unnecessary re-fetches)
9. ✅ TypeScript compiles without errors
10. ✅ No console errors during normal operation
11. ✅ UI matches existing tab styling patterns
12. ✅ Works with both premium and non-premium LinkedIn accounts

## Implementation Checklist

### 1. Create Type Definitions
**File:** `apps/wxt-extension/entrypoints/linkedin.content/utils/linkedin-profile-view-fetcher-personal.ts` (top section)

```typescript
// Type definitions for LinkedIn Auth (reuse from linkedin-comments-fetcher.ts)
interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

// Analytics data structure
export interface LinkedInAnalyticsData {
  viewCount: number;
  period: number; // in days (e.g., 90)
  lastFetched: Date;
}

// Raw analytics response structure (from LinkedIn HTML JSON)
interface AnalyticsMetricItem {
  value?: number;
  name?: { text?: string };
  description?: { text?: string };
  subhead?: { text?: string };
}
```

### 2. Create Analytics Fetcher - HTML Fetch Function
**File:** `apps/wxt-extension/entrypoints/linkedin.content/utils/linkedin-profile-view-fetcher-personal.ts`

**Function:** `async fetchAnalyticsHTML(): Promise<string>`

- Fetch from `https://www.linkedin.com/analytics/profile-views/`
- Retrieve auth from `storage.getItem<LinkedInAuth>("local:auth")`
- Throw error if auth missing: `"Missing Auth Headers. Please refresh page."`
- Set headers:
  - `accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"`
  - `cookie: auth.cookie`
  - `sec-fetch-dest: "document"`
  - `sec-fetch-mode: "navigate"`
  - `upgrade-insecure-requests: "1"`
- Return HTML text response
- Catch and re-throw network errors with descriptive messages

### 3. Create Analytics Fetcher - HTML Parser Function
**File:** `apps/wxt-extension/entrypoints/linkedin.content/utils/linkedin-profile-view-fetcher-personal.ts`

**Function:** `parseAnalyticsFromHTML(html: string): LinkedInAnalyticsData | null`

- Create DOMParser: `new DOMParser().parseFromString(html, "text/html")`
- Query all `<code>` elements: `doc.querySelectorAll("code")`
- Loop through code elements:
  - Check if `textContent` includes `"premiumDashAnalyticsView"` or `"edgeinsightsanalytics"`
  - Parse JSON: `JSON.parse(el.textContent)`
  - Navigate to `included` array in parsed JSON
  - Find analytics entities (look for items with `$type` containing `"analyticsView"` or `"MetricsItem"`)
  - Extract view count from `value` field (type: number)
  - Extract period from description or default to 90
  - Return `{ viewCount, period, lastFetched: new Date() }`
- Return `null` if no analytics data found
- Catch JSON parse errors and return `null`
- Log warnings for debugging: `console.warn("No analytics data found in HTML")`

### 4. Create Analytics Fetcher - Main Export Function
**File:** `apps/wxt-extension/entrypoints/linkedin.content/utils/linkedin-profile-view-fetcher-personal.ts`

**Function:** `export async function fetchLinkedInAnalytics(): Promise<LinkedInAnalyticsData>`

- Call `fetchAnalyticsHTML()` to get raw HTML
- Call `parseAnalyticsFromHTML(html)` to extract data
- If parse returns `null`, throw error: `"No analytics data found in response"`
- Return parsed analytics data
- Catch all errors and re-throw with context: `"Failed to fetch LinkedIn analytics: ${error.message}"`

### 5. Create Analytics Store - State Interface
**File:** `apps/wxt-extension/entrypoints/linkedin.content/stores/analytics-store.ts`

```typescript
import { create } from "zustand";
import type { LinkedInAnalyticsData } from "../utils/linkedin-profile-view-fetcher-personal";

interface AnalyticsState {
  data: LinkedInAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
}

interface AnalyticsActions {
  fetchAnalytics: () => Promise<void>;
  clearError: () => void;
}

type AnalyticsStore = AnalyticsState & AnalyticsActions;
```

### 6. Create Analytics Store - Zustand Implementation
**File:** `apps/wxt-extension/entrypoints/linkedin.content/stores/analytics-store.ts`

```typescript
export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  // Initial state
  data: null,
  isLoading: false,
  error: null,

  // Action: Fetch analytics data
  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchLinkedInAnalytics();
      set({ data, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      set({ error: errorMessage, isLoading: false });
      console.error("Analytics fetch error:", err);
    }
  },

  // Action: Clear error state
  clearError: () => set({ error: null }),
}));
```

### 7. Create AnalyticsTab Component - Imports and Setup
**File:** `apps/wxt-extension/entrypoints/linkedin.content/analytics-tab/AnalyticsTab.tsx`

```typescript
import { useEffect } from "react";
import { TrendingUp, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sassy/ui/card";
import { Badge } from "@sassy/ui/badge";
import { useAnalyticsStore } from "../stores/analytics-store";
```

### 8. Create AnalyticsTab Component - Loading State
**File:** `apps/wxt-extension/entrypoints/linkedin.content/analytics-tab/AnalyticsTab.tsx`

**Component:** `function LoadingState()`

- Return Card with:
  - CardHeader with Loader2 icon (animated spin)
  - CardTitle: "Loading Analytics..."
  - CardDescription: "Fetching your profile view data"
  - CardContent with skeleton placeholder (gray animated pulse div)

### 9. Create AnalyticsTab Component - Error State
**File:** `apps/wxt-extension/entrypoints/linkedin.content/analytics-tab/AnalyticsTab.tsx`

**Component:** `function ErrorState({ error, onRetry }: { error: string; onRetry: () => void })`

- Return Card with:
  - CardHeader with AlertCircle icon (text-destructive color)
  - CardTitle: "Error Loading Analytics"
  - CardDescription: `{error}` (display error message)
  - CardContent with:
    - Retry button calling `onRetry`
    - Help text: "Make sure you're signed into LinkedIn"

### 10. Create AnalyticsTab Component - Success State
**File:** `apps/wxt-extension/entrypoints/linkedin.content/analytics-tab/AnalyticsTab.tsx`

**Component:** `function AnalyticsContent({ data, onRefresh }: { data: LinkedInAnalyticsData; onRefresh: () => void })`

- Return Card with:
  - CardHeader:
    - TrendingUp icon
    - CardTitle: "Profile Views"
    - Refresh button (RefreshCw icon) calling `onRefresh`
  - CardContent:
    - Large number display: `{data.viewCount.toLocaleString()}` (e.g., "12,227")
    - Period badge: `{data.period} days`
    - Last updated text: `Last updated: {data.lastFetched.toLocaleTimeString()}`
    - Optional: small text linking to full analytics page on LinkedIn

### 11. Create AnalyticsTab Component - Main Export
**File:** `apps/wxt-extension/entrypoints/linkedin.content/analytics-tab/AnalyticsTab.tsx`

**Component:** `export function AnalyticsTab()`

- Use store: `const { data, isLoading, error, fetchAnalytics } = useAnalyticsStore()`
- `useEffect(() => { fetchAnalytics(); }, [])` - Auto-fetch on mount
- Conditional rendering:
  - If `isLoading`: render `<LoadingState />`
  - If `error`: render `<ErrorState error={error} onRetry={fetchAnalytics} />`
  - If `data`: render `<AnalyticsContent data={data} onRefresh={fetchAnalytics} />`
  - Else (empty): render Card with "No analytics data available"
- Wrap in `<div className="flex flex-col gap-4 px-4">` (matches other tabs)

### 12. Update Sidebar Store - Change MAIL to ANALYTICS
**File:** `apps/wxt-extension/entrypoints/linkedin.content/stores/sidebar-store.ts`

**Changes:**
- Line 6: Change `MAIL: 1,` to `ANALYTICS: 1,`
- Update comment if present (Tab 1 is now Analytics, not Mail)

### 13. Update LinkedInSidebar - Import AnalyticsTab
**File:** `apps/wxt-extension/entrypoints/linkedin.content/LinkedInSidebar.tsx`

**Changes:**
- Add import: `import { AnalyticsTab } from "./analytics-tab/AnalyticsTab";`
- Change Tab 1 icon in `tabs` array (line 44):
  - Replace `Mail` icon with `TrendingUp` or `BarChart3`
  - Update title from "Mail" to "Analytics"

### 14. Update LinkedInSidebar - Integrate AnalyticsTab Component
**File:** `apps/wxt-extension/entrypoints/linkedin.content/LinkedInSidebar.tsx`

**Changes:**
- Line 316: Replace `{selectedTab === 1 && <div>Mail content coming soon...</div>}`
- With: `{selectedTab === 1 && <AnalyticsTab />}`

### 15. Update Store Index Export
**File:** `apps/wxt-extension/entrypoints/linkedin.content/stores/index.ts`

**Changes:**
- Add export: `export * from "./analytics-store";`
- Ensure `SIDEBAR_TABS` export is updated if needed

### 16. Test and Verify
**Manual Testing Steps:**

1. **Build Extension:**
   - Run `pnpm run dev` (or build command)
   - Verify TypeScript compiles without errors

2. **Load Extension in Browser:**
   - Load unpacked extension in Chrome
   - Navigate to LinkedIn.com
   - Open browser profile (ensure logged into LinkedIn)

3. **Test Analytics Tab:**
   - Open extension sidebar
   - Click Tab 1 (Analytics icon/label)
   - Verify loading state appears briefly
   - Verify analytics data displays (view count + period)
   - Verify "Last updated" timestamp shows current time

4. **Test Refresh:**
   - Click refresh button
   - Verify loading state appears
   - Verify data re-fetches and timestamp updates

5. **Test Error Handling:**
   - Sign out of LinkedIn
   - Refresh page
   - Open Analytics tab
   - Verify error message displays
   - Verify retry button appears and works

6. **Test Edge Cases:**
   - Switch between tabs rapidly (verify no race conditions)
   - Close and reopen sidebar (verify data persists)
   - Check console for warnings/errors

7. **Cross-Browser Testing (if applicable):**
   - Test in Firefox (if extension supports it)
   - Verify behavior is consistent

## Risks and Mitigations

**Risk 1:** LinkedIn changes HTML structure or data location
- **Mitigation:** Implement flexible JSON parsing with multiple fallback selectors; log warnings when data structure changes; add version detection for LinkedIn's analytics page

**Risk 2:** Auth cookie expires or becomes invalid mid-session
- **Mitigation:** Check auth validity before fetch; provide clear error message prompting page refresh; implement retry logic with exponential backoff

**Risk 3:** HTML response is too large causing performance issues
- **Mitigation:** Stream parse HTML instead of loading entire document; limit search to first 1000 `<code>` tags; set timeout on fetch request (5 seconds)

**Risk 4:** Non-premium LinkedIn accounts have different data structure
- **Mitigation:** Handle multiple data structure patterns; gracefully degrade when premium-only fields missing; test with both account types

**Risk 5:** Rate limiting from LinkedIn API
- **Mitigation:** Cache analytics data for 5 minutes; only re-fetch on manual refresh; display cached data with staleness indicator

## Integration Notes

- **Auth Pattern:** Reuse `storage.getItem<LinkedInAuth>("local:auth")` from linkedin-comments-fetcher.ts
- **Fetch Pattern:** Follow fetch + headers setup from linkedin-comments-fetcher.ts (lines 465-477)
- **Parse Pattern:** Use DOMParser approach similar to use-linkedin-profile.ts (lines 28-40)
- **Store Pattern:** Follow Zustand patterns from account-store.ts and saved-profile-store.ts
- **UI Pattern:** Match Card layout from AccountTab.tsx (Card, CardHeader, CardTitle, CardDescription, CardContent)
- **Icon Pattern:** Use lucide-react icons (TrendingUp for analytics, same pattern as Building2, Link, etc.)
- **Error Handling:** Follow existing console.error + state update patterns from comment-store.ts
- **Type Safety:** Import types from @sassy/ui for UI components; define domain types locally

## Cursor + RIPER-5 Guidance

**Cursor Plan Mode:**
- Import this checklist into Cursor Plan mode
- Execute steps sequentially (1-16)
- Check off items as completed
- Update status markers as progress is made

**RIPER-5 Mode:**
- **RESEARCH:** ✅ Complete - Analyzed sample-response.html, existing fetcher patterns, UI component structure
- **INNOVATE:** ✅ Complete - Selected Approach 3: Hybrid HTML Fetch + Targeted JSON Extract
- **PLAN:** ✅ Current - This plan document
- **EXECUTE:** Next - Implement following checklist exactly (requires explicit user approval)
- **REVIEW:** After execution - Validate against acceptance criteria

**Next Step:** User must approve plan and say "ENTER EXECUTE MODE" to begin implementation.

---

## Data Extraction Details (Technical Reference)

**HTML Structure:**
- URL: `https://www.linkedin.com/analytics/profile-views/`
- Data location: `<code>` tags (multiple instances)
- Target tag pattern: `id="bpr-guid-*"` or contains `premiumDashAnalyticsView`
- Sample line 275 reference: `analyticsEntityUrn` reference

**JSON Path to Analytics Data:**
1. Parse `<code>` tag textContent as JSON
2. Navigate to `data.included` array
3. Find item where `$type` contains `"edgeinsightsanalytics"` or `"MetricsItem"`
4. Extract `value` field (number) - this is view count
5. Extract period from `description.text` or default to 90
6. Example expected data: `{ viewCount: 12227, period: 90 }`

**Fallback Strategy:**
- If primary JSON path fails, search all `included` items for numeric `value` fields
- Look for associated text containing "views" or "profile views"
- Default period to 90 if not found
- Return null if no valid data structure found

**Error Messages:**
- Missing auth: "Authentication headers not found. Please refresh the LinkedIn page."
- Fetch failed: "Failed to fetch analytics page. Please check your connection."
- Parse failed: "Unable to parse analytics data. LinkedIn may have changed their format."
- No data: "No analytics data available. This might require LinkedIn Premium."
