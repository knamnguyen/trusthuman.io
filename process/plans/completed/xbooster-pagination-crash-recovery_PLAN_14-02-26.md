# xBooster: Pagination & Tab Crash Recovery

**Date**: 14-02-2026
**Complexity**: SIMPLE
**Estimated Duration**: One session

---

## Overview

This plan implements two critical reliability features for the xBooster Chrome extension:

1. **Notifications Pagination**: Fix hardcoded `cursor: null` in `fetchNotifications()`, `getListTweets()`, and `getCommunityTweets()` to fetch multiple pages until `count` items accumulated or no more pages available.

2. **Tab Crash Recovery**: Add background-script heartbeat monitoring via `chrome.alarms` to detect content script crashes, with auto-reload and state persistence for seamless 24/7 operation.

---

## Goals

### Feature 1: Notifications Pagination
- Fetch multiple pages from X GraphQL endpoints until desired count reached
- Extract and use cursor from each response to fetch next page
- Apply to all three fetch functions: `fetchNotifications`, `getListTweets`, `getCommunityTweets`
- Respect abort signals (allow mid-fetch cancellation during auto-run stop)
- Maintain existing response parsing logic (no changes to parser functions)

### Feature 2: Tab Crash Recovery
- Background script pings content script via `chrome.alarms` every 30 seconds
- Content script responds to pings (heartbeat)
- After 3 consecutive missed pongs, background reloads tab via `chrome.tabs.reload()`
- Persist auto-run state (mentions/engage/both) in `chrome.storage.local`
- On content script init, resume auto-run from persisted state if it was active before crash
- Prevent reload during active send operations (no double-sends) via send-lock flag

---

## Scope

### In Scope
- Pagination loop implementation in `x-api.ts` for three fetch functions
- Cursor extraction from X GraphQL responses
- Background heartbeat system via `chrome.alarms`
- Content script heartbeat responder via `chrome.runtime.onMessage`
- Auto-run state persistence and recovery
- Send-lock protection during active sends

### Out of Scope
- Response parsing logic changes (parsers work with single-page or multi-page data identically)
- Changes to auto-run hooks beyond state persistence
- Manual user-triggered reload (only automatic recovery)
- Crash detection for background script itself (service worker self-healing is built into Chrome MV3)

---

## Implementation Checklist

### Phase 1: Pagination Implementation (Feature 1)

#### Step 1: Add cursor extraction helper to `apps/xbooster/entrypoints/x.content/utils/x-api.ts`
- **Action**: Add `extractCursor()` helper function before `fetchNotifications()`
- **Implementation**:
  ```typescript
  /**
   * Extract cursor from X GraphQL timeline response
   * Returns null if no cursor found (end of timeline)
   */
  function extractCursor(data: unknown): string | null {
    try {
      // NotificationsTimeline path
      const notifInstructions = (data as any)?.data?.viewer_v2?.user_results?.result?.notification_timeline?.timeline?.instructions;
      if (Array.isArray(notifInstructions)) {
        for (const inst of notifInstructions) {
          if (inst.type === "TimelineAddEntries") {
            const entries = inst.entries;
            if (Array.isArray(entries)) {
              // Cursor is typically in the last entry with entryId "cursor-bottom-*"
              for (let i = entries.length - 1; i >= 0; i--) {
                const entry = entries[i];
                if (entry.entryId?.startsWith("cursor-bottom-") || entry.entryId?.startsWith("cursor-")) {
                  return entry.content?.value ?? null;
                }
              }
            }
          }
        }
      }

      // ListLatestTweetsTimeline path
      const listInstructions = (data as any)?.data?.list?.tweets_timeline?.timeline?.instructions;
      if (Array.isArray(listInstructions)) {
        for (const inst of listInstructions) {
          if (inst.type === "TimelineAddEntries") {
            const entries = inst.entries;
            if (Array.isArray(entries)) {
              for (let i = entries.length - 1; i >= 0; i--) {
                const entry = entries[i];
                if (entry.entryId?.startsWith("cursor-bottom-") || entry.entryId?.startsWith("cursor-")) {
                  return entry.content?.value ?? null;
                }
              }
            }
          }
        }
      }

      // CommunityTweetsTimeline path
      const communityInstructions = (data as any)?.data?.communityResults?.result?.ranked_community_timeline?.timeline?.instructions;
      if (Array.isArray(communityInstructions)) {
        for (const inst of communityInstructions) {
          if (inst.type === "TimelineAddEntries") {
            const entries = inst.entries;
            if (Array.isArray(entries)) {
              for (let i = entries.length - 1; i >= 0; i--) {
                const entry = entries[i];
                if (entry.entryId?.startsWith("cursor-bottom-") || entry.entryId?.startsWith("cursor-")) {
                  return entry.content?.value ?? null;
                }
              }
            }
          }
        }
      }

      return null;
    } catch (err) {
      console.error("xBooster: extractCursor error:", err);
      return null;
    }
  }
  ```
- **Location**: After `buildHeaders()` function, before `fetchNotifications()`
- **Why**: Centralized cursor extraction logic for all three timeline types

