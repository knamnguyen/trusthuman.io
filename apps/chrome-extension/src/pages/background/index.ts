import { createClerkClient } from "@clerk/chrome-extension/background";
import { getTRPCClient } from "@src/services/trpc-client";

import type {
  BrowserBackendChannelMessage,
  BrowserFunctions,
} from "@sassy/api";

import type { AutoCommentingState } from "./background-types";
import { AIService } from "../../services/ai-service";
import { getSyncHost } from "../../utils/get-sync-host";
import { buildListFeedUrl, LIST_FEED_BASE_URL } from "./build-list-feed-url";
import { getUrnsForSelectedList } from "./get-list-urns";
import { MessageRouter } from "./message-router";

console.log("background script loaded");

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const syncHost = getSyncHost();

console.log("syncHost", syncHost);

if (!publishableKey) {
  throw new Error("Please add the VITE_CLERK_PUBLISHABLE_KEY to the .env file");
}

/**
 * Initialize or get existing Clerk client instance.
 * This is called on-demand to ensure the latest session state is loaded from cookies.
 */
const getClerkClient = async () => {
  console.log(
    `Background: Creating new Clerk client on-demand, syncing with ${syncHost}`,
  );
  // Always create a new instance to load the latest session state from cookies.
  return createClerkClient({
    publishableKey,
    syncHost: syncHost,
  });
};

const trpc = getTRPCClient({
  assumedUserTokenGetter: () => authService.assumedUserToken,
});

/**
 * Authentication Service - handles all auth operations in background
 */
const authService = {
  assumedUserToken: null as string | null,
  /**
   * Get fresh token from Clerk session
   */
  async getToken(): Promise<string | null> {
    try {
      console.log("Background: Getting fresh token from Clerk...");

      const clerk = await getClerkClient();

      if (!clerk.session) {
        console.warn("Background: No valid Clerk session found");
        return null;
      }

      const token = await clerk.session.getToken();
      console.log(
        "Background: Successfully got fresh token, length:",
        token?.length || 0,
      );

      return token;
    } catch (error) {
      console.error("Background: Error getting fresh token:", error);
      return null;
    }
  },

  /**
   * Get authentication status and user info
   */
  async getAuthStatus(): Promise<{
    isSignedIn: boolean;
    user: any;
    session: any;
  }> {
    try {
      const clerk = await getClerkClient();

      return {
        isSignedIn: !!clerk.session,
        user: clerk.user || null,
        session: clerk.session || null,
      };
    } catch (error) {
      console.error("Background: Error getting auth status:", error);
      return { isSignedIn: false, user: null, session: null };
    }
  },

  /**
   * Sign out user and cleanup session
   */
  async signOut(): Promise<{ success: boolean }> {
    try {
      const clerk = await getClerkClient();

      if (clerk.session) {
        await clerk.signOut();
      }

      console.log("Background: User signed out successfully");
      return { success: true };
    } catch (error) {
      console.error("Background: Error signing out:", error);
      return { success: false };
    }
  },

  async attachTokenToSession(token: string) {
    this.assumedUserToken = token;
    const response = await trpc.account.verifyJwt.mutate({ token });
    if (response.status === "error") {
      return { success: false };
    }

    return { success: true };
  },

  /**
   * Check if session is valid
   */
  async checkSession(): Promise<{ isValid: boolean; expiresAt?: number }> {
    try {
      const clerk = await getClerkClient();

      if (!clerk.session) {
        return { isValid: false };
      }

      // Try to get a token to validate session
      const token = await clerk.session.getToken();

      return {
        isValid: !!token,
        expiresAt: clerk.session.expireAt.getTime(),
      };
    } catch (error) {
      console.error("Background: Error checking session:", error);
      return { isValid: false };
    }
  },
};

let autoCommentingState: AutoCommentingState = {
  isRunning: false,
  styleGuide: "",
  apiKey: "",
  scrollDuration: 10,
  commentDelay: 10,
  maxPosts: 20,
  duplicateWindow: 24,
  commentCount: 0,
};

