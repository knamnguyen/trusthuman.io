# Auth Redirect and Loading Fixes - Plan

**Date:** 24-01-26
**Complexity:** Simple
**Status:** PLANNED

## Overview

Fix three critical auth/redirect issues preventing smooth organization creation and sign-in flows. Each phase is independently testable and addresses a specific user-blocking issue.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Phase Overviews](#phase-overviews)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Risks and Mitigations](#risks-and-mitigations)
- [Integration Notes](#integration-notes)

## Goals and Success Metrics

**Goals:**
- **Phase 1:** Eliminate infinite loading after org creation on webapp
- **Phase 2:** Fix redirect to incorrect URL (localhost:3000) after org creation in extension-auth
- **Phase 3:** Resolve infinite loading on signin overlay refresh in extension

**Success Metrics:**
- **Phase 1:** After creating org, webapp immediately renders /{orgSlug}/accounts page
- **Phase 2:** After creating org in extension-auth, redirect goes to /{orgSlug}/accounts instead of localhost:3000
- **Phase 3:** Clicking "Refresh" in extension overlay successfully invalidates and refetches auth state without infinite loading

## Phase Overviews

### Phase 1: Fix Webapp Infinite Loading After Org Creation
**Problem:** OrgLayout blocks rendering until `organization?.slug === orgSlug`, but Clerk may not sync immediately after org creation, causing infinite skeleton.

**Solution:** Implement optimistic rendering - trust the URL and render immediately, while showing enhanced loading states during DB sync.

**Test Steps:**
1. Sign in to webapp
2. Click "Create Organization" in OrganizationSwitcher
3. Enter org name and create
4. Verify immediate redirect to /{orgSlug}/accounts (no infinite skeleton)
5. Verify page shows "Loading organization..." briefly then loads data
6. Verify no console errors related to org mismatch

### Phase 2: Fix Extension-Auth Redirect After Org Creation
**Problem:** After creating org in extension-auth page, redirect goes to localhost:3000 instead of /{orgSlug}/accounts.

**Solution:** Add `afterCreateOrganizationUrl="/{slug}/accounts"` to OrganizationSwitcher in extension-auth page (same as dashboard-sidebar.tsx line 126).

**Test Steps:**
1. Open extension on LinkedIn
2. Click "Sign In to EngageKit" (opens extension-auth page)
3. Click "Create Organization" in Clerk modal
4. Enter org name and create
5. Verify redirect goes to /{orgSlug}/accounts (not localhost:3000)
6. Verify extension auth state updates correctly
7. Verify no redirect loops or errors

### Phase 3: Fix Infinite Loading on Signin Overlay Refresh
**Problem:** Multiple concurrent fetchAuthStatus calls cause race condition when clicking "Refresh" button in SignInOverlay.

**Solution:** Add request cancellation and debouncing to prevent concurrent auth fetches, ensure proper invalidation on refresh.

**Test Steps:**
1. Open extension on LinkedIn while signed out
2. Click "Refresh" button in SignInOverlay
3. Verify loading spinner shows briefly then resolves (no infinite loop)
4. Sign in via extension-auth page
5. Return to LinkedIn and click "Refresh" again
6. Verify auth state updates correctly and overlay disappears
7. Verify no duplicate fetch requests in console
8. Verify no race condition warnings in logs

## Acceptance Criteria

**Phase 1: Webapp Org Loading**
1. After org creation, webapp renders /{orgSlug}/accounts within 2 seconds
2. No infinite skeleton/loading states
3. Enhanced loading message "Setting up organization..." shown briefly
4. OrgLayout doesn't block on slug mismatch during initial sync
5. No console errors or warnings

**Phase 2: Extension-Auth Redirect**
1. After org creation in extension-auth, redirect URL is /{orgSlug}/accounts
2. No redirect to localhost:3000 or other incorrect URLs
3. Extension auth state syncs correctly after redirect
4. User lands on accounts page ready to add LinkedIn accounts
5. No redirect loops

**Phase 3: Extension Refresh Loading**
1. Clicking "Refresh" button triggers proper auth invalidation
2. No infinite loading spinner
3. No concurrent fetchAuthStatus calls
4. Auth state updates correctly after refresh
5. SignInOverlay disappears after successful auth
6. No race condition errors in console

## Implementation Checklist

### Phase 1: Fix Webapp Infinite Loading After Org Creation

1. **Update OrgLayout to implement optimistic rendering**
   - File: `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/layout.tsx`
   - Remove blocking check at lines 107-114 that waits for `organization?.slug === orgSlug`
   - Allow children to render immediately after basic loading checks
   - Keep auto-switch logic (lines 59-97) but don't block on it
   - Add console logging for debugging org sync timing

2. **Enhance loading states in AccountsPage**
   - File: `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/accounts/page.tsx`
   - Update loading message at line 95 from "Loading organization..." to "Setting up organization..."
   - Add optimistic loading state that shows immediately while org data syncs
   - Consider adding skeleton UI for better perceived performance
   - Keep existing error handling (lines 104-118)

3. **Test Phase 1 completion**
   - Run webapp locally: `pnpm dev`
   - Sign in and create new organization
   - Verify immediate render of accounts page
   - Check console for org sync logs
   - Verify no infinite loading states

### Phase 2: Fix Extension-Auth Redirect After Org Creation

4. **Add redirect configuration to extension-auth page**
   - File: `apps/nextjs/src/app/extension-auth/page.tsx`
   - Currently no OrganizationSwitcher component on this page
   - Review if OrganizationSwitcher should be added or if redirect config goes elsewhere
   - Reference dashboard-sidebar.tsx line 126: `afterCreateOrganizationUrl="/{slug}/accounts"`
   - Investigate where org creation happens in extension-auth flow
   - Add appropriate redirect URL configuration

5. **Add OrganizationSwitcher with redirect config (if needed)**
   - File: `apps/nextjs/src/app/extension-auth/page.tsx`
   - Import OrganizationSwitcher from @clerk/nextjs (similar to dashboard-sidebar.tsx)
   - Add OrganizationSwitcher component in SignedIn section (around line 82)
   - Configure with: `afterCreateOrganizationUrl="/{slug}/accounts"`
   - Match appearance styling from dashboard-sidebar if visible
   - Alternatively, configure global Clerk settings if this affects all creation flows

6. **Test Phase 2 completion**
   - Open extension on LinkedIn
   - Click "Sign In to EngageKit"
   - In extension-auth page, create new organization
   - Verify redirect goes to /{orgSlug}/accounts (not localhost:3000)
   - Check network tab for redirect chain
   - Verify extension auth state updates

### Phase 3: Fix Infinite Loading on Signin Overlay Refresh

7. **Add request cancellation to auth-store.ts**
   - File: `apps/wxt-extension/lib/auth-store.ts`
   - Add AbortController to fetchAuthStatus function (line 52)
   - Store controller reference to cancel in-flight requests
   - Abort previous request when new fetchAuthStatus call starts
   - Update authService.getAuthStatus call to accept AbortSignal

8. **Add debouncing to refresh button in SignInOverlay**
   - File: `apps/wxt-extension/entrypoints/linkedin.content/_components/SignInOverlay.tsx`
   - Add debounce wrapper to fetchAuthStatus call on line 72
   - Use setTimeout/clearTimeout pattern or lodash debounce
   - Set debounce delay to 500ms to prevent rapid clicks
   - Add loading state to disable button during fetch
   - Update button text to show "Refreshing..." during fetch

9. **Prevent concurrent fetches in content script initialization**
   - File: `apps/wxt-extension/entrypoints/linkedin.content/index.tsx`
   - Review fetchAuthStatus calls on lines 98 and 106
   - Ensure no concurrent calls during initial load
   - Add guards to prevent multiple simultaneous auth fetches
   - Consider using Promise singleton pattern for auth fetch
   - Update initAuthStoreListener callback (line 101) to handle race conditions

10. **Add proper invalidation on forceRefresh**
    - File: `apps/wxt-extension/lib/auth-store.ts`
    - Ensure forceRefresh=true properly invalidates Clerk client cache
    - Add logging to track refresh calls (line 55-60)
    - Verify authService.getAuthStatus handles forceRefresh correctly
    - Clear any stale state before fetching fresh data

11. **Test Phase 3 completion**
    - Open extension on LinkedIn while signed out
    - Click "Refresh" multiple times rapidly
    - Verify no infinite loading, single request in network tab
    - Sign in via extension-auth
    - Return to LinkedIn, click "Refresh" again
    - Verify auth state updates and overlay disappears
    - Check console for race condition warnings

## Risks and Mitigations

**Risk 1: Optimistic rendering causes stale org data display**
- **Mitigation:** Keep existing query invalidation logic, rely on React Query refetch on org change (OrgLayout lines 35-56)

**Risk 2: Extension-auth redirect breaks other flows**
- **Mitigation:** Test all sign-in paths (new user, existing user, org switch), verify redirect only affects org creation

**Risk 3: Debouncing causes perceived unresponsiveness**
- **Mitigation:** Use short debounce (500ms), show visual feedback ("Refreshing..."), disable button during fetch

**Risk 4: AbortController not supported in extension context**
- **Mitigation:** Add feature detection, gracefully fall back to basic deduplication if unsupported

**Risk 5: Auth state race condition persists after fixes**
- **Mitigation:** Add comprehensive logging, use Promise singleton pattern, test thoroughly with rapid clicks

## Integration Notes

**Phase 1 - OrgLayout Changes:**
- Affects all org-level pages (accounts, history, target-list, personas)
- Must not break existing org switching logic
- Keep query invalidation on org change (lines 35-56)
- Preserve auto-switch behavior (lines 59-97)

**Phase 2 - Extension-Auth Redirect:**
- Extension-auth page is standalone (no shared layout with dashboard)
- May need to check if OrganizationSwitcher is appropriate here
- Redirect config might belong in Clerk middleware or global config
- Test both direct browser access and extension popup trigger

**Phase 3 - Auth Store Refactor:**
- Auth store is singleton used by all extension components
- Changes affect SignInOverlay, content script initialization, and background worker
- Must preserve existing auth state listener (initAuthStoreListener)
- Cannot break warmup interval logic (lines 36-58 in index.tsx)

## File Summary

**Phase 1 Files:**
- `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/layout.tsx` - Remove blocking check
- `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/accounts/page.tsx` - Enhanced loading states

**Phase 2 Files:**
- `apps/nextjs/src/app/extension-auth/page.tsx` - Add redirect configuration

**Phase 3 Files:**
- `apps/wxt-extension/lib/auth-store.ts` - Request cancellation, debouncing
- `apps/wxt-extension/entrypoints/linkedin.content/_components/SignInOverlay.tsx` - Debounced refresh
- `apps/wxt-extension/entrypoints/linkedin.content/index.tsx` - Prevent concurrent fetches

## Dependencies

**All Phases:**
- No new package installations required
- Uses existing Clerk, React Query, Zustand infrastructure
- Relies on current auth-service implementation

## Next Steps

**After Plan Approval:**
1. Review plan carefully
2. Verify test steps are clear and achievable
3. Say "ENTER EXECUTE MODE" to begin implementation

**Implementation Order:**
- Can implement phases in any order (independent)
- Recommended: Phase 1 → Phase 2 → Phase 3 (increasing complexity)
- Test each phase thoroughly before moving to next

**Post-Implementation:**
- Run full regression test on all auth flows
- Update any related documentation
- Monitor for edge cases in production