#### Step 2: Refactor `fetchNotifications()` to support pagination
- **File**: `apps/xbooster/entrypoints/x.content/utils/x-api.ts`
- **Action**: Replace function body to loop until `count` items or no more pages
- **Current signature**: `export async function fetchNotifications(count = 40): Promise<{...}>`
- **Implementation**:
  ```typescript
  export async function fetchNotifications(
    count = 40,
    abortSignal?: AbortSignal
  ): Promise<{
    success: boolean;
    data?: unknown;
    message?: string;
  }> {
    try {
      const queryId = await getQueryId("NotificationsTimeline");
      let cursor: string | null = null;
      let allData: unknown[] = [];

      while (allData.length < count) {
        if (abortSignal?.aborted) {
          console.log("xBooster: fetchNotifications aborted mid-fetch");
          break;
        }

        const variables = {
          timeline_type: "Mentions",
          cursor,
          count: Math.min(40, count - allData.length), // Fetch remaining
        };

        const url = `/i/api/graphql/${queryId}/NotificationsTimeline?variables=${encodeURIComponent(
          JSON.stringify(variables),
        )}&features=${encodeURIComponent(JSON.stringify(FEATURES))}`;

        const headers = await buildHeaders(
          "https://x.com/notifications",
          "GET",
          `/i/api/graphql/${queryId}/NotificationsTimeline`,
        );

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }

        const json = await res.json();
        if (json.errors) throw new Error(JSON.stringify(json.errors));

        allData.push(json);

        // Extract cursor for next page
        const nextCursor = extractCursor(json);
        if (!nextCursor) {
          console.log(`xBooster: fetchNotifications - No more pages (fetched ${allData.length} pages)`);
          break; // No more pages
        }

        cursor = nextCursor;
        console.log(`xBooster: fetchNotifications - Fetched page ${allData.length}, cursor: ${cursor.substring(0, 20)}...`);
      }

      // Merge all pages into single response structure
      // X parsers expect single response, so we merge entries arrays
      if (allData.length === 0) {
        return { success: true, data: { data: null } };
      }

      if (allData.length === 1) {
        return { success: true, data: allData[0] };
      }

      // Merge multiple pages: combine instructions.entries arrays
      const merged = JSON.parse(JSON.stringify(allData[0])); // Deep clone first page
      const mergedInstructions = merged?.data?.viewer_v2?.user_results?.result?.notification_timeline?.timeline?.instructions;

      if (Array.isArray(mergedInstructions)) {
        const addEntriesIdx = mergedInstructions.findIndex((i: any) => i.type === "TimelineAddEntries");
        if (addEntriesIdx !== -1) {
          // Collect entries from all pages
          for (let i = 1; i < allData.length; i++) {
            const pageInstructions = (allData[i] as any)?.data?.viewer_v2?.user_results?.result?.notification_timeline?.timeline?.instructions;
            if (Array.isArray(pageInstructions)) {
              const pageAddEntries = pageInstructions.find((inst: any) => inst.type === "TimelineAddEntries");
              if (pageAddEntries?.entries) {
                // Append entries, excluding cursor entries
                const nonCursorEntries = pageAddEntries.entries.filter(
                  (e: any) => !e.entryId?.startsWith("cursor-")
                );
                mergedInstructions[addEntriesIdx].entries.push(...nonCursorEntries);
              }
            }
          }
        }
      }

      console.log(`xBooster: fetchNotifications - Merged ${allData.length} pages`);
      return { success: true, data: merged };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("xBooster: fetchNotifications error:", message);
      return { success: false, message };
    }
  }
  ```
- **Key changes**:
  - Add `abortSignal?: AbortSignal` parameter
  - Initialize `cursor: string | null = null` and `allData: unknown[] = []`
  - Loop until `allData.length < count`
  - Check `abortSignal?.aborted` at start of each loop iteration
  - Extract cursor via `extractCursor(json)`, break if null
  - Merge all pages by combining `instructions.entries` arrays (exclude cursor entries)
- **Why**: Parser functions (`parseNotificationEntries`) iterate over entries array, so merging pages into single structure maintains compatibility

#### Step 3: Refactor `getListTweets()` for pagination
- **File**: `apps/xbooster/entrypoints/x.content/utils/x-api.ts`
- **Action**: Apply same pagination pattern as `fetchNotifications()`
- **Current signature**: `export async function getListTweets(listId: string, count = 20): Promise<{...}>`
- **Implementation**:
  ```typescript
  export async function getListTweets(
    listId: string,
    count = 20,
    abortSignal?: AbortSignal
  ): Promise<{ success: boolean; data?: unknown; message?: string }> {
    try {
      const queryId = await getQueryId("ListLatestTweetsTimeline");
      let cursor: string | null = null;
      let allData: unknown[] = [];

      while (allData.length < count) {
        if (abortSignal?.aborted) {
          console.log("xBooster: getListTweets aborted mid-fetch");
          break;
        }

        const variables: Record<string, unknown> = {
          listId,
          count: Math.min(40, count - allData.length),
        };

        if (cursor) {
          variables.cursor = cursor;
        }

        const url = `/i/api/graphql/${queryId}/ListLatestTweetsTimeline?variables=${encodeURIComponent(
          JSON.stringify(variables),
        )}&features=${encodeURIComponent(JSON.stringify(FEATURES))}`;

        const headers = await buildHeaders(
          "https://x.com",
          "GET",
          `/i/api/graphql/${queryId}/ListLatestTweetsTimeline`,
        );

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }

        const json = await res.json();
        if (json.errors) throw new Error(JSON.stringify(json.errors));

        allData.push(json);

        const nextCursor = extractCursor(json);
        if (!nextCursor) {
          console.log(`xBooster: getListTweets - No more pages (fetched ${allData.length} pages)`);
          break;
        }

        cursor = nextCursor;
        console.log(`xBooster: getListTweets - Fetched page ${allData.length}, cursor: ${cursor.substring(0, 20)}...`);
      }

      if (allData.length === 0) {
        return { success: true, data: { data: null } };
      }

      if (allData.length === 1) {
        return { success: true, data: allData[0] };
      }

      // Merge pages
      const merged = JSON.parse(JSON.stringify(allData[0]));
      const mergedInstructions = merged?.data?.list?.tweets_timeline?.timeline?.instructions;

      if (Array.isArray(mergedInstructions)) {
        const addEntriesIdx = mergedInstructions.findIndex((i: any) => i.type === "TimelineAddEntries");
        if (addEntriesIdx !== -1) {
          for (let i = 1; i < allData.length; i++) {
            const pageInstructions = (allData[i] as any)?.data?.list?.tweets_timeline?.timeline?.instructions;
            if (Array.isArray(pageInstructions)) {
              const pageAddEntries = pageInstructions.find((inst: any) => inst.type === "TimelineAddEntries");
              if (pageAddEntries?.entries) {
                const nonCursorEntries = pageAddEntries.entries.filter(
                  (e: any) => !e.entryId?.startsWith("cursor-")
                );
                mergedInstructions[addEntriesIdx].entries.push(...nonCursorEntries);
              }
            }
          }
        }
      }

      console.log(`xBooster: getListTweets - Merged ${allData.length} pages`);
      return { success: true, data: merged };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("xBooster: getListTweets error:", message);
      return { success: false, message };
    }
  }
  ```