// Utility function to wait for a specified time
const waitBackground = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Function to send status updates to popup
const sendStatusUpdate = (
  status: string,
  updates: Partial<AutoCommentingState> = {},
) => {
  try {
    chrome.runtime.sendMessage({
      action: "statusUpdate",
      status,
      commentCount: autoCommentingState.commentCount,
      isRunning: autoCommentingState.isRunning,
      ...updates,
    });

    // Also save state to storage for persistence
    chrome.storage.local.set({
      isRunning: autoCommentingState.isRunning,
      currentCommentCount: autoCommentingState.commentCount,
    });
  } catch (error) {
    console.error("Error sending status update:", error);
  }
};

// Function to update today's comment count
const updateTodayComments = (newCount: number) => {
  const today = new Date().toDateString();
  const storageKey = `comments_today_${today}`;

  chrome.storage.local.get([storageKey], (result) => {
    const currentTodayCount = result[storageKey] || 0;
    const updatedTodayCount = currentTodayCount + newCount;
    chrome.storage.local.set({ [storageKey]: updatedTodayCount });

    // Send updated today total to popup
    try {
      chrome.runtime.sendMessage({
        action: "statusUpdate",
        newTodayTotal: updatedTodayCount,
      });
    } catch (error) {
      console.error("Error sending today total update:", error);
    }
  });
};

// Initialize services
const aiService = new AIService();

// Function to generate comment using AI service
const generateCommentBackground = async (
  postContent: string,
): Promise<string> => {
  return aiService.generateComment(postContent, {
    apiKey: autoCommentingState.apiKey,
    styleGuide: autoCommentingState.styleGuide,
  });
};

// Main function to start auto-commenting (tokens now fetched fresh on-demand)
const startAutoCommenting = async (
  styleGuide: string,
  scrollDuration: number,
  commentDelay: number,
  maxPosts: number,
  duplicateWindow: number,
): Promise<void> => {
  try {
    console.log(
      "Background: Starting auto-commenting with fresh token service",
    );

    // Reset and initialize state
    autoCommentingState.styleGuide = styleGuide;
    autoCommentingState.apiKey = ""; // No longer needed - using server-side auth
    autoCommentingState.scrollDuration = scrollDuration;
    autoCommentingState.commentDelay = commentDelay;
    autoCommentingState.maxPosts = maxPosts;
    autoCommentingState.duplicateWindow = duplicateWindow;
    autoCommentingState.isRunning = true;
    autoCommentingState.commentCount = 0;

    console.log(`Starting LinkedIn auto-commenting process...`);
    sendStatusUpdate(`Starting LinkedIn auto-commenting...`);

    // Determine target LinkedIn URL based on Target List setting
    const { enabled: targetListEnabled, urns } = await getUrnsForSelectedList();
    const FEED_BASE_URL = "https://www.linkedin.com/feed/" as const;
    const targetBase = targetListEnabled ? LIST_FEED_BASE_URL : FEED_BASE_URL;
    const targetUrl = targetListEnabled
      ? buildListFeedUrl(urns)
      : FEED_BASE_URL;

    // Get the current active tab to decide whether we need a new LinkedIn tab
    const currentTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    let feedTab: chrome.tabs.Tab | undefined;

    // Reuse current tab only if it already matches the target base URL
    if (currentTabs.length > 0 && currentTabs[0]?.url?.startsWith(targetBase)) {
      // Re-use the current tab as the feed tab
      feedTab = currentTabs[0];
      autoCommentingState.feedTabId = feedTab.id!;
      autoCommentingState.originalTabId = undefined; // Staying on the same tab

      console.log("Using existing LinkedIn tab for automation:", feedTab.id);
      sendStatusUpdate(
        "Using current LinkedIn tab for automation (anti-throttling)...",
      );

      // Ensure the tab is pinned to minimise throttling
      if (!feedTab.pinned) {
        await chrome.tabs.update(feedTab.id!, { pinned: true, active: true });
        console.log("Pinned existing LinkedIn feed tab for anti-throttling");
      }

      // In an already-open tab, the content script is loaded and has
      // likely already fired its initial `pageReady` signal earlier. Send the
      // instruction directly so the overlay/start button appears immediately.
      try {
        chrome.tabs.sendMessage(feedTab.id!, { action: "showStartButton" });
        console.log("Sent showStartButton message to existing tab");
      } catch (err) {
        console.warn("Could not send showStartButton message:", err);
      }
    } else {
      // Remember the original tab so we can return to it later
      if (currentTabs.length > 0 && currentTabs[0]?.id) {
        autoCommentingState.originalTabId = currentTabs[0].id;
        console.log(
          `Captured original tab ID: ${autoCommentingState.originalTabId}`,
        );
      }

      console.log("Creating LinkedIn tab in current window with target URL...");
      sendStatusUpdate("Creating LinkedIn tab for automation...");

      feedTab = await chrome.tabs.create({
        url: targetUrl,
        active: true,
        pinned: true,
      });

      if (!feedTab || !feedTab.id) {
        throw new Error("Failed to create LinkedIn feed tab");
      }

      autoCommentingState.feedTabId = feedTab.id;
      console.log(`LinkedIn tab created with ID: ${feedTab.id}`);
      console.log(`LinkedIn tab pinned status: ${feedTab.pinned}`);
      sendStatusUpdate(
        "LinkedIn tab created successfully as pinned tab (anti-throttling)...",
      );
    }

    sendStatusUpdate("Waiting for LinkedIn page to load...");

    // Don't show start button immediately - wait for content script to signal ready
    // The content script will send 'pageReady' when DOM is loaded and LinkedIn feed is ready
    console.log("Waiting for content script to signal page ready...");
  } catch (error) {
    console.error("Error in auto-commenting process:", error);
    autoCommentingState.isRunning = false;
    // No need to cleanup background window since we're using tabs now
    sendStatusUpdate("Error occurred during auto-commenting setup", {
      isRunning: false,
    });
  }
};

