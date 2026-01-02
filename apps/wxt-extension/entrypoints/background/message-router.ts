/**
 * Message Router for WXT Extension Background Worker
 *
 * Handles message routing from content scripts to background worker.
 * Provides centralized auth-related message handling.
 */

import type {
  MessageRequest,
  MessageResponse,
  MessageRouterDependencies,
  AuthStatus,
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
    sendResponse: (response: MessageResponse<any>) => void
  ): boolean | void => {
    console.log("MessageRouter: Received message:", request.action);

    switch (request.action) {
      case "getAuthStatus":
        return this.handleGetAuthStatus(request, sender, sendResponse);
      case "getToken":
        return this.handleGetToken(request, sender, sendResponse);
      case "signOut":
        return this.handleSignOut(request, sender, sendResponse);
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
    _request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<AuthStatus>) => void
  ): boolean => {
    console.log("MessageRouter: handleGetAuthStatus called");
    this.dependencies.getClerkClient()
      .then((clerk) => {
        console.log("MessageRouter: Clerk client obtained:", {
          hasSession: !!clerk.session,
          hasUser: !!clerk.user,
          sessionId: clerk.session?.id,
          userId: clerk.user?.id
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
    sendResponse: (response: MessageResponse<{ token: string | null }>) => void
  ): boolean => {
    this.dependencies.getClerkClient()
      .then(async (clerk) => {
        if (!clerk.session) {
          console.warn("MessageRouter: No session available for token");
          sendResponse({ success: true, data: { token: null } });
          return;
        }

        // Get token asynchronously
        const token = await clerk.session.getToken();
        console.log("MessageRouter: Token retrieved, length:", token?.length || 0);
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
   * Handle signOut request
   * Signs out the user via Clerk and broadcasts auth state change
   */
  private handleSignOut = (
    _request: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse<{ success: boolean }>) => void
  ): boolean => {
    this.dependencies.getClerkClient()
      .then(async (clerk) => {
        if (!clerk.session) {
          console.log("MessageRouter: No session to sign out");
          sendResponse({ success: true, data: { success: true } });
          return;
        }

        // Sign out asynchronously
        await clerk.signOut();
        console.log("MessageRouter: Sign out successful");

        // Broadcast auth state change to ALL LinkedIn content scripts
        // Must use chrome.tabs.sendMessage to reach content scripts (not chrome.runtime.sendMessage)
        console.log("MessageRouter: Broadcasting authStateChanged after signOut");
        chrome.tabs.query({ url: "https://*.linkedin.com/*" }, (tabs) => {
          console.log(`MessageRouter: Found ${tabs.length} LinkedIn tabs to notify`);
          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs
                .sendMessage(tab.id, {
                  action: "authStateChanged",
                  isSignedIn: false,
                })
                .catch((error) => {
                  // Content script may not be loaded on this tab
                  console.log(
                    `MessageRouter: Failed to send to tab ${tab.id}:`,
                    error
                  );
                });
            }
          }
        });

        sendResponse({ success: true, data: { success: true } });
      })
      .catch((error: Error) => {
        console.error("MessageRouter: Error signing out:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return true; // Asynchronous response
  };
}