- **Key changes**: Same pattern as `fetchNotifications()`, but merge path is `data.list.tweets_timeline.timeline.instructions`
- **Note**: X API for lists doesn't require cursor in first request, so use conditional `if (cursor) variables.cursor = cursor;`

#### Step 4: Refactor `getCommunityTweets()` for pagination
- **File**: `apps/xbooster/entrypoints/x.content/utils/x-api.ts`
- **Action**: Apply same pagination pattern as `fetchNotifications()`
- **Current signature**: `export async function getCommunityTweets(communityId: string, count = 20): Promise<{...}>`
- **Implementation**:
  ```typescript
  export async function getCommunityTweets(
    communityId: string,
    count = 20,
    abortSignal?: AbortSignal
  ): Promise<{ success: boolean; data?: unknown; message?: string }> {
    try {
      const queryId = await getQueryId("CommunityTweetsTimeline");
      let cursor: string | null = null;
      let allData: unknown[] = [];

      while (allData.length < count) {
        if (abortSignal?.aborted) {
          console.log("xBooster: getCommunityTweets aborted mid-fetch");
          break;
        }

        const variables: Record<string, unknown> = {
          communityId,
          count: Math.min(40, count - allData.length),
          displayLocation: "Community",
          rankingMode: "Recency",
          withCommunity: true,
        };

        if (cursor) {
          variables.cursor = cursor;
        }

        const url = `/i/api/graphql/${queryId}/CommunityTweetsTimeline?variables=${encodeURIComponent(
          JSON.stringify(variables),
        )}&features=${encodeURIComponent(JSON.stringify(FEATURES))}`;

        const headers = await buildHeaders(
          "https://x.com",
          "GET",
          `/i/api/graphql/${queryId}/CommunityTweetsTimeline`,
        );

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }

        const json = await res.json();
        if (json.errors) throw new Error(JSON.stringify(json.errors));

        allData.push(json);

        const nextCursor = extractCursor(json);
        if (!nextCursor) {
          console.log(`xBooster: getCommunityTweets - No more pages (fetched ${allData.length} pages)`);
          break;
        }

        cursor = nextCursor;
        console.log(`xBooster: getCommunityTweets - Fetched page ${allData.length}, cursor: ${cursor.substring(0, 20)}...`);
      }

      if (allData.length === 0) {
        return { success: true, data: { data: null } };
      }

      if (allData.length === 1) {
        return { success: true, data: allData[0] };
      }

      // Merge pages
      const merged = JSON.parse(JSON.stringify(allData[0]));
      const mergedInstructions = merged?.data?.communityResults?.result?.ranked_community_timeline?.timeline?.instructions;

      if (Array.isArray(mergedInstructions)) {
        const addEntriesIdx = mergedInstructions.findIndex((i: any) => i.type === "TimelineAddEntries");
        if (addEntriesIdx !== -1) {
          for (let i = 1; i < allData.length; i++) {
            const pageInstructions = (allData[i] as any)?.data?.communityResults?.result?.ranked_community_timeline?.timeline?.instructions;
            if (Array.isArray(pageInstructions)) {
              const pageAddEntries = pageInstructions.find((inst: any) => inst.type === "TimelineAddEntries");
              if (pageAddEntries?.entries) {
                const nonCursorEntries = pageAddEntries.entries.filter(
                  (e: any) => !e.entryId?.startsWith("cursor-")
                );
                mergedInstructions[addEntriesIdx].entries.push(...nonCursorEntries);
              }
            }
          }
        }
      }

      console.log(`xBooster: getCommunityTweets - Merged ${allData.length} pages`);
      return { success: true, data: merged };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("xBooster: getCommunityTweets error:", message);
      return { success: false, message };
    }
  }
  ```
- **Key changes**: Same pattern, merge path is `data.communityResults.result.ranked_community_timeline.timeline.instructions`