// Initialize message router with dependencies
const messageRouter = new MessageRouter({
  autoCommentingState,
  sendStatusUpdate,
  updateTodayComments,
  startAutoCommenting,
  generateComment: generateCommentBackground,
});

interface BackgroundScriptFunctions extends BrowserFunctions {
  sendMessageToContentScriptTab: (
    message: ContentScriptMessage,
  ) => Promise<void>;
}

const createBackgroundScriptFunctions = () => {
  let tabId: number | null = null;

  async function sendMessageToContentScriptTab(
    tabId: number,
    message: ContentScriptMessage,
  ) {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  }

  async function getPinnedTabId() {
    // if a tab id is already set, just return
    if (tabId !== null) {
      return tabId;
    }

    // query for tabs to see if there are any linkedin tabs
    const tabs = await chrome.tabs.query({
      active: false,
      currentWindow: true,
    });

    const feedTab = tabs.find(
      (tab) =>
        tab.url !== undefined && tab.url.startsWith("https://www.linkedin.com"),
    );

    // if no linkedin tabs, just create one and assign it to tab id
    if (feedTab === undefined) {
      console.log("No pinned LinkedIn tab found, creating one...");
      const tab = await chrome.tabs.create({
        url: "https://www.linkedin.com/feed/",
        active: false,
        pinned: true,
      });

      // can use null assertion because chrome.tabs.create and chrome.tabs.query should return an id
      tabId = tab.id!;
      console.log("Pinned LinkedIn tab created.");
    } else {
      // can use null assertion because chrome.tabs.create and chrome.tabs.query should return an id
      tabId = feedTab.id!;
    }

    return tabId;
  }

  return {
    async startAutoCommenting(params) {
      const tabId = await getPinnedTabId();
      await sendMessageToContentScriptTab(tabId, {
        action: "startNewCommentingFlow",
        params,
      });
    },
    async stopAutoCommenting() {
      const tabId = await getPinnedTabId();
      await sendMessageToContentScriptTab(tabId, {
        action: "stopCommentingFlow",
      });
    },
    async sendMessageToContentScriptTab(message) {
      const pinnedTabId = await getPinnedTabId();
      await sendMessageToContentScriptTab(pinnedTabId, message);
    },
  } satisfies BackgroundScriptFunctions;
};

