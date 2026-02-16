# xBooster WXT MVP Plan

- **Date**: 2026-02-05
- **Complexity**: Simple (one-session MVP)
- **Status**: ✅ DEPLOYED (running on VPS, all core features complete)

## Overview

Migrate the xBooster Chrome extension into the turborepo at `apps/xbooster` using the WXT framework. The extension automates X/Twitter engagement by fetching mentions, displaying original tweet context, generating AI replies via Gemini, and posting replies — all through a sidebar UI injected into x.com pages via Shadow DOM, following the same architectural patterns as the LinkedIn `wxt-extension`.

## Quick Links

- [Goals](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Functional Requirements](#functional-requirements)
- [Implementation Checklist](#implementation-checklist)

## Goals and Success Metrics

| Goal | Metric |
|------|--------|
| Extension loads on x.com | Sidebar toggle button visible on x.com pages |
| Header capture works | Background intercepts and stores X.com auth headers |
| Mentions load | "Fetch Mentions" returns parsed mention data |
| Original tweets cached | Same original tweet fetched only once for multiple mentions |
| AI replies auto-generate | Gemini generates reply for each mention on load |
| Replies post successfully | "Send" button posts reply via CreateTweet API |

---

## Execution Brief

### Phase 1: Project Scaffolding (Config + Build) ✅
**What happens**: Create `apps/xbooster` with WXT config, package.json, tsconfig, Tailwind, PostCSS — adapted from `wxt-extension` but stripped of Clerk/tRPC/PostHog. Install deps.
**Test**: `pnpm dev` in xbooster starts WXT dev server without errors.

### Phase 2: Background Script (Auth Capture) ✅
**What happens**: Create background script that intercepts `x.com/i/api/*` requests via `webRequest.onBeforeSendHeaders`, captures `cookie`, `x-csrf-token`, `authorization`, and stores in `wxt/storage`. Responds to `getXAuth` messages from content script.
**Test**: Browse x.com, then send `getXAuth` message from devtools — returns captured headers.

### Phase 3: Content Script Shell (Shadow DOM Sidebar) ✅
**What happens**: Create content script for `x.com/*` with Shadow DOM sidebar using `@sassy/ui` Sheet component. Toggle button on right edge. Minimal sidebar with header and "Fetch Mentions" button.
**Test**: Navigate to x.com, see toggle button, click to open/close sidebar.

### Phase 4: X.com API Integration (Mentions + Tweet Detail) ✅
**What happens**: Implement `fetchNotifications()`, `getTweetDetail()`, and `postTweet()` in `utils/x-api.ts`. Dynamic queryId extraction from `main.*.js` with hardcoded fallbacks. Use captured headers from background. Implement tweet cache in Zustand store.
**Test**: Click "Fetch Mentions" → mentions appear with original tweet context. Same original tweet only fetched once.

### Phase 5: AI Reply Generation + Posting ✅
**What happens**: Implement Gemini 2.5 Flash direct API call for reply generation. Auto-generate replies as mentions load. Add regenerate button, send individual, send all. Track already-replied IDs in `chrome.storage.local`.
**Test**: Mentions load → AI replies auto-populate → can edit, regenerate, send individually or all at once.

### Phase 6: Post-Implementation Fixes & Enhancements ✅
**What happens**: Fix bugs found during live testing on x.com.
**Fixes applied**:
1. CSP blocking WebSocket in dev mode — added `http://localhost:* ws://localhost:*` to CSP `connect-src`
2. Toggle button invisible — `variant="default"` doesn't exist in `@sassy/ui/button`, changed to `variant="primary"`
3. CreateTweet HTTP 400 — X.com API requires `responsive_web_grok_annotations_enabled` and `post_ctas_fetch_enabled` features, added to FEATURES object
4. Empty `authorHandle` in parsed mentions — `screen_name` lives at `core.screen_name` (same path as `core.name`), added fallback path
5. SPA navigation for tweet links — created `navigateX` utility (pushState + popstate) and `XLink` component to navigate within x.com without page reload, keeping sidebar open
6. Navigate-before-send — `handleSendReply` now SPA-navigates to the mention's tweet page, waits 1.5s, then posts from that page context (Referer = `window.location.href`). Both individual Send and Send All use this flow.

### Phase 7: Settings UI & Auto-Run Loop ✅
**What happens**: Add configurable settings panel (fetch interval, send delay, fetch count, max sends per cycle, reply length, history cleanup, custom prompt) stored in `chrome.storage.local`. Add auto-run loop that fetches mentions, generates replies, and sends them on a randomized schedule with abort support.
**Files created**:
- `entrypoints/x.content/_components/SettingsSheet.tsx` — Animated settings panel with all configurable parameters
- `entrypoints/x.content/stores/settings-store.ts` — Zustand store backed by `chrome.storage.local` under `xbooster_settings` key
- `entrypoints/x.content/hooks/use-auto-run.ts` — Auto-run hook with cycle management, abort, and randomized delays
**Test**: Open settings, change values, close/reopen — values persist. Start auto-run → fetches, generates, sends on schedule. Stop auto-run → cleanly aborts.

### Phase 8: AI Prompt & Model Upgrade ✅
**What happens**: Replace basic AI prompt with comprehensive v5 anti-AI-detection prompt (Mode A/B, tiers, anti-slop filter, banned patterns, human question patterns). Upgrade from Gemini 2.5 Flash to Gemini 3 Flash with thinking (`thinkingLevel: "LOW"`). Fix response parsing for thinking model (filter thought parts from text parts).
**Changes**:
- `DEFAULT_REPLY_PROMPT` → Full v5 prompt (~286 lines) with persona, voice rules, tier system, anti-slop filter, banned AI vocabulary
- Context labeling: `"YOUR original tweet"` + `"{author}'s reply to your tweet"` with Mode B indicator
- Model: `gemini-3-flash-preview` with `thinkingConfig: { thinkingLevel: "LOW" }`
- Response parsing: `parts.filter(p => p.text && !p.thought).pop()` to skip thinking parts
**Test**: Generate reply → output follows v5 prompt style (lowercase, one sentence, no emojis, no AI-isms).

### Phase 9: Production Build & VPS Deployment ✅
**What happens**: Build production Chrome extension, deploy to VPS via Chrome Remote Desktop, export/import already-replied history from dev machine to VPS.
**Steps completed**:
1. `pnpm --filter xbooster build` → `dist/chrome-mv3/` (~508KB)
2. Zipped to `apps/xbooster/xbooster-chrome-mv3.zip`
3. Uploaded to VPS via Chrome Remote Desktop
4. Unzipped and loaded as unpacked extension on VPS Chrome
5. Exported 31 already-replied entries from dev machine's service worker console
6. Imported entries on VPS to prevent duplicate replies
**Test**: VPS auto-run processes new mentions without re-replying to old ones.

### Expected Outcome
- New `apps/xbooster` WXT Chrome extension in the turborepo
- Sidebar UI on x.com pages (no popup, no options page)
- Background captures X.com auth headers automatically
- Fetch mentions with original tweet context (cached)
- AI-generated replies via Gemini 3 Flash with thinking and v5 anti-AI prompt
- Configurable settings (intervals, delays, reply length, custom prompt)
- Auto-run loop with cycle management and randomized timing
- Already-replied tracking to avoid duplicates (exportable/importable across machines)
- Production build deployed and running on VPS

---

## Scope

### In Scope
- WXT project scaffolding in turborepo
- Background header capture for X.com auth
- Content script sidebar on x.com (Shadow DOM)
- Fetch mentions via NotificationsTimeline GraphQL API
- Fetch original tweet via TweetDetail GraphQL API (with caching)
- Post replies via CreateTweet GraphQL API
- AI reply generation via direct Gemini API call
- Regenerate reply, send individual, send all
- Already-replied tracking
- Use `@sassy/ui` Sheet + Button components

### Out of Scope
- Clerk auth / tRPC backend integration
- PostHog analytics
- Popup page / options page
- `x-client-transaction-id` header generation (add later if needed)
- `x-xp-forwarded-for` header generation (add later if needed)
- Community posting
- Custom fonts (use system fonts for MVP)
- Dark mode
- Chrome Web Store deployment (currently sideloaded)
- Auth expiration detection / auto-refresh
- Rate limit detection and backoff
- Auto-resume after browser restart

---

## Assumptions and Constraints

1. X.com's GraphQL API still accepts requests without `x-client-transaction-id` — if not, we'll add it in a follow-up
2. The user has an active X.com session in their browser (extension piggybacks on it)
3. QueryId extraction from `main.*.js` still works; hardcoded fallbacks serve as backup
4. Gemini API key `AIzaSyDYd2Zh6ALKkEmyVN7WwCBHSUFoCWtYNAs` is valid and has sufficient quota
5. The existing `@sassy/ui` Sheet component works in Shadow DOM with `portalContainer` prop

---

## Functional Requirements

### Background Script
- FR-1: Intercept all `x.com/i/api/*` requests via `webRequest.onBeforeSendHeaders`
- FR-2: Capture and persist headers: `cookie`, `x-csrf-token`, `authorization`, `user-agent`
- FR-3: Store captured auth in `wxt/storage` under `local:xAuth` key
- FR-4: Respond to `getXAuth` messages from content scripts with stored auth data
- FR-5: Use `extraHeaders` flag to access cookie headers

### Content Script Sidebar
- FR-6: Mount Shadow DOM sidebar on all `x.com/*` pages
- FR-7: Toggle button fixed on right edge, opens/closes Sheet sidebar
- FR-8: CSS isolation via `:host` variables, `postcss-rem-to-pixel`
- FR-9: Sidebar contains: header, "Fetch Mentions" button, "Send All" button, mention list

### X.com API
- FR-10: `fetchNotifications()` — GET `NotificationsTimeline` with `timeline_type: "Mentions"`, count: 40
- FR-11: `getTweetDetail(tweetId)` — GET `TweetDetail` for original tweet context
- FR-12: `postTweet(text, replyToTweetId)` — POST `CreateTweet` for reply posting
- FR-13: Dynamic queryId extraction from page's `main.*.js` bundle with regex
- FR-14: Hardcoded queryId fallbacks for all 3 operations
- FR-15: Tweet detail cache — Map of `tweetId → TweetData` in Zustand store, check before fetch

### AI Reply
- FR-16: Call Gemini 3 Flash `generateContent` API with thinking (`thinkingLevel: "LOW"`) directly from content script context ✅ (upgraded from 2.5 Flash)
- FR-17: Prompt includes original tweet text + mention text with Mode B context labeling ✅ (upgraded to v5 anti-AI prompt)
- FR-18: Auto-generate replies as mentions load (sequential, not parallel to avoid rate limits)
- FR-19: Editable reply textarea per mention
- FR-20: "Regenerate" button per mention
- FR-21: "Send" button per mention (posts via CreateTweet, marks as replied)
- FR-22: "Send All" button (sequential with configurable delays)
- FR-23: Track already-replied IDs in `chrome.storage.local` to skip on next fetch
- FR-24: Response parsing handles Gemini 3 thinking parts (filter `thought` from `text` parts)

### Settings & Configuration
- FR-25: Configurable fetch interval range (minutes)
- FR-26: Configurable send delay range (seconds)
- FR-27: Configurable fetch count per API call
- FR-28: Configurable max sends per auto-run cycle
- FR-29: Configurable reply word count range
- FR-30: Custom system prompt override (empty = use default v5 prompt)
- FR-31: History cleanup — auto-prune already-replied entries older than N days
- FR-32: All settings persisted in `chrome.storage.local` under `xbooster_settings`
- FR-33: Reset to defaults button

### Auto-Run Loop
- FR-34: Start/stop auto-run with visual status indicators
- FR-35: Randomized fetch interval between configured min/max
- FR-36: Full cycle: fetch → filter → fetch originals → generate → send (capped by maxSendsPerCycle)
- FR-37: Abort support — cleanly stops mid-cycle
- FR-38: Cycle counter and sent-this-cycle display
- FR-39: Next-run countdown display
- FR-40: Error display per cycle

### Mention Filtering
- FR-41: Only show mentions where `reply_count === 0` (no existing replies)
- FR-42: Skip mentions already in the replied list
- FR-43: Group mentions by original tweet to minimize API calls

---

## Non-Functional Requirements

- NFR-1: Extension must not break x.com page functionality
- NFR-2: Shadow DOM must fully isolate sidebar styles from x.com
- NFR-3: Sidebar should not exceed 400px width
- NFR-4: API calls must use `credentials: "include"` for cookie forwarding

---

## Acceptance Criteria

1. `pnpm dev` starts xbooster WXT dev server
2. Loading the extension shows a toggle button on x.com pages
3. Clicking toggle opens a sidebar panel
4. Background captures auth headers when user browses x.com
5. "Fetch Mentions" loads and displays mention notifications
6. Original tweet context shown above each mention
7. Same original tweet only fetched once (verify via network tab)
8. AI replies auto-generate for each mention
9. Can edit the generated reply text
10. "Regenerate" produces a new reply
11. "Send" posts the reply and marks it as replied
12. "Send All" posts all pending replies sequentially
13. Already-replied mentions are hidden on next fetch

---

## Implementation Checklist

### Phase 1: Project Scaffolding

- [x] **1.1** Create `apps/xbooster/package.json` with name `@sassy/xbooster`, WXT deps, React 19, Zustand, `@sassy/ui`, Tailwind 3, postcss-rem-to-pixel. No Clerk, no tRPC, no PostHog.

```json
{
  "name": "@sassy/xbooster",
  "description": "xBooster - X/Twitter Engagement Automation",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "pnpm with-env wxt",
    "with-env": "dotenv -e ../../.env --",
    "build": "wxt build",
    "postinstall": "wxt prepare",
    "clean": "git clean -xdf .cache .turbo .output dist node_modules"
  },
  "dependencies": {
    "@sassy/ui": "workspace:*",
    "lucide-react": "^0.511.0",
    "react": "catalog:react19",
    "react-dom": "catalog:react19",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "zustand": "^5.0.9"
  },
  "devDependencies": {
    "@sassy/tsconfig": "workspace:*",
    "@types/chrome": "^0.0.323",
    "@types/react": "catalog:react19",
    "@types/react-dom": "catalog:react19",
    "@wxt-dev/module-react": "^1.1.2",
    "autoprefixer": "^10.4.21",
    "dotenv-cli": "^8.0.0",
    "postcss": "^8.5.6",
    "postcss-rem-to-pixel": "^4.1.2",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "catalog:",
    "vite-tsconfig-paths": "^5.1.4",
    "wxt": "^0.19.29"
  },
  "prettier": "@sassy/prettier-config"
}
```

- [x] **1.2** Create `apps/xbooster/wxt.config.ts` — Chrome MV3, React module, x.com permissions

```ts
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";

const basePort = parseInt(process.env.PORT || "3000");
const wxtPort = basePort + 3; // +3 to avoid conflict with wxt-extension (+2)

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",
  runner: { disabled: true },
  dev: { server: { port: wxtPort } },
  manifest: {
    name: "xBooster",
    description: "X/Twitter Engagement Automation",
    version: "0.1.0",
    permissions: ["storage", "tabs", "cookies", "webRequest"],
    host_permissions: [
      "https://*.x.com/*",
      "https://x.com/*",
      "https://generativelanguage.googleapis.com/*",
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com;",
    },
  },
  vite: () => ({
    plugins: [tsconfigPaths()],
    css: {
      postcss: {
        plugins: [
          require("tailwindcss"),
          require("postcss-rem-to-pixel")({
            rootValue: 16,
            propList: ["*"],
            selectorBlackList: [],
          }),
          require("autoprefixer"),
        ],
      },
    },
    esbuild: { charset: "ascii" },
  }),
});
```

- [x] **1.3** Create `apps/xbooster/tsconfig.json` — extends monorepo base, Chrome types, `@/*` alias

- [x] **1.4** Create `apps/xbooster/tailwind.config.ts` — CSS variable-based, content includes `@sassy/ui`

- [x] **1.5** Create `apps/xbooster/postcss.config.mjs` — Tailwind + rem-to-pixel + autoprefixer

- [x] **1.6** Create `apps/xbooster/assets/globals.css` — `:host` scoped CSS variables (simpler theme than LinkedIn extension, just clean defaults)

- [x] **1.7** Run `pnpm install` from monorepo root, verify `pnpm --filter @sassy/xbooster dev` starts

### Phase 2: Background Script

- [x] **2.1** Create `apps/xbooster/entrypoints/background/index.ts`

```ts
// Key implementation:
// - defineBackground()
// - chrome.webRequest.onBeforeSendHeaders on *://x.com/i/api/* and *://*.x.com/i/api/*
// - Capture: cookie, x-csrf-token, authorization, user-agent
// - Store in storage.setItem("local:xAuth", { cookie, csrfToken, authorization, userAgent })
// - Handle message: "getXAuth" → return stored auth
// - Use ["requestHeaders", "extraHeaders"] to access cookies
```

- [x] **2.2** Verify header capture: browse x.com with extension loaded, check `wxt/storage` has auth data

### Phase 3: Content Script Sidebar

- [x] **3.1** Create `apps/xbooster/entrypoints/x.content/index.tsx`

```tsx
// Key implementation:
// - defineContentScript({ matches: ["https://*.x.com/*", "https://x.com/*"], cssInjectionMode: "ui" })
// - createShadowRootUi(ctx, { name: "xbooster-sidebar", position: "overlay", anchor: "body" })
// - Mount React root with <App shadowRoot={container} />
// - Import globals.css
```

- [x] **3.2** Create `apps/xbooster/entrypoints/x.content/App.tsx`

```tsx
// Key implementation:
// - Sheet from @sassy/ui/sheet (non-modal, portalContainer={shadowRoot})
// - ToggleButton fixed on right edge
// - XBoosterSidebar inside Sheet
// - useSidebarStore for open/close state
// - useShadowRootStore to share shadowRoot ref with portals
```

- [x] **3.3** Create `apps/xbooster/entrypoints/x.content/XBoosterSidebar.tsx`

```tsx
// Key implementation:
// - SheetContent side="right" with portalContainer
// - Header: "xBooster" title
// - "Fetch Mentions" button
// - "Send All" button (disabled when no pending replies)
// - Scrollable mention list
```

- [x] **3.4** Create `apps/xbooster/entrypoints/x.content/_components/ToggleButton.tsx`

- [x] **3.5** Create Zustand stores:
  - `stores/sidebar-store.ts` — isOpen, setIsOpen
  - `stores/shadow-root-store.ts` — shadowRoot ref for Radix portals

- [x] **3.6** Verify: load extension on x.com, toggle button appears, sidebar opens/closes

### Phase 4: X.com API Integration

- [x] **4.1** Create `apps/xbooster/lib/x-auth-service.ts`

```ts
// Key implementation:
// - getXAuth(): sends chrome.runtime.sendMessage({ action: "getXAuth" })
// - Returns { cookie, csrfToken, authorization, userAgent }
```

- [x] **4.2** Create `apps/xbooster/entrypoints/x.content/utils/x-api.ts`

```ts
// Key implementation:
// - getQueryIds(): fetch page's main.*.js, regex extract queryIds for CreateTweet, TweetDetail, NotificationsTimeline
// - Hardcoded fallbacks for all 3
// - fetchNotifications(): GET /i/api/graphql/{qid}/NotificationsTimeline
//   - variables: { timeline_type: "Mentions", cursor: null, count: 40 }
//   - features: { ... 30+ feature flags ... }
//   - Headers: authorization, x-csrf-token, cookie, x-twitter-active-user, x-twitter-auth-type, x-twitter-client-language
// - getTweetDetail(tweetId): GET /i/api/graphql/{qid}/TweetDetail
// - postTweet(text, replyToTweetId): POST /i/api/graphql/{qid}/CreateTweet
// All calls use credentials: "include"
```

- [x] **4.3** Create `apps/xbooster/entrypoints/x.content/utils/parse-notifications.ts`

```ts
// Key implementation:
// - parseNotificationEntries(data) → MentionData[]
// - Extract: tweetId, text, authorName, authorHandle, conversationId, inReplyToStatusId, replyCount
// - Filter: replyCount === 0, conversationId === inReplyToStatusId
// - parseTweetDetail(data) → { text, authorName, authorHandle }
```

- [x] **4.4** Create mentions store with tweet cache:
  - `stores/mentions-store.ts`

```ts
// Key implementation:
// interface MentionData { tweetId, text, authorName, authorHandle, conversationId, inReplyToStatusId, replyCount }
// interface OriginalTweet { tweetId, text, authorName, authorHandle }
//
// Store:
//   mentions: MentionData[]
//   originalTweetCache: Map<string, OriginalTweet>  // tweetId → data
//   isLoading: boolean
//   fetchMentions(): async - calls fetchNotifications(), parses, deduplicates
//   fetchOriginalTweet(tweetId): async - checks cache first, fetches if miss, stores in cache
//   loadMentionsWithContext(): async - fetchMentions(), then for each unique conversationId, fetchOriginalTweet()
```

- [x] **4.5** Create `apps/xbooster/entrypoints/x.content/_components/MentionCard.tsx`

```tsx
// Key implementation:
// - Shows original tweet (from cache) in a card above
// - Shows mention text + author
// - Shows AI reply textarea (from replies store)
// - Regenerate button, Send button
// - Loading/sent states
```

- [x] **4.6** Wire "Fetch Mentions" button → `loadMentionsWithContext()` → render MentionCards

### Phase 5: AI Reply + Posting

- [x] **5.1** Create `apps/xbooster/entrypoints/x.content/utils/ai-reply.ts`

```ts
// Key implementation:
// - GEMINI_API_KEY = "AIzaSyDYd2Zh6ALKkEmyVN7WwCBHSUFoCWtYNAs"
// - REPLY_PROMPT — adapted from old xbooster's prompt
// - generateReply(originalTweetText, mentionText, mentionAuthor): Promise<string>
//   - POST to https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
//   - temperature: 0.9, topK: 1, topP: 1
//   - Returns cleaned text
```

- [x] **5.2** Create replies store:
  - `stores/replies-store.ts`

```ts
// Key implementation:
// interface ReplyState { tweetId: string; text: string; status: "pending" | "generating" | "ready" | "sending" | "sent" | "error" }
//
// Store:
//   replies: Map<string, ReplyState>
//   alreadyRepliedIds: string[]  // loaded from chrome.storage.local
//   generateReply(tweetId, originalText, mentionText, mentionAuthor): async
//   regenerateReply(tweetId, ...): async
//   updateReplyText(tweetId, text): void  // for manual editing
//   sendReply(tweetId): async — calls postTweet, marks as sent, adds to alreadyRepliedIds
//   sendAllReplies(): async — sequential with 2s delays
//   loadAlreadyReplied(): async — from chrome.storage.local
//   isAlreadyReplied(tweetId): boolean
```

- [x] **5.3** Create `apps/xbooster/entrypoints/x.content/_components/ReplyEditor.tsx`

```tsx
// Key implementation:
// - Textarea bound to reply text (editable)
// - "Regenerate" button (calls regenerateReply)
// - "Send" button (calls sendReply)
// - Status indicator (generating spinner, sent checkmark, error message)
```

- [x] **5.4** Wire auto-generation: after `loadMentionsWithContext()` completes, sequentially call `generateReply()` for each mention that isn't already replied

- [x] **5.5** Wire "Send All" button → `sendAllReplies()` with visual progress

- [x] **5.6** Load already-replied IDs from `chrome.storage.local` on mount, filter them from mention display

- [x] **5.7** End-to-end test: fetch mentions → see original tweets → see AI replies → edit → send one → send all

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| X.com requires `x-client-transaction-id` | API calls fail with 403 | Add `x-client-transaction-id` npm package in follow-up; for now test without |
| QueryId extraction regex breaks | Can't find dynamic queryIds | Hardcoded fallback queryIds; update them manually if needed |
| X.com rate limits automated posting | 429 errors on Send All | 2-second delay between sends; can increase if needed |
| Gemini API rate limits | AI generation fails for bulk | Sequential generation (not parallel); add retry with backoff |
| Shadow DOM breaks `@sassy/ui` components | UI doesn't render | Use `portalContainer` prop on Sheet; already proven in LinkedIn ext |

---

## Integration Notes

### Dependencies
- `@sassy/ui` — Sheet, Button, Textarea, ScrollArea components
- `wxt` framework — defineContentScript, defineBackground, createShadowRootUi, storage
- `zustand` — state management
- No new packages beyond what's already in the monorepo (except WXT dev deps)

### Environment
- Gemini API key: hardcoded `AIzaSyDYd2Zh6ALKkEmyVN7WwCBHSUFoCWtYNAs`
- Dev server port: `PORT + 3` (to avoid conflict with wxt-extension at `PORT + 2`)
- Loads `.env` from monorepo root via `dotenv-cli`

### Key Patterns from LinkedIn Extension
- Shadow DOM via `createShadowRootUi` with `cssInjectionMode: "ui"`
- `:host` CSS variables (not `:root`)
- `postcss-rem-to-pixel` for consistent sizing
- `portalContainer` prop on Radix-based Sheet for portal rendering inside Shadow DOM
- `chrome.webRequest.onBeforeSendHeaders` with `["requestHeaders", "extraHeaders"]`
- `wxt/storage` for persisting captured auth

### X.com API Headers (minimal set for MVP)
```
authorization: Bearer <captured>
cookie: <captured>
x-csrf-token: <extracted from ct0 cookie>
x-twitter-active-user: yes
x-twitter-auth-type: OAuth2Session
x-twitter-client-language: en
content-type: application/json
```

---

## Cursor Plan + RIPER-5 Guidance

### Cursor Plan Mode
- Import the Implementation Checklist steps (1.1 through 5.7) directly
- Execute sequentially — each phase builds on the previous
- After each phase, verify the test criteria before proceeding

### RIPER-5 Mode
- **RESEARCH**: ✅ Complete — codebase analyzed, patterns documented
- **INNOVATE**: ✅ Complete — approach decided (WXT sidebar, direct API, direct Gemini)
- **PLAN**: ✅ Complete — this document
- **EXECUTE**: ✅ Complete — all 9 phases implemented and deployed
- **REVIEW**: ✅ Complete — tested on live x.com, deployed to VPS, running 24/7

### Acceptance Criteria Status
1. ✅ `pnpm dev` starts xbooster WXT dev server
2. ✅ Loading the extension shows a toggle button on x.com pages
3. ✅ Clicking toggle opens a sidebar panel
4. ✅ Background captures auth headers when user browses x.com
5. ✅ "Fetch Mentions" loads and displays mention notifications
6. ✅ Original tweet context shown above each mention
7. ✅ Same original tweet only fetched once (caching in Zustand store)
8. ✅ AI replies auto-generate for each mention (Gemini 3 Flash with thinking)
9. ✅ Can edit the generated reply text
10. ✅ "Regenerate" produces a new reply
11. ✅ "Send" posts the reply and marks it as replied (navigate-before-send pattern)
12. ✅ "Send All" posts all pending replies sequentially with configurable delays
13. ✅ Already-replied mentions are hidden on next fetch
14. ✅ Settings panel with all configurable parameters (persisted)
15. ✅ Auto-run loop with cycle management and randomized timing
16. ✅ Custom v5 anti-AI prompt with Mode A/B, tiers, anti-slop filter
17. ✅ Production build deployed and running on VPS

### Additional Files Created (not in original plan)
- `entrypoints/x.content/utils/navigate-x.ts` — SPA navigation utility (`pushState` + `popstate`)
- `entrypoints/x.content/_components/XLink.tsx` — Link component for in-page X.com navigation
- `entrypoints/x.content/_components/SettingsSheet.tsx` — Animated settings panel
- `entrypoints/x.content/stores/settings-store.ts` — Settings persistence via `chrome.storage.local`
- `entrypoints/x.content/hooks/use-auto-run.ts` — Auto-run cycle management hook

### Key Deviations from Plan
1. **CSP**: Added `http://localhost:* ws://localhost:*` to `connect-src` for dev mode WebSocket
2. **FEATURES object**: Added `responsive_web_grok_annotations_enabled` and `post_ctas_fetch_enabled` — X.com requires these for CreateTweet
3. **authorHandle parsing**: Added `core.screen_name` fallback path — `legacy.screen_name` was empty in X.com's response
4. **Navigate-before-send**: SPA navigation to tweet page before posting reply, wait 1.5s, then POST — makes Referer match tweet context
5. **XLink component**: Created for in-page SPA navigation to tweet conversations
6. **Settings system**: Full configurable settings panel not in original plan — added fetch interval, send delay, fetch count, max sends per cycle, reply length, history cleanup, custom prompt
7. **Auto-run loop**: Not in original plan — added full autonomous cycle with abort support, randomized delays, cycle tracking
8. **Gemini 3 Flash upgrade**: Upgraded from Gemini 2.5 Flash to 3 Flash with `thinkingConfig: { thinkingLevel: "LOW" }` — response parsing handles thought parts
9. **v5 anti-AI prompt**: Comprehensive 286-line prompt replacing basic prompt — Mode A/B, tier system, anti-slop filter, banned AI vocabulary, human question patterns
10. **VPS deployment**: Production build, zip packaging, already-replied export/import workflow

### VPS Deployment Notes
- Build: `pnpm --filter xbooster build` → `dist/chrome-mv3/`
- Zip artifact: `apps/xbooster/xbooster-chrome-mv3.zip`
- Deploy: Upload zip → unzip on VPS → load as unpacked extension in Chrome
- Already-replied sync: Export from dev machine service worker console → import on VPS service worker console
- Auth capture: Browse x.com on VPS Chrome → extension auto-captures headers

### Known Limitations (for future improvement)
1. **No auth expiration detection** — if X.com auth expires, API calls silently fail (estimated #1 risk for long-running VPS)
2. **Unbounded memory growth** — `originalTweetCache` and `replies` dict grow without limit over time
3. **No rate limit handling** — no detection or backoff for X.com 429 responses
4. **No Gemini retry** — single attempt per generation, no retry on transient errors
5. **No auto-resume** — if Chrome restarts on VPS, auto-run doesn't resume automatically
6. **Manual already-replied sync** — export/import between machines requires service worker console access

**Status**: MVP complete and deployed. Running on VPS for 24/7 automated engagement.