#### Step 5: Update auto-run hooks to pass abort signal
- **File 1**: `apps/xbooster/entrypoints/x.content/hooks/use-auto-run.ts`
- **Action**: Update `fetchNotifications()` call on line 73 to pass `abortRef.current`
- **Change**:
  ```typescript
  // BEFORE (line 73):
  const notifResult = await fetchNotifications(settings.fetchCount);

  // AFTER:
  const abortSignal = new AbortController();
  abortRef.current = false; // Reset abort flag
  const notifResult = await fetchNotifications(settings.fetchCount, abortSignal.signal);
  ```
- **Note**: Need to create `AbortController` instance at start of `runCycle()` and check `abortRef.current` throughout

- **File 2**: `apps/xbooster/entrypoints/x.content/engage-tab/hooks/use-engage-auto-run.ts`
- **Action**: Update `getListTweets()` call on line 96 and `getCommunityTweets()` call on line 98
- **Change**:
  ```typescript
  // In processSource function, around lines 94-99:
  // BEFORE:
  if (source.type === "list") {
    result = await getListTweets(source.id, settings.fetchCount);
  } else {
    result = await getCommunityTweets(source.id, settings.fetchCount);
  }

  // AFTER:
  const abortSignal = new AbortController();
  if (source.type === "list") {
    result = await getListTweets(source.id, settings.fetchCount, abortSignal.signal);
  } else {
    result = await getCommunityTweets(source.id, settings.fetchCount, abortSignal.signal);
  }
  ```

---

### Phase 2: Tab Crash Recovery (Feature 2)

#### Step 6: Add heartbeat types and state persistence to background script
- **File**: `apps/xbooster/entrypoints/background/index.ts`
- **Action**: Add heartbeat monitoring system after existing code
- **Implementation**:
  ```typescript
  // Add after existing imports
  import { storage } from "wxt/storage";

  // Add after XAuth interface
  export interface XAutoRunState {
    mentionsRunning: boolean;
    engageRunning: boolean;
    lastSaveTime: number;
  }

  // Add after existing export default defineBackground(() => {
  export default defineBackground(() => {
    // ... existing webRequest.onBeforeSendHeaders code ...

    // ... existing runtime.onMessage for getXAuth ...

    // === TAB CRASH RECOVERY SYSTEM ===

    // Track heartbeat state per tab
    const tabHeartbeats = new Map<number, { lastPong: number; missedPongs: number }>();
    const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
    const MAX_MISSED_PONGS = 3; // Reload after 3 missed
    const SEND_LOCK_CHECK_GRACE_MS = 5000; // 5 second grace period for send locks

    // Initialize heartbeat alarm (survives service worker sleep)
    chrome.alarms.create("xbooster-heartbeat", {
      periodInMinutes: HEARTBEAT_INTERVAL_MS / 60000,
    });

    // Heartbeat alarm handler
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name !== "xbooster-heartbeat") return;

      console.log("xBooster background: Heartbeat alarm fired");

      // Find all X.com tabs
      const tabs = await chrome.tabs.query({ url: ["https://*.x.com/*", "https://x.com/*"] });
      console.log(`xBooster background: Found ${tabs.length} X.com tabs`);

      for (const tab of tabs) {
        if (!tab.id) continue;

        // Initialize heartbeat state if not exists
        if (!tabHeartbeats.has(tab.id)) {
          tabHeartbeats.set(tab.id, { lastPong: Date.now(), missedPongs: 0 });
          console.log(`xBooster background: Initialized heartbeat for tab ${tab.id}`);
        }

        // Send ping to content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: "ping" });

          if (response?.pong) {
            // Content script responded
            const state = tabHeartbeats.get(tab.id)!;
            state.lastPong = Date.now();
            state.missedPongs = 0;
            console.log(`xBooster background: Tab ${tab.id} responded to ping (healthy)`);
          } else {
            console.warn(`xBooster background: Tab ${tab.id} responded but no pong`);
            handleMissedPong(tab.id);
          }
        } catch (err) {
          console.warn(`xBooster background: Tab ${tab.id} failed to respond to ping:`, err);
          handleMissedPong(tab.id);
        }
      }

      // Clean up heartbeat state for closed tabs
      const currentTabIds = new Set(tabs.map((t) => t.id).filter((id): id is number => id !== undefined));
      for (const tabId of tabHeartbeats.keys()) {
        if (!currentTabIds.has(tabId)) {
          console.log(`xBooster background: Cleaning up heartbeat for closed tab ${tabId}`);
          tabHeartbeats.delete(tabId);
        }
      }
    });

    // Handle missed pong
    async function handleMissedPong(tabId: number): Promise<void> {
      const state = tabHeartbeats.get(tabId);
      if (!state) return;

      state.missedPongs++;
      console.warn(`xBooster background: Tab ${tabId} missed pong ${state.missedPongs}/${MAX_MISSED_PONGS}`);

      if (state.missedPongs >= MAX_MISSED_PONGS) {
        console.error(`xBooster background: Tab ${tabId} exceeded max missed pongs, checking send-lock before reload...`);

        // Check if content script is in the middle of sending (send-lock)
        try {
          const lockCheck = await chrome.tabs.sendMessage(tabId, { action: "check-send-lock" });

          if (lockCheck?.isSending) {
            console.warn(`xBooster background: Tab ${tabId} is actively sending, delaying reload...`);
            // Wait grace period and re-check
            await new Promise(r => setTimeout(r, SEND_LOCK_CHECK_GRACE_MS));

            try {
              const recheckLock = await chrome.tabs.sendMessage(tabId, { action: "check-send-lock" });
              if (recheckLock?.isSending) {
                console.warn(`xBooster background: Tab ${tabId} still sending after grace period, skipping reload this cycle`);
                return; // Don't reload, try again next heartbeat
              }
            } catch {
              // If re-check fails, tab is likely crashed, proceed with reload
              console.log(`xBooster background: Tab ${tabId} send-lock re-check failed, assuming crash`);
            }
          }
        } catch {
          // If send-lock check fails, tab is likely crashed, proceed with reload
          console.log(`xBooster background: Tab ${tabId} send-lock check failed, assuming crash`);
        }

        // Reload tab
        console.log(`xBooster background: Reloading tab ${tabId}...`);
        await chrome.tabs.reload(tabId);

        // Reset heartbeat state after reload
        tabHeartbeats.set(tabId, { lastPong: Date.now(), missedPongs: 0 });
        console.log(`xBooster background: Tab ${tabId} reloaded successfully`);
      }
    }

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Existing getXAuth handler
      if (message.action === "getXAuth") {
        storage.getItem<XAuth>("local:xAuth").then((auth) => {
          sendResponse({ success: !!auth, auth });
        });
        return true; // async response
      }

      // Ping-pong heartbeat handler
      if (message.action === "ping") {
        sendResponse({ pong: true });
        return false; // sync response
      }

      // Auto-run state persistence
      if (message.action === "save-auto-run-state") {
        const state: XAutoRunState = {
          mentionsRunning: message.mentionsRunning ?? false,
          engageRunning: message.engageRunning ?? false,
          lastSaveTime: Date.now(),
        };
        storage.setItem<XAutoRunState>("local:xAutoRunState", state).then(() => {
          console.log("xBooster background: Saved auto-run state:", state);
          sendResponse({ success: true });
        });
        return true; // async response
      }

      // Get auto-run state
      if (message.action === "get-auto-run-state") {
        storage.getItem<XAutoRunState>("local:xAutoRunState").then((state) => {
          console.log("xBooster background: Retrieved auto-run state:", state);
          sendResponse({ success: true, state });
        });
        return true; // async response
      }

      // Clear auto-run state
      if (message.action === "clear-auto-run-state") {
        storage.removeItem("local:xAutoRunState").then(() => {
          console.log("xBooster background: Cleared auto-run state");
          sendResponse({ success: true });
        });
        return true; // async response
      }
    });

    console.log("xBooster: Background script loaded with heartbeat monitoring");
  });
  ```
