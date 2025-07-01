import type { AutoCommentingState } from "./background-types";
import { AIService } from "../../utils/ai-service";
import { setCachedClerkToken } from "../../utils/trpc-client";
import { MessageRouter } from "./message-router";

console.log("background script loaded");

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

// Main function to start auto-commenting with cached token
const startAutoCommenting = async (
  styleGuide: string,
  clerkToken: string,
  scrollDuration: number,
  commentDelay: number,
  maxPosts: number,
  duplicateWindow: number,
): Promise<void> => {
  try {
    // Set the cached token for tRPC client (much more efficient!)
    setCachedClerkToken(clerkToken);
    console.log("Background: Cached Clerk token for tRPC client");

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

    // Get the current active tab to remember as the original tab
    const currentTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (currentTabs.length > 0 && currentTabs[0]?.id) {
      autoCommentingState.originalTabId = currentTabs[0].id;
      console.log(
        `Captured original tab ID: ${autoCommentingState.originalTabId}`,
      );
    }

    let feedTab: chrome.tabs.Tab | undefined;

    // Create LinkedIn tab in current window instead of new background window
    console.log("Creating LinkedIn tab in current window...");
    sendStatusUpdate("Creating LinkedIn tab for automation...");

    feedTab = await chrome.tabs.create({
      url: "https://www.linkedin.com/feed/",
      active: true, // Start with focus so user can see it
      pinned: true, // Pin the tab to provide exemption from throttling
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

// Message listener
chrome.runtime.onMessage.addListener(messageRouter.handleMessage);

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