export const backgroundScriptFunctions = createBackgroundScriptFunctions();

// TODO: some error here that it's not exposed properly so when backend calls it fails
// expose functions to be called in linkedin-browser-session
(globalThis as any)._backgroundScriptFunctions = backgroundScriptFunctions;

console.info("injected background script");

let contentScriptTabId: number | null = null;

// Message listener with comprehensive authentication service
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle authentication requests directly in background
  switch (request.action) {
    case "engagekit_contentscript_handshake": {
      if (sender.tab?.id) {
        sendResponse({ status: "ok" });
        contentScriptTabId = sender.tab?.id ?? null;
      } else {
        sendResponse({ status: "error", message: "No tab ID in sender" });
      }
      return true;
    }
    case "getFreshToken":
      console.log("Background: Received getFreshToken request");
      authService
        .getToken()
        .then((token) => {
          console.log(
            "Background: Sending fresh token response, hasToken:",
            !!token,
          );
          sendResponse({ token });
        })
        .catch((error) => {
          console.error("Background: Error getting fresh token:", error);
          sendResponse({ token: null });
        });
      return true;

    case "attachTokenToSession":
      console.info(request);
      console.log(
        "Background: Received requestAssumedUserTokenAndAttachToSession request",
      );
      authService
        .attachTokenToSession(request.payload.token)
        .then((response) => {
          sendResponse(response);
        });
      return true;

    case "getAuthStatus":
      console.log("Background: Received getAuthStatus request");
      authService
        .getAuthStatus()
        .then((status) => {
          console.log(
            "Background: Sending auth status response, isSignedIn:",
            status.isSignedIn,
          );
          sendResponse(status);
        })
        .catch((error) => {
          console.error("Background: Error getting auth status:", error);
          sendResponse({ isSignedIn: false, user: null, session: null });
        });
      return true;

    case "signOut":
      console.log("Background: Received signOut request");
      authService
        .signOut()
        .then((result) => {
          console.log("Background: Sign out result:", result);
          sendResponse(result);
        })
        .catch((error) => {
          console.error("Background: Error during sign out:", error);
          sendResponse({ success: false });
        });
      return true;

    case "checkSession":
      console.log("Background: Received checkSession request");
      authService
        .checkSession()
        .then((result) => {
          console.log("Background: Session check result:", result);
          sendResponse(result);
        })
        .catch((error) => {
          console.error("Background: Error checking session:", error);
          sendResponse({ isValid: false });
        });
      return true;

    case "sendMessageToPuppeteerBackend":
      console.log("Background: Received sendMessageToPuppeteerBackend request");
      sendMessageToPuppeteerBackend(request.payload);
      sendResponse({ success: true });
      return true;

    default:
      // Route other messages to message router
      return messageRouter.handleMessage(request, sender, sendResponse);
  }
});

// Handle LinkedIn tab being manually closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (autoCommentingState.feedTabId === tabId) {
    console.log("LinkedIn tab was manually closed");
    autoCommentingState.feedTabId = undefined;

    // Stop the automation if it's running
    if (autoCommentingState.isRunning) {
      autoCommentingState.isRunning = false;

      // Clear current run state from storage
      chrome.storage.local.set({
        isRunning: false,
        currentCommentCount: 0,
      });

      // Reset comment count
      autoCommentingState.commentCount = 0;

      // Clear original tab reference
      autoCommentingState.originalTabId = undefined;

      sendStatusUpdate("LinkedIn tab was closed - automation stopped", {
        isRunning: false,
      });
    }
  }
});

console.log("EngageKit background script loaded");

// === SERVICE WORKER LIFECYCLE & AUTH STATE MANAGEMENT ===

/**
 * Keep service worker alive and monitor authentication state changes
 * This ensures we detect when users sign in via the web app
 */

// Add chrome.runtime.onStartup listener to detect extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Background: Extension startup detected");
  // Force auth status check on startup
  authService.getAuthStatus().then((status) => {
    console.log("Background: Startup auth check:", status.isSignedIn);
  });
});