- **Key additions**:
  - `XAutoRunState` interface for persisting auto-run state
  - `tabHeartbeats` Map to track pong responses per tab
  - `chrome.alarms.create("xbooster-heartbeat")` for periodic pings (survives service worker sleep)
  - `chrome.alarms.onAlarm.addListener()` to send pings to all X.com tabs
  - `handleMissedPong()` to increment counter and reload after threshold
  - Send-lock check before reload to prevent double-sends
  - Message handlers for state persistence (`save-auto-run-state`, `get-auto-run-state`, `clear-auto-run-state`)

#### Step 7: Add heartbeat responder and send-lock to content script
- **File**: `apps/xbooster/entrypoints/x.content/index.tsx`
- **Action**: Add message listener in `main()` function before `ui.mount()`
- **Implementation**:
  ```typescript
  export default defineContentScript({
    matches: ["https://*.x.com/*", "https://x.com/*"],
    cssInjectionMode: "ui",

    async main(ctx) {
      // === HEARTBEAT RESPONDER ===
      let isSendingActive = false;

      // Listen for ping from background script
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === "ping") {
          console.log("xBooster content: Received ping from background, sending pong");
          sendResponse({ pong: true });
          return false; // sync response
        }

        if (message.action === "check-send-lock") {
          console.log(`xBooster content: Send-lock check, isSending=${isSendingActive}`);
          sendResponse({ isSending: isSendingActive });
          return false; // sync response
        }
      });

      // Export send-lock setter globally so auto-run hooks can update it
      (window as any).__xbooster_setSendLock = (isActive: boolean) => {
        isSendingActive = isActive;
        console.log(`xBooster content: Send-lock set to ${isActive}`);
      };

      const ui = await createShadowRootUi(ctx, {
        name: "xbooster-sidebar",
        position: "overlay",
        anchor: "body",
        onMount: (container) => {
          const appEl = document.createElement("div");
          appEl.id = "xbooster-root";
          container.append(appEl);

          const root = ReactDOM.createRoot(appEl);
          root.render(<App shadowRoot={container} />);
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
        },
      });

      ui.mount();

      // Initialize stealth headers early (non-blocking)
      initStealthHeaders().catch((err) => {
        console.warn("xBooster: Stealth headers init error:", err);
      });

      console.log("xBooster: Content script loaded with heartbeat responder");
    },
  });
  ```
- **Key additions**:
  - `isSendingActive` flag to track active send operations
  - `chrome.runtime.onMessage.addListener()` to respond to `ping` and `check-send-lock`
  - `window.__xbooster_setSendLock()` global function for auto-run hooks to update send-lock

#### Step 8: Add send-lock calls to mentions auto-run
- **File**: `apps/xbooster/entrypoints/x.content/hooks/use-auto-run.ts`
- **Action**: Wrap send loop with send-lock calls
- **Location**: In `runCycle()` function, around line 158 (before send loop) and line 228 (after send loop)
- **Implementation**:
  ```typescript
  // Around line 158, BEFORE "// 5. Send replies with randomized delays"
  // Add send-lock setter
  const setSendLock = (window as any).__xbooster_setSendLock as ((isActive: boolean) => void) | undefined;

  // ... existing "// 5. Send replies with randomized delays" ...
  setStatus("sending");

  // Set send-lock BEFORE sending
  setSendLock?.(true);

  // ... existing isPaused() check ...

  // ... existing sendableCount and for loop ...

  // Around line 228, AFTER send loop ends (after the for loop closes)
  // Clear send-lock AFTER sending completes
  setSendLock?.(false);
  ```
