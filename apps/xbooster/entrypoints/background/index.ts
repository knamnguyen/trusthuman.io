import { storage } from "wxt/storage";

export interface XAuth {
  cookie: string;
  csrfToken: string;
  authorization: string;
  userAgent: string;
}

export interface XAutoRunState {
  mentionsRunning: boolean;
  engageRunning: boolean;
  lastSaveTime: number;
}

export default defineBackground(() => {
  // Intercept X.com API requests to capture auth headers
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      const headers = Object.fromEntries(
        details.requestHeaders?.map((h) => [h.name.toLowerCase(), h.value]) ??
          [],
      );

      const cookie = headers["cookie"];
      const csrfToken = headers["x-csrf-token"];
      const authorization = headers["authorization"];
      const userAgent = headers["user-agent"];

      if (cookie && csrfToken && authorization) {
        storage.setItem<XAuth>("local:xAuth", {
          cookie,
          csrfToken,
          authorization,
          userAgent: userAgent ?? "",
        });
        console.log("xBooster: Captured X.com auth headers");
      }
    },
    { urls: ["*://x.com/i/api/*", "*://*.x.com/i/api/*"] },
    ["requestHeaders", "extraHeaders"],
  );

  // === TAB CRASH RECOVERY SYSTEM ===

  // Track heartbeat state per tab
  const tabHeartbeats = new Map<number, { lastPong: number; missedPongs: number }>();
  const MAX_MISSED_PONGS = 3;
  const SEND_LOCK_CHECK_GRACE_MS = 5000;

  // Initialize heartbeat alarm (survives service worker sleep)
  chrome.alarms.create("xbooster-heartbeat", {
    periodInMinutes: 0.5, // 30 seconds
  });

  // Heartbeat alarm handler
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== "xbooster-heartbeat") return;

    // Find all X.com tabs
    const tabs = await chrome.tabs.query({ url: ["https://*.x.com/*", "https://x.com/*"] });

    for (const tab of tabs) {
      if (!tab.id) continue;

      // Initialize heartbeat state if not exists
      if (!tabHeartbeats.has(tab.id)) {
        tabHeartbeats.set(tab.id, { lastPong: Date.now(), missedPongs: 0 });
      }

      // Send ping to content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: "ping" });

        if (response?.pong) {
          const state = tabHeartbeats.get(tab.id)!;
          state.lastPong = Date.now();
          state.missedPongs = 0;
        } else {
          handleMissedPong(tab.id);
        }
      } catch {
        handleMissedPong(tab.id);
      }
    }

    // Clean up heartbeat state for closed tabs
    const currentTabIds = new Set(tabs.map((t) => t.id).filter((id): id is number => id !== undefined));
    for (const tabId of tabHeartbeats.keys()) {
      if (!currentTabIds.has(tabId)) {
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
      console.error(`xBooster background: Tab ${tabId} exceeded max missed pongs, checking send-lock...`);

      // Check if content script is in the middle of sending (send-lock)
      try {
        const lockCheck = await chrome.tabs.sendMessage(tabId, { action: "check-send-lock" });

        if (lockCheck?.isSending) {
          console.warn(`xBooster background: Tab ${tabId} is actively sending, delaying reload...`);
          await new Promise(r => setTimeout(r, SEND_LOCK_CHECK_GRACE_MS));

          try {
            const recheckLock = await chrome.tabs.sendMessage(tabId, { action: "check-send-lock" });
            if (recheckLock?.isSending) {
              console.warn(`xBooster background: Tab ${tabId} still sending after grace, skipping reload`);
              return;
            }
          } catch {
            console.log(`xBooster background: Tab ${tabId} send-lock re-check failed, assuming crash`);
          }
        }
      } catch {
        console.log(`xBooster background: Tab ${tabId} send-lock check failed, assuming crash`);
      }

      // Reload tab
      console.log(`xBooster background: Reloading tab ${tabId}...`);
      await chrome.tabs.reload(tabId);

      // Reset heartbeat state after reload
      tabHeartbeats.set(tabId, { lastPong: Date.now(), missedPongs: 0 });
    }
  }

  // Handle messages from content scripts
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "getXAuth") {
      storage.getItem<XAuth>("local:xAuth").then((auth) => {
        sendResponse({ success: !!auth, auth });
      });
      return true; // async response
    }

    // Auto-run state persistence (merge with existing state)
    if (message.action === "save-auto-run-state") {
      storage.getItem<XAutoRunState>("local:xAutoRunState").then((current) => {
        const state: XAutoRunState = {
          mentionsRunning: message.mentionsRunning ?? current?.mentionsRunning ?? false,
          engageRunning: message.engageRunning ?? current?.engageRunning ?? false,
          lastSaveTime: Date.now(),
        };
        storage.setItem<XAutoRunState>("local:xAutoRunState", state).then(() => {
          console.log("xBooster background: Saved auto-run state:", state);
          sendResponse({ success: true });
        });
      });
      return true; // async response
    }

    // Get auto-run state
    if (message.action === "get-auto-run-state") {
      storage.getItem<XAutoRunState>("local:xAutoRunState").then((state) => {
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
