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
import { storage } from "wxt/storage";

import type { MessageRouterDependencies } from "./background-types";
import { getSyncHostUrl, getWebAppDomain } from "../../lib/get-sync-host-url";
import { MessageRouter } from "./message-router";

export default defineBackground(() => {
  console.log("EngageKit WXT Extension - Background script loaded", {
    id: browser.runtime.id,
  });

  /**
   * Initialize Clerk client eagerly on background script load
   * This eliminates the cold-start delay when content scripts first request auth
   */
  const syncHost = getSyncHostUrl();
  console.log(
    "Background: Initializing Clerk client eagerly with syncHost:",
    syncHost,
  );

  let clerkClientPromise: ReturnType<typeof createClerkClient> =
    createClerkClient({
      publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
      syncHost,
    });

  const getClerkClient = async () => {
    return await clerkClientPromise;
  };

  /**
   * Invalidate and recreate Clerk client
   * Call this to force a fresh client (e.g., after org switch)
   */
  const invalidateClerkCache = () => {
    console.log("Background: Recreating Clerk client");
    clerkClientPromise = createClerkClient({
      publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
      syncHost,
    });
  };

  /**
   * Initialize MessageRouter with dependencies
   */
  const dependencies: MessageRouterDependencies = {
    getClerkClient,
    invalidateClerkCache,
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
      const webAppDomain = getWebAppDomain();
      const authDomains = [
        `${webAppDomain}/extension-auth`,
        `${webAppDomain}/sign-in`,
        `${webAppDomain}/sign-up`,
      ];

      const signOutUrls = [`${webAppDomain}/sign-out`];

      const isAuthUrl = authDomains.some((domain) => tab.url?.includes(domain));

      const isSignOutUrl = signOutUrls.some((domain) =>
        tab.url?.includes(domain),
      );

      if (isAuthUrl || isSignOutUrl) {
        console.log("Background: Detected auth/sign-out URL:", {
          url: tab.url,
          isAuthUrl,
          isSignOutUrl,
          syncHost,
        });

        // Refresh auth status after potential sign-in/sign-out
        // Recreate client to force fresh check
        invalidateClerkCache();

        setTimeout(async () => {
          console.log(
            "Background: Creating fresh Clerk client after URL visit...",
          );
          const clerk = await getClerkClient();
          const isSignedIn = !!clerk.session;

          console.log("Background: Auth check after URL visit:", {
            isSignedIn,
            wasSignOut: isSignOutUrl,
            hasSession: !!clerk.session,
            sessionId: clerk.session?.id,
            userId: clerk.user?.id,
            organizationId: clerk.organization?.id,
          });

          // Notify ALL LinkedIn content scripts of auth state change
          // Must use chrome.tabs.sendMessage to reach content scripts (not chrome.runtime.sendMessage)
          console.log(
            "Background: Broadcasting authStateChanged to LinkedIn tabs:",
            {
              isSignedIn,
            },
          );

          // Query all LinkedIn tabs and send message to each
          chrome.tabs.query({ url: "https://*.linkedin.com/*" }, (tabs) => {
            console.log(
              `Background: Found ${tabs.length} LinkedIn tabs to notify`,
            );
            for (const tab of tabs) {
              if (tab.id) {
                chrome.tabs
                  .sendMessage(tab.id, {
                    action: "authStateChanged",
                    isSignedIn,
                  })
                  .catch((error) => {
                    // Content script may not be loaded on this tab
                    console.log(
                      `Background: Failed to send to tab ${tab.id}:`,
                      error,
                    );
                  });
              }
            }
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

  /**
   * Intercept LinkedIn Auth Headers from realtime/connect requests
   * Captures cookies, csrf-token, and tracking headers for API calls
   */
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      if (!details.url.includes("/realtime/connect")) return;

      const headers = Object.fromEntries(
        details.requestHeaders?.map((h) => [h.name.toLowerCase(), h.value]) ||
          [],
      );

      if (headers["cookie"] && headers["csrf-token"]) {
        storage.setItem("local:auth", {
          cookie: headers["cookie"],
          csrfToken: headers["csrf-token"],
          pageInstance: headers["x-li-page-instance"],
          track: headers["x-li-track"],
        });
        console.log("Background: Captured LinkedIn Auth Headers");
      }
    },
    { urls: ["https://*.linkedin.com/realtime/connect*"] },
    ["requestHeaders", "extraHeaders"],
  );
});
