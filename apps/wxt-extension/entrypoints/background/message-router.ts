/**
 * Message Router for WXT Extension Background Worker
 *
 * Handles message routing from content scripts to background worker.
 * Provides centralized auth-related message handling.
 */

import type {
  AuthStatus,
  MessageRequest,
  MessageResponse,
  MessageRouterDependencies,
} from "./background-types";

export class MessageRouter {
  private dependencies: MessageRouterDependencies;

  constructor(dependencies: MessageRouterDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Main message handler that routes messages to appropriate handlers
   */
  handleMessage = (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<any>) => void,
  ): boolean | void => {
    console.log("MessageRouter: Received message:", request.action);

    switch (request.action) {
      case "getAuthStatus":
        return this.handleGetAuthStatus(request, sender, sendResponse);
      case "getToken":
        return this.handleGetToken(request, sender, sendResponse);
      case "openTargetListTab":
        return this.handleOpenTargetListTab(request, sender, sendResponse);
      default:
        console.warn("MessageRouter: Unknown action:", request.action);
        sendResponse({ success: false, error: "Unknown action" });
        return false;
    }
  };

  /**
   * Handle getAuthStatus request
   * Returns current authentication status from Clerk
   */
  private handleGetAuthStatus = (
    request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<AuthStatus>) => void,
  ): boolean => {
    console.log("MessageRouter: handleGetAuthStatus called", {
      forceRefresh: request.forceRefresh,
    });

    // Invalidate cache if forceRefresh requested (e.g., user switched orgs externally)
    if (request.forceRefresh) {
      console.log(
        "MessageRouter: Invalidating Clerk cache due to forceRefresh",
      );
      this.dependencies.invalidateClerkCache();
    }

    this.dependencies
      .getClerkClient()
      .then((clerk) => {
        console.log("MessageRouter: Clerk client obtained:", {
          hasSession: !!clerk.session,
          hasUser: !!clerk.user,
          sessionId: clerk.session?.id,
          userId: clerk.user?.id,
        });

        const authStatus: AuthStatus = {
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
                lastActiveToken: clerk.session.lastActiveToken
                  ? {
                      jwt: clerk.session.lastActiveToken.getRawString(),
                    }
                  : null,
              }
            : null,
          organization: clerk.organization
            ? {
                id: clerk.organization.id,
                name: clerk.organization.name,
                slug: clerk.organization.slug,
                imageUrl: clerk.organization.imageUrl,
                membersCount: clerk.organization.membersCount,
                maxAllowedMemberships: clerk.organization.maxAllowedMemberships,
              }
            : null,
        };

        console.log("MessageRouter: Sending auth status response:", {
          isSignedIn: authStatus.isSignedIn,
          userId: authStatus.user?.id,
          sessionId: authStatus.session?.id,
          organizationId: authStatus.organization?.id,
          organizationName: authStatus.organization?.name,
        });

        sendResponse({ success: true, data: authStatus });
      })
      .catch((error) => {
        console.error("MessageRouter: Error getting auth status:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return true; // Asynchronous response
  };

  /**
   * Handle getToken request
   * Returns fresh JWT token from Clerk session
   */
  private handleGetToken = (
    _request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<{ token: string | null }>) => void,
  ): boolean => {
    this.dependencies
      .getClerkClient()
      .then(async (clerk) => {
        if (!clerk.session) {
          console.warn("MessageRouter: No session available for token");
          sendResponse({ success: true, data: { token: null } });
          return;
        }

        // Get token with organizationId to include org claims in JWT
        // setActive doesn't seem to propagate to session in chrome extension context
        // so we explicitly pass the org when generating the token
        const token = await clerk.session.getToken({
          skipCache: true,
          organizationId: clerk.organization?.id,
        });
        console.log("MessageRouter: Token retrieved:", {
          length: token?.length || 0,
          organizationId: clerk.organization?.id || null,
        });
        sendResponse({ success: true, data: { token } });
      })
      .catch((error: Error) => {
        console.error("MessageRouter: Error getting token:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return true; // Asynchronous response
  };

  /**
   * Handle openTargetListTab request
   * Opens a new tab with the specified URL (bypasses popup blocker)
   * Used by queue system to open target list feed tabs sequentially
   */
  private handleOpenTargetListTab = (
    request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<{ tabId: number }>) => void,
  ): boolean => {
    const { url } = request;

    if (!url) {
      console.error("MessageRouter: openTargetListTab called without URL");
      sendResponse({ success: false, error: "URL is required" });
      return false;
    }

    console.log("MessageRouter: Opening target list tab:", { url });

    chrome.tabs
      .create({ url, active: true })
      .then((tab) => {
        console.log("MessageRouter: Tab created:", { tabId: tab.id, url });
        sendResponse({ success: true, data: { tabId: tab.id ?? -1 } });
      })
      .catch((error) => {
        console.error("MessageRouter: Error creating tab:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Failed to create tab",
        });
      });

    return true; // Asynchronous response
  };
}