- **Key changes**:
  - Get reference to `window.__xbooster_setSendLock`
  - Call `setSendLock(true)` before send loop starts
  - Call `setSendLock(false)` after send loop completes (even on early exit via rate-limit)
- **Edge case**: If rate-limited mid-loop (line 216 `break`), send-lock must still be cleared
  - **Solution**: Add `finally` block after send loop:
    ```typescript
    try {
      // Send loop code
    } finally {
      setSendLock?.(false);
    }
    ```

#### Step 9: Add send-lock calls to engage auto-run
- **File**: `apps/xbooster/entrypoints/x.content/engage-tab/hooks/use-engage-auto-run.ts`
- **Action**: Wrap send loop in `processSource()` function with send-lock calls
- **Location**: In `processSource()` function, around line 178 (before send loop) and line 248 (after send loop)
- **Implementation**:
  ```typescript
  // Around line 178, BEFORE "// 4. Send replies (capped by maxSendsPerSource)"
  const setSendLock = (window as any).__xbooster_setSendLock as ((isActive: boolean) => void) | undefined;

  // ... existing "// 4. Send replies (capped by maxSendsPerSource)" ...
  setStatus("sending");

  // Set send-lock BEFORE sending
  setSendLock?.(true);

  try {
    // ... existing isPaused() check and sendableCount ...

    // ... existing send loop ...

    return sentCount;
  } finally {
    // Clear send-lock AFTER sending completes
    setSendLock?.(false);
  }
  ```
- **Key changes**: Same pattern as mentions auto-run, wrapped in `try...finally` to guarantee send-lock is cleared

#### Step 10: Add auto-run state persistence to mentions auto-run
- **File**: `apps/xbooster/entrypoints/x.content/hooks/use-auto-run.ts`
- **Action**: Add state save/restore logic to `start()` and `stop()` functions
- **Implementation**:
  ```typescript
  // Add helper function at top of file (after imports, before useAutoRun)
  async function saveAutoRunState(mentionsRunning: boolean, engageRunning: boolean): Promise<void> {
    try {
      await chrome.runtime.sendMessage({
        action: "save-auto-run-state",
        mentionsRunning,
        engageRunning,
      });
    } catch (err) {
      console.error("xBooster: Failed to save auto-run state:", err);
    }
  }

  async function getAutoRunState(): Promise<{ mentionsRunning: boolean; engageRunning: boolean } | null> {
    try {
      const response = await chrome.runtime.sendMessage({ action: "get-auto-run-state" });
      return response?.state ?? null;
    } catch (err) {
      console.error("xBooster: Failed to get auto-run state:", err);
      return null;
    }
  }

  async function clearAutoRunState(): Promise<void> {
    try {
      await chrome.runtime.sendMessage({ action: "clear-auto-run-state" });
    } catch (err) {
      console.error("xBooster: Failed to clear auto-run state:", err);
    }
  }

  // In start() function, add state persistence after setState:
  const start = useCallback(async () => {
    abortRef.current = false;
    setState((prev) => ({
      ...prev,
      isRunning: true,
      error: null,
      cycleCount: 0,
    }));

    // Save state to background for crash recovery
    await saveAutoRunState(true, false); // mentions running, engage not (will be updated by engage hook)

    // ... rest of existing start() code ...
  }, [runCycle, scheduleNext]);

  // In stop() function, add state clear after setState:
  const stop = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isRunning: false,
      status: "idle",
      nextRunAt: null,
      delayUntil: null,
    }));

    // Clear state in background
    clearAutoRunState();
  }, []);

  // Add auto-resume effect at end of useAutoRun hook (before return statement):
  // Auto-resume on mount if was running before crash
  useEffect(() => {
    const checkAutoResume = async () => {
      const savedState = await getAutoRunState();
      if (savedState?.mentionsRunning) {
        console.log("xBooster: Auto-resuming mentions auto-run after crash recovery");
        await start();
      }
    };

    checkAutoResume();
  }, []); // Run once on mount
  ```
- **Key changes**:
  - Add helper functions for state persistence (`saveAutoRunState`, `getAutoRunState`, `clearAutoRunState`)
  - Call `saveAutoRunState(true, false)` in `start()` to persist mentions running state
  - Call `clearAutoRunState()` in `stop()` to clear state when user stops
  - Add `useEffect` to check saved state on mount and auto-resume if `mentionsRunning` was true

