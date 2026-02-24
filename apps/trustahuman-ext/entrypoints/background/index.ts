/**
 * Background Worker for TrustHuman Extension
 *
 * Responsibilities:
 * - Initialize Clerk client with syncHost
 * - Handle auth-related messages from content scripts
 * - Handle webcam capture via offscreen document
 * - Monitor auth state changes and notify content scripts
 * - Automatically inject auth tokens into API requests via getClientCookies()
 */

import { createClerkClient, getClientCookies } from "@clerk/chrome-extension/background";

import { getSyncHostUrl, getWebAppUrl, getApiUrl } from "../../lib/get-sync-host-url";

export default defineBackground(() => {
  console.log("TrustAHuman - Background loaded");

  /**
   * Set up automatic auth token injection for API requests
   * This intercepts fetch requests to permitted origins and adds Authorization header
   * See: https://clerk.com/docs/references/chrome-extension/add-react-router#make-authenticated-requests-with-clerk-s-session-token
   */
  const apiUrl = getApiUrl();
  const PERMITTED_ORIGINS = [apiUrl];
  const MATCH_PATTERNS = PERMITTED_ORIGINS.map((origin) => `${origin}/*`);

  console.log("TrustAHuman BG: Setting up getClientCookies for:", MATCH_PATTERNS);

  getClientCookies({
    urls: MATCH_PATTERNS,
  });

  /**
   * On first install, request camera permission
   */
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      console.log("TrustAHuman BG: First install detected, requesting camera permission");

      // Small delay to ensure extension is fully loaded
      setTimeout(async () => {
        try {
          // Create offscreen document to trigger camera permission request
          const hasDoc = await chrome.offscreen.hasDocument();
          if (!hasDoc) {
            await chrome.offscreen.createDocument({
              url: "offscreen.html",
              reasons: [chrome.offscreen.Reason.USER_MEDIA],
              justification: "Request camera permission for human verification",
            });
          }

          // Send message to offscreen to request camera
          chrome.runtime.sendMessage({ action: "requestCameraPermission" });

          console.log("TrustAHuman BG: Camera permission request sent");
        } catch (err) {
          console.error("TrustAHuman BG: Failed to request camera permission:", err);
        }
      }, 1000);
    }
  });

  /**
   * Initialize Clerk client eagerly
   */
  const syncHost = getSyncHostUrl();
  console.log("TrustAHuman BG: Initializing Clerk client with syncHost:", syncHost);

  let clerkClientPromise: ReturnType<typeof createClerkClient> = createClerkClient({
    publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
    syncHost,
  });

  const getClerkClient = async () => {
    return await clerkClientPromise;
  };

  const invalidateClerkCache = () => {
    console.log("TrustAHuman BG: Recreating Clerk client");
    clerkClientPromise = createClerkClient({
      publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY!,
      syncHost,
    });
  };

  /**
   * Handle messages from content scripts
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("TrustAHuman BG: received message", message.action);

    if (message.action === "getAuthStatus") {
      handleGetAuthStatus(message.forceRefresh, sendResponse);
      return true; // async response
    }

    if (message.action === "getToken") {
      handleGetToken(sendResponse);
      return true; // async response
    }

    if (message.action === "openSetup") {
      chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") });
      sendResponse({ success: true });
      return false;
    }

    if (message.action === "openSignIn") {
      const webAppUrl = getWebAppUrl();
      chrome.tabs.create({ url: `${webAppUrl}/extension-auth` });
      sendResponse({ success: true });
      return false;
    }

    if (message.action === "capturePhoto") {
      handleCapturePhoto()
        .then((result) => {
          console.log("TrustAHuman BG: capturePhoto result, has base64:", !!result.base64);
          sendResponse(result);
        })
        .catch((err) => {
          console.error("TrustAHuman BG: capturePhoto error:", err);
          sendResponse({ base64: null });
        });
      return true; // async response
    }

    if (message.action === "captureResult") {
      console.log("TrustAHuman BG: captureResult received, has base64:", !!message.base64);
      return false;
    }

    return false;
  });

  /**
   * Handle getAuthStatus request
   */
  async function handleGetAuthStatus(
    forceRefresh: boolean | undefined,
    sendResponse: (response: any) => void,
  ) {
    try {
      if (forceRefresh) {
        invalidateClerkCache();
      }

      const clerk = await getClerkClient();
      console.log("TrustAHuman BG: Clerk client obtained:", {
        hasSession: !!clerk.session,
        hasUser: !!clerk.user,
      });

      const authStatus = {
        isSignedIn: !!clerk.session,
        user: clerk.user
          ? {
              id: clerk.user.id,
              emailAddress: clerk.user.emailAddresses[0]?.emailAddress || "",
              firstName: clerk.user.firstName,
              lastName: clerk.user.lastName,
              imageUrl: clerk.user.imageUrl,
            }
          : null,
        session: clerk.session
          ? {
              id: clerk.session.id,
            }
          : null,
      };

      sendResponse({ success: true, data: authStatus });
    } catch (error) {
      console.error("TrustAHuman BG: Error getting auth status:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Handle getToken request
   */
  async function handleGetToken(sendResponse: (response: any) => void) {
    try {
      const clerk = await getClerkClient();

      if (!clerk.session) {
        sendResponse({ success: true, data: { token: null } });
        return;
      }

      const token = await clerk.session.getToken({ skipCache: true });
      console.log("TrustAHuman BG: Token retrieved, length:", token?.length || 0);
      sendResponse({ success: true, data: { token } });
    } catch (error) {
      console.error("TrustAHuman BG: Error getting token:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Handle photo capture via offscreen document
   */
  async function handleCapturePhoto(): Promise<{ base64: string | null }> {
    console.log("TrustAHuman BG: handleCapturePhoto started");
    const hasDoc = await chrome.offscreen.hasDocument();
    console.log("TrustAHuman BG: hasDocument:", hasDoc);

    if (!hasDoc) {
      console.log("TrustAHuman BG: creating offscreen document");
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: "Capture webcam for human verification",
      });
      console.log("TrustAHuman BG: offscreen document created");
    }

    const base64 = await new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("TrustAHuman BG: capturePhoto timed out after 10s");
        resolve(null);
      }, 10000);

      const listener = (msg: any) => {
        if (msg.action === "captureResult") {
          console.log("TrustAHuman BG: captureResult listener fired, has base64:", !!msg.base64);
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(listener);
          resolve(msg.base64 ?? null);
        }
      };
      chrome.runtime.onMessage.addListener(listener);

      console.log("TrustAHuman BG: sending startCapture to offscreen");
      chrome.runtime.sendMessage({ action: "startCapture" });
    });

    try {
      await chrome.offscreen.closeDocument();
      console.log("TrustAHuman BG: offscreen document closed");
    } catch {
      /* already closed */
    }

    return { base64 };
  }

  /**
   * Monitor tab updates for auth URL visits
   */
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      const webAppUrl = getWebAppUrl();
      const authUrls = [
        `${webAppUrl}/extension-auth`,
        `${webAppUrl}/sign-in`,
        `${webAppUrl}/sign-up`,
      ];
      const signOutUrls = [`${webAppUrl}/sign-out`];

      const isAuthUrl = authUrls.some((url) => tab.url?.includes(url));
      const isSignOutUrl = signOutUrls.some((url) => tab.url?.includes(url));

      if (isAuthUrl || isSignOutUrl) {
        console.log("TrustAHuman BG: Detected auth URL:", tab.url);

        invalidateClerkCache();

        setTimeout(async () => {
          const clerk = await getClerkClient();
          const isSignedIn = !!clerk.session;

          console.log("TrustAHuman BG: Auth check after URL visit:", {
            isSignedIn,
            userId: clerk.user?.id,
          });

          // Notify all LinkedIn tabs
          chrome.tabs.query({ url: "https://*.linkedin.com/*" }, (tabs) => {
            console.log(`TrustAHuman BG: Broadcasting to ${tabs.length} LinkedIn tabs`);
            for (const tab of tabs) {
              if (tab.id) {
                chrome.tabs
                  .sendMessage(tab.id, {
                    action: "authStateChanged",
                    isSignedIn,
                  })
                  .catch(() => {});
              }
            }
          });
        }, 2000);
      }
    }
  });

  /**
   * Periodic auth checks
   */
  chrome.alarms.create("authCheck", { periodInMinutes: 2 });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "authCheck") {
      const clerk = await getClerkClient();
      console.log("TrustAHuman BG: Periodic auth check:", { isSignedIn: !!clerk.session });
    }
  });

  console.log("TrustAHuman BG: Initialized with syncHost:", syncHost);
});
