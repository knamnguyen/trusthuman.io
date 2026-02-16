# xBooster Stealth Headers + Engage Tab

- **Date**: 2026-02-12
- **Complexity**: COMPLEX (Multi-phase)
- **Status**: ⏳ PLANNED
- **Prerequisite**: `xbooster-wxt-mvp_PLAN_05-02-26.md` ✅ DEPLOYED

## Overview

Upgrade xBooster with two major enhancements: (1) port EngageX's stealth anti-detection headers (`x-client-transaction-id` and `x-xp-forwarded-for`) into all existing and new API calls, and (2) add a second "Engage" tab to the sidebar that lets users input X list/community URLs and automatically fetch, generate AI replies, and send them on a periodic schedule — mirroring the Mentions tab pattern but targeting external tweet sources instead of notifications.

---

## Quick Links

- [Execution Brief](#15-execution-brief)
- [Phased Execution Workflow](#175-phased-execution-workflow)
- [Architecture Decisions](#3-architecture-decisions-final)
- [High-level Data Flow](#5-high-level-data-flow)
- [Component Details](#7-component-details)
- [Phased Delivery Plan](#13-phased-delivery-plan)
- [Features List](#14-features-list-moscow)
- [RFCs](#15-rfcs)
- [Implementation Checklist](#implementation-checklist-complete-workflow)

---

## 1. Context and Goals

**Current State**: xBooster is a WXT Chrome extension (`apps/xbooster`) that fetches Notifications/Mentions, generates AI replies via Gemini, and sends them via DOM manipulation. It lacks stealth headers (`x-client-transaction-id`, `x-xp-forwarded-for`) and only supports one engagement source (mentions).

**Target State**: xBooster becomes a dual-tab extension with:
1. **Mentions tab** (existing) — enhanced with stealth headers on all API calls
2. **Engage tab** (new) — fetch tweets from X lists/communities, generate replies, send periodically

**In-scope**:
- Port `XClientTransactionManager` from EngageX JS to TypeScript
- Port `x-xp-forwarded-for` generation via Twitter's `XPForwardedForSDK`
- Integrate stealth headers into `buildHeaders()` (benefits ALL existing + new endpoints)
- Add `getListTweets()` and `getCommunityTweets()` API functions with parsers
- Tab system using `ExpandableTabs` from `@sassy/ui` (following LinkedIn extension pattern)
- Engage tab UI with source management, tweet list, reply generation, auto-run
- Engage-specific settings (fetch interval, send delay, count, prompt, word limits)
- Engage-specific stores (sources, tweets, replies, already-replied)
- Engage auto-run hook (periodic fetch → generate → send cycle)

**Out-of-scope (V1)**:
- Community memberships auto-discovery (user must paste URLs manually)
- Pagination / cursor-based fetching (single page per fetch, same as EngageX)
- Rate limit detection or backoff
- Retry logic on failed requests
- Like/retweet functionality
- Analytics or engagement tracking

---

## 1.5 Execution Brief

### Phase 1-2: Stealth Infrastructure (Transaction ID + XP Forwarded For)
**What happens**: Port `XClientTransactionManager` from EngageX JS to TypeScript as a lib module. Create `page-context.ts` WXT public script to access Twitter's `XPForwardedForSDK`. Integrate both headers into `buildHeaders()` in `x-api.ts`.
**Test**: Open x.com → `fetchNotifications()` request includes valid `x-client-transaction-id` and `x-xp-forwarded-for` headers → response succeeds.

### Phase 3: New API Functions (List + Community Tweets)
**What happens**: Add `getListTweets()` and `getCommunityTweets()` to `x-api.ts` with response parsers. Add query IDs to the dynamic extraction and fallback system.
**Test**: Call `getListTweets("1234567890", 20)` → returns parsed tweet array with id, text, user, timestamp.

### Phase 4-5: Tab System + Engage Tab UI Shell
**What happens**: Refactor sidebar to use `ExpandableTabs` with two tabs (Mentions, Engage). Extract current sidebar content into `MentionsTab`. Create `EngageTab` shell with source URL input, tweet list, and auto-run controls.
**Test**: Tab bar shows two tabs with animated switching. Mentions tab works exactly as before. Engage tab renders with empty state.

### Phase 6-7: Engage Stores + Auto-Run Hook
**What happens**: Create Zustand stores for engage sources, fetched tweets, replies, already-replied tracking. Create `use-engage-auto-run.ts` hook mirroring the mentions auto-run pattern but fetching from lists/communities.
**Test**: Add a list URL → start auto-run → tweets fetched → AI replies generated → replies sent via DOM → next cycle scheduled.

### Phase 8: Engage Settings + Polish
**What happens**: Add engage-specific settings section to SettingsSheet. Polish UI, error handling, edge cases.
**Test**: All engage settings persist across sessions. Full end-to-end cycle works with configurable parameters.

### Expected Outcome
- All xBooster API calls include stealth `x-client-transaction-id` and `x-xp-forwarded-for` headers
- Sidebar has two tabs: "Mentions" (existing functionality) and "Engage" (new)
- Users can paste X list/community URLs as engagement sources
- Engage tab periodically fetches tweets, generates AI replies, and sends them
- Each tab has independent settings, stores, and auto-run cycles
- Both tabs can run simultaneously without interference

---

## 1.75 Phased Execution Workflow

**IMPORTANT**: This plan uses a phase-by-phase execution model with built-in approval gates. Each RFC follows this workflow:

### Phase Workflow Pattern

**Step 1: Pre-Phase Research**
- Read existing code patterns in xBooster and EngageX
- Analyze the specific EngageX code to be ported
- Identify potential blockers (WXT constraints, TypeScript porting issues)
- Present findings to user for review

**Step 2: Detailed Planning**
- Based on research, create detailed implementation steps
- Specify exact files to create/modify
- Define success criteria
- Get user approval before proceeding

**Step 3: Implementation**
- Execute approved plan exactly as specified
- No deviations from approved approach

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
User: "Begin RFC-001: XClientTransactionManager"

Assistant (Pre-Phase Research):
- Reading EngageX api-combined.js XClientTransactionManager...
- Reading xBooster x-api.ts buildHeaders()...
- Findings: EngageX uses bundled sha256 lib, SVG keyframe extraction, cubic bezier
- TypeScript port needs: sha256 package, typed interfaces, async init
- Do you approve proceeding?

User: "Yes, proceed"

Assistant (Implementation):
[Creates lib/x-client-transaction.ts, updates x-api.ts]

Assistant (Testing):
Running post-phase tests:
✓ XClientTransactionManager initializes on x.com
✓ generateTransactionId("GET", "/i/api/graphql/...") returns valid base64 string
✓ fetchNotifications() now includes x-client-transaction-id header
✓ API response succeeds (no 403)

Phase RFC-001 complete. Proceed to RFC-002?
```

---

## 2. Non-Goals and Constraints

**Non-Goals**:
- Automated community discovery (user pastes URLs)
- Cursor-based pagination (single-page fetch only, consistent with EngageX)
- Rate limit detection, backoff, or retry mechanisms
- Like, retweet, or bookmark automation
- Engagement analytics or tracking dashboard
- Multi-account support
- Scheduling replies for specific times

**Constraints**:
- Must use existing WXT framework and build pipeline
- Must use existing `@sassy/ui` components (ExpandableTabs, Sheet, Button, etc.)
- Must follow existing xBooster patterns (Zustand stores, `chrome.storage.local` persistence)
- Stealth header generation must work within content script context (access to `document`, `window`)
- `page-context.ts` must run in page world (not content script world) to access `window.XPForwardedForSDK`
- DOM-based reply posting is the only send method (no GraphQL CreateTweet)
- Extension manifest permissions: no new permissions needed beyond existing `storage`, `tabs`, `cookies`, `webRequest`

---

## 3. Architecture Decisions (Final)

### AD-001: Port EngageX JS to TypeScript (Not Wrapper)

**Decision**: Fully rewrite `XClientTransactionManager` in TypeScript rather than bundling raw JS.

**Rationale**:
- Type safety catches errors at compile time
- Better IDE support (autocomplete, refactoring)
- Consistent with xBooster's TypeScript codebase
- Enables proper module imports (no global `window.*` pollution)

**Implications**:
- Need a SHA-256 library (`js-sha256` or Web Crypto API)
- Need to type all intermediate data structures (SVG paths, keyframes, matrices)
- More upfront work but better maintainability

### AD-002: Page-Context Script for XPForwardedFor (SDK Method)

**Decision**: Use Twitter's native `XPForwardedForSDK` via an injected page-context script, matching EngageX's primary approach.

**Rationale**:
- Most authentic header value (generated by Twitter's own SDK)
- Less likely to be flagged as inauthentic vs custom generation
- EngageX proves this approach works in production

**Implications**:
- Need a WXT public script (`public/page-context.js`) injected into page world
- Communication via `CustomEvent` between page world and content script world
- Need `web_accessible_resources` manifest entry
- Fallback to hardcoded value if SDK unavailable

### AD-003: Tab System Following LinkedIn Extension Pattern

**Decision**: Use `ExpandableTabs` from `@sassy/ui` with index-based conditional rendering, same as LinkedIn extension's `LinkedInSidebar.tsx`.

**Rationale**:
- Proven pattern already used in the monorepo
- Animated tab bar with Lucide icons matches xBooster's neo-brutalist theme
- Simple conditional rendering (no React Router overhead)
- Zustand stores survive tab switches (module-level singletons)

**Implications**:
- Tab components unmount/remount on switch (React local state lost, Zustand persists)
- `selectedTab` state stored in `sidebar-store.ts`
- Each tab is a separate directory with own components, stores, hooks

### AD-004: Independent Auto-Run Cycles Per Tab

**Decision**: Mentions and Engage tabs have completely independent auto-run cycles that can run simultaneously.

**Rationale**:
- Different fetch sources (notifications vs lists/communities)
- Different settings (intervals, counts, prompts)
- User may want to engage with mentions AND lists simultaneously
- Simpler to reason about than a unified queue

**Implications**:
- Two separate `useAutoRun` hooks with own state
- Two separate already-replied tracking stores
- Potential for conflicting DOM navigation (mitigated by send delays)
- DOM reply posting is sequential within each cycle; if both fire simultaneously, one will need to wait

### AD-005: URL-Based Source Input (Not ID Input)

**Decision**: Users paste full X URLs (`https://x.com/i/lists/1234` or `https://x.com/i/communities/5678`), and the extension parses the ID from the URL.

**Rationale**:
- Users don't know list/community numeric IDs
- URLs are copy-pasteable from the browser address bar
- URL parsing is straightforward (regex on path segments)

**URL Patterns**:
- List: `https://x.com/i/lists/{listId}` → extract `listId`
- Community: `https://x.com/i/communities/{communityId}` → extract `communityId`

**Implications**:
- Need URL parsing utility with validation
- Store both the original URL and extracted ID
- Display source as friendly label (type + truncated ID)

### AD-006: Stealth Headers in Shared buildHeaders()

**Decision**: Integrate `x-client-transaction-id` and `x-xp-forwarded-for` into the existing `buildHeaders()` function in `x-api.ts`, so ALL API calls (existing mentions + new engage) benefit.

**Rationale**:
- Single point of header construction
- Existing `fetchNotifications()` and `getTweetDetail()` automatically get stealth headers
- New `getListTweets()` and `getCommunityTweets()` automatically get stealth headers
- No risk of forgetting headers on individual calls

**Implications**:
- `buildHeaders()` becomes async (transaction ID generation is async)
- All callers of `buildHeaders()` must await it
- Initialization of `XClientTransactionManager` happens once at content script load
- Fallback values used if manager not yet initialized

---

## 4. Architecture Clarification: Stealth Header Flow

### Content Script Context (Where API Calls Happen)

```
Content script loads on x.com
    ↓
Initialize XClientTransactionManager:
  1. Read document.documentElement.outerHTML (homepage HTML)
  2. Find <script src="...ondemand.s.{hash}a.js"> in page
  3. Fetch ondemand bundle content
  4. Extract twitter-site-verification meta tag
  5. Extract SVG animation keyframes from loading-x-anim elements
  6. Ready to generate transaction IDs
    ↓
Inject page-context.js into page world:
  1. Script calls window.XPForwardedForSDK.init("production")
  2. Script calls getForwardedForStr()
  3. Result communicated back via CustomEvent
  4. Content script caches XP Forwarded For value
    ↓
buildHeaders(method, path) now returns:
  {
    ...existing headers (authorization, csrf, etc.),
    "x-client-transaction-id": <generated per-request>,
    "x-xp-forwarded-for": <cached SDK value>
  }
```

### Why Both Headers Matter

| Header | Purpose | Without It |
|--------|---------|------------|
| `x-client-transaction-id` | Proves request comes from real Twitter web client | Higher risk of 403/rate limiting |
| `x-xp-forwarded-for` | Client identity/fingerprint header | May trigger additional bot checks |

---

## 5. High-level Data Flow

### Stealth Headers (applies to both tabs)

```
Content script init
    ↓
XClientTransactionManager.initialize()
  → parse homepage HTML → fetch ondemand.js → extract keyframes → ready
    ↓
injectPageContext() → XPForwardedForSDK → CustomEvent → cache value
    ↓
Every API call: buildHeaders("GET", "/i/api/graphql/...")
  → auth headers + transaction ID + xp forwarded for
```

### Engage Tab Flow

```
User pastes https://x.com/i/lists/1234567890
    ↓
parseSourceUrl() → { type: "list", id: "1234567890", url: "..." }
    ↓
Source saved to engage-sources-store (persisted in chrome.storage.local)
    ↓
User clicks "Start Auto-Run" (or auto-starts)
    ↓
use-engage-auto-run cycle:
  1. For each source:
     - if list: getListTweets(id, count)
     - if community: getCommunityTweets(id, count)
  2. Parse responses → TweetData[]
  3. Filter: not already replied, within maxAge
  4. For each actionable tweet:
     - generateReply(tweetText, authorName, settings)
  5. For each ready reply (capped by maxSendsPerCycle):
     - navigateX(tweet.url)
     - wait 2s
     - postTweetViaDOM(replyText)
     - markSent()
     - random delay
  6. Schedule next cycle (random interval)
```

---

## 6. Security Posture

**Authentication**: Same as existing — uses intercepted X.com auth headers (cookie, csrf, bearer).

**Stealth**: Adding `x-client-transaction-id` and `x-xp-forwarded-for` actually improves security posture by making requests indistinguishable from real browser requests.

**Data Privacy**: No user data leaves the extension except to X.com APIs and Gemini API (existing pattern). Source URLs and settings stored locally in `chrome.storage.local`.

**No New Permissions**: All functionality works within existing manifest permissions.

---

## 7. Component Details

### New Files Overview

```
apps/xbooster/
  public/
    page-context.js                 -- NEW: Injected into page world for XPForwardedFor SDK
  lib/
    x-client-transaction.ts         -- NEW: XClientTransactionManager (ported from EngageX)
    x-stealth-headers.ts            -- NEW: Stealth header orchestrator (init + generate)
  entrypoints/
    x.content/
      XBoosterSidebar.tsx           -- MODIFIED: Add ExpandableTabs, render MentionsTab/EngageTab
      stores/
        sidebar-store.ts            -- MODIFIED: Add selectedTab state + SIDEBAR_TABS const
      mentions-tab/
        MentionsTab.tsx             -- NEW: Extracted from current XBoosterSidebar content
      engage-tab/
        EngageTab.tsx               -- NEW: Main engage tab component
        SourceInput.tsx             -- NEW: URL input + add button
        TweetCard.tsx               -- NEW: Display fetched tweet with reply editor
        stores/
          engage-sources-store.ts   -- NEW: Sources list (persisted)
          engage-tweets-store.ts    -- NEW: Fetched tweets + cache
          engage-replies-store.ts   -- NEW: Reply states + already-replied
          engage-settings-store.ts  -- NEW: Engage-specific settings
        hooks/
          use-engage-auto-run.ts    -- NEW: Engage auto-run cycle
        utils/
          parse-source-url.ts       -- NEW: URL → { type, id } parser
          parse-tweets.ts           -- NEW: List/community response parsers
      utils/
        x-api.ts                    -- MODIFIED: Add buildHeaders stealth, getListTweets, getCommunityTweets
      _components/
        SettingsSheet.tsx           -- MODIFIED: Add engage settings section (tab-aware)
```

### XClientTransactionManager (lib/x-client-transaction.ts)

**Ported from**: `engageX/api/api-combined.js`

**Responsibilities**:
- Parse x.com homepage HTML for `twitter-site-verification` meta tag
- Fetch and parse `ondemand.s.*.js` bundle for animation indices
- Extract SVG keyframe data from loading animation elements
- Generate per-request `x-client-transaction-id` using SHA-256 + cubic bezier + matrix rotation

**Key Interfaces**:
```typescript
interface TransactionManagerConfig {
  randomKeyword?: string;  // default: "obfiowerehiring"
  randomNumber?: number;   // default: 3
}

class XClientTransactionManager {
  private clientTransaction: ClientTransaction | null;
  private initialized: boolean;

  async initialize(): Promise<void>;
  generateTransactionId(method: string, path: string): string | null;
  isReady(): boolean;
}
```

**Dependencies**:
- `js-sha256` npm package (or inline implementation matching EngageX)
- Access to `document.documentElement.outerHTML`
- Access to `document.querySelectorAll('script[src]')` for bundle URL
- `fetch()` for loading ondemand bundle

### Stealth Header Orchestrator (lib/x-stealth-headers.ts)

**Responsibilities**:
- Initialize `XClientTransactionManager` on content script load
- Inject `page-context.js` and capture XP Forwarded For value
- Provide `getStealthHeaders(method, path)` function for `buildHeaders()`

**Key Interface**:
```typescript
interface StealthHeaders {
  "x-client-transaction-id": string;
  "x-xp-forwarded-for": string;
}

async function initStealthHeaders(): Promise<void>;
async function getStealthHeaders(method: string, path: string): Promise<StealthHeaders>;
```

### Sidebar Tab System (XBoosterSidebar.tsx modification)

**Pattern follows**: `wxt-extension/entrypoints/linkedin.content/LinkedInSidebar.tsx`

**Tab Definitions**:
```typescript
// In sidebar-store.ts
export const SIDEBAR_TABS = {
  MENTIONS: 0,
  ENGAGE: 1,
} as const;
```

**Tab Bar** (in XBoosterSidebar header):
```typescript
const tabs = [
  { title: "Mentions", icon: AtSign },
  { title: "Engage", icon: Crosshair },
];

<ExpandableTabs
  tabs={tabs}
  value={selectedTab}
  onChange={setSelectedTab}
/>
```

**Conditional Rendering**:
```typescript
{selectedTab === SIDEBAR_TABS.MENTIONS && <MentionsTab />}
{selectedTab === SIDEBAR_TABS.ENGAGE && <EngageTab />}
```

### MentionsTab (mentions-tab/MentionsTab.tsx)

**Extracted from**: Current `XBoosterSidebar.tsx` body content.

Contains: fetch button, send all button, auto-run controls, status display, filtered mention list, MentionCard components. No behavioral changes — pure extraction.

### EngageTab (engage-tab/EngageTab.tsx)

**Structure** (top to bottom):
1. **SourceInput** — URL text input + "Add" button
2. **Sources list** — Chips showing active sources with remove (X) button
3. **Auto-run controls** — Start/Stop button, status, cycle count, next run countdown
4. **Tweet list** — Scrollable list of TweetCard components
5. **Empty state** — "Add a list or community URL to get started"

### EngageTab Stores

**engage-sources-store.ts**:
```typescript
interface EngageSource {
  id: string;            // extracted numeric ID
  type: "list" | "community";
  url: string;           // original URL
  label: string;         // display name (e.g., "List 1234...")
  addedAt: number;       // timestamp
}

interface EngageSourcesStore {
  sources: EngageSource[];
  addSource: (url: string) => EngageSource | null;  // parses URL, returns null if invalid
  removeSource: (id: string) => void;
  loadSources: () => Promise<void>;
}
// Persisted to chrome.storage.local under "xbooster_engage_sources"
```

**engage-tweets-store.ts**:
```typescript
interface EngageTweetData {
  tweetId: string;
  text: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  url: string;
  timestamp: string;
  sourceId: string;       // which source this came from
  sourceType: "list" | "community";
}

interface EngageTweetsStore {
  tweets: EngageTweetData[];
  isLoading: boolean;
  error: string | null;
  setTweets: (tweets: EngageTweetData[]) => void;
  addTweets: (tweets: EngageTweetData[]) => void;  // merge, dedupe by tweetId
  clear: () => void;
}
```

**engage-replies-store.ts**:
```typescript
// Identical pattern to existing replies-store.ts
interface EngageRepliesStore {
  replies: Record<string, ReplyState>;
  alreadyReplied: RepliedEntry[];
  setReply / updateReplyText / markSent / isAlreadyReplied / loadAlreadyReplied / addToAlreadyReplied / pruneAlreadyReplied / clear
}
// Persisted to chrome.storage.local under "xbooster_engage_replied"
```

**engage-settings-store.ts**:
```typescript
interface EngageSettings {
  fetchIntervalMin: number;      // default: 30 (minutes) — more aggressive than mentions
  fetchIntervalMax: number;      // default: 60 (minutes)
  sendDelayMin: number;          // default: 60 (seconds)
  sendDelayMax: number;          // default: 120 (seconds)
  customPrompt: string;          // default: "" (uses DEFAULT_ENGAGE_PROMPT)
  maxWordsMin: number;           // default: 5
  maxWordsMax: number;           // default: 20
  fetchCount: number;            // default: 20 (tweets per source per fetch)
  maxSendsPerCycle: number;      // default: 5
  repliedRetentionDays: number;  // default: 30
  maxTweetAgeMinutes: number;    // default: 1440 (24 hours)
}
// Persisted to chrome.storage.local under "xbooster_engage_settings"
```

### use-engage-auto-run.ts Hook

**Mirrors**: `use-auto-run.ts` but adapted for engage sources.

**Cycle Flow**:
1. Prune old already-replied entries
2. For each source in `engageSourcesStore.sources`:
   - If list: `getListTweets(source.id, settings.fetchCount)`
   - If community: `getCommunityTweets(source.id, settings.fetchCount)`
   - Parse response, tag each tweet with `sourceId` and `sourceType`
3. Merge all tweets, deduplicate by tweetId
4. Filter: within `maxTweetAgeMinutes`, not already replied, not own tweets
5. For each actionable tweet: `generateReply()` with engage-specific prompt/settings
6. For each ready reply (capped by `maxSendsPerCycle`):
   - `navigateX(tweet.url)`
   - Wait 2000ms
   - `postTweetViaDOM(replyText)`
   - Mark sent
   - Random delay between `sendDelayMin` and `sendDelayMax`
7. Schedule next cycle with random interval

**State Shape**:
```typescript
interface EngageAutoRunState {
  isRunning: boolean;
  status: "idle" | "fetching" | "generating" | "sending" | "waiting";
  lastRunAt: number | null;
  nextRunAt: number | null;
  cycleCount: number;
  sentThisCycle: number;
  error: string | null;
}
```

### parse-source-url.ts

```typescript
interface ParsedSource {
  type: "list" | "community";
  id: string;
}

function parseSourceUrl(url: string): ParsedSource | null {
  // Match: https://x.com/i/lists/{id}
  // Match: https://x.com/i/communities/{id}
  // Return null if invalid
}
```

### parse-tweets.ts (Response Parsers)

**Ported from**: EngageX `parseTweetsFromResponse` and `parseCommunityTweetsFromResponse`

```typescript
function parseListTweetsResponse(data: unknown): EngageTweetData[];
function parseCommunityTweetsResponse(data: unknown): EngageTweetData[];
```

**List response path**: `data.list.tweets_timeline.timeline.instructions[]` → `TimelineAddEntries` → entries starting with `tweet-`

**Community response path**: `data.communityResults.result.ranked_community_timeline.timeline.instructions[]` → handles `TimelinePinEntry` + `TimelineAddEntries`, handles `TweetWithVisibilityResults` wrapper

**Both**:
- Filter out retweets (skip if `retweeted_status_result` exists)
- Sort by `created_at` descending
- Extract: tweetId, text (including note_tweet long text), authorName, authorHandle, authorAvatar, url, timestamp

### SettingsSheet Modification

**Tab-aware settings**: The SettingsSheet already slides from the sidebar. It will add a second section for Engage settings, conditionally shown based on which tab is active OR always shown with section headers.

**Approach**: Always show both sections with clear headers:
- **Mentions Settings** (existing fields)
- **Engage Settings** (new fields: fetch interval, send delay, count, max sends, word limits, custom prompt, tweet age)

---

## 8. API Surface (New X.com GraphQL Endpoints)

### getListTweets(listId, count)

**Endpoint**: `GET /i/api/graphql/{queryId}/ListLatestTweetsTimeline`

**Query ID**: `8F_zY5Fd6RPLh6thWMTWxg` (fallback; also add to dynamic extraction)

**Variables**:
```json
{
  "listId": "<string>",
  "count": 20
}
```

**Features**: Same `FEATURES` object used by existing endpoints.

**Headers**: Full stealth headers via `buildHeaders("GET", "/i/api/graphql/.../ListLatestTweetsTimeline")`

### getCommunityTweets(communityId, count)

**Endpoint**: `GET /i/api/graphql/{queryId}/CommunityTweetsTimeline`

**Query ID**: `4D6L5dLISN2dBphE1Hk7Dg` (fallback; also add to dynamic extraction)

**Variables**:
```json
{
  "communityId": "<string>",
  "count": 20,
  "displayLocation": "Community",
  "rankingMode": "Recency",
  "withCommunity": true
}
```

**Features**: Same `FEATURES` object.

**Headers**: Full stealth headers.

---

## 9. Phased Delivery Plan

### Current Status

⏳ **RFC-001**: XClientTransactionManager TypeScript Port (PLANNED)
⏳ **RFC-002**: XP Forwarded For via Page-Context Script (PLANNED)
⏳ **RFC-003**: Stealth Headers Integration into buildHeaders (PLANNED)
⏳ **RFC-004**: List + Community Tweet API Functions (PLANNED)
⏳ **RFC-005**: Tab System + MentionsTab Extraction (PLANNED)
⏳ **RFC-006**: Engage Tab Stores + Source Management (PLANNED)
⏳ **RFC-007**: Engage Tab UI + Auto-Run Hook (PLANNED)
⏳ **RFC-008**: Engage Settings + Polish (PLANNED)

**Immediate Next Steps**: RFC-001 — XClientTransactionManager TypeScript Port

---

## 14. Features List (MoSCoW)

### Must-Have (M)

| ID | Feature |
|----|---------|
| M-001 | `x-client-transaction-id` header on all API calls |
| M-002 | `x-xp-forwarded-for` header on all API calls |
| M-003 | `getListTweets()` API function with response parser |
| M-004 | `getCommunityTweets()` API function with response parser |
| M-005 | Tab system with Mentions and Engage tabs |
| M-006 | Engage tab source URL input (list + community) |
| M-007 | Engage tab tweet display list |
| M-008 | Engage tab AI reply generation |
| M-009 | Engage tab DOM-based reply sending |
| M-010 | Engage tab auto-run cycle (fetch → generate → send) |
| M-011 | Engage tab independent settings |
| M-012 | Engage tab already-replied tracking |
| M-013 | Source persistence across sessions |

### Should-Have (S)

| ID | Feature |
|----|---------|
| S-001 | Source URL validation with user-friendly error messages |
| S-002 | Tweet age filter for engage tab |
| S-003 | Retweet filtering (skip retweets) |
| S-004 | Own-tweet filtering (skip tweets by the authenticated user) |
| S-005 | Engage-specific custom AI prompt |
| S-006 | Loading states and error handling throughout |

### Could-Have (C)

| ID | Feature |
|----|---------|
| C-001 | Source labels/nicknames (user can rename sources) |
| C-002 | Per-source enable/disable toggle |
| C-003 | Tweet preview with author avatar |
| C-004 | Manual "Fetch Now" button per source |

### Won't-Have (W)

| ID | Feature |
|----|---------|
| W-001 | Community auto-discovery from memberships |
| W-002 | Cursor-based pagination |
| W-003 | Rate limit detection or backoff |
| W-004 | Like/retweet automation |
| W-005 | Analytics dashboard |

---

## 15. RFCs

### RFC-001: XClientTransactionManager TypeScript Port

**Summary**: Port the `XClientTransactionManager` and its `ClientTransaction` dependency from EngageX's JavaScript to TypeScript, preserving the exact algorithm.

**Dependencies**: None

**Source Files** (EngageX):
- `/Users/knamnguyen/Documents/0-Programming/engageX/api/api-combined.js` — The `ClientTransaction` IIFE and `XClientTransactionManager` class

**Target Files** (xBooster):
- `apps/xbooster/lib/x-client-transaction.ts`

---

**Stage 0: Pre-Phase Research**
1. Read the full `XClientTransactionManager` and `ClientTransaction` code in EngageX
2. Identify all dependencies: SHA-256 (bundled `h`/`Sha256` class), CubicBezier (`u` class), interpolation functions, matrix rotation
3. Check if `js-sha256` npm package exists and matches the bundled implementation
4. Identify all hardcoded constants: `"obfiowerehiring"`, `3`, ondemand URL template, regexes
5. Map the class hierarchy: `ClientTransaction` (core) → `XClientTransactionManager` (wrapper)
6. Present findings and proposed TypeScript structure to user

**Stage 1: Core Algorithm Types and Utilities**
1. Create `apps/xbooster/lib/x-client-transaction.ts`
2. Define TypeScript interfaces:
   ```typescript
   interface ClientTransactionConfig {
     homePageResponse: string;
     ondemandFileResponse: string;
     randomKeyword?: string;
     randomNumber?: number;
   }
   ```
3. Implement `CubicBezier` class with typed methods
4. Implement `interpolate()`, `interpolateNum()`, `convertRotationToMatrix()` utility functions
5. Implement SHA-256 usage (decide: `js-sha256` package vs Web Crypto `crypto.subtle.digest`)

**Stage 2: ClientTransaction Class**
1. Implement `getIndices(ondemandFileResponse)` — regex extraction of numeric indices
2. Implement `getKey(homePageResponse)` — extract `twitter-site-verification` meta tag content
3. Implement `getKeyBytes(key)` — base64 decode to byte array
4. Implement `getFrames(htmlResponse)` — extract SVG path `d` attributes from `loading-x-anim-*` elements, with hardcoded fallback paths
5. Implement `get2dArray(keyBytes, html, frames)` — select SVG path, parse into 2D numeric array
6. Implement `solve(t, e, n, r)` — byte-to-range mapping
7. Implement `animate(data, progress)` — core animation step with color interpolation, rotation, bezier
8. Implement `getAnimationKey(keyBytes, html)` — compute animation key from selected row
9. Implement `generateTransactionId(method, path, ...)` — full pipeline: timestamp → keyBytes → SHA-256 → XOR → base64

**Stage 3: XClientTransactionManager Wrapper**
1. Implement `initialize()`:
   - Get `document.documentElement.outerHTML` as homepage HTML
   - Find `<script src="...ondemand.s...">` in page scripts
   - Fetch the ondemand bundle content
   - Create `ClientTransaction` instance
2. Implement `generateTransactionId(method, path)` — delegates to `ClientTransaction`
3. Implement `isReady()` — returns whether initialization succeeded
4. Export class

**Stage 4: Fallback Chain**
1. Implement fallback `generateDefaultTransactionId()` — base64 of `"e:web:{timestamp}:{randomHex}"`
2. Implement priority chain: real generation → default fallback → hardcoded string
3. Ensure graceful degradation if initialization fails (log warning, use fallback)

**Post-Phase Testing**:
1. In browser console on x.com: instantiate `XClientTransactionManager`, call `initialize()`
2. Call `generateTransactionId("GET", "/i/api/graphql/xxx/NotificationsTimeline")`
3. Verify output is a non-empty base64-like string
4. Compare output format with EngageX's output (similar length, same character set)
5. No console errors during initialization

**Acceptance Criteria**:
- [ ] `x-client-transaction.ts` compiles without errors
- [ ] `XClientTransactionManager` initializes successfully on x.com pages
- [ ] `generateTransactionId()` returns valid base64-encoded strings
- [ ] Fallback chain works when initialization fails
- [ ] Algorithm matches EngageX output format (base64, similar length)
- [ ] No global window pollution (module-scoped)

**What's Functional Now**: Transaction ID generator ready for integration

**Ready For**: RFC-002

---

### RFC-002: XP Forwarded For via Page-Context Script

**Summary**: Create a page-context script that runs in x.com's page world to access Twitter's `XPForwardedForSDK`, and a content-script bridge to retrieve the value.

**Dependencies**: None (can run in parallel with RFC-001)

**Source Files** (EngageX):
- `/Users/knamnguyen/Documents/0-Programming/engageX/api/page-context.js` — SDK invocation and event communication

**Target Files** (xBooster):
- `apps/xbooster/public/page-context.js` — Page-world script (must be plain JS, not TypeScript)
- `apps/xbooster/lib/x-stealth-headers.ts` — Content-script bridge

---

**Stage 0: Pre-Phase Research**
1. Read EngageX's `page-context.js` fully — understand both modes (SDK and interceptor)
2. Check WXT docs for `web_accessible_resources` and page-world script injection patterns
3. Verify `window.XPForwardedForSDK` exists on x.com pages (inspect in browser console)
4. Understand CustomEvent communication pattern between page world and content script
5. Present findings to user

**Stage 1: Page-Context Script**
1. Create `apps/xbooster/public/page-context.js` (plain JavaScript)
2. Implement SDK invocation:
   ```javascript
   window.XPForwardedForSDK.init("production");
   const result = window.XPForwardedForSDK.getForwardedForStr();
   // Dispatch CustomEvent with result back to content script
   ```
3. Use `data-event-name` attribute pattern for unique event targeting
4. Handle SDK not available (dispatch error event)
5. Handle SDK timeout

**Stage 2: WXT Manifest Configuration**
1. Update `wxt.config.ts` to include `page-context.js` in `web_accessible_resources`
2. Verify the script is accessible at `chrome-extension://{id}/page-context.js`

**Stage 3: Content Script Bridge (in x-stealth-headers.ts)**
1. Implement `injectPageContextScript()`:
   - Create `<script>` element with `src` pointing to extension's `page-context.js`
   - Set unique `data-event-name` attribute
   - Inject into page `document.head`
2. Implement `getXPForwardedFor()`:
   - Add CustomEvent listener for the unique event name
   - Return promise that resolves with the SDK's forwarded-for string
   - 5-second timeout → fallback to hardcoded value
3. Cache the result (SDK value has expiry, re-fetch when expired)

**Stage 4: Fallback**
1. Hardcoded fallback string (same as EngageX's fallback)
2. Log warning when falling back

**Post-Phase Testing**:
1. Navigate to x.com → check console for "XPForwardedFor initialized" log
2. Call `getXPForwardedFor()` from content script → returns hex string
3. Verify string format matches expected pattern (long hex string)
4. Test fallback by temporarily breaking SDK (e.g., override `window.XPForwardedForSDK`)
5. No errors in extension console

**Acceptance Criteria**:
- [ ] `page-context.js` successfully invokes `XPForwardedForSDK` on x.com
- [ ] Content script receives forwarded-for value via CustomEvent
- [ ] Value is cached with expiry handling
- [ ] Fallback works when SDK unavailable
- [ ] No CSP violations or console errors
- [ ] WXT manifest includes `web_accessible_resources`

**What's Functional Now**: XP Forwarded For header value available to content script

**Ready For**: RFC-003

---

### RFC-003: Stealth Headers Integration into buildHeaders

**Summary**: Modify `x-api.ts` to integrate both stealth headers from RFC-001 and RFC-002 into the shared `buildHeaders()` function.

**Dependencies**: RFC-001, RFC-002

**Target Files**:
- `apps/xbooster/entrypoints/x.content/utils/x-api.ts` — MODIFY
- `apps/xbooster/lib/x-stealth-headers.ts` — MODIFY (add orchestration)
- `apps/xbooster/entrypoints/x.content/index.tsx` — MODIFY (add initialization)

---

**Stage 1: Stealth Header Orchestrator**
1. In `lib/x-stealth-headers.ts`, implement `initStealthHeaders()`:
   - Call `XClientTransactionManager.initialize()` (from RFC-001)
   - Call `injectPageContextScript()` and `getXPForwardedFor()` (from RFC-002)
   - Store references for later use
2. Implement `getStealthHeaders(method: string, path: string)`:
   - Generate transaction ID via `XClientTransactionManager.generateTransactionId(method, path)`
   - Get cached XP forwarded for value (re-fetch if expired)
   - Return `{ "x-client-transaction-id": ..., "x-xp-forwarded-for": ... }`

**Stage 2: Modify buildHeaders()**
1. Change `buildHeaders(referer: string)` to `buildHeaders(referer: string, method: string, path: string)`
2. Make it `async` (stealth header generation is async)
3. Call `getStealthHeaders(method, path)` and merge into headers object
4. Existing headers unchanged: authorization, csrf, cookie, etc.

**Stage 3: Update All Callers**
1. `fetchNotifications()` — update to pass method + path to `buildHeaders()`
2. `getTweetDetail()` — update to pass method + path
3. `postTweet()` — update to pass method + path (even though commented out)

**Stage 4: Initialization in Content Script Entry**
1. In `entrypoints/x.content/index.tsx`, call `initStealthHeaders()` after mount
2. This runs once when the content script loads on x.com
3. Non-blocking — stealth initialization happens in background, fallbacks used until ready

**Post-Phase Testing**:
1. Open x.com → wait 3 seconds for initialization
2. Click "Fetch Mentions" in xBooster sidebar
3. Open DevTools Network tab → find the `NotificationsTimeline` request
4. Verify request headers include `x-client-transaction-id` (base64 string)
5. Verify request headers include `x-xp-forwarded-for` (hex string)
6. Verify response is 200 OK (not 403)
7. Repeat for `TweetDetail` request → same stealth headers present

**Acceptance Criteria**:
- [ ] `buildHeaders()` is now async and includes stealth headers
- [ ] All existing API calls (`fetchNotifications`, `getTweetDetail`) include stealth headers
- [ ] Stealth initialization happens automatically on content script load
- [ ] Fallback values used if initialization not yet complete
- [ ] No regressions — existing Mentions tab functionality unchanged
- [ ] Network tab shows stealth headers on all x.com API requests

**What's Functional Now**: All xBooster API calls have stealth anti-detection headers

**Ready For**: RFC-004

---

### RFC-004: List + Community Tweet API Functions

**Summary**: Add `getListTweets()` and `getCommunityTweets()` to `x-api.ts` with response parsers.

**Dependencies**: RFC-003 (stealth headers integrated)

**Source Files** (EngageX):
- Content script's `getListTweets()`, `getCommunityTweets()`, `parseTweetsFromResponse()`, `parseCommunityTweetsFromResponse()`, `parseTweetData()`

**Target Files**:
- `apps/xbooster/entrypoints/x.content/utils/x-api.ts` — ADD new functions
- `apps/xbooster/entrypoints/x.content/engage-tab/utils/parse-tweets.ts` — NEW parsers

---

**Stage 1: Query ID Registration**
1. Add `ListLatestTweetsTimeline` and `CommunityTweetsTimeline` to the `FALLBACK_QUERY_IDS` object
2. Add them to the `extractQueryIds()` function's operation name list
3. Query IDs: `8F_zY5Fd6RPLh6thWMTWxg` (list), `4D6L5dLISN2dBphE1Hk7Dg` (community)

**Stage 2: getListTweets() Function**
1. Add to `x-api.ts`:
   ```typescript
   export async function getListTweets(
     listId: string,
     count = 20
   ): Promise<{ success: boolean; data?: unknown; message?: string }>
   ```
2. Build variables: `{ listId, count }`
3. Build features: same `FEATURES` object
4. Construct URL with query params
5. Call `buildHeaders("GET", "/i/api/graphql/.../ListLatestTweetsTimeline")`
6. Execute `fetch()` with `credentials: "include"`
7. Handle errors (HTTP errors, GraphQL errors)

**Stage 3: getCommunityTweets() Function**
1. Add to `x-api.ts`:
   ```typescript
   export async function getCommunityTweets(
     communityId: string,
     count = 20
   ): Promise<{ success: boolean; data?: unknown; message?: string }>
   ```
2. Build variables: `{ communityId, count, displayLocation: "Community", rankingMode: "Recency", withCommunity: true }`
3. Same pattern as `getListTweets()`

**Stage 4: Response Parsers**
1. Create `engage-tab/utils/parse-tweets.ts`
2. Define `EngageTweetData` interface (already defined in Component Details)
3. Implement `parseListTweetsResponse(data)`:
   - Navigate: `data.list.tweets_timeline.timeline.instructions[]`
   - Find `TimelineAddEntries` type
   - Filter entries starting with `tweet-`
   - Extract tweet data from `content.itemContent.tweet_results.result`
   - Handle `Tweet` and `TweetWithVisibilityResults` types
   - Skip retweets (check `retweeted_status_result`)
   - Map to `EngageTweetData`
4. Implement `parseCommunityTweetsResponse(data)`:
   - Navigate: `data.communityResults.result.ranked_community_timeline.timeline.instructions[]`
   - Handle both `TimelinePinEntry` and `TimelineAddEntries`
   - Same tweet extraction logic
5. Shared helper `parseSingleTweet(result)` for both parsers

**Post-Phase Testing**:
1. Find a public X list URL, extract ID
2. Call `getListTweets("listId", 10)` from browser console
3. Verify response contains tweets
4. Call `parseListTweetsResponse(response.data)` → returns array of `EngageTweetData`
5. Verify each tweet has: tweetId, text, authorName, authorHandle, url, timestamp
6. Repeat with a community ID
7. Verify retweets are filtered out

**Acceptance Criteria**:
- [ ] `getListTweets()` returns tweet data from X lists
- [ ] `getCommunityTweets()` returns tweet data from X communities
- [ ] Response parsers correctly extract tweet fields
- [ ] Retweets filtered out
- [ ] Stealth headers included in requests
- [ ] Query IDs extracted dynamically with fallback
- [ ] Error handling returns `{ success: false, message }` on failure

**What's Functional Now**: Can fetch tweets from any X list or community

**Ready For**: RFC-005

---

### RFC-005: Tab System + MentionsTab Extraction

**Summary**: Refactor the sidebar to use `ExpandableTabs` with two tabs, extracting the current content into a `MentionsTab` component.

**Dependencies**: RFC-004 (API functions ready for engage tab)

**Target Files**:
- `apps/xbooster/entrypoints/x.content/XBoosterSidebar.tsx` — MAJOR REFACTOR
- `apps/xbooster/entrypoints/x.content/stores/sidebar-store.ts` — MODIFY (add selectedTab)
- `apps/xbooster/entrypoints/x.content/mentions-tab/MentionsTab.tsx` — NEW (extracted)
- `apps/xbooster/entrypoints/x.content/engage-tab/EngageTab.tsx` — NEW (shell)

---

**Stage 0: Pre-Phase Research**
1. Read current `XBoosterSidebar.tsx` fully — identify all content to extract
2. Read LinkedIn extension's `LinkedInSidebar.tsx` — understand tab pattern exactly
3. Read `ExpandableTabs` component props and usage
4. Plan the extraction boundaries (what stays in sidebar shell vs moves to MentionsTab)
5. Present findings to user

**Stage 1: Update sidebar-store.ts**
1. Add `SIDEBAR_TABS` constant:
   ```typescript
   export const SIDEBAR_TABS = { MENTIONS: 0, ENGAGE: 1 } as const;
   ```
2. Add `selectedTab` state to `SidebarStore`:
   ```typescript
   selectedTab: number;
   setSelectedTab: (tab: number) => void;
   ```
3. Default to `SIDEBAR_TABS.MENTIONS`

**Stage 2: Extract MentionsTab**
1. Create `mentions-tab/MentionsTab.tsx`
2. Move from XBoosterSidebar:
   - Fetch button + handler
   - Send all button + handler
   - Auto-run controls (start/stop, status, cycle count, countdown)
   - Error banner
   - Loading state
   - Filtered mentions list
   - Empty state message
   - All mentions-specific hooks (`useAutoRun`)
3. Keep in XBoosterSidebar shell:
   - SheetContent wrapper
   - Close ToggleButton
   - Settings gear button + SettingsSheet
   - Header with title + tab bar
4. MentionsTab receives no props — uses existing Zustand stores directly

**Stage 3: Create EngageTab Shell**
1. Create `engage-tab/EngageTab.tsx`
2. Minimal implementation: show "Engage tab coming soon" or empty state
3. Will be fully implemented in RFC-006 and RFC-007

**Stage 4: Add Tab Bar to XBoosterSidebar**
1. Import `ExpandableTabs` from `@sassy/ui/expandable-tabs`
2. Define tabs array with Lucide icons (`AtSign` for Mentions, `Crosshair` for Engage)
3. Place tab bar in SheetHeader below the title row
4. Wire `value` and `onChange` to `useSidebarStore`
5. Conditional rendering:
   ```typescript
   {selectedTab === SIDEBAR_TABS.MENTIONS && <MentionsTab />}
   {selectedTab === SIDEBAR_TABS.ENGAGE && <EngageTab />}
   ```

**Stage 5: Verify Zero Regressions**
1. Open xBooster → Mentions tab should be selected by default
2. All existing functionality works exactly as before
3. Click Engage tab → shows shell/empty state
4. Click back to Mentions tab → state preserved (Zustand stores persist)
5. Settings button still works (opens SettingsSheet)
6. Auto-run still works from Mentions tab
7. Tab bar animates correctly

**Post-Phase Testing**:
1. Open xBooster sidebar → Mentions tab active by default
2. Click "Fetch Mentions" → mentions load (same as before)
3. Start auto-run → works (same as before)
4. Switch to Engage tab → shell renders
5. Switch back to Mentions → mentions still visible (Zustand persisted)
6. Close sidebar → reopen → last tab remembered? (design decision: always default to Mentions)
7. Settings gear → SettingsSheet opens regardless of active tab

**Acceptance Criteria**:
- [ ] Tab bar renders with Mentions and Engage tabs
- [ ] Tab switching works with animation
- [ ] MentionsTab contains all previous functionality
- [ ] Zero regressions in Mentions tab behavior
- [ ] EngageTab renders (even if empty shell)
- [ ] SettingsSheet accessible from both tabs
- [ ] Zustand stores survive tab switches

**What's Functional Now**: Dual-tab sidebar with full Mentions functionality preserved

**Ready For**: RFC-006

---

### RFC-006: Engage Tab Stores + Source Management

**Summary**: Create all Zustand stores for the Engage tab and implement source URL management (add/remove/persist).

**Dependencies**: RFC-005 (tab system ready)

**Target Files**:
- `apps/xbooster/entrypoints/x.content/engage-tab/stores/engage-sources-store.ts` — NEW
- `apps/xbooster/entrypoints/x.content/engage-tab/stores/engage-tweets-store.ts` — NEW
- `apps/xbooster/entrypoints/x.content/engage-tab/stores/engage-replies-store.ts` — NEW
- `apps/xbooster/entrypoints/x.content/engage-tab/stores/engage-settings-store.ts` — NEW
- `apps/xbooster/entrypoints/x.content/engage-tab/utils/parse-source-url.ts` — NEW
- `apps/xbooster/entrypoints/x.content/engage-tab/SourceInput.tsx` — NEW

---

**Stage 1: URL Parser Utility**
1. Create `parse-source-url.ts`
2. Implement `parseSourceUrl(url: string): ParsedSource | null`
3. Handle patterns:
   - `https://x.com/i/lists/{id}` → `{ type: "list", id }`
   - `https://x.com/i/communities/{id}` → `{ type: "community", id }`
   - `https://twitter.com/i/lists/{id}` → same (legacy domain)
   - Invalid URLs → `null`
4. Generate display label: `"List #{id.slice(0,8)}..."` or `"Community #{id.slice(0,8)}..."`

**Stage 2: Sources Store**
1. Create `engage-sources-store.ts` following existing store patterns
2. Interface: `EngageSource { id, type, url, label, addedAt }`
3. Actions: `addSource(url)`, `removeSource(id)`, `loadSources()`
4. Persist to `chrome.storage.local` under `"xbooster_engage_sources"`
5. `addSource()` calls `parseSourceUrl()`, rejects duplicates (same id)

**Stage 3: Tweets Store**
1. Create `engage-tweets-store.ts`
2. Interface: `EngageTweetData` (defined in Component Details)
3. Actions: `setTweets()`, `addTweets()` (merge + dedupe by tweetId), `clear()`
4. No persistence needed (tweets refreshed each cycle)

**Stage 4: Replies Store**
1. Create `engage-replies-store.ts`
2. Mirror pattern from existing `replies-store.ts`
3. Same `ReplyState`, `RepliedEntry` interfaces
4. Persist `alreadyReplied` to `chrome.storage.local` under `"xbooster_engage_replied"`
5. Include migration logic and prune function

**Stage 5: Settings Store**
1. Create `engage-settings-store.ts`
2. Interface: `EngageSettings` (defined in Component Details)
3. Defaults optimized for list/community engagement (shorter intervals than mentions)
4. Persist to `chrome.storage.local` under `"xbooster_engage_settings"`
5. `loadSettings()`, `updateSettings()`, `resetSettings()` actions

**Stage 6: SourceInput Component**
1. Create `SourceInput.tsx` — text input + "Add" button
2. On submit: validate URL via `parseSourceUrl()`, add to sources store
3. Show validation error if URL invalid
4. Below input: render sources as chips with type icon + label + remove (X) button
5. Style: neo-brutalist input with border, chips with badges

**Post-Phase Testing**:
1. Type `https://x.com/i/lists/1234567890` → click Add → source appears as chip
2. Type `https://x.com/i/communities/9876543210` → click Add → community chip appears
3. Type invalid URL → error message shown
4. Add duplicate → rejected with message
5. Click X on chip → source removed
6. Refresh page → sources persist (from chrome.storage.local)
7. Check `chrome.storage.local` → `xbooster_engage_sources` contains saved sources

**Acceptance Criteria**:
- [ ] All 4 Zustand stores created and functional
- [ ] URL parser handles list and community URLs (both x.com and twitter.com)
- [ ] Sources persist in chrome.storage.local
- [ ] SourceInput validates, adds, and displays sources
- [ ] Duplicate sources rejected
- [ ] Remove source works
- [ ] Stores load persisted data on init

**What's Functional Now**: Engage tab can manage engagement sources

**Ready For**: RFC-007

---

### RFC-007: Engage Tab UI + Auto-Run Hook

**Summary**: Build the full Engage tab UI (tweet list, reply editors, auto-run controls) and the engage-specific auto-run hook.

**Dependencies**: RFC-006 (stores ready), RFC-004 (API functions ready)

**Target Files**:
- `apps/xbooster/entrypoints/x.content/engage-tab/EngageTab.tsx` — FULL IMPLEMENTATION
- `apps/xbooster/entrypoints/x.content/engage-tab/TweetCard.tsx` — NEW
- `apps/xbooster/entrypoints/x.content/engage-tab/hooks/use-engage-auto-run.ts` — NEW

---

**Stage 1: use-engage-auto-run Hook**
1. Create `use-engage-auto-run.ts` mirroring `use-auto-run.ts` pattern
2. State: `EngageAutoRunState` (isRunning, status, lastRunAt, nextRunAt, cycleCount, sentThisCycle, error)
3. `runCycle()` implementation:
   a. Load engage settings
   b. Prune old already-replied entries
   c. For each source in `engageSourcesStore.sources`:
      - Call `getListTweets()` or `getCommunityTweets()` based on `source.type`
      - Parse response into `EngageTweetData[]`, tag with `sourceId`
   d. Merge all tweets, deduplicate by `tweetId`
   e. Store in `engageTweetsStore`
   f. Filter actionable: within `maxTweetAgeMinutes`, not in `alreadyReplied`, not own tweets
   g. For each actionable tweet: `generateReply()` with engage settings
   h. For each ready reply (capped by `maxSendsPerCycle`):
      - `navigateX(tweet.url)`
      - Wait 2000ms
      - `postTweetViaDOM(replyText)`
      - `engageRepliesStore.markSent()`
      - Random delay between `sendDelayMin` and `sendDelayMax`
   i. Increment cycle count, set sentThisCycle
4. `scheduleNext()` — random interval between `fetchIntervalMin` and `fetchIntervalMax`
5. `start()` / `stop()` with abort mechanism
6. Cleanup on unmount

**Stage 2: TweetCard Component**
1. Create `TweetCard.tsx`
2. Display: author avatar, name, handle (with link), tweet text (truncated), timestamp, source badge
3. Embed `ReplyEditor` (reuse from `_components/ReplyEditor.tsx`)
4. Wire to `engageRepliesStore` for reply state
5. "Regen" and "Send" buttons (same pattern as MentionCard)
6. Style: neo-brutalist card matching MentionCard

**Stage 3: EngageTab Full Implementation**
1. Update `EngageTab.tsx`:
   - SourceInput section (from RFC-006)
   - Fetch button (manual single fetch)
   - Send all button (send all ready replies)
   - Auto-run controls (Start/Stop, status, cycle count, countdown)
   - Scrollable tweet list with TweetCard components
   - Filtered tweets count ("X of Y tweets (filtered)")
   - Empty states: "Add a source URL to get started" / "No tweets found" / "All filtered"
   - Error banner
   - Loading spinner
2. `handleFetchTweets()` — manual fetch from all sources
3. `handleSendReply(tweetId)` — send single reply via DOM
4. `handleSendAll()` — send all ready replies with delays
5. Filtering logic: within maxAge, not already replied

**Stage 4: AI Prompt for Engage Mode**
1. Create `DEFAULT_ENGAGE_PROMPT` — variant of the reply prompt for list/community tweets
2. Key difference from Mentions: Mode A style (replying to someone else's tweet, not responding to mentions)
3. Adapt context labeling: `"{author}'s tweet"` instead of `"{author}'s reply to your tweet"`
4. Use engage settings for word limits

**Post-Phase Testing**:
1. Add a list source → click "Fetch" → tweets appear
2. Add a community source → click "Fetch" → community tweets appear
3. AI replies auto-generate for each tweet
4. Click "Send" on individual tweet → navigates to tweet, posts reply via DOM
5. Click "Send All" → sends all ready replies sequentially
6. Start auto-run → full cycle runs (fetch all sources → generate → send)
7. Auto-run schedules next cycle → countdown visible
8. Stop auto-run → cleanly aborts
9. Switch to Mentions tab and back → Engage state preserved
10. Both auto-runs running simultaneously → no conflicts

**Acceptance Criteria**:
- [ ] Auto-run cycle fetches from all configured sources
- [ ] Tweets from multiple sources merged and deduplicated
- [ ] AI replies generated with engage-specific prompt
- [ ] DOM-based reply sending works for list/community tweets
- [ ] TweetCard displays tweet info with reply editor
- [ ] Manual fetch, send, send-all buttons work
- [ ] Auto-run controls (start/stop/status) match mentions tab pattern
- [ ] Both tabs can run auto-run simultaneously

**What's Functional Now**: Engage tab fully functional end-to-end

**Ready For**: RFC-008

---

### RFC-008: Engage Settings + Polish

**Summary**: Add engage-specific settings to the SettingsSheet and polish the overall experience.

**Dependencies**: RFC-007 (engage tab functional)

**Target Files**:
- `apps/xbooster/entrypoints/x.content/_components/SettingsSheet.tsx` — MODIFY
- Various files for polish

---

**Stage 1: Settings Sheet Tab Awareness**
1. Modify `SettingsSheet.tsx` to show two sections with clear headers:
   - **"Mentions Settings"** — existing fields (fetch interval, send delay, count, etc.)
   - **"Engage Settings"** — new fields from `engage-settings-store`
2. Each section has its own `SettingsSection` components
3. Engage settings: fetch interval (min/max), send delay (min/max), fetch count, max sends, word limits (min/max), custom prompt, tweet age, retention days
4. Wire to `useEngageSettingsStore`
5. Reset button resets the active section (or both)

**Stage 2: Edge Case Handling**
1. Handle: no sources configured + auto-run started → show warning "Add sources first"
2. Handle: source fetch fails (invalid list ID, private community) → show per-source error
3. Handle: all tweets filtered (all already replied or too old) → show "No new tweets"
4. Handle: DOM reply fails (tweet deleted, reply disabled) → mark as error, continue cycle
5. Handle: both auto-runs trying to navigate simultaneously → queue navigation (or warn user)

**Stage 3: UI Polish**
1. Source chips: type icon (List icon for lists, Users icon for communities) + truncated label
2. TweetCard: author avatar (if available), relative timestamp ("2h ago"), source badge
3. Auto-run status: clear labels matching mentions tab pattern
4. Tab badge: show count of pending replies on tab icon (optional)
5. Smooth transitions between loading/ready states

**Stage 4: Persistence Verification**
1. Verify all stores load correctly on page refresh
2. Verify settings persist and merge with defaults
3. Verify already-replied tracking works across sessions
4. Verify sources survive page reload

**Post-Phase Testing**:
1. Open Settings → both Mentions and Engage sections visible
2. Change engage settings → close/reopen → values persist
3. Reset engage settings → defaults restored
4. Start engage auto-run with no sources → warning shown
5. Add invalid list ID → error shown on fetch
6. Full end-to-end cycle with settings applied (custom intervals, word limits)
7. Close sidebar → reopen → engage state preserved
8. Refresh x.com page → sources and replied history preserved

**Acceptance Criteria**:
- [ ] Engage settings section in SettingsSheet with all fields
- [ ] Settings persist across sessions
- [ ] Reset button works for engage settings
- [ ] Edge cases handled with user-friendly messages
- [ ] No crashes or unhandled errors
- [ ] Both tabs work independently and simultaneously
- [ ] Polish: icons, timestamps, badges, transitions

**What's Functional Now**: Complete dual-tab xBooster with stealth headers and engage functionality

**Ready For**: Production use

---

## 16. Rules (for this project)

### Tech Stack
- **Framework**: WXT (Web Extension Toolkit) with React
- **Language**: TypeScript (strict)
- **State**: Zustand 5.x with chrome.storage.local persistence
- **UI**: @sassy/ui (shadcn/radix-based), Tailwind CSS, Lucide icons, Framer Motion
- **Crypto**: js-sha256 (for transaction ID) or Web Crypto API

### Code Standards
- Follow existing xBooster patterns (store shape, hook patterns, component structure)
- No `any` types — use `unknown` with type guards for API responses
- Use named exports (consistent with codebase)
- Co-locate tab-specific code in tab directories
- Shared utilities in `utils/` or `lib/`

### Architecture Patterns
- Zustand stores as module-level singletons (survive tab switches)
- Chrome.storage.local for persistence (not localStorage — extension context)
- Content script for API calls (has cookie access via credentials: "include")
- Page-context script for page-world SDK access (CustomEvent bridge)
- DOM manipulation for tweet posting (not GraphQL CreateTweet)

### Performance
- Stealth header initialization: non-blocking, fallback until ready
- Tweet deduplication: O(n) via Set
- Store updates: granular (avoid full-store re-renders)

### Security
- No hardcoded API keys beyond the public Twitter bearer token
- Gemini API key stored in code (existing pattern, acceptable for personal extension)
- No new manifest permissions required

---

## 17. Verification (Comprehensive Review)

### Gap Analysis

**Resolved**:
- EngageX transaction ID algorithm fully documented from research
- XPForwardedFor SDK availability confirmed on x.com
- Tab system pattern proven in LinkedIn extension
- Response parser paths documented from EngageX source analysis

**Remaining Risks**:
- Twitter may have updated query IDs since EngageX was built → mitigated by dynamic extraction
- `XPForwardedForSDK` may not be present on all x.com pages → mitigated by fallback
- SVG animation elements may differ between x.com page versions → mitigated by hardcoded fallback paths
- Both auto-runs navigating simultaneously could conflict → mitigated by sequential DOM posting within each cycle + send delays

### Quality Assessment

| Criteria | Score | Reason |
|----------|-------|--------|
| **Completeness** | 90/100 | All major features specified; engage AI prompt details left to implementation |
| **Clarity** | 95/100 | Clear architecture decisions, file locations, and data flow |
| **Feasibility** | 95/100 | All components proven in either EngageX or LinkedIn extension |
| **Maintainability** | 90/100 | TypeScript port, co-located tab structure, shared patterns |
| **Risk** | 85/100 | Main risk is Twitter API changes; mitigated by fallbacks |

---

## 18. Change Management

**Change Request Process**:
1. Classify change (stealth algorithm update, new tweet source type, UI change)
2. Assess impact on RFCs (which phases affected)
3. Update this plan file
4. If mid-execution: pause, update plan, get approval, resume

**Likely Changes**:
- Twitter updates query IDs → update fallback constants (5-minute fix)
- Twitter changes SVG animation structure → update hardcoded fallback paths
- User wants additional source types (search, user timeline) → new RFC after V1

---

## 19. Acceptance Criteria (Versioned)

### V1.0

**Stealth Headers**:
- [ ] All API calls include `x-client-transaction-id`
- [ ] All API calls include `x-xp-forwarded-for`
- [ ] Fallbacks work when generation fails
- [ ] No increase in 403/rate limit responses vs before

**Engage Tab**:
- [ ] Tab bar with Mentions and Engage tabs
- [ ] Users can add/remove list and community URLs
- [ ] Tweets fetched from configured sources
- [ ] AI replies generated for fetched tweets
- [ ] Replies sent via DOM manipulation
- [ ] Auto-run cycle works (fetch → generate → send → schedule)
- [ ] Independent settings for engage tab
- [ ] Already-replied tracking prevents duplicate engagement
- [ ] Sources and settings persist across sessions

**Zero Regressions**:
- [ ] Mentions tab works exactly as before
- [ ] Mentions auto-run unaffected
- [ ] Settings for mentions tab unchanged

---

## 20. Future Work

### Post-V1 Enhancements
- Community auto-discovery from memberships API
- Cursor-based pagination for more tweets
- Rate limit detection and adaptive backoff
- Per-source statistics (tweets fetched, replies sent)
- Search timeline as a source type
- User timeline as a source type
- Like/retweet automation alongside replies

---

## Implementation Checklist (Complete Workflow)

**RFC-001: XClientTransactionManager** (~3-4 hours)
- [ ] Research EngageX algorithm and dependencies
- [ ] Create `lib/x-client-transaction.ts` with types
- [ ] Implement CubicBezier, interpolation, matrix utilities
- [ ] Implement ClientTransaction class (full algorithm)
- [ ] Implement XClientTransactionManager wrapper
- [ ] Implement fallback chain
- [ ] Test on x.com

**RFC-002: XP Forwarded For** (~2 hours)
- [ ] Create `public/page-context.js`
- [ ] Configure WXT web_accessible_resources
- [ ] Implement content script bridge in `lib/x-stealth-headers.ts`
- [ ] Implement caching and fallback
- [ ] Test SDK invocation on x.com

**RFC-003: Stealth Integration** (~1-2 hours)
- [ ] Implement `initStealthHeaders()` orchestrator
- [ ] Modify `buildHeaders()` to be async with stealth headers
- [ ] Update all existing callers
- [ ] Add initialization to content script entry
- [ ] Verify headers in Network tab

**RFC-004: List + Community APIs** (~2-3 hours)
- [ ] Add query IDs to extraction + fallbacks
- [ ] Implement `getListTweets()`
- [ ] Implement `getCommunityTweets()`
- [ ] Create response parsers (list + community)
- [ ] Test with real list/community IDs

**RFC-005: Tab System** (~2-3 hours)
- [ ] Update sidebar-store with selectedTab
- [ ] Extract MentionsTab from XBoosterSidebar
- [ ] Create EngageTab shell
- [ ] Add ExpandableTabs to sidebar header
- [ ] Verify zero regressions

**RFC-006: Engage Stores + Sources** (~2-3 hours)
- [ ] Create URL parser utility
- [ ] Create engage-sources-store (persisted)
- [ ] Create engage-tweets-store
- [ ] Create engage-replies-store (persisted)
- [ ] Create engage-settings-store (persisted)
- [ ] Create SourceInput component

**RFC-007: Engage Tab UI + Auto-Run** (~4-5 hours)
- [ ] Create use-engage-auto-run hook
- [ ] Create TweetCard component
- [ ] Implement EngageTab (full UI)
- [ ] Create engage AI prompt
- [ ] Test end-to-end cycle
- [ ] Test simultaneous auto-runs

**RFC-008: Settings + Polish** (~2-3 hours)
- [ ] Add engage settings to SettingsSheet
- [ ] Handle edge cases
- [ ] UI polish (icons, timestamps, badges)
- [ ] Persistence verification
- [ ] Final testing

**Total Estimated Effort**: ~18-23 hours across 8 RFCs

---

## Cursor + RIPER-5 Guidance

### Cursor Plan Mode
- Import RFC checklists directly into Cursor Plan mode
- Execute sequentially: RFC-001 → RFC-002 → ... → RFC-008
- After each RFC, update status markers in this plan (⏳ → 🚧 → ✅)
- Reattach this plan to future sessions for context

### RIPER-5 Mode
1. **RESEARCH**: ✅ Complete (EngageX stealth analysis, xBooster structure, LinkedIn tab pattern)
2. **INNOVATE**: ✅ Complete (architecture decisions finalized)
3. **PLAN**: 🚧 **YOU ARE HERE** — This plan is the output
4. **EXECUTE**: Request user approval, then `ENTER EXECUTE MODE` per RFC
5. **REVIEW**: After each RFC, validate implementation matches plan

**Next Step**: Review this plan, approve, then begin with `ENTER EXECUTE MODE` for RFC-001.
