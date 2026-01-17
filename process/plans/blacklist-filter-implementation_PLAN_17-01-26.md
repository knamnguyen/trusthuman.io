# Blacklist Filter Implementation - Implementation Plan

**Created**: 2026-01-17
**Complexity**: SIMPLE
**Status**: 🔲 NOT STARTED

---

## 1. Overview

Implement blacklist filtering during post loading. When a user selects a blacklist and enables "Skip Blacklist", posts from authors whose profile URL partially matches any blacklisted profile should be skipped.

### Current State

- ✅ UI exists for selecting a blacklist (`BlacklistSelector.tsx`)
- ✅ Settings stored in DB (`skipBlacklistEnabled`, `blacklistId`)
- ✅ Settings passed through queue state
- ❌ **No pre-fetching of blacklist profiles**
- ❌ **No actual filtering during post collection**

### Key Insight: Partial URL Matching

Posts contain author profile URLs like `/in/john-doe-123/` but we store profile URLs that may differ slightly. Need **partial matching** (e.g., if blacklist has `linkedin.com/in/john-doe-123`, match against post author URL `/in/john-doe-123`).

---

## 2. Implementation Checklist

### Phase 1: Blacklist Cache Module

#### Step 1.1: Add Blacklist Cache to target-list-queue.ts
- [ ] Add `blacklistCache` Map similar to `urnCache`
- [ ] Store profile URLs (not URNs) since posts have profile URLs
- [ ] Add `cacheBlacklistProfiles(listId, profileUrls, listName)`
- [ ] Add `getCachedBlacklist(listId): { profileUrls: string[], listName: string } | null`
- [ ] Use same 5-minute TTL as URN cache

#### Step 1.2: Add Blacklist Pre-fetch Function
- [ ] Add `prefetchBlacklist(listId: string)` function
- [ ] Fetch profiles via `targetList.getProfilesInList.query({ listId })`
- [ ] Extract `profileUrl` field (not `profileUrn`)
- [ ] Cache the profile URLs
- [ ] Handle errors gracefully (non-critical)

### Phase 2: Pre-fetch Triggers

#### Step 2.1: Pre-fetch on Settings Load
- [ ] In `settings-db-store.ts` `fetchSettings()`, after loading settings:
  - If `skipBlacklistEnabled && blacklistId`, call `prefetchBlacklist(blacklistId)`
  - Fire-and-forget (don't await)

#### Step 2.2: Pre-fetch on Blacklist Selection
- [ ] In `BlacklistSelector.tsx` `handleSelect()`:
  - After saving to DB, if newly selected (not deselected)
  - Call `prefetchBlacklist(newBlacklistId)` fire-and-forget

### Phase 3: Filtering Implementation

#### Step 3.1: Create Blacklist Matcher Utility
- [ ] Create `compose-tab/utils/is-author-blacklisted.ts`
- [ ] Function: `isAuthorBlacklisted(authorProfileUrl: string, blacklistProfileUrls: string[]): boolean`
- [ ] Implement **partial matching**:
  - Extract username/slug from both URLs (e.g., `/in/john-doe-123` → `john-doe-123`)
  - Match if post author's slug is contained in any blacklist profile URL
  - Handle various URL formats: `/in/username`, `linkedin.com/in/username`, full URLs

#### Step 3.2: Update load-posts-to-cards.ts
- [ ] Add `blacklistProfileUrls: string[]` to `LoadPostsToCardsParams`
- [ ] Before creating each card, check if author is blacklisted
- [ ] If blacklisted, skip the post (don't add card, don't generate comment)
- [ ] Log skipped posts for debugging

#### Step 3.3: Update ComposeTab.tsx
- [ ] Before calling `loadPostsToCards()`:
  - If `skipBlacklistEnabled && blacklistId`:
    - Get cached blacklist or fetch if not cached
    - Pass `blacklistProfileUrls` to `loadPostsToCards()`
  - If not enabled: pass empty array

### Phase 4: Extract Author Profile URL

#### Step 4.1: Verify PostAuthorInfo has profile URL
- [ ] Check `extractPostAuthorInfo()` in linkedin-automation package
- [ ] Ensure it extracts author's profile URL (not just name/headline)
- [ ] If missing, add extraction from author link element

---

## 3. Technical Details

### Partial URL Matching Algorithm

```typescript
function extractProfileSlug(url: string): string | null {
  // Handle various formats:
  // - "/in/john-doe-123"
  // - "linkedin.com/in/john-doe-123"
  // - "https://www.linkedin.com/in/john-doe-123/"
  const match = url.match(/\/in\/([^\/\?]+)/);
  return match ? match[1].toLowerCase() : null;
}

function isAuthorBlacklisted(
  authorProfileUrl: string | null,
  blacklistProfileUrls: string[]
): boolean {
  if (!authorProfileUrl) return false;

  const authorSlug = extractProfileSlug(authorProfileUrl);
  if (!authorSlug) return false;

  return blacklistProfileUrls.some(blacklistUrl => {
    const blacklistSlug = extractProfileSlug(blacklistUrl);
    return blacklistSlug && authorSlug === blacklistSlug;
  });
}
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. SETTINGS LOAD / BLACKLIST SELECTION                         │
│     └─ prefetchBlacklist(blacklistId) → cacheBlacklistProfiles() │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. LOAD POSTS BUTTON CLICKED                                    │
│     └─ getCachedBlacklist(blacklistId) → get profile URLs        │
│     └─ Pass blacklistProfileUrls to loadPostsToCards()           │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. POST COLLECTION (in loadPostsToCards onBatchReady)           │
│     └─ For each post, get authorInfo.profileUrl                  │
│     └─ isAuthorBlacklisted(profileUrl, blacklistProfileUrls)     │
│     └─ If blacklisted: skip, else: add card                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Files to Modify

| File | Changes |
|------|---------|
| `stores/target-list-queue.ts` | Add blacklist cache + `prefetchBlacklist()` |
| `stores/settings-db-store.ts` | Trigger blacklist pre-fetch on settings load |
| `compose-tab/settings/BlacklistSelector.tsx` | Trigger pre-fetch on selection |
| `compose-tab/utils/is-author-blacklisted.ts` | **NEW** - Partial URL matching |
| `compose-tab/utils/load-posts-to-cards.ts` | Add blacklist filtering |
| `compose-tab/ComposeTab.tsx` | Pass blacklist URLs to utility |

---

## 5. Acceptance Criteria

- [ ] Selecting a blacklist pre-fetches profile URLs (visible in console logs)
- [ ] Loading settings with blacklist enabled pre-fetches profile URLs
- [ ] Posts from blacklisted authors are skipped during Load Posts
- [ ] Partial URL matching works (e.g., `/in/john-doe` matches `linkedin.com/in/john-doe`)
- [ ] Blacklist filtering works in all modes:
  - Manual "Load Posts" on feed
  - Target list queue (each tab)
  - Auto-resume after navigation
- [ ] Skipped posts are logged for debugging
- [ ] If blacklist not cached, fetch on-demand (fallback)

---

## 6. Edge Cases

- **No profile URL on post**: Skip filtering for that post (don't block)
- **Blacklist fetch fails**: Log warning, continue without filtering
- **Empty blacklist**: No posts filtered (empty array = no matches)
- **Blacklist cache expired**: Re-fetch on Load Posts if needed