#### Step 11: Add auto-run state persistence to engage auto-run
- **File**: `apps/xbooster/entrypoints/x.content/engage-tab/hooks/use-engage-auto-run.ts`
- **Action**: Add same state save/restore logic as mentions auto-run
- **Implementation**:
  ```typescript
  // Add same helper functions at top of file (copy from use-auto-run.ts):
  async function saveAutoRunState(mentionsRunning: boolean, engageRunning: boolean): Promise<void> {
    // ... same as Step 10 ...
  }

  async function getAutoRunState(): Promise<{ mentionsRunning: boolean; engageRunning: boolean } | null> {
    // ... same as Step 10 ...
  }

  async function clearAutoRunState(): Promise<void> {
    // ... same as Step 10 ...
  }

  // In start() function:
  const start = useCallback(async () => {
    abortRef.current = false;
    setState((prev) => ({
      ...prev,
      isRunning: true,
      error: null,
      cycleCount: 0,
    }));

    // Save state to background for crash recovery
    await saveAutoRunState(false, true); // mentions not, engage running

    // ... rest of existing start() code ...
  }, [runCycle, scheduleNext]);

  // In stop() function:
  const stop = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isRunning: false,
      status: "idle",
      nextRunAt: null,
      delayUntil: null,
    }));

    // Clear state in background
    clearAutoRunState();
  }, []);

  // Add auto-resume effect before return statement:
  useEffect(() => {
    const checkAutoResume = async () => {
      const savedState = await getAutoRunState();
      if (savedState?.engageRunning) {
        console.log("xBooster: Auto-resuming engage auto-run after crash recovery");
        await start();
      }
    };

    checkAutoResume();
  }, []); // Run once on mount
  ```
- **Key changes**: Same as Step 10, but persist `engageRunning: true` instead of `mentionsRunning: true`

#### Step 12: Handle simultaneous mentions + engage auto-run
- **File**: Both `apps/xbooster/entrypoints/x.content/hooks/use-auto-run.ts` and `apps/xbooster/entrypoints/x.content/engage-tab/hooks/use-engage-auto-run.ts`
- **Action**: Update `saveAutoRunState()` calls to merge with existing state
- **Problem**: If both auto-runs are active, each hook's `saveAutoRunState()` call overwrites the other's state
- **Solution**: Fetch current state before saving, merge with new state
- **Implementation** (apply to both files):
  ```typescript
  // Update saveAutoRunState helper to merge with existing state:
  async function saveAutoRunState(mentionsRunning: boolean, engageRunning: boolean): Promise<void> {
    try {
      // Fetch current state first
      const current = await getAutoRunState();

      // Merge with new state (preserve other mode's state)
      const merged = {
        mentionsRunning: current?.mentionsRunning ?? mentionsRunning,
        engageRunning: current?.engageRunning ?? engageRunning,
      };

      // Special case: if we're updating a specific mode, override it
      // This allows each hook to update only its own state
      // (Implementation note: Pass a "mode" parameter to distinguish)

      await chrome.runtime.sendMessage({
        action: "save-auto-run-state",
        mentionsRunning: merged.mentionsRunning,
        engageRunning: merged.engageRunning,
      });
    } catch (err) {
      console.error("xBooster: Failed to save auto-run state:", err);
    }
  }
  ```
- **Alternative simpler approach**: Each hook updates only its own field
  - Mentions hook: `saveAutoRunState(true, undefined)` → only updates `mentionsRunning`
  - Engage hook: `saveAutoRunState(undefined, true)` → only updates `engageRunning`
  - Background merges undefined fields with existing state
  - **Recommended**: Use this approach for simplicity
  - **Implementation**:
    ```typescript
    // Change signature to accept optional booleans:
    async function saveAutoRunState(mentionsRunning?: boolean, engageRunning?: boolean): Promise<void> {
      try {
        await chrome.runtime.sendMessage({
          action: "save-auto-run-state",
          mentionsRunning,
          engageRunning,
        });
      } catch (err) {
        console.error("xBooster: Failed to save auto-run state:", err);
      }
    }

    // Update background handler to merge undefined fields:
    // In apps/xbooster/entrypoints/background/index.ts, update save handler:
    if (message.action === "save-auto-run-state") {
      const current = await storage.getItem<XAutoRunState>("local:xAutoRunState");
      const state: XAutoRunState = {
        mentionsRunning: message.mentionsRunning ?? current?.mentionsRunning ?? false,
        engageRunning: message.engageRunning ?? current?.engageRunning ?? false,
        lastSaveTime: Date.now(),
      };
      storage.setItem<XAutoRunState>("local:xAutoRunState", state).then(() => {
        console.log("xBooster background: Saved auto-run state:", state);
        sendResponse({ success: true });
      });
      return true;
    }

    // Update start() calls in both hooks:
    // In use-auto-run.ts:
    await saveAutoRunState(true, undefined); // Only set mentions

    // In use-engage-auto-run.ts:
    await saveAutoRunState(undefined, true); // Only set engage

    // Update stop() calls to clear only own field:
    // In use-auto-run.ts:
    await saveAutoRunState(false, undefined);

    // In use-engage-auto-run.ts:
    await saveAutoRunState(undefined, false);
    ```

#### Step 13: Update manifest permissions for alarms API
- **File**: `apps/xbooster/wxt.config.ts`
- **Action**: Add `"alarms"` to `permissions` array
- **Location**: Line 29, in `manifest.permissions` array
- **Change**:
  ```typescript
  // BEFORE (line 29):
  permissions: ["storage", "tabs", "cookies", "webRequest"],

  // AFTER:
  permissions: ["storage", "tabs", "cookies", "webRequest", "alarms"],
  ```
- **Why**: `chrome.alarms` API requires explicit permission in manifest

---

## Acceptance Criteria

### Feature 1: Pagination
- [ ] When `fetchCount: 40` is set, `fetchNotifications()` fetches multiple pages until 40 items accumulated or no more pages
- [ ] Cursor is extracted from each response and passed to next request
- [ ] Same behavior for `getListTweets()` and `getCommunityTweets()`
- [ ] Parsers (`parseNotificationEntries`, `parseListTweetsResponse`, `parseCommunityTweetsResponse`) work without modification
- [ ] Abort signal is respected (auto-run can be stopped mid-fetch without hanging)
- [ ] Console logs show page count and cursor values for debugging