// Add chrome.runtime.onInstalled listener for installation/updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Background: Extension installed/updated:", details.reason);
  // Force auth status check on install/update
  authService.getAuthStatus().then((status) => {
    console.log("Background: Install/update auth check:", status.isSignedIn);
  });
});

// Monitor tab navigation to detect auth-related page visits
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if this is a completed navigation to an auth-related URL
  if (changeInfo.status === "complete" && tab.url) {
    const authDomains = [
      "clerk.accounts.dev",
      "clerk.dev",
      "tolerant-hagfish-1.clerk.accounts.dev",
      "localhost:3000",
      "ngrok-free.app",
      "engagekit.io",
    ];

    const isAuthUrl = authDomains.some((domain) => tab.url?.includes(domain));

    if (isAuthUrl) {
      console.log("Background: Detected navigation to auth URL:", tab.url);
      // Wait a moment for auth to complete, then check status
      setTimeout(() => {
        authService.getAuthStatus().then((status) => {
          console.log(
            "Background: Auth URL visit - session check:",
            status.isSignedIn,
          );
        });
      }, 2000);
    }
  }
});

// Periodic auth state checking (every 30 seconds when extension is active)
let authCheckInterval: NodeJS.Timeout | null = null;

const startAuthMonitoring = () => {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
  }

  authCheckInterval = setInterval(async () => {
    try {
      const status = await authService.getAuthStatus();
      console.log(
        "Background: Periodic auth check - isSignedIn:",
        status.isSignedIn,
      );
    } catch (error) {
      console.warn("Background: Error in periodic auth check:", error);
    }
  }, 30000); // Check every 30 seconds
};

const stopAuthMonitoring = () => {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
    authCheckInterval = null;
  }
};

// Start monitoring when background script loads
startAuthMonitoring();

// Add alarm for periodic wake-ups (Chrome extensions best practice)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "authCheck") {
    console.log("Background: Alarm-triggered auth check");
    authService.getAuthStatus().then((status) => {
      console.log("Background: Alarm auth check result:", status.isSignedIn);
    });
  }
});

// Create recurring alarm for auth checks (every 2 minutes)
chrome.alarms.create("authCheck", { periodInMinutes: 2 });

console.log(
  "Background: Auth monitoring and service worker lifecycle handlers initialized",
);

function sendMessageToPuppeteerBackend(message: BrowserBackendChannelMessage) {
  if (contentScriptTabId === null) {
    console.warn(
      `No content script tab ID available to send message to Puppeteer backend`,
    );
    return;
  }

  chrome.tabs.sendMessage(
    contentScriptTabId,
    {
      action: "sendMessageToPuppeteerBackend",
      payload: message,
    },
    () => {
      console.log(
        `Sent message to Puppeteer backend via content script in tab ${tab.id}`,
      );
    },
  );
}

export type ContentScriptMessage =
  | {
      action: "startNewCommentingFlow";
      params: {
        autoCommentRunId: string;
        scrollDuration: number;
        commentDelay: number;
        maxPosts: number;
        styleGuide: string;
        duplicateWindow: number;
        commentAsCompanyEnabled?: boolean;
        timeFilterEnabled?: boolean;
        minPostAge?: number;
        manualApproveEnabled?: boolean;
        authenticityBoostEnabled?: boolean;
        commentProfileName?: string;
        languageAwareEnabled?: boolean;
        skipCompanyPagesEnabled?: boolean;
        skipPromotedPostsEnabled?: boolean;
        skipFriendsActivitiesEnabled?: boolean;
        blacklistEnabled?: boolean;
        blacklistAuthors?: string[];
      };
    }
  | {
      action: "showStartButton";
    }
  | {
      action: "stopCommentingFlow";
    }
  | ({
      action: "statusUpdate";
      status: string;
    } & {
      [k in string]: any;
    })
  | {
      action: "sendMessageToPuppeteerBackend";
      payload: BrowserBackendChannelMessage;
    };
