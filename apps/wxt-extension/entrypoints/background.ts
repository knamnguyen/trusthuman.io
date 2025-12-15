/**
 * Background Worker for WXT Extension
 *
 * Responsibilities:
 * - Initialize Clerk client with syncHost
 * - Handle auth-related messages from content scripts
 * - Monitor auth state changes (URL visits, periodic checks)
 * - Notify content scripts of auth state changes
 */

import { createClerkClient } from "@clerk/chrome-extension/background";
import { MessageRouter } from "./background/message-router";
import type { MessageRouterDependencies } from "./background/background-types";

export default defineBackground(() => {
  console.log("EngageKit WXT Extension - Background script loaded", {
    id: browser.runtime.id,
  });

  /**
   * Get syncHost URL from environment
   * This must be imported differently in background worker
   */
  const getSyncHostUrl = (): string => {
    // VITE_APP_URL is set in .env (or .env.local for worktrees)
    // Examples:
    // - Main repo: http://localhost:3000
    // - Worktree: http://localhost:3010
    // - Production: https://engagekit.io

    // In WXT background workers, we need to check both import.meta.env and process.env
    const syncHost = import.meta.env.VITE_APP_URL;

    if (!syncHost) {
      throw new Error(
        "VITE_APP_URL is not defined. Please check your .env file."
      );
    }

    return syncHost;
  };

  /**
   * Initialize Clerk client (lazy, on-demand)
   */
  let clerkClientPromise: ReturnType<typeof createClerkClient> | null = null;

  const getClerkClient = async () => {
    if (!clerkClientPromise) {
      const syncHost = getSyncHostUrl();
      console.log("Background: Creating Clerk client with syncHost:", syncHost);

      clerkClientPromise = createClerkClient({
        publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
        syncHost,
      });
    }
    return await clerkClientPromise;
  };

  /**
   * Initialize MessageRouter with dependencies
   */
  const dependencies: MessageRouterDependencies = {
    getClerkClient,
  };

  const messageRouter = new MessageRouter(dependencies);

  /**
   * Listen for messages from content scripts
   */
  chrome.runtime.onMessage.addListener(messageRouter.handleMessage);

  /**
   * Monitor tab updates for auth URL visits
   * When user visits auth domains, check session and notify content scripts
   */
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      // Auth domains to monitor (syncHost + /extension-auth path)
      const syncHost = getSyncHostUrl();
      const authDomains = [
        `${syncHost}/extension-auth`,
        `${syncHost}/sign-in`,
        `${syncHost}/sign-up`,
      ];

      const signOutUrls = [
        `${syncHost}/sign-out`,
      ];

      const isAuthUrl = authDomains.some((domain) =>
        tab.url?.includes(domain)
      );

      const isSignOutUrl = signOutUrls.some((domain) =>
        tab.url?.includes(domain)
      );

      if (isAuthUrl || isSignOutUrl) {
        console.log("Background: Detected auth/sign-out URL:", {
          url: tab.url,
          isAuthUrl,
          isSignOutUrl,
          syncHost
        });

        // Refresh auth status after potential sign-in/sign-out
        // Invalidate cached client to force fresh check
        const hadCachedClient = clerkClientPromise !== null;
        clerkClientPromise = null;
        console.log("Background: Invalidated Clerk client cache:", { hadCachedClient });

        setTimeout(async () => {
          console.log("Background: Creating fresh Clerk client after URL visit...");
          const clerk = await getClerkClient();
          const isSignedIn = !!clerk.session;

          console.log("Background: Auth check after URL visit:", {
            isSignedIn,
            wasSignOut: isSignOutUrl,
            hasSession: !!clerk.session,
            sessionId: clerk.session?.id,
            userId: clerk.user?.id
          });

          // Notify content scripts of auth state change
          console.log("Background: Broadcasting authStateChanged message:", { isSignedIn });
          chrome.runtime.sendMessage({
            action: "authStateChanged",
            isSignedIn
          }).catch((error) => {
            console.log("Background: Failed to broadcast message (content script may not be loaded):", error);
          });
        }, 2000);
      }
    }
  });

  /**
   * Periodic auth checks via alarms
   * Check every 2 minutes if session is still valid
   */
  chrome.alarms.create("authCheck", { periodInMinutes: 2 });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "authCheck") {
      const clerk = await getClerkClient();
      const isSignedIn = !!clerk.session;
      console.log("Background: Periodic auth check:", { isSignedIn });

      // Could notify content scripts here if needed
      // chrome.runtime.sendMessage({ action: "authStateChanged", isSignedIn });
    }
  });

  console.log("Background: Initialized with syncHost:", getSyncHostUrl());
});

