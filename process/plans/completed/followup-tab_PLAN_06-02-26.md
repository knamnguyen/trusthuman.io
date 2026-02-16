# Follow-Up Tab Implementation - Plan

**Date:** 06-02-26
**Complexity:** Simple
**Status:** PLANNED

## Overview

Implement the Follow-Up tab in the LinkedIn sidebar to display mentions where the current user has been tagged in comments. The feature automatically fetches mentions from LinkedIn's API at configurable intervals and displays them in a scrollable list with full comment text, post context, reaction/comment counts, and navigation to the original post.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Assumptions and Constraints](#assumptions-and-constraints)
- [Technical Decisions](#technical-decisions)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Risks and Mitigations](#risks-and-mitigations)
- [Integration Notes](#integration-notes)

## Goals and Success Metrics

**Goals:**
- Display all mentions where the current user is tagged in LinkedIn comments
- Auto-fetch mentions at configurable intervals (5, 15, 30, 60 minutes, or disabled)
- Show full comment text, mentioner name, post context, and engagement metrics
- Provide one-click navigation to the original post
- Persist mentions data locally with watermark-based fetching strategy

**Success Metrics:**
- All mentions display correctly with full text (not truncated)
- Auto-fetch runs at configured interval without user interaction
- Watermark strategy prevents duplicate fetches and maintains chronological order
- Navigation to posts works correctly via LinkedInLink component
- UI matches existing sidebar tab design patterns (compact, readable, scrollable)

---

## Execution Brief

**IMPORTANT:** This is a SIMPLE (one-session) plan - implement continuously without approval gates. The steps below follow a logical dependency order but should be executed in one continuous session.

### Phase 1: Data Layer Setup
**What happens:** Create TypeScript interfaces, API fetcher with watermark logic, Zustand store with persistence.

### Phase 2: Auto-Fetch Infrastructure
**What happens:** Create interval config (similar to analytics auto-fetch), wire auto-fetch into content script initialization, handle account switching.

### Phase 3: UI Components
**What happens:** Build MentionCard component, FollowUpTab container with scroll, integrate LinkedInLink for navigation.

### Phase 4: Tab Integration
**What happens:** Add FOLLOWUP to SIDEBAR_TABS constant, add tab definition to LinkedInSidebar, wire tab rendering.

### Post-Implementation Testing

After completing all implementation steps, verify the following:

1. **Tab Visibility Test:** FOLLOWUP tab appears in sidebar (icon and label correct)
2. **Data Fetch Test:** Open DevTools, check console for auto-fetch logs on page load
3. **Storage Test:** Verify mentions stored in local storage with account ID key
4. **Watermark Test:** Trigger multiple fetches, verify no duplicates in UI
5. **Navigation Test:** Click "Go to post" link on a mention card, verify LinkedIn navigates correctly
6. **Interval Config Test:** Change auto-fetch interval in UI, verify interval updates in storage
7. **Manual Refresh Test:** Click refresh button, verify new mentions appear
8. **Empty State Test:** Clear storage, verify empty state displays
9. **Account Switch Test:** Switch LinkedIn accounts, verify mentions clear and re-fetch
10. **Read/Unread Test:** Verify read status displays correctly

### Expected Outcome
- Follow-Up tab functional with auto-fetching mentions
- Full comment text displayed without truncation
- Clickable navigation to original posts
- Configurable auto-fetch interval
- Watermark-based deduplication working
- No console errors or warnings

---

## Scope

**In-Scope:**
- Follow-Up tab in LinkedIn sidebar
- Mentions fetching from LinkedIn Voyager API (`/voyagerIdentityDashNotificationCards`)
- Watermark-based fetching strategy (entityUrn matching)
- Auto-fetch at configurable intervals (5, 15, 30, 60 minutes, or disabled)
- Zustand store with local storage persistence
- MentionCard component with mentioner avatar, name, comment text, post context, engagement counts
- LinkedInLink integration for navigation
- Manual refresh button
- Read/unread indicator
- Empty state when no mentions

**Out-of-Scope:**
- Mark as read/unread functionality (display only in this iteration)
- Filtering by read/unread status
- Searching mentions
- Exporting mentions data
- Notification badges on sidebar tab
- Real-time mentions (uses polling only)

## Assumptions and Constraints

**Assumptions:**
- LinkedIn Voyager API endpoint `/voyagerIdentityDashNotificationCards` is stable
- Auth cookies and CSRF token available via `storage.getItem<LinkedInAuth>("local:auth")`
- EntityUrn is globally unique and stable (safe for watermark deduplication)
- Mentions API returns normalized JSON with `data` and `included` arrays
- Current user account ID available via `useAccountStore().currentLinkedIn.profileUrn`
- Auto-fetch pattern from analytics (lines 149-197 in `index.tsx`) is appropriate

**Constraints:**
- Must use existing LinkedInAuth interface pattern
- Must follow Zustand + persist middleware pattern (like other stores)
- Must follow auto-fetch config pattern (like `auto-fetch-config.ts`)
- Must use LinkedInLink for navigation (not window.open or direct links)
- Must match existing tab UI patterns (Card, ScrollArea, Badge)
- Interval options: 0 (disabled), 5, 15, 30, 60 minutes only

## Technical Decisions

### API Integration
- **Endpoint:** `GET /voyager/api/voyagerIdentityDashNotificationCards`
- **Query params:** `decorationId=com.linkedin.voyager.dash.deco.identity.notifications.CardsCollection-80`, `count=20`, `filterUrn=urn:li:fsd_notificationFilter:MENTIONS_ALL`, `q=notifications`, `start=0`
- **Auth:** Via `LinkedInAuth` from storage (`cookie`, `csrfToken`)
- **Headers:**
  - `accept: application/vnd.linkedin.normalized+json+2.1`
  - `csrf-token: {auth.csrfToken}`
  - `cookie: {auth.cookie}`
  - `x-restli-protocol-version: 2.0.0`
  - `x-li-lang: en_US`

### Data Structures

**LinkedInMention:**
```typescript
interface LinkedInMention {
  entityUrn: string; // e.g., "urn:li:fsd_notificationCard:(MENTIONED_YOU_IN_THIS,urn:li:comment:(activity:XXX,YYY))"
  mentionerName: string;
  mentionerPhotoUrl: string | null;
  mentionerProfileUrl: string; // e.g., "/in/chrislangsocial"
  commentText: string; // Full text, not truncated
  postSnippet: string; // Secondary text from post context
  postUrl: string; // e.g., "/feed/update/urn:li:activity:XXX?commentUrn=..."
  publishedAt: number; // Unix timestamp in milliseconds
  read: boolean; // From API response
  numLikes: number | null; // From SocialActivityCounts
  numComments: number | null; // From SocialActivityCounts
}
```

**MentionsStore (Zustand):**
```typescript
interface MentionsState {
  mentions: LinkedInMention[];
  watermark: string | null; // Most recent entityUrn
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
}

interface MentionsActions {
  setMentions: (mentions: LinkedInMention[]) => void;
  prependMentions: (newMentions: LinkedInMention[]) => void;
  setWatermark: (urn: string) => void;
  setLastFetchTime: (timestamp: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearMentions: () => void;
}

type MentionsStore = MentionsState & MentionsActions;
```

**Storage key pattern:** `local:linkedin-mentions-{accountId}` (account-specific persistence)

### Watermark Strategy

**Initial fetch:**
1. Call API with `start=0, count=20`
2. Parse all 20 results
3. Store all mentions
4. Set watermark = `mentions[0].entityUrn` (newest)

**Subsequent fetches:**
1. Call API with `start=0, count=20`
2. Walk results from newest to oldest
3. Stop when encountering `entityUrn === watermark`
4. Prepend only new mentions (those before watermark)
5. Update watermark = `newMentions[0].entityUrn` (if any new)

**Edge case - all 20 are new:**
- If all 20 mentions are new AND `metadata.nextStart` exists
- Fetch next page with `start=20, count=20`
- Repeat up to 3 pages max (cap at 60 mentions per fetch)
- Update watermark to newest across all pages

### Auto-Fetch Configuration

**Config file:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/followup-auto-fetch-config.ts`

**Pattern:** Follow `auto-fetch-config.ts` but with minute-based intervals

**Interval options:** `[0, 5, 15, 30, 60]` minutes (0 = disabled)

**Default interval:** 15 minutes

**Storage keys:**
- `local:followup-auto-fetch-interval-minutes`
- Reuse account-specific mentions storage (last fetch time tracked in store)

**Functions:**
```typescript
export const DEFAULT_FOLLOWUP_INTERVAL_MINUTES = 15;
export const FOLLOWUP_INTERVAL_OPTIONS = [0, 5, 15, 30, 60] as const;
export const FOLLOWUP_AUTO_FETCH_DISABLED = 0;
export const FOLLOWUP_INTERVAL_KEY = "local:followup-auto-fetch-interval-minutes" as const;

export async function getFollowUpIntervalMs(): Promise<number>;
export async function isFollowUpAutoFetchDisabled(): Promise<boolean>;
export async function getFollowUpIntervalMinutes(): Promise<number>;
export async function setFollowUpIntervalMinutes(minutes: number): Promise<void>;
export function watchFollowUpInterval(callback: (minutes: number) => void): () => void;
```

### React Hook

**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/use-mentions.ts`

**Pattern:** Similar to `use-profile-views-history.ts` but simpler (no snapshots, just latest array)

**Hook signature:**
```typescript
interface UseMentionsReturn {
  mentions: LinkedInMention[];
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMentions(): UseMentionsReturn;
```

**Behavior:**
- Subscribe to account-specific Zustand store slice
- Provide `refetch()` function that calls fetcher + updates store
- Handle loading/error states
- Auto-clears when account switches

---

## Functional Requirements

1. **Mentions Display**
   - Show all mentions in reverse chronological order (newest first)
   - Display mentioner avatar (40x40, rounded-full)
   - Display mentioner name (bold, clickable to profile)
   - Display full comment text (not truncated, line clamp optional at 4 lines)
   - Display post snippet (secondary text, 2-line clamp)
   - Display timestamp (relative format: "2h ago", "1d ago")
   - Display engagement counts (likes, comments) with icons
   - Read/unread indicator (badge or border styling)

2. **Navigation**
   - "Go to post" link on each mention card
   - Use `LinkedInLink` component with `to={mention.postUrl}`
   - Clicking mentioner name opens profile in LinkedIn (via `LinkedInLink`)

3. **Auto-Fetch**
   - Fetch on content script initialization (if interval not disabled)
   - Re-fetch when account switches
   - Use setInterval with configurable interval
   - Stop fetching when tab/window not visible (optional optimization)
   - Respect rate limit (don't fetch if within interval window)

4. **Manual Refresh**
   - Refresh button in tab header
   - Shows loading spinner during fetch
   - Displays toast/error on failure
   - Updates lastFetchTime on success

5. **Interval Configuration**
   - Dropdown/select in tab footer (like Analytics tab)
   - Options: "Stop fetching", "5 minutes", "15 minutes", "30 minutes", "60 minutes"
   - Persists to storage immediately on change
   - Restarts auto-fetch loop with new interval

6. **Empty State**
   - Display when `mentions.length === 0` and not loading
   - Message: "No mentions yet. When someone tags you in a comment, it will appear here."
   - Icon: MessageSquare or AtSign from lucide-react

7. **Error Handling**
   - Display error message in card if fetch fails
   - "Retry" button to trigger manual refetch
   - Console logging for debugging

---

## Non-Functional Requirements

- **Performance:** Watermark deduplication prevents re-processing old mentions
- **Storage:** Local storage persistence survives page reloads
- **Type Safety:** Full TypeScript coverage with strict types
- **Code Quality:** Follow existing patterns (stores, fetchers, hooks, components)
- **Accessibility:** Semantic HTML, keyboard navigation, screen reader support
- **Error Resilience:** Graceful degradation if API fails

---

## Acceptance Criteria

1. Follow-Up tab visible in sidebar with correct icon and label
2. Mentions auto-fetch on page load (if interval enabled)
3. Mentions display with full comment text, mentioner info, post context
4. LinkedInLink navigation works to original posts
5. Auto-fetch interval configurable (0, 5, 15, 30, 60 minutes)
6. Manual refresh button triggers fetch
7. Watermark deduplication prevents duplicates
8. Account switching clears mentions and re-fetches
9. Empty state displays when no mentions
10. Read/unread indicator visible on mention cards
11. Engagement counts (likes, comments) display correctly
12. No console errors or warnings
13. TypeScript compiles without errors

---

## Implementation Checklist

### Step 1: Create TypeScript Interfaces
**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/types.ts`

**Create:**
```typescript
export interface LinkedInMention {
  entityUrn: string;
  mentionerName: string;
  mentionerPhotoUrl: string | null;
  mentionerProfileUrl: string;
  commentText: string;
  postSnippet: string;
  postUrl: string;
  publishedAt: number;
  read: boolean;
  numLikes: number | null;
  numComments: number | null;
}

export interface MentionsApiResponse {
  data: {
    metadata: {
      nextStart?: number;
      numUnseen: number;
    };
    paging: {
      start: number;
      count: number;
    };
    "*elements": string[]; // Array of notification card URNs
  };
  included: Array<
    | NotificationCardObject
    | SocialActivityCountsObject
  >;
}

interface NotificationCardObject {
  $type: "com.linkedin.voyager.dash.identity.notifications.Card";
  entityUrn: string;
  headline: { text: string }; // e.g., "Chris Lang mentioned you in a comment."
  contentPrimaryText: Array<{ text: string }>; // Comment text
  contentSecondaryText: Array<{ text: string }>; // Post snippet
  cardAction: { actionTarget: string }; // Post URL
  headerImage: {
    actionTarget: string; // Mentioner profile URL
    accessibilityText: string; // e.g., "View Chris Lang's profile."
  };
  publishedAt: number;
  read: boolean;
  "*socialActivityCounts"?: string; // URN reference
}

interface SocialActivityCountsObject {
  $type: "com.linkedin.voyager.dash.feed.SocialActivityCounts";
  entityUrn: string;
  numLikes: number;
  numComments: number;
  liked: boolean;
}
```

---

### Step 2: Create API Fetcher
**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/linkedin-mentions-fetcher.ts`

**Implement:**
- Import `LinkedInAuth` interface from `linkedin-followers-fetcher.ts`
- Import `storage` from `wxt/storage`
- Import `MentionsApiResponse`, `LinkedInMention` from `./types`

**Function signature:**
```typescript
export async function fetchMentions(
  start: number = 0,
  count: number = 20
): Promise<{ mentions: LinkedInMention[]; nextStart?: number } | null>
```

**Implementation:**
1. Get auth via `await storage.getItem<LinkedInAuth>("local:auth")`
2. Validate auth (cookie, csrfToken present)
3. Construct URL: `https://www.linkedin.com/voyager/api/voyagerIdentityDashNotificationCards?decorationId=com.linkedin.voyager.dash.deco.identity.notifications.CardsCollection-80&count=${count}&filterUrn=urn%3Ali%3Afsd_notificationFilter%3AMENTIONS_ALL&q=notifications&start=${start}`
4. Fetch with headers:
   - `accept: application/vnd.linkedin.normalized+json+2.1`
   - `csrf-token: auth.csrfToken`
   - `cookie: auth.cookie`
   - `x-restli-protocol-version: 2.0.0`
   - `x-li-lang: en_US`
5. Check response.ok
6. Parse JSON as `MentionsApiResponse`
7. Build lookup map for SocialActivityCounts by entityUrn
8. Map notification cards to `LinkedInMention[]`:
   - Extract mentioner name from `headline.text` (regex or split)
   - Extract mentioner photo from `headerImage` (may need to resolve URN or use placeholder)
   - Extract mentioner profile URL from `headerImage.actionTarget`
   - Extract comment text from `contentPrimaryText[0].text`
   - Extract post snippet from `contentSecondaryText[0].text`
   - Extract post URL from `cardAction.actionTarget`
   - Extract publishedAt, read from card
   - Lookup engagement counts from SocialActivityCounts map
9. Return `{ mentions, nextStart: data.metadata.nextStart }`

**Error handling:**
- Log errors to console
- Return null on failure

**Mentioner photo resolution:**
- LinkedIn may return URN references instead of direct URLs
- If `headerImage` doesn't contain direct photo URL, use placeholder or omit
- Alternative: Extract from `accessibilityText` or use default avatar

**Reference pattern:** Follow `linkedin-followers-fetcher.ts` structure

---

### Step 3: Create Auto-Fetch Config
**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/followup-auto-fetch-config.ts`

**Implementation:**
- Copy pattern from `auto-fetch-config.ts`
- Change interval unit to minutes (not hours)
- Change default to 15 minutes
- Change interval options to `[0, 5, 15, 30, 60]`
- Change storage key to `local:followup-auto-fetch-interval-minutes`

**Full code:**
```typescript
import { storage } from "wxt/storage";

export const DEFAULT_FOLLOWUP_INTERVAL_MINUTES = 15;
export const MIN_INTERVAL_MINUTES = 5;
export const MAX_INTERVAL_MINUTES = 60;

export const FOLLOWUP_AUTO_FETCH_DISABLED = 0;

export const FOLLOWUP_INTERVAL_OPTIONS = [0, 5, 15, 30, 60] as const;

export const FOLLOWUP_INTERVAL_KEY = "local:followup-auto-fetch-interval-minutes" as const;

export async function getFollowUpIntervalMs(): Promise<number> {
  const minutes = await storage.getItem<number>(FOLLOWUP_INTERVAL_KEY);
  if (minutes === FOLLOWUP_AUTO_FETCH_DISABLED) return Infinity;
  return (minutes ?? DEFAULT_FOLLOWUP_INTERVAL_MINUTES) * 60 * 1000;
}

export async function isFollowUpAutoFetchDisabled(): Promise<boolean> {
  const minutes = await storage.getItem<number>(FOLLOWUP_INTERVAL_KEY);
  return minutes === FOLLOWUP_AUTO_FETCH_DISABLED;
}

export async function getFollowUpIntervalMinutes(): Promise<number> {
  const minutes = await storage.getItem<number>(FOLLOWUP_INTERVAL_KEY);
  return minutes ?? DEFAULT_FOLLOWUP_INTERVAL_MINUTES;
}

export async function setFollowUpIntervalMinutes(minutes: number): Promise<void> {
  const value =
    minutes === FOLLOWUP_AUTO_FETCH_DISABLED
      ? FOLLOWUP_AUTO_FETCH_DISABLED
      : Math.max(MIN_INTERVAL_MINUTES, Math.min(MAX_INTERVAL_MINUTES, minutes));
  await storage.setItem(FOLLOWUP_INTERVAL_KEY, value);
  if (value === FOLLOWUP_AUTO_FETCH_DISABLED) {
    console.log("⚙️ Follow-Up auto-fetch disabled");
  } else {
    console.log(`⚙️ Follow-Up auto-fetch interval set to ${value} minutes`);
  }
}

export function watchFollowUpInterval(callback: (minutes: number) => void): () => void {
  return storage.watch<number>(FOLLOWUP_INTERVAL_KEY, (newValue) => {
    callback(newValue ?? DEFAULT_FOLLOWUP_INTERVAL_MINUTES);
  });
}
```

---

### Step 4: Create Zustand Store with Persistence
**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/mentions-store.ts`

**Implementation:**
- Import `create` from `zustand`
- Import `persist` middleware from `zustand/middleware`
- Import `storage` from `wxt/storage`
- Import `LinkedInMention` from `./types`

**Store shape:**
```typescript
interface MentionsState {
  mentions: LinkedInMention[];
  watermark: string | null; // Most recent entityUrn
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
}

interface MentionsActions {
  setMentions: (mentions: LinkedInMention[]) => void;
  prependMentions: (newMentions: LinkedInMention[]) => void;
  setWatermark: (urn: string) => void;
  setLastFetchTime: (timestamp: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearMentions: () => void;
}

type MentionsStore = MentionsState & MentionsActions;
```

**Store factory function:**
```typescript
export const createMentionsStore = (accountId: string) =>
  create<MentionsStore>()(
    persist(
      (set) => ({
        mentions: [],
        watermark: null,
        lastFetchTime: null,
        isLoading: false,
        error: null,

        setMentions: (mentions) => set({ mentions }),
        prependMentions: (newMentions) =>
          set((state) => ({
            mentions: [...newMentions, ...state.mentions],
          })),
        setWatermark: (urn) => set({ watermark: urn }),
        setLastFetchTime: (timestamp) => set({ lastFetchTime: timestamp }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearMentions: () =>
          set({
            mentions: [],
            watermark: null,
            lastFetchTime: null,
            error: null,
          }),
      }),
      {
        name: `local:linkedin-mentions-${accountId}`,
        storage: {
          getItem: (name) => storage.getItem(name as `local:${string}`),
          setItem: (name, value) => storage.setItem(name as `local:${string}`, value),
          removeItem: (name) => storage.removeItem(name as `local:${string}`),
        },
      }
    )
  );
```

**Store instance management:**
- Create per-account store instances
- Store in a Map keyed by accountId
- Clear and re-create when account switches

**Helper:**
```typescript
const storeCache = new Map<string, ReturnType<typeof createMentionsStore>>();

export function getMentionsStore(accountId: string) {
  if (!storeCache.has(accountId)) {
    storeCache.set(accountId, createMentionsStore(accountId));
  }
  return storeCache.get(accountId)!;
}
```

---

### Step 5: Implement Watermark Fetcher Logic
**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/linkedin-mentions-fetcher.ts` (extend Step 2)

**Add function:**
```typescript
export async function fetchMentionsWithWatermark(
  accountId: string,
  watermark: string | null,
  maxPages: number = 3
): Promise<LinkedInMention[]>
```

**Implementation:**
1. Call `fetchMentions(0, 20)`
2. If watermark is null (first fetch):
   - Return all mentions
3. If watermark exists:
   - Walk results from index 0 to 19
   - Stop when `mention.entityUrn === watermark`
   - Collect mentions before watermark
   - If all 20 are new AND nextStart exists:
     - Fetch next page (`fetchMentions(20, 20)`)
     - Repeat up to `maxPages` total
   - Return collected new mentions
4. Handle errors gracefully (return empty array)

**Pseudocode:**
```typescript
export async function fetchMentionsWithWatermark(
  accountId: string,
  watermark: string | null,
  maxPages: number = 3
): Promise<LinkedInMention[]> {
  const allNewMentions: LinkedInMention[] = [];
  let currentStart = 0;
  let pagesProcessed = 0;

  while (pagesProcessed < maxPages) {
    const result = await fetchMentions(currentStart, 20);
    if (!result) break;

    const { mentions, nextStart } = result;

    if (watermark === null) {
      // First fetch - return everything
      return mentions;
    }

    // Find watermark index
    const watermarkIndex = mentions.findIndex((m) => m.entityUrn === watermark);

    if (watermarkIndex === -1) {
      // All mentions are new
      allNewMentions.push(...mentions);

      // Check if there's a next page
      if (nextStart !== undefined) {
        currentStart = nextStart;
        pagesProcessed++;
        continue;
      } else {
        // No more pages
        break;
      }
    } else {
      // Found watermark - take mentions before it
      allNewMentions.push(...mentions.slice(0, watermarkIndex));
      break;
    }
  }

  return allNewMentions;
}
```

---

### Step 6: Create React Hook
**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/use-mentions.ts`

**Implementation:**
- Import `useAccountStore` from `../stores`
- Import `getMentionsStore` from `./mentions-store`
- Import `fetchMentionsWithWatermark` from `./linkedin-mentions-fetcher`
- Use `useSyncExternalStore` or Zustand's `useStore` hook

**Hook:**
```typescript
import { useEffect, useState } from "react";
import { useAccountStore } from "../stores";
import { getMentionsStore } from "./mentions-store";
import { fetchMentionsWithWatermark } from "./linkedin-mentions-fetcher";
import type { LinkedInMention } from "./types";

interface UseMentionsReturn {
  mentions: LinkedInMention[];
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMentions(): UseMentionsReturn {
  const accountId = useAccountStore((state) => state.currentLinkedIn.profileUrn);

  const [store, setStore] = useState(() =>
    accountId ? getMentionsStore(accountId) : null
  );

  // Update store when account changes
  useEffect(() => {
    if (accountId) {
      setStore(getMentionsStore(accountId));
    } else {
      setStore(null);
    }
  }, [accountId]);

  const mentions = store?.((s) => s.mentions) ?? [];
  const lastFetchTime = store?.((s) => s.lastFetchTime) ?? null;
  const isLoading = store?.((s) => s.isLoading) ?? false;
  const error = store?.((s) => s.error) ?? null;
  const watermark = store?.((s) => s.watermark) ?? null;

  const refetch = async () => {
    if (!accountId || !store) return;

    const storeInstance = getMentionsStore(accountId);
    storeInstance.getState().setIsLoading(true);
    storeInstance.getState().setError(null);

    try {
      const newMentions = await fetchMentionsWithWatermark(accountId, watermark);

      if (newMentions.length > 0) {
        // Prepend new mentions
        storeInstance.getState().prependMentions(newMentions);
        // Update watermark to newest
        storeInstance.getState().setWatermark(newMentions[0]!.entityUrn);
      }

      storeInstance.getState().setLastFetchTime(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      storeInstance.getState().setError(message);
      console.error("Error fetching mentions:", err);
    } finally {
      storeInstance.getState().setIsLoading(false);
    }
  };

  return { mentions, lastFetchTime, isLoading, error, refetch };
}
```

---

### Step 7: Create MentionCard Component
**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/MentionCard.tsx`

**Implementation:**
- Import Card, CardContent from `@sassy/ui/card`
- Import Badge from `@sassy/ui/badge`
- Import LinkedInLink from `../_components/LinkedInLink`
- Import icons: MessageSquare, ThumbsUp, ExternalLink
- Import `LinkedInMention` from `./types`
- Import date formatting utility (or use `date-fns` directly)

**Component:**
```typescript
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ThumbsUp, ExternalLink } from "lucide-react";
import { Badge } from "@sassy/ui/badge";
import { Card, CardContent } from "@sassy/ui/card";
import { LinkedInLink } from "../_components/LinkedInLink";
import type { LinkedInMention } from "./types";

interface MentionCardProps {
  mention: LinkedInMention;
}

export function MentionCard({ mention }: MentionCardProps) {
  const relativeTime = formatDistanceToNow(new Date(mention.publishedAt), {
    addSuffix: true,
  });

  return (
    <Card className="relative">
      <CardContent className="flex flex-col gap-2 p-3">
        {/* Header: Avatar + Name + Time */}
        <div className="flex items-center gap-2">
          <img
            src={mention.mentionerPhotoUrl || "/default-avatar.png"}
            alt={mention.mentionerName}
            className="h-10 w-10 rounded-full shrink-0"
          />
          <div className="flex-1 min-w-0">
            <LinkedInLink
              to={mention.mentionerProfileUrl}
              className="text-sm font-medium hover:underline truncate block"
            >
              {mention.mentionerName}
            </LinkedInLink>
            <span className="text-muted-foreground text-xs">{relativeTime}</span>
          </div>
          {!mention.read && (
            <Badge variant="default" className="shrink-0 px-1.5 py-0 text-[10px]">
              New
            </Badge>
          )}
        </div>

        {/* Comment Text */}
        <div className="text-sm">
          <p className="line-clamp-4">{mention.commentText}</p>
        </div>

        {/* Post Snippet */}
        {mention.postSnippet && (
          <div className="bg-muted/30 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
            <p className="line-clamp-2">{mention.postSnippet}</p>
          </div>
        )}

        {/* Footer: Engagement + Link */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {mention.numLikes !== null && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span>{mention.numLikes}</span>
              </div>
            )}
            {mention.numComments !== null && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{mention.numComments}</span>
              </div>
            )}
          </div>
          <LinkedInLink
            to={mention.postUrl}
            className="text-primary text-xs font-medium hover:underline flex items-center gap-1"
          >
            <span>Go to post</span>
            <ExternalLink className="h-3 w-3" />
          </LinkedInLink>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Step 8: Create FollowUpTab Component
**File:** `apps/wxt-extension/entrypoints/linkedin.content/followup-tab/FollowUpTab.tsx`

**Implementation:**
- Import `useMentions` hook
- Import `MentionCard` component
- Import ScrollArea from `@sassy/ui/scroll-area`
- Import Button from `@sassy/ui/button`
- Import RefreshCw, AtSign icons
- Import auto-fetch config functions
- Add interval selector (dropdown like AnalyticsTab)

**Component:**
```typescript
import { useEffect, useState } from "react";
import { RefreshCw, AtSign } from "lucide-react";
import { Button } from "@sassy/ui/button";
import { ScrollArea } from "@sassy/ui/scroll-area";
import { useMentions } from "./use-mentions";
import { MentionCard } from "./MentionCard";
import {
  DEFAULT_FOLLOWUP_INTERVAL_MINUTES,
  FOLLOWUP_INTERVAL_OPTIONS,
  getFollowUpIntervalMinutes,
  setFollowUpIntervalMinutes,
} from "./followup-auto-fetch-config";

export function FollowUpTab() {
  const { mentions, lastFetchTime, isLoading, error, refetch } = useMentions();

  const [autoFetchIntervalMinutes, setAutoFetchInterval] = useState(
    DEFAULT_FOLLOWUP_INTERVAL_MINUTES
  );

  // Load saved interval on mount
  useEffect(() => {
    getFollowUpIntervalMinutes().then(setAutoFetchInterval);
  }, []);

  // Handle interval change
  const handleIntervalChange = async (minutes: number) => {
    setAutoFetchInterval(minutes);
    await setFollowUpIntervalMinutes(minutes);
  };

  return (
    <div id="ek-followup-tab" className="flex flex-col gap-4 px-4 h-full">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mentions</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="h-8 w-8 p-0"
          title="Refresh mentions"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Mentions List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3">
          {mentions.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AtSign className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No mentions yet. When someone tags you in a comment, it will
                appear here.
              </p>
            </div>
          ) : (
            mentions.map((mention) => (
              <MentionCard key={mention.entityUrn} mention={mention} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Auto-fetch Settings */}
      <div className="bg-muted/30 flex items-center justify-between rounded-lg border px-3 py-2">
        <span className="text-muted-foreground text-xs">Auto-fetch every:</span>
        <select
          value={autoFetchIntervalMinutes}
          onChange={(e) => handleIntervalChange(Number(e.target.value))}
          className="bg-background focus:ring-primary rounded border px-2 py-1 text-xs focus:ring-1 focus:outline-none"
        >
          {FOLLOWUP_INTERVAL_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes === 0
                ? "Stop fetching"
                : `${minutes} ${minutes === 1 ? "minute" : "minutes"}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

---

### Step 9: Add FOLLOWUP to SIDEBAR_TABS Constant
**File:** `apps/wxt-extension/entrypoints/linkedin.content/stores/sidebar-store.ts`

**Change:**
```typescript
// Before:
export const SIDEBAR_TABS = {
  COMPOSE: 0,
  CONNECT: 1,
  ANALYTICS: 2,
  ACCOUNT: 3,
} as const;

// After:
export const SIDEBAR_TABS = {
  COMPOSE: 0,
  CONNECT: 1,
  ANALYTICS: 2,
  FOLLOWUP: 3,
  ACCOUNT: 4,
} as const;
```

---

### Step 10: Add FollowUp Tab to LinkedInSidebar
**File:** `apps/wxt-extension/entrypoints/linkedin.content/LinkedInSidebar.tsx`

**Changes:**

1. **Import FollowUpTab:**
```typescript
import { FollowUpTab } from "./followup-tab/FollowUpTab";
```

2. **Add to tabs array:**
```typescript
// Before:
const tabs = [
  { id: "ek-compose-tab-button", title: "Compose", icon: Feather },
  { id: "ek-connect-tab-button", title: "Connect", icon: Users },
  { id: "ek-analytics-tab-button", title: "Analytics", icon: BarChart3 },
  { id: "ek-account-tab-button", title: "Account", icon: User },
];

// After:
import { AtSign } from "lucide-react"; // Add import

const tabs = [
  { id: "ek-compose-tab-button", title: "Compose", icon: Feather },
  { id: "ek-connect-tab-button", title: "Connect", icon: Users },
  { id: "ek-analytics-tab-button", title: "Analytics", icon: BarChart3 },
  { id: "ek-followup-tab-button", title: "Follow-Up", icon: AtSign },
  { id: "ek-account-tab-button", title: "Account", icon: User },
];
```

3. **Add tab rendering:**
```typescript
{/* Tab 3: Follow-Up - Mentions Display */}
{selectedTab === SIDEBAR_TABS.FOLLOWUP && <FollowUpTab />}
```

**Full render section should be:**
```typescript
<div className="flex-1 overflow-y-auto">
  {/* Tab 0: Compose - Unified Comment Composition */}
  {selectedTab === SIDEBAR_TABS.COMPOSE && <ComposeTab />}

  {/* Tab 1: Connect - Saved Profile Display */}
  {selectedTab === SIDEBAR_TABS.CONNECT && <ConnectTab />}

  {/* Tab 2: Analytics - Profile Views */}
  {selectedTab === SIDEBAR_TABS.ANALYTICS && <AnalyticsTab />}

  {/* Tab 3: Follow-Up - Mentions Display */}
  {selectedTab === SIDEBAR_TABS.FOLLOWUP && <FollowUpTab />}

  {/* Tab 4: Account - Auth & Organization Info */}
  {selectedTab === SIDEBAR_TABS.ACCOUNT && <AccountTab />}

  {/* Sign-in overlay - covers everything when not signed in */}
  {showSignInOverlay && <SignInOverlay />}

  {showDailyAILimitQuotaExceededOverlay && (
    <DailyAIQuotaExceededOverlay />
  )}

  {/* No account registered overlay - shows when no LinkedIn accounts */}
  <CreateLinkedInAccountOverlay />

  {/* Account mismatch overlay - shows on non-Account tabs when LinkedIn not registered */}
  {showMismatchOverlay && <AccountMismatchOverlay />}
</div>
```

---

### Step 11: Wire Auto-Fetch into Content Script
**File:** `apps/wxt-extension/entrypoints/linkedin.content/index.tsx`

**Add auto-fetch logic similar to analytics (lines 149-197):**

**Implementation:**

1. **Import dependencies:**
```typescript
import { getMentionsStore } from "./followup-tab/mentions-store";
import { fetchMentionsWithWatermark } from "./followup-tab/linkedin-mentions-fetcher";
import { getFollowUpIntervalMs, isFollowUpAutoFetchDisabled } from "./followup-tab/followup-auto-fetch-config";
```

2. **Create auto-fetch function:**
```typescript
const startMentionsAutoFetch = async () => {
  const accountId = useAccountStore.getState().currentLinkedIn.profileUrn;

  if (!accountId) {
    console.warn(
      "EngageKit WXT: No LinkedIn account ID detected, skipping mentions auto-fetch"
    );
    return;
  }

  console.log(
    `EngageKit WXT: Starting mentions auto-fetch for account: ${accountId}`
  );

  const fetchMentions = async () => {
    const disabled = await isFollowUpAutoFetchDisabled();
    if (disabled) {
      console.log("⏸️ Mentions auto-fetch is disabled");
      return;
    }

    const store = getMentionsStore(accountId);
    const { watermark, lastFetchTime } = store.getState();

    // Check rate limit
    const intervalMs = await getFollowUpIntervalMs();
    if (lastFetchTime) {
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      if (timeSinceLastFetch < intervalMs) {
        console.log(
          `⏱️ Mentions fetch rate limited: ${Math.round((intervalMs - timeSinceLastFetch) / 60000)}m until next fetch`
        );
        return;
      }
    }

    try {
      store.getState().setIsLoading(true);
      const newMentions = await fetchMentionsWithWatermark(accountId, watermark);

      if (newMentions.length > 0) {
        store.getState().prependMentions(newMentions);
        store.getState().setWatermark(newMentions[0]!.entityUrn);
        console.log(`✅ Fetched ${newMentions.length} new mentions`);
      } else {
        console.log("✅ No new mentions");
      }

      store.getState().setLastFetchTime(Date.now());
    } catch (err) {
      console.error("❌ Mentions auto-fetch error:", err);
      store.getState().setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      store.getState().setIsLoading(false);
    }
  };

  // Initial fetch
  await fetchMentions();

  // Set up interval
  const intervalMs = await getFollowUpIntervalMs();
  if (intervalMs !== Infinity) {
    setInterval(fetchMentions, intervalMs);
  }
};
```

3. **Call in main() function:**
```typescript
// After line 197 (after analytics auto-collect setup):

// Start mentions auto-fetch immediately
startMentionsAutoFetch();

// Re-trigger auto-fetch when account changes
let lastMentionsAccountId = useAccountStore.getState().currentLinkedIn.profileUrn;
const unsubscribeMentions = useAccountStore.subscribe((state) => {
  const currentAccountId = state.currentLinkedIn.profileUrn;
  if (currentAccountId && currentAccountId !== lastMentionsAccountId) {
    console.log(
      `EngageKit WXT: Account changed to ${currentAccountId}, triggering mentions auto-fetch`
    );
    lastMentionsAccountId = currentAccountId;
    startMentionsAutoFetch();
  }
});
```

4. **Clean up in onRemove:**
```typescript
// In onRemove callback (line 226):
unsubscribeMentions(); // Add this line
```

---

### Step 12: Add Default Avatar Placeholder
**File:** Create or identify existing default avatar asset

**Options:**
1. Use lucide-react `User` icon as fallback in MentionCard
2. Use a data URL for a simple gray circle SVG
3. Reference existing avatar fallback pattern from AccountTab or other components

**Recommended approach:** Use inline fallback in MentionCard:
```typescript
<img
  src={mention.mentionerPhotoUrl || undefined}
  alt={mention.mentionerName}
  className="h-10 w-10 rounded-full shrink-0 bg-muted"
  onError={(e) => {
    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e5e7eb'/%3E%3C/svg%3E";
  }}
/>
```

---

### Step 13: Test End-to-End Flow

**Manual testing steps:**

1. **Build and reload extension:**
   - Run `pnpm build` in wxt-extension directory
   - Reload extension in Chrome
   - Navigate to LinkedIn

2. **Verify tab appears:**
   - Open sidebar
   - Check that Follow-Up tab is visible (icon: AtSign, label: "Follow-Up")

3. **Check auto-fetch on load:**
   - Open DevTools console
   - Look for log: "EngageKit WXT: Starting mentions auto-fetch for account: ..."
   - Verify fetch request to `/voyagerIdentityDashNotificationCards` in Network tab

4. **Verify data display:**
   - Switch to Follow-Up tab
   - Check if mentions display (if any exist)
   - Verify all fields: avatar, name, comment text, post snippet, engagement counts

5. **Test navigation:**
   - Click "Go to post" link on a mention
   - Verify LinkedIn navigates to the correct post

6. **Test manual refresh:**
   - Click refresh button
   - Verify loading spinner appears
   - Check console for fetch logs

7. **Test interval config:**
   - Change auto-fetch interval to 5 minutes
   - Verify setting persists after page reload
   - Change to "Stop fetching"
   - Verify no more fetches occur

8. **Test account switching:**
   - Switch to a different LinkedIn account (if available)
   - Verify mentions clear and re-fetch for new account

9. **Test empty state:**
   - Clear local storage for mentions
   - Reload page
   - Verify empty state displays

10. **Check for errors:**
    - Verify no console errors
    - Verify no TypeScript compilation errors

---

### Step 14: Polish and Error Handling

**Enhancements:**

1. **Add loading skeleton in FollowUpTab:**
   - Show placeholder cards while `isLoading && mentions.length === 0`

2. **Add toast notifications (optional):**
   - Show success toast after manual refresh
   - Show error toast on fetch failure

3. **Improve relative time formatting:**
   - Use short format: "2h", "1d", "3w"
   - Add custom formatter if needed

4. **Add keyboard shortcuts (optional):**
   - `r` key to refresh mentions when tab is active

5. **Optimize re-renders:**
   - Memoize MentionCard if needed
   - Use React.memo for performance

6. **Add analytics tracking:**
   - Track tab views
   - Track mention clicks
   - Track refresh actions

**Final checks:**
- All TypeScript errors resolved
- No console warnings
- Code formatted and linted
- Comments added where necessary
- All imports organized

---

## Risks and Mitigations

**Risk 1:** LinkedIn API changes response format
- **Mitigation:** Add robust error handling, type guards for API response parsing, fallback to empty state

**Risk 2:** Watermark deduplication fails (e.g., entityUrn not stable)
- **Mitigation:** Add logging to track watermark behavior, fallback to timestamp-based deduplication if needed

**Risk 3:** Auto-fetch interval too aggressive (rate limiting)
- **Mitigation:** Default to 15 minutes, provide 0 (disabled) option, respect rate limits

**Risk 4:** Mentioner photo URL resolution fails
- **Mitigation:** Use placeholder avatar, graceful degradation with default image

**Risk 5:** Performance issues with large mentions list
- **Mitigation:** Limit display to 100 most recent mentions, implement pagination or virtualization if needed

**Risk 6:** Storage quota exceeded
- **Mitigation:** Cap mentions storage at 100 items per account, implement cleanup for old mentions

---

## Integration Notes

**Auto-Fetch Pattern:**
- Follow analytics auto-fetch pattern (lines 149-197 in `index.tsx`)
- Use setInterval with configurable interval
- Re-trigger on account changes
- Clean up intervals on unmount

**Storage Pattern:**
- Use WXT storage with account-specific keys
- Persist via Zustand middleware
- Clear on account switch

**UI Pattern:**
- Match AnalyticsTab layout (header, ScrollArea, footer config)
- Match ComposeCard styling (Card, CardContent, Badge, Button)
- Use LinkedInLink for all LinkedIn navigation

**Type Safety:**
- Strict TypeScript types for API responses
- Runtime validation for critical fields
- Graceful degradation for missing data

**Error Handling:**
- Log all errors to console
- Display user-friendly error messages in UI
- Provide retry mechanism for failed fetches

---

## Completion Checklist

After implementation, verify:

- [ ] Follow-Up tab visible in sidebar
- [ ] Auto-fetch runs on page load
- [ ] Mentions display with all fields
- [ ] Navigation to posts works
- [ ] Manual refresh works
- [ ] Interval configuration works
- [ ] Watermark deduplication works
- [ ] Empty state displays
- [ ] Account switching clears/re-fetches
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] Code follows existing patterns
- [ ] Performance is acceptable

---

**Ready for EXECUTE mode. Review plan, then say "ENTER EXECUTE MODE" to begin implementation.**
