# Queue Performance Optimization - Implementation Plan

**Created**: 2026-01-16
**Complexity**: SIMPLE
**Status**: ✅ IMPLEMENTED - Ready for testing

---

## 1. Overview

This plan addresses two performance bottlenecks identified in the multi-tab target list queue system:

1. **First tab delay (~5s)**: When clicking "Load Posts", there's a delay before the first tab opens
2. **New tab delay (~5s)**: Each new tab waits for stores to load before starting Load Posts

Both delays significantly impact user experience when processing multiple target lists.

---

## 2. Problem Analysis

### Bottleneck 1: First Tab Delay

**Current flow**:
```
Click "Load Posts" → Check cached URNs → Fetch uncached URNs (API) → Save queue → Open tab
```

**Root cause**: URNs are only pre-fetched when user closes the TargetListSelector popover. If user:
- Never opens the popover (uses previously saved settings)
- Opens extension in a new session (URN cache expired/cleared)

Then URNs must be fetched on-demand when clicking "Load Posts".

**Solution**: Pre-fetch URNs immediately when settings load from DB.

### Bottleneck 2: New Tab Delay

**Current flow**:
```
Tab opens → waitForStoresReady() polls every 100ms:
  - authLoaded (auth check ~1s)
  - accountLoaded (3 API calls ~2s)
  - settingsLoaded (1 API call ~2s, AFTER account)
→ consumePendingNavigation() → Open sidebar → ComposeTab triggers Load Posts
```

**Root cause**: The auto-resume system waits for ALL stores to be ready before proceeding, but:
- Auth token is already persisted (Clerk cookies)
- Settings snapshot is already in `pendingNavigation.postLoadSettings`
- Account data is not needed for `collectPostsBatch` or `generateComment`

**Solution**: Skip store waiting for auto-resume. Use the `pendingNavigation` snapshot directly.

---

## 3. Goals

- Eliminate first-tab delay when URNs are already selected in settings
- Reduce new-tab delay from ~5s to near-instant (<500ms)
- Maintain correctness (auth still works, UI displays properly)
- No breaking changes to existing functionality

---

## 4. Implementation Checklist

### Phase 1: Pre-fetch URNs on Settings Load ✅

#### Step 1.1: Add URN Pre-fetch Function to Queue Module
- [x] In `stores/target-list-queue.ts`, add `prefetchUrnsForLists(listIds: string[])` function
- [x] Reuse existing `cacheTargetListUrns` cache mechanism
- [x] Handle errors gracefully (non-critical, fire-and-forget)

#### Step 1.2: Trigger Pre-fetch When Settings Load
- [x] In `stores/settings-db-store.ts`, after `fetchSettings()` completes
- [x] Check if `postLoad.targetListIds` has any IDs
- [x] If yes, call `prefetchUrnsForLists()` (fire-and-forget)
- [x] Add console logging for debugging

#### Step 1.3: Test First-Tab Performance
- [ ] Clear URN cache
- [ ] Load extension (settings load from DB)
- [ ] Verify URNs are pre-fetched in background
- [ ] Click "Load Posts" - should be near-instant

### Phase 2: Skip Store Wait for Auto-Resume ✅

#### Step 2.1: Update Auto-Resume Check in Content Script
- [x] In `index.tsx`, modify `checkAutoResume()`:
  - Check `consumePendingNavigation()` IMMEDIATELY (no store wait)
  - If pending navigation found, set global and open sidebar
  - Let stores load in background (for UI correctness)
- [x] Remove `waitForStoresReady()` call from auto-resume path

#### Step 2.2: Ensure ComposeTab Works Without Stores
- [x] Verify `ComposeTab` uses `pendingNavigation.postLoadSettings` directly
- [x] Verify `collectPostsBatch` doesn't require store data
- [x] Verify `generateComment` tRPC call works (auth token from background)

#### Step 2.3: Test New-Tab Performance
- [ ] Start queue with 3+ target lists
- [ ] Verify each tab opens and starts Load Posts quickly (<1s)
- [ ] Verify AI comment generation works (auth token available)
- [ ] Verify sidebar displays correctly (stores eventually load)

---

## 5. Technical Details

### 5.1 URN Pre-fetch on Settings Load

**Location**: `settings-db-store.ts`

```typescript
// In fetchSettings(), after settings are loaded:
if (postLoad?.targetListIds?.length) {
  console.log("[SettingsDB] Pre-fetching URNs for saved target lists...");
  void prefetchUrnsForLists(postLoad.targetListIds);
}
```

**New function in `target-list-queue.ts`**:

```typescript
export async function prefetchUrnsForLists(listIds: string[]): Promise<void> {
  if (listIds.length === 0) return;

  // Skip if all already cached
  const uncachedIds = listIds.filter(id => !getCachedUrns(id));
  if (uncachedIds.length === 0) {
    console.log("[QueuePrefetch] All URNs already cached");
    return;
  }

  console.log(`[QueuePrefetch] Pre-fetching URNs for ${uncachedIds.length} lists...`);
  const trpcClient = getTrpcClient();

  try {
    // Fetch list names and profiles in parallel
    const [listsResponse, ...profilesResponses] = await Promise.all([
      trpcClient.targetList.findLists.query({}),
      ...uncachedIds.map(id => trpcClient.targetList.getProfilesInList.query({ listId: id })),
    ]);

    // Cache results
    for (let i = 0; i < uncachedIds.length; i++) {
      const listId = uncachedIds[i];
      const profiles = profilesResponses[i];
      const listInfo = listsResponse.data.find(l => l.id === listId);

      const urns = profiles?.data
        .map(p => p.profileUrn)
        .filter((urn): urn is string => urn !== null) ?? [];

      if (urns.length > 0) {
        cacheTargetListUrns(listId, urns, listInfo?.name ?? "Unknown");
      }
    }

    console.log(`[QueuePrefetch] Pre-fetched URNs for ${uncachedIds.length} lists`);
  } catch (error) {
    console.warn("[QueuePrefetch] Failed to pre-fetch URNs:", error);
  }
}
```

### 5.2 Skip Store Wait for Auto-Resume

**Location**: `index.tsx`

**Before**:
```typescript
const checkAutoResume = async () => {
  try {
    await waitForStoresReady(); // ← 5 second delay
    const navigationState = await consumePendingNavigation();
    // ...
  }
};
```

**After**:
```typescript
const checkAutoResume = async () => {
  try {
    // Check immediately - don't wait for stores
    // pendingNavigation contains all data needed for Load Posts
    const navigationState = await consumePendingNavigation();

    if (navigationState) {
      console.log("[AutoResume] Found pending navigation, starting immediately", {
        type: navigationState.type,
      });

      // Set global for ComposeTab
      (window as any).__engagekit_pending_navigation = navigationState;

      // Open sidebar immediately
      useSidebarStore.getState().setIsOpen(true);
      useSidebarStore.getState().setSelectedTab(SIDEBAR_TABS.COMPOSE);

      // Stores will load in background for UI correctness
    } else {
      console.log("[AutoResume] No pending navigation found");
    }
  } catch (error) {
    console.error("[AutoResume] Error:", error);
  }
};
```

### 5.3 Why This Works

**Auth for API calls**:
- `authService.getToken()` messages background worker
- Background worker has Clerk session (persisted)
- Returns token in milliseconds
- No dependency on `authStore.isLoaded`

**Settings for Load Posts**:
- `pendingNavigation.postLoadSettings` contains full snapshot
- ComposeTab already uses this for auto-resume
- No dependency on `settingsDBStore.isLoaded`

**Sidebar display**:
- Stores load in background (normal init flow)
- UI may show loading states briefly
- Eventually shows correct data
- No blocking of Load Posts

---

## 6. Acceptance Criteria

### Performance
- [ ] First tab opens in <1s after clicking "Load Posts" (when URNs pre-fetched)
- [ ] New tabs start Load Posts in <1s after opening (no store wait)
- [ ] 7-list queue completes 5+ seconds faster than before

### Correctness
- [ ] AI comment generation works (auth token available)
- [ ] Sidebar displays correctly after stores load
- [ ] Queue continues correctly to next tab
- [ ] No console errors during Load Posts

### Edge Cases
- [ ] Works when URN cache is empty (falls back to on-demand fetch)
- [ ] Works when auth token needs refresh
- [ ] Works when user is signed out (graceful failure)

---

## 7. Risks and Mitigations

### Risk 1: API calls fail without auth
**Impact**: `generateComment` fails silently
**Mitigation**: Auth token is already available via background worker. Verify with testing.

### Risk 2: Sidebar shows stale/empty data
**Impact**: Brief flash of loading state
**Mitigation**: Acceptable UX tradeoff. Stores load quickly in background.

### Risk 3: Race condition between auto-resume and store init
**Impact**: ComposeTab tries to use stores before ready
**Mitigation**: ComposeTab already uses `pendingNavigation` snapshot, not stores.

---

## 8. Testing Plan

### Manual Testing
1. **Fresh session test**:
   - Clear extension storage
   - Sign in, select 3 target lists, close popover
   - Reload page
   - Click "Load Posts" → should be fast (URNs pre-fetched on settings load)

2. **Multi-tab queue test**:
   - Select 5 target lists
   - Click "Load Posts"
   - Time each tab's Load Posts start
   - Should be <1s per tab (vs ~5s before)

3. **Auth verification**:
   - Monitor Network tab
   - Verify `generateComment` requests succeed
   - Verify auth header is present

---

## 9. Files to Modify

| File | Changes |
|------|---------|
| `stores/target-list-queue.ts` | Add `prefetchUrnsForLists()` function |
| `stores/settings-db-store.ts` | Call prefetch after settings load |
| `index.tsx` | Remove `waitForStoresReady()` from auto-resume |

---

## 10. Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| First tab delay | ~5s (if uncached) | <1s (pre-fetched) |
| New tab delay | ~5s (store wait) | <1s (no wait) |
| 7-list queue total | ~35s+ delays | <7s delays |

**User-perceived improvement**: Queue feels nearly instant instead of sluggish.