### Feature 2: Crash Recovery
- [ ] Background script sends ping every 30 seconds to all X.com tabs
- [ ] Content script responds with pong when healthy
- [ ] After 3 missed pongs, background reloads tab (unless send-lock is active)
- [ ] Before reload, background checks send-lock and waits grace period if active
- [ ] When mentions auto-run is running and tab crashes/reloads, auto-run resumes after reload
- [ ] When engage auto-run is running and tab crashes/reloads, auto-run resumes after reload
- [ ] When both auto-runs are running and tab crashes/reloads, both resume after reload
- [ ] When user manually stops auto-run, state is cleared (no auto-resume on next reload)
- [ ] No double-sends occur during reload (send-lock protection works)
- [ ] Console logs show heartbeat events for debugging

---

## Dependencies

### Existing Code
- `apps/xbooster/entrypoints/x.content/utils/x-api.ts` - All three fetch functions
- `apps/xbooster/entrypoints/x.content/utils/parse-notifications.ts` - `parseNotificationEntries()`, `parseTweetDetail()`
- `apps/xbooster/entrypoints/x.content/engage-tab/utils/parse-tweets.ts` - `parseListTweetsResponse()`, `parseCommunityTweetsResponse()`
- `apps/xbooster/entrypoints/x.content/hooks/use-auto-run.ts` - Mentions auto-run loop
- `apps/xbooster/entrypoints/x.content/engage-tab/hooks/use-engage-auto-run.ts` - Engage auto-run loop
- `apps/xbooster/entrypoints/background/index.ts` - Background service worker
- `apps/xbooster/entrypoints/x.content/index.tsx` - Content script entry point
- `apps/xbooster/wxt.config.ts` - Manifest configuration

### External Dependencies
- Chrome Extension APIs: `chrome.alarms`, `chrome.tabs`, `chrome.storage`, `chrome.runtime`
- WXT framework: `storage` from `wxt/storage`
- AbortController (native Web API)

---

## Risks

### Feature 1: Pagination
- **Risk**: X's GraphQL response structure may vary (cursor location inconsistent)
  - **Mitigation**: `extractCursor()` tries multiple common paths for each endpoint type
- **Risk**: Merging pages may break parser logic if entry IDs conflict
  - **Mitigation**: Filter out cursor entries before merging, parsers only read tweet entries
- **Risk**: Fetching many pages may trigger rate limits
  - **Mitigation**: Respect X's rate limit errors (already handled by existing `postTweetViaDOM` logic via `isRateLimit` flag)

### Feature 2: Crash Recovery
- **Risk**: Background service worker itself could crash (Chrome MV3 limitation)
  - **Mitigation**: `chrome.alarms` API persists across service worker restarts, alarm will re-fire and re-initialize heartbeat logic
- **Risk**: Send-lock check may fail to prevent reload during send (race condition)
  - **Mitigation**: 5-second grace period before reload, re-check send-lock after grace period
- **Risk**: Auto-resume may trigger twice if both hooks call `saveAutoRunState()` simultaneously
  - **Mitigation**: Use optional boolean parameters and merge with existing state in background handler
- **Risk**: User may not want auto-resume after crash (privacy/control concern)
  - **Future**: Add setting to disable auto-resume (out of scope for this plan)

---

## Integration Notes

### Testing Pagination
1. Set `fetchCount: 40` in mentions settings
2. Start mentions auto-run
3. Check console logs for "Fetched page N, cursor: ..." messages
4. Verify mentions list shows ~40 items (not ~20)
5. Test with lists and communities (same verification)

### Testing Crash Recovery
1. Start mentions auto-run
2. Open Chrome DevTools → Sources → Content Scripts → find `x.content/index.tsx`
3. Pause script execution (simulates crash)
4. Wait 90 seconds (3 heartbeats at 30s interval)
5. Tab should reload automatically
6. After reload, mentions auto-run should resume automatically
7. Check console logs for heartbeat events

### Testing Send-Lock Protection
1. Start mentions auto-run with very short send delay (e.g., `sendDelayMin: 0.1`)
2. During send loop, simulate crash (pause script)
3. Background should detect missed pongs but NOT reload (send-lock active)
4. After grace period, if still crashed, reload occurs
5. Verify no double-sends in X.com UI

---

## Post-Implementation

### Verification Checklist
- [ ] Run extension in dev mode, check no console errors on load
- [ ] Test pagination with `fetchCount: 100` (should see multiple pages fetched)
- [ ] Test crash recovery by pausing content script (tab should auto-reload after 90s)
- [ ] Test auto-resume by starting auto-run, reloading tab manually (should resume)
- [ ] Test send-lock by pausing during send loop (should not reload immediately)
- [ ] Test simultaneous mentions + engage auto-run (both should resume after crash)
- [ ] Test manual stop (should NOT resume after manual reload)

### Documentation Updates
- Update `apps/xbooster/README.md` with new pagination behavior and crash recovery feature
- Add console log reference guide (what each heartbeat log means)

### Future Enhancements (Out of Scope)
- Add UI indicator for heartbeat status (green = healthy, yellow = missed 1-2 pongs, red = reloading)
- Add setting to configure heartbeat interval and max missed pongs
- Add setting to disable auto-resume
- Add heartbeat for background script itself (via external monitoring service)

---

## Change Log

**Initial Version (14-02-2026)**
- Created plan for pagination and crash recovery features
- Defined 13 implementation steps
- Specified acceptance criteria and testing procedures
