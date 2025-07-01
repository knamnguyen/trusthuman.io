import type {
  CommentGeneratorError,
  MessageHandler,
  MessageRouterDependencies,
} from "./background-types";

/**
 * Message Router Service
 *
 * SERVICE CLASS - Handles message routing and processing
 * - Routes incoming messages to appropriate handlers
 * - Organizes all message handling logic in clean methods
 * - Manages async response patterns consistently
 * - Centralizes message validation and error handling
 */

export class MessageRouter {
  private dependencies: MessageRouterDependencies;

  constructor(dependencies: MessageRouterDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Main message handler that routes messages to appropriate handlers
   */
  handleMessage = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean | void => {
    switch (request.action) {
      case "backgroundLog":
        return this.handleBackgroundLog(request, sender, sendResponse);
      case "startAutoCommenting":
        return this.handleStartAutoCommenting(request, sender, sendResponse);
      case "stopAutoCommenting":
        return this.handleStopAutoCommenting(request, sender, sendResponse);
      case "generateComment":
        return this.handleGenerateComment(request, sender, sendResponse);
      case "updateCommentCount":
        return this.handleUpdateCommentCount(request, sender, sendResponse);
      case "commentingCompleted":
        return this.handleCommentingCompleted(request, sender, sendResponse);
      case "moveToOriginalTab":
        return this.handleMoveToOriginalTab(request, sender, sendResponse);
      case "pageReady":
        return this.handlePageReady(request, sender, sendResponse);
      default:
        console.warn("MessageRouter: Unknown action:", request.action);
        sendResponse({ success: false, error: "Unknown action" });
        return false;
    }
  };

  private handleBackgroundLog = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean => {
    // Handle logging from content script to background console
    const timestamp = new Date().toLocaleTimeString();
    const tabInfo = sender.tab ? `[Tab ${sender.tab.id}]` : "[Unknown Tab]";

    switch (request.level) {
      case "error":
        console.error(`${timestamp} ${tabInfo} CONTENT:`, ...request.args);
        break;
      case "warn":
        console.warn(`${timestamp} ${tabInfo} CONTENT:`, ...request.args);
        break;
      case "group":
        console.group(`${timestamp} ${tabInfo} CONTENT:`, ...request.args);
        break;
      case "groupEnd":
        console.groupEnd();
        break;
      default:
        console.log(`${timestamp} ${tabInfo} CONTENT:`, ...request.args);
        break;
    }

    sendResponse({ success: true });
    return false;
  };

  private handleStartAutoCommenting = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean => {
    console.log("MessageRouter: Received startAutoCommenting with settings:", {
      scrollDuration: request.scrollDuration,
      commentDelay: request.commentDelay,
      maxPosts: request.maxPosts,
      duplicateWindow: request.duplicateWindow,
      styleGuide: request.styleGuide?.substring(0, 50) + "...",
      hasClerkToken: !!request.clerkToken,
      tokenLength: request.clerkToken?.length || 0,
    });

    // Validate that we have a Clerk token
    if (!request.clerkToken) {
      console.error("MessageRouter: No Clerk token provided!");
      sendResponse({
        success: false,
        error: "No authentication token provided",
      });
      return false;
    }

    // Save the current settings to storage for persistence
    const settingsToSave = {
      styleGuide: request.styleGuide,
      scrollDuration: request.scrollDuration,
      commentDelay: request.commentDelay,
      maxPosts: request.maxPosts,
      duplicateWindow: request.duplicateWindow,
    };

    console.log("MessageRouter: Saving settings to storage:", settingsToSave);
    chrome.storage.local.set(settingsToSave);

    this.dependencies.startAutoCommenting(
      request.styleGuide,
      request.clerkToken, // Pass token instead of API key
      request.scrollDuration,
      request.commentDelay,
      request.maxPosts,
      request.duplicateWindow,
    );
    sendResponse({ success: true });
    return false;
  };

  private handleStopAutoCommenting = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean => {
    console.log("MessageRouter: Received stopAutoCommenting request");

    // Stop the commenting process immediately
    this.dependencies.autoCommentingState.isRunning = false;

    // Send stop message to content script immediately
    if (this.dependencies.autoCommentingState.feedTabId) {
      chrome.tabs.sendMessage(this.dependencies.autoCommentingState.feedTabId, {
        action: "stopCommentingFlow",
      });

      // Close the LinkedIn tab
      //   chrome.tabs
      //     .remove(this.dependencies.autoCommentingState.feedTabId)
      //     .catch(() => {
      //       // Tab might already be closed, that's okay
      //     });
    }

    // Clear current run state from storage
    chrome.storage.local.set({
      isRunning: false,
      currentCommentCount: 0,
    });

    // Reset comment count
    this.dependencies.autoCommentingState.commentCount = 0;

    // Clear original tab reference
    this.dependencies.autoCommentingState.originalTabId = undefined;

    this.dependencies.sendStatusUpdate(
      "Process stopped and LinkedIn tab closed",
      {
        isRunning: false,
      },
    );
    sendResponse({ success: true });
    return false;
  };

  private handleGenerateComment = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean => {
    // Handle comment generation requests from content script
    console.log(
      "MessageRouter: Received comment generation request for content:",
      request.postContent?.substring(0, 100) + "...",
    );

    this.dependencies
      .generateComment(request.postContent)
      .then((comment) => {
        console.log(
          "MessageRouter: Sending comment response:",
          comment.substring(0, 100) + "...",
        );
        sendResponse({ comment });
      })
      .catch((error) => {
        console.error(
          "MessageRouter: Error in comment generation promise:",
          error,
        );

        // Create detailed error object for content script
        const errorDetails: CommentGeneratorError = {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : "Unknown",
          apiKey: this.dependencies.autoCommentingState.apiKey
            ? "Present"
            : "Missing",
          styleGuide: this.dependencies.autoCommentingState.styleGuide
            ? "Present"
            : "Missing",
          postContentLength: request.postContent
            ? request.postContent.length
            : 0,
          timestamp: new Date().toISOString(),
          type: "comment_generation_error",
        };

        // Send error details to content script
        if (this.dependencies.autoCommentingState.feedTabId) {
          chrome.tabs
            .sendMessage(this.dependencies.autoCommentingState.feedTabId, {
              action: "ai_generation_error",
              error: errorDetails,
            })
            .catch((msgError) => {
              console.error(
                "MessageRouter: Failed to send error to content script:",
                msgError,
              );
            });
        }

        console.error("MessageRouter: Sending fallback comment due to error");
        sendResponse({
          comment: "Great post! Thanks for sharing.",
          error: errorDetails,
        });
      });
    return true; // Indicates we will send a response asynchronously
  };

  private handleUpdateCommentCount = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean => {
    // Handle comment count updates from content script
    this.dependencies.autoCommentingState.commentCount = request.count;
    this.dependencies.sendStatusUpdate(
      request.status || `Processed ${request.count} comments`,
      {
        commentCount: request.count,
      },
    );
    sendResponse({ success: true });
    return false;
  };

  private handleCommentingCompleted = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean => {
    // Handle completion notification from content script
    this.dependencies.autoCommentingState.isRunning = false;

    // Close the LinkedIn tab when automation completes
    if (this.dependencies.autoCommentingState.feedTabId) {
      chrome.tabs
        .remove(this.dependencies.autoCommentingState.feedTabId)
        .catch(() => {
          // Tab might already be closed, that's okay
          console.log("LinkedIn tab was already closed or could not be closed");
        });
    }

    // Clear original tab reference
    this.dependencies.autoCommentingState.originalTabId = undefined;

    this.dependencies.sendStatusUpdate(
      `Commenting completed! LinkedIn tab closed. Check the counts above for total comments posted.`,
      { isRunning: false },
    );
    sendResponse({ success: true });
    return false;
  };

  private handleMoveToOriginalTab = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean => {
    // Handle request to move back to the original tab
    console.log(
      "MessageRouter: Received request to move back to the original tab",
    );

    if (this.dependencies.autoCommentingState.originalTabId) {
      // Switch focus to the original tab
      chrome.tabs
        .update(this.dependencies.autoCommentingState.originalTabId, {
          active: true,
        })
        .then(() => {
          console.log(
            `✅ Successfully focused original tab ID: ${this.dependencies.autoCommentingState.originalTabId}`,
          );
          sendResponse({ success: true });
        });
    }
    return true; // Indicates we will send a response asynchronously
  };

  private handlePageReady = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean => {
    // Handle signal from content script that LinkedIn page is ready
    console.log("Content script signaled page ready - showing start button");
    this.dependencies.sendStatusUpdate(
      "LinkedIn feed loaded. Showing start button...",
    );

    if (
      this.dependencies.autoCommentingState.feedTabId &&
      this.dependencies.autoCommentingState.isRunning
    ) {
      chrome.tabs.sendMessage(this.dependencies.autoCommentingState.feedTabId, {
        action: "showStartButton",
      });
      console.log("Start button should now be visible in the LinkedIn tab");
    }

    sendResponse({ success: true });
    return false;
  };
}
