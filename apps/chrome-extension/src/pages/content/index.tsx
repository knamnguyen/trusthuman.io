import wait from "@src/utils/wait";

import { cleanupManualApproveUI } from "./approve-flow/cleanup";
import { runManualApproveList } from "./approve-flow/manual-approve-list";
import { runManualApproveStandard } from "./approve-flow/manual-approve-standard";
import {
  backgroundError,
  backgroundGroup,
  backgroundGroupEnd,
  backgroundLog,
  backgroundWarn,
} from "./background-log";
import {
  hasCommentedOnAuthorRecently,
  loadCommentedAuthorsWithTimestamps,
  saveCommentedAuthorWithTimestamp,
} from "./check-duplicate/check-duplicate-author-recency";
import {
  commentedPostHashes,
  hasCommentedOnPostHash,
  loadCommentedPostHashes,
  saveCommentedPostHash,
} from "./check-duplicate/check-duplicate-commented-post-hash";
import {
  commentedPostUrns,
  hasCommentedOnPostUrn,
  loadCommentedPostUrns,
  saveCommentedPostUrn,
} from "./check-duplicate/check-duplicate-commented-post-urns";
import cleanupOldPostHashes from "./check-duplicate/clean-old-post-hashes";
import cleanupOldPostUrns from "./check-duplicate/clean-old-post-urns";
import cleanupOldTimestampsAuthor from "./check-duplicate/clean-old-timestamp-author";
import normalizeAndHashContent from "./check-duplicate/normalize-and-hash-content";
import checkFriendsActivity from "./check-friends-activity";
import extractAuthorInfo from "./extract-author-info";
import extractBioAuthor from "./extract-bio-author";
import loadAndExtractComments from "./extract-post-comments";
import extractPostContent from "./extract-post-content";
import extractPostTimePromoteState from "./extract-post-time-promote-state";
import extractPostUrns from "./extract-post-urns";
import generateComment from "./generate-comment";
import postCommentOnPost from "./post-comment-on-post";
import { loadSelectedListAuthors } from "./profile-target-list/load-selected-list-authors";
import { runListMode } from "./profile-target-list/run-target-list-mode";
import saveCurrentUsernameUrl from "./save-current-username-url";
import scrollFeedLoadPosts from "./scroll-feed-load-post";
import { tabAudio } from "./tab-audio";
import updateCommentCounts from "./update-comment-counts";

import "./attach-engage-button";
import "./init-comment-history";
import "./profile-target-list";

// Pronoun rule for company mode
const COMPANY_PRONOUN_RULE =
  "IMPORTANT: You are in company page mode, not individual mode anymore. You're speaking on behalf of a company. ALWAYS use We/we pronouns; NEVER use I/i. This is the rule first and foremost you must follow before looking at any other rules or guide. Again, always use We/we pronouns when referring to yourself instead of I/i";

const LANGUAGE_AWARE_RULE =
  "IMPORTANT: When commenting, detect the language of the original post and comment in the same language. If the post is in English, comment in English; otherwise, switch to that language. Always respect grammar and tone. This rule is mandatory. If the post is in a language other than English, you must try as hard as possible to comment in the same tone and style as the post. If you can't, comment in English.";
// Content script for EngageKit - Background Window Mode
// This script processes posts directly on the feed page

let isCommentingActive = false;
let commentedAuthors = new Set<string>();
let commentedAuthorsWithTimestamps = new Map<string, number>();
let postsSkippedDuplicateCount = 0;
let recentAuthorsDetectedCount = 0;
let postsSkippedAlreadyCommentedCount = 0;
let duplicatePostsDetectedCount = 0;

// Check if we need to show the start button
let hasUserInteracted = false;

// Initialize profile functionality early but safely
console.log("🔥 CONTENT SCRIPT LOADED - EngageKit Profile Extract");
console.log("🔥 Current URL:", window.location.href);
console.log("🔥 Document state:", document.readyState);

//check if page is ready to display the start button
if (document.readyState !== "loading") {
  console.log("document is already ready, just execute code here");
  //send page ready message to background script
  chrome.runtime.sendMessage({
    action: "pageReady",
  });
} else {
  document.addEventListener("DOMContentLoaded", function () {
    console.log("document was not ready, place code here");
    //send page ready message to background script
    chrome.runtime.sendMessage({
      action: "pageReady",
    });
  });
}

// Function to show the start button overlay
function showStartButton() {
  console.log("🚀 Showing start button for EngageKit...");

  // Don't show multiple buttons
  if (document.getElementById("linkedin-start-overlay")) {
    return;
  }

  // Create full-screen overlay
  const overlay = document.createElement("div");
  overlay.id = "linkedin-start-overlay";
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 115, 177, 0.95) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important;
    color: white !important;
  `;

  // Create container
  const container = document.createElement("div");
  container.style.cssText = `
    text-align: center !important;
    max-width: 600px !important;
    padding: 40px !important;
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 20px !important;
    backdrop-filter: blur(10px) !important;
  `;

  // Create title
  const title = document.createElement("h1");
  title.textContent = "EngageKit";
  title.style.cssText = `
    font-size: 48px !important;
    margin: 0 0 20px 0 !important;
    text-align: center !important;
    font-weight: bold !important;
    color: white !important;
  `;

  // Create subtitle
  const subtitle = document.createElement("p");
  subtitle.textContent = "Click to start auto-commenting on LinkedIn posts";
  subtitle.style.cssText = `
    font-size: 20px !important;
    margin: 0 0 40px 0 !important;
    text-align: center !important;
    opacity: 0.9 !important;
    color: white !important;
  `;

  // Create start button
  const startButton = document.createElement("button");
  startButton.textContent = "🚀 Start Auto-Commenting";
  startButton.style.cssText = `
    background: #ffffff !important;
    color: #0073b1 !important;
    border: none !important;
    padding: 20px 40px !important;
    font-size: 24px !important;
    font-weight: bold !important;
    border-radius: 12px !important;
    cursor: pointer !important;
    box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
    transition: all 0.3s ease !important;
    margin: 0 0 20px 0 !important;
    font-family: inherit !important;
  `;

  // Add hover effects
  startButton.addEventListener("mouseenter", () => {
    startButton.style.transform = "translateY(-2px)";
    startButton.style.boxShadow = "0 12px 20px rgba(0,0,0,0.3)";
  });

  startButton.addEventListener("mouseleave", () => {
    startButton.style.transform = "translateY(0)";
    startButton.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)";
  });

  // Create info text
  const infoText = document.createElement("p");
  infoText.innerHTML = `
    <strong>What will happen:</strong><br>
    • Audio will start playing to keep this tab active<br>
    • This window will move to the background<br>
    • Auto-commenting will begin immediately<br>
    • You can continue using other applications
  `;
  infoText.style.cssText = `
    font-size: 16px !important;
    text-align: center !important;
    opacity: 0.8 !important;
    line-height: 1.6 !important;
    max-width: 500px !important;
    margin: 0 !important;
    color: white !important;
  `;

  // Button click handler
  startButton.addEventListener("click", async () => {
    console.log("🚀 Start button clicked! Beginning full flow...");
    hasUserInteracted = true;

    // Update button state
    startButton.textContent = "🔄 Starting...";
    startButton.style.background = "#28a745";
    startButton.style.color = "white";
    startButton.disabled = true;

    try {
      // Step 1: Start continuous audio
      console.log("🎵 Step 1: Starting continuous audio...");
      await tabAudio.start({
        frequencyHz: 10000,
        gain: 0.001,
        muted: true,
        loop: true,
      });

      // startButton.textContent = "🎵 Audio Started";

      // await wait(1000);
      startButton.textContent = "💬 Starting flow";
      //step 2: move back to the original tab

      // Get settings from storage and start commenting
      chrome.storage.local.get(
        [
          "scrollDuration",
          "commentDelay",
          "maxPosts",
          "duplicateWindow",
          "styleGuide",
          "apiKey",
          "commentAsCompanyEnabled",
          "timeFilterEnabled",
          "minPostAge",
        ],
        (result) => {
          // Use popup settings with fallbacks only if completely missing
          const scrollDuration =
            result.scrollDuration !== undefined ? result.scrollDuration : 10;
          const commentDelay =
            result.commentDelay !== undefined ? result.commentDelay : 5;
          const maxPosts = result.maxPosts !== undefined ? result.maxPosts : 5;
          const duplicateWindow =
            result.duplicateWindow !== undefined ? result.duplicateWindow : 24;
          const styleGuide =
            result.styleGuide !== undefined
              ? result.styleGuide
              : "Be engaging and professional";
          const apiKey = result.apiKey !== undefined ? result.apiKey : "";
          const commentAsCompanyEnabled =
            result.commentAsCompanyEnabled !== undefined
              ? result.commentAsCompanyEnabled
              : false;

          const timeFilterEnabled = result.timeFilterEnabled ?? false;
          const minPostAge = result.minPostAge ?? 1;

          backgroundLog("🎯 Starting commenting flow with settings:", {
            scrollDuration,
            commentDelay,
            maxPosts,
            styleGuide: styleGuide?.substring(0, 50) + "...",
            hasApiKey: !!apiKey,
            commentAsCompanyEnabled,
            timeFilterEnabled,
            minPostAge,
          });

          // API key check removed - using server-side tRPC API now

          if (!styleGuide) {
            backgroundError(
              "❌ No style guide found in storage! Cannot start commenting.",
            );
            return;
          }

          // Update button status for scrolling phase
          startButton.textContent = `📜 Scrolling to load posts (${scrollDuration}s) - DON'T navigate away!`;
          startButton.style.background = "#ff9500";
          startButton.style.fontSize = "18px";
          subtitle.textContent =
            "Loading posts from LinkedIn feed - please keep this tab visible";

          // Add dynamic status panel to the overlay
          const statusPanel = document.createElement("div");
          statusPanel.id = "linkedin-status-panel";
          statusPanel.style.cssText = `
          background: rgba(255, 255, 255, 0.15) !important;
          border-radius: 12px !important;
          padding: 20px !important;
          margin-top: 20px !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          font-family: monospace !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        `;

          const initialPosts = document.querySelectorAll(
            ".feed-shared-update-v2__control-menu-container",
          ).length;

          statusPanel.innerHTML = `
          <div style="color: white !important; margin-bottom: 12px !important;">
            <strong>📊 AUTOMATION SETTINGS</strong>
          </div>
          <div style="color: #e0e0e0 !important; margin-bottom: 8px !important;">
            📜 Scroll Duration: <span style="color: #90EE90 !important;">${scrollDuration} seconds</span>
          </div>
          <div style="color: #e0e0e0 !important; margin-bottom: 8px !important;">
            ⏱️ Comment Delay: <span style="color: #90EE90 !important;">${commentDelay} seconds</span>
          </div>
          <div style="color: #e0e0e0 !important; margin-bottom: 16px !important;">
            🎯 Max Posts: <span style="color: #90EE90 !important;">${maxPosts} posts</span>
          </div>
          
          <div style="color: white !important; margin-bottom: 12px !important;">
            <strong>📈 REAL-TIME STATUS</strong>
          </div>
          <div id="time-remaining" style="color: #FFD700 !important; margin-bottom: 8px !important;">
            ⏰ Time Remaining: <span style="color: #FFA500 !important;">${scrollDuration}s</span>
          </div>
          <div id="posts-loaded" style="color: #87CEEB !important; margin-bottom: 8px !important;">
            📝 Posts Loaded: <span style="color: #00BFFF !important;">${initialPosts} posts</span>
          </div>
          <div id="scroll-progress" style="color: #DDA0DD !important;">
            🔄 Status: <span style="color: #DA70D6 !important;">Starting scroll...</span>
          </div>
        `;

          // Add status panel to the container (after the info text)
          const container = overlay.querySelector("div");
          if (container) {
            container.appendChild(statusPanel);
          }

          // Start the commenting flow but decide if list mode should be used
          chrome.storage.local.get(
            [
              "finishListModeEnabled",
              "targetListEnabled",
              "selectedTargetList",
              "commentProfileName",
              "languageAwareEnabled",
              "skipCompanyPagesEnabled",
              "skipPromotedPostsEnabled",
              "skipFriendsActivitiesEnabled",
              "blacklistEnabled",
              "blacklistAuthors",
              "manualApproveEnabled",
              "authenticityBoostEnabled",
            ],
            async (cfg) => {
              const useListMode =
                !!cfg.finishListModeEnabled &&
                !!cfg.targetListEnabled &&
                !!(cfg.selectedTargetList || "").trim();
              const authenticityBoostEnabledCfg =
                !!cfg.authenticityBoostEnabled;
              if (useListMode) {
                try {
                  isCommentingActive = true;
                  // Update overlay text
                  startButton.textContent = `📋 List Mode: preparing authors...`;
                  subtitle.textContent =
                    "Loading author posts - please keep this tab visible";

                  const selectedListAuthors = await loadSelectedListAuthors();
                  const blacklistEnabledCfg = !!cfg.blacklistEnabled;
                  const blacklistListCfg = (
                    (cfg.blacklistAuthors as string) || ""
                  )
                    .split(",")
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean);
                  const skipCompanyPagesCfg = !!cfg.skipCompanyPagesEnabled;
                  const skipPromotedPostsCfg = !!cfg.skipPromotedPostsEnabled;
                  const skipFriendsActivitiesCfg =
                    !!cfg.skipFriendsActivitiesEnabled;
                  const languageAwareEnabledCfg = !!cfg.languageAwareEnabled;

                  {
                    await runListMode({
                      commentDelay,
                      duplicateWindow,
                      styleGuide,
                      commentProfileName:
                        (cfg.commentProfileName as string) || "",
                      commentAsCompanyEnabled,
                      languageAwareEnabled: languageAwareEnabledCfg,
                      timeFilterEnabled,
                      minPostAge,
                      blacklistEnabled: blacklistEnabledCfg,
                      blacklistList: blacklistListCfg,
                      skipCompanyPages: skipCompanyPagesCfg,
                      skipPromotedPosts: skipPromotedPostsCfg,
                      skipFriendsActivities: skipFriendsActivitiesCfg,
                      isCommentingActiveRef: () => isCommentingActive,
                      selectedListAuthors,
                      statusPanel,
                      manualApproveEnabled: !!cfg.manualApproveEnabled,
                      authenticityBoostEnabled: authenticityBoostEnabledCfg,
                    });
                  }

                  // Remove overlay once preloading started
                  if (overlay) overlay.remove();
                  // In Composer (manual approve) mode, keep audio active and do NOT signal completion here.
                  if (!cfg.manualApproveEnabled) {
                    tabAudio.stop();
                    if (isCommentingActive) {
                      chrome.runtime.sendMessage({
                        action: "commentingCompleted",
                      });
                    }
                  }
                } catch (e) {
                  console.error("[ListMode] Error:", e);
                  isCommentingActive = false;
                  tabAudio.stop();
                }
              } else {
                startNewCommentingFlowWithDelayedTabSwitch(
                  scrollDuration,
                  commentDelay,
                  maxPosts,
                  styleGuide,
                  duplicateWindow,
                  overlay,
                  startButton,
                  subtitle,
                  statusPanel,
                  commentAsCompanyEnabled,
                  timeFilterEnabled,
                  minPostAge,
                  !!cfg.manualApproveEnabled,
                  authenticityBoostEnabledCfg,
                );
              }
            },
          );
        },
      );

      // Don't remove overlay here - let the commenting flow handle it

      console.log("✅ Full flow started successfully!");
    } catch (error) {
      console.error("❌ Failed to start:", error);
      startButton.textContent = "❌ Failed - Try Again";
      startButton.style.background = "#dc3545";
      startButton.disabled = false;
      subtitle.textContent = "Something went wrong - click to try again";
    }
  });

  // Assemble UI
  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(startButton);
  container.appendChild(infoText);
  overlay.appendChild(container);

  // Add to page
  document.body.appendChild(overlay);

  console.log("🚀 Start button overlay displayed");
}

// (Audio logic moved to tab-audio.ts)

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.action === "showStartButton") {
    console.log("📱 Popup requested to show start button");
    showStartButton();
    sendResponse({ success: true });
  } else if (request.action === "startNewCommentingFlow") {
    chrome.storage.local.get(
      ["timeFilterEnabled", "minPostAge", "manualApproveEnabled"],
      (r) => {
        const timeFilterEnabled = r.timeFilterEnabled ?? false;
        const minPostAge = r.minPostAge ?? 1;
        const manualApproveEnabled = !!r.manualApproveEnabled;
        startNewCommentingFlowWithDelayedTabSwitch(
          request.scrollDuration,
          request.commentDelay,
          request.maxPosts,
          request.styleGuide,
          request.duplicateWindow || 24,
          null as any,
          null as any,
          null as any,
          null as any,
          false,
          timeFilterEnabled,
          minPostAge,
          manualApproveEnabled,
        );
      },
    );
    sendResponse({ success: true });
  } else if (request.action === "stopCommentingFlow") {
    console.log("Received stop signal - stopping commenting flow");
    isCommentingActive = false;
    try {
      cleanupManualApproveUI();
    } catch {}
    tabAudio.stop();
    sendResponse({ success: true });
  } else if (request.action === "statusUpdate" && request.error) {
    // Log error details to the website console for debugging
    console.group("🚨 EngageKit Error Details");
    console.error("Error Message:", request.error.message);
  }
});

// saveCommentedAuthorWithTimestamp, loadCommentedAuthorsWithTimestamps, hasCommentedOnAuthorRecently are imported from check-duplicate/check-duplicate-author-recency

// Function to load today's commented authors from local storage (for backward compatibility)
async function loadTodayCommentedAuthors(): Promise<Set<string>> {
  const today = new Date().toDateString();
  const storageKey = `commented_authors_${today}`;

  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      const todayAuthors = result[storageKey] || [];
      resolve(new Set(todayAuthors));
    });
  });
}

// Function to load counter values from storage
async function loadCounters(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      [
        "postsSkippedDuplicate",
        "recentAuthorsDetected",
        "postsSkippedAlreadyCommented",
        "duplicatePostsDetected",
      ],
      (result) => {
        postsSkippedDuplicateCount = result.postsSkippedDuplicate || 0;
        recentAuthorsDetectedCount = result.recentAuthorsDetected || 0;
        postsSkippedAlreadyCommentedCount =
          result.postsSkippedAlreadyCommented || 0;
        duplicatePostsDetectedCount = result.duplicatePostsDetected || 0;
        console.log(
          `Loaded counters - Posts skipped: ${postsSkippedDuplicateCount}, Recent authors: ${recentAuthorsDetectedCount}, Posts already commented: ${postsSkippedAlreadyCommentedCount}, Duplicate posts detected: ${duplicatePostsDetectedCount}`,
        );
        resolve();
      },
    );
  });
}

// Main function to start the new commenting flow with delayed tab switching
async function startNewCommentingFlowWithDelayedTabSwitch(
  scrollDuration: number,
  commentDelay: number,
  maxPosts: number,
  styleGuide: string,
  duplicateWindow: number,
  overlay: HTMLDivElement,
  startButton: HTMLButtonElement,
  subtitle: HTMLParagraphElement,
  statusPanel: HTMLDivElement,
  commentAsCompanyEnabled: boolean = false,
  timeFilterEnabled: boolean = false,
  minPostAge: number = 1,
  manualApproveEnabled: boolean = false,
  authenticityBoostEnabled: boolean = false,
) {
  // ➡️ Persist the current LinkedIn username path for later usage in popup
  saveCurrentUsernameUrl();

  isCommentingActive = true;
  console.log(`🚀 Starting new commenting flow with parameters:`);

  console.log(`   - scrollDuration: ${scrollDuration}`);
  console.log(`   - commentDelay: ${commentDelay}`);
  console.log(`   - maxPosts: ${maxPosts}`);
  console.log(`   - isCommentingActive: ${isCommentingActive}`);

  // // Start anti-throttling mechanisms to prevent tab throttling
  // keepTabActiveAudio();

  //starts the always active core
  // window.alwaysActive.enable();

  // Load commented authors with timestamps, post URNs, and counters from local storage
  commentedAuthorsWithTimestamps = await loadCommentedAuthorsWithTimestamps();
  await loadCommentedPostUrns();
  await loadCommentedPostHashes();
  await loadCounters();

  console.log("CHECKpoinn 1");

  // Retrieve desired company profile name (if any) and language flag from storage once per session
  const {
    commentProfileName,
    languageAwareEnabled,
    skipCompanyPagesEnabled,
    skipPromotedPostsEnabled,
    skipFriendsActivitiesEnabled,
  } = await new Promise<{
    commentProfileName: string;
    languageAwareEnabled: boolean;
    skipCompanyPagesEnabled: boolean;
    skipPromotedPostsEnabled: boolean;
    skipFriendsActivitiesEnabled: boolean;
    authenticityBoostEnabled: boolean;
  }>((resolve) => {
    chrome.storage.local.get(
      [
        "commentProfileName",
        "languageAwareEnabled",
        "skipCompanyPagesEnabled",
        "skipPromotedPostsEnabled",
        "skipFriendsActivitiesEnabled",
        "authenticityBoostEnabled",
      ],
      (r) => {
        resolve({
          commentProfileName: (r.commentProfileName as string) || "",
          languageAwareEnabled: r.languageAwareEnabled || false,
          skipCompanyPagesEnabled: r.skipCompanyPagesEnabled || false,
          skipPromotedPostsEnabled: r.skipPromotedPostsEnabled || false,
          skipFriendsActivitiesEnabled: r.skipFriendsActivitiesEnabled || false,
          authenticityBoostEnabled: r.authenticityBoostEnabled || false,
        });
      },
    );
  });
  console.log("CHECK POINT REACHED");
  const skipCompanyPages = skipCompanyPagesEnabled;
  const skipPromotedPosts = skipPromotedPostsEnabled;
  const skipFriendsActivities = skipFriendsActivitiesEnabled;
  console.log("CHECK POINT 2");
  // authenticityBoostEnabled already available from storage destructuring
  // Retrieve blacklist settings once per session
  const { blacklistEnabled: blacklistEnabled, blacklistAuthors } =
    await new Promise<{
      blacklistEnabled: boolean;
      blacklistAuthors: string;
    }>((resolve) => {
      chrome.storage.local.get(
        ["blacklistEnabled", "blacklistAuthors"],
        (r) => {
          resolve({
            blacklistEnabled: r.blacklistEnabled ?? false,
            blacklistAuthors: (r.blacklistAuthors as string) ?? "",
          });
        },
      );
    });

  const blacklistList = blacklistAuthors
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Clean up old timestamp entries and post URNs to prevent storage bloat
  await cleanupOldTimestampsAuthor();
  await cleanupOldPostUrns(commentedPostUrns);
  await cleanupOldPostHashes(commentedPostHashes);

  // For backward compatibility, also load today's authors
  commentedAuthors = await loadTodayCommentedAuthors();
  console.log(
    `Loaded ${commentedAuthorsWithTimestamps.size} authors with timestamps and ${commentedAuthors.size} authors for today`,
  );
  console.log(
    `Loaded counters - Posts skipped: ${postsSkippedDuplicateCount}, Recent authors: ${recentAuthorsDetectedCount}`,
  );

  try {
    console.log(`Starting new commenting flow with max ${maxPosts} posts...`);

    // Step 1: Scroll down for specified duration to load posts
    console.log(`📜 Step 1: Scrolling feed for ${scrollDuration} seconds...`);

    await scrollFeedLoadPosts(scrollDuration, isCommentingActive, statusPanel);

    console.log(
      "📜 Step 1.5: Scrolling completed, now moving back to original tab...",
    );

    if (!isCommentingActive) {
      console.log("❌ Commenting stopped during scroll phase");

      tabAudio.stop();
      return;
    }

    // Step 2: Scroll back to top
    console.log("📜 Step 2: Scrolling back to top...");

    window.scrollTo({ top: 0, behavior: "smooth" });
    await wait(1000);

    // Update overlay status after scrolling is complete (if overlay elements exist)
    if (overlay && startButton && subtitle) {
      startButton.textContent =
        "✅ Posts loaded! You can now move away from this tab";
      startButton.style.background = "#28a745";
      startButton.style.fontSize = "20px";
      subtitle.textContent =
        "All posts have been loaded. Switching to automation mode...";

      // Wait a moment to show the message, then remove overlay
      await wait(1000);
      overlay.remove();
    }

    if (!isCommentingActive) {
      console.log("❌ Commenting stopped during scroll to top");

      tabAudio.stop();
      return;
    }

    // Step 3: Either manual-approve prepare-only or full auto process
    console.log("📜 Step 3: Processing all posts on feed...");
    console.log(`   - maxPosts parameter: ${maxPosts}`);
    console.log(`   - commentDelay parameter: ${commentDelay}`);
    console.log(
      `   - isCommentingActive before processing: ${isCommentingActive}`,
    );

    if (manualApproveEnabled) {
      await runManualApproveStandard({
        maxPosts,
        timeFilterEnabled,
        minPostAge,
        skipCompanyPages,
        skipPromotedPosts,
        skipFriendsActivities,
        blacklistEnabled,
        blacklistList,
        styleGuide,
        duplicateWindow,
        authenticityBoostEnabled,
      });
      // In manual approve, keep audio playing for the tab (do not stop here)
      return;
    } else {
      await processAllPostsFeed(
        commentDelay,
        maxPosts,
        duplicateWindow,
        styleGuide,
        commentProfileName,
        commentAsCompanyEnabled,
        languageAwareEnabled,
        timeFilterEnabled,
        minPostAge,
        blacklistEnabled,
        blacklistList,
        skipCompanyPages,
        skipPromotedPosts,
        skipFriendsActivities,
        authenticityBoostEnabled,
      );
    }

    console.log(`📜 Step 3 completed. Final state:`);
    console.log(`   - isCommentingActive: ${isCommentingActive}`);

    // Stop anti-throttling mechanisms
    tabAudio.stop();

    // Only notify completion if we weren't stopped
    if (isCommentingActive) {
      console.log("🏁 Sending completion message to background script...");

      chrome.runtime.sendMessage({
        action: "commentingCompleted",
      });
    } else {
      console.log(
        "🛑 Not sending completion message because commenting was stopped",
      );
    }
  } catch (error) {
    console.error("💥 Error in new commenting flow:", error);

    isCommentingActive = false;
    tabAudio.stop();
  }
}

// Function to process all posts on the feed
async function processAllPostsFeed(
  commentDelay: number,
  maxPosts: number,
  duplicateWindow: number,
  styleGuide: string,
  commentProfileName: string,
  commentAsCompanyEnabled: boolean,
  languageAwareEnabled: boolean,
  timeFilterEnabled: boolean,
  minPostAge: number,
  blacklistEnabled: boolean,
  blacklistList: string[],
  skipCompanyPages: boolean,
  skipPromotedPosts: boolean,
  skipFriendsActivities: boolean,
  authenticityBoostEnabled: boolean,
): Promise<void> {
  console.group("🎯 PROCESSING ALL POSTS - DETAILED DEBUG");

  console.log(
    `🎯 Starting to process posts on feed (max ${maxPosts} posts)...`,
  );

  // Prefer div[data-urn] (search/list feed), fallback to div[data-id] (home feed)
  let postContainers = document.querySelectorAll("div[data-urn]");
  if (postContainers.length > 0) {
    console.log(
      `🎯 Found ${postContainers.length} post containers with selector: div[data-urn]`,
    );
  } else {
    postContainers = document.querySelectorAll("div[data-id]");
    console.log(
      `🎯 Found ${postContainers.length} post containers with selector: div[data-id]`,
    );
  }

  // Let's also try alternative selectors to see what we find
  const altSelector1 = document.querySelectorAll(".feed-shared-update-v2");
  const altSelector2 = document.querySelectorAll(
    '[data-urn*="urn:li:activity"]',
  );
  const altSelector3 = document.querySelectorAll(
    ".feed-shared-update-v2__content",
  );

  if (postContainers.length === 0) {
    console.error(
      "🚨 NO POSTS FOUND! This is why the automation stops immediately.",
    );
    console.error(
      "🚨 The page might not be fully loaded or the selector is wrong.",
    );

    console.groupEnd();

    return;
  }

  let commentCount = 0;
  console.log(
    `🎯 Starting loop: commentCount=${commentCount}, maxPosts=${maxPosts}, isActive=${isCommentingActive}`,
  );
  backgroundLog(
    `🎯 Starting loop: commentCount=${commentCount}, maxPosts=${maxPosts}, isActive=${isCommentingActive}`,
  );

  for (
    let i = 0;
    i < postContainers.length && isCommentingActive && commentCount < maxPosts;
    i++
  ) {
    console.group(
      `🔄 POST ${i + 1}/${postContainers.length} - DETAILED PROCESSING`,
    );
    console.log(`🔄 Loop iteration ${i + 1}:`);
    console.log(`   - commentCount: ${commentCount}/${maxPosts}`);
    console.log(`   - isCommentingActive: ${isCommentingActive}`);
    console.log(
      `   - Loop condition: i(${i}) < postContainers.length(${
        postContainers.length
      }) = ${i < postContainers.length}`,
    );
    console.log(
      `   - Active condition: isCommentingActive = ${isCommentingActive}`,
    );
    console.log(
      `   - Count condition: commentCount(${commentCount}) < maxPosts(${maxPosts}) = ${
        commentCount < maxPosts
      }`,
    );
    console.log(
      `   - Overall loop should continue: ${
        i < postContainers.length &&
        isCommentingActive &&
        commentCount < maxPosts
      }`,
    );

    // Check if we should stop at the beginning of each iteration
    if (!isCommentingActive) {
      console.log("❌ STOPPING: isCommentingActive became false");
      console.groupEnd();
      break;
    }

    const postContainer = postContainers[i] as HTMLElement;

    // STEP 0.1: Friend activity skip check
    if (skipFriendsActivities && checkFriendsActivity(postContainer)) {
      console.log("⏭️ SKIPPING friend activity post");
      continue;
    }

    // Check company page skip
    if (skipCompanyPages) {
      const bioText = extractBioAuthor(postContainer) ?? "";
      const companyRegex = /^\d[\d\s,.]*followers$/i;
      if (companyRegex.test(bioText.trim())) {
        console.log(
          "🚫 Skipping company page post based on bio text:",
          bioText,
        );
        continue;
      }
    }

    // STEP 0: Promoted & Time filter check
    const { ageHours, isPromoted } = extractPostTimePromoteState(postContainer);

    if (skipPromotedPosts && isPromoted) {
      console.log("⏭️ SKIPPING promoted post");
      continue;
    }

    if (timeFilterEnabled && (ageHours === null || ageHours > minPostAge)) {
      console.log(
        `⏭️ SKIPPING post ${i + 1} due to age (${ageHours ?? "unknown"}h) > limit ${minPostAge}h`,
      );
      console.groupEnd();
      continue;
    }

    try {
      console.log(
        `🔍 Processing post ${i + 1}/${
          postContainers.length
        } (commented: ${commentCount}/${maxPosts})`,
      );

      // Scroll to the post
      postContainer.scrollIntoView({ behavior: "smooth", block: "center" });
      await wait(500);

      // Check again after scroll
      if (!isCommentingActive) {
        console.log(
          "❌ STOPPING: isCommentingActive became false after scroll",
        );
        console.groupEnd();
        break;
      }

      // STEP 1: Check for post URN duplicates (if we've already commented on this specific post)
      const postUrns = extractPostUrns(postContainer);
      if (postUrns.length === 0) {
        console.log(`⏭️ SKIPPING post ${i + 1} - could not extract post URNs`);
        console.groupEnd();
        continue;
      }

      // Check if we've commented on any of these URNs before
      let hasCommentedOnThisPost = false;
      for (const urn of postUrns) {
        if (hasCommentedOnPostUrn(urn)) {
          console.log(
            `⏭️ SKIPPING post ${i + 1} - already commented on post URN: ${urn}`,
          );
          hasCommentedOnThisPost = true;
          break;
        }
      }

      if (hasCommentedOnThisPost) {
        console.groupEnd();
        continue;
      }

      // STEP 2: Extract author info
      const authorInfo = extractAuthorInfo(postContainer);
      if (!authorInfo) {
        console.log(
          `⏭️ SKIPPING post ${i + 1} - could not extract author info`,
        );
        console.groupEnd();
        continue;
      }

      // Blacklist author check
      if (
        blacklistEnabled &&
        blacklistList.some((blacklistedName) =>
          authorInfo.name.trim().toLowerCase().includes(blacklistedName),
        )
      ) {
        console.log(
          `⏭️ SKIPPING post ${i + 1} - author ${authorInfo.name} is blacklisted`,
        );
        console.groupEnd();
        continue;
      }

      // STEP 3: Check for author duplicate (within time window)
      // Skip posts from authors we've recently commented on inside the configured duplicateWindow
      try {
        const fallbackAuthorName =
          "No author name available, please do not refer to author when making comment";
        const authorName = (authorInfo.name || "").trim();
        if (
          authorName &&
          authorName !== fallbackAuthorName &&
          hasCommentedOnAuthorRecently(
            authorName,
            commentedAuthorsWithTimestamps,
            duplicateWindow,
          )
        ) {
          console.log(
            `⏭️ SKIPPING post ${i + 1} - author ${authorName} recently commented within ${duplicateWindow}h`,
          );
          console.groupEnd();
          continue;
        }
      } catch (e) {
        console.warn("Author recency check failed:", e);
      }

      // Extract post content
      const postContent = extractPostContent(postContainer);
      if (!postContent) {
        console.log(
          `⏭️ SKIPPING post ${i + 1} - could not extract post content`,
        );
        console.groupEnd();
        continue;
      }

      // Hash-based duplicate detection (content-level)
      const hashRes = await normalizeAndHashContent(postContent);
      if (hashRes?.hash && hasCommentedOnPostHash(hashRes.hash)) {
        console.log(
          `⏭️ SKIPPING post ${i + 1} - duplicate content detected via hash ${hashRes.hash.slice(0, 12)}...`,
        );
        console.groupEnd();
        continue;
      }

      const postAuthorContent = authorInfo.name + postContent;

      console.log(
        `📝 Post content preview: ${postContent.substring(0, 100)}...`,
      );

      // Check again before generating comment
      if (!isCommentingActive) {
        console.log(
          "❌ STOPPING: isCommentingActive became false before comment generation",
        );
        console.groupEnd();
        break;
      }

      // Build style guide (add pronoun rule when company mode enabled)
      var effectiveStyleGuide = styleGuide;

      if (commentAsCompanyEnabled) {
        effectiveStyleGuide = `${COMPANY_PRONOUN_RULE}\n\n${effectiveStyleGuide}\n\n${COMPANY_PRONOUN_RULE}`;
      }

      if (languageAwareEnabled) {
        effectiveStyleGuide = `${LANGUAGE_AWARE_RULE}\n\n${effectiveStyleGuide}`;
      }

      // Generate comment using direct tRPC call
      console.log(`🤖 Generating comment for post ${i + 1}...`);
      let adjacentComments: any = "No existing comments";
      if (authenticityBoostEnabled) {
        try {
          const extracted = await loadAndExtractComments(postContainer);
          adjacentComments = extracted
            .slice()
            .sort(
              (a, b) =>
                b.likeCount + b.replyCount - (a.likeCount + a.replyCount),
            )
            .slice(0, 5)
            .map(({ commentContent, likeCount, replyCount }) => ({
              commentContent,
              likeCount,
              replyCount,
            }));
        } catch {}
      }

      const comment = await generateComment(
        postAuthorContent,
        effectiveStyleGuide,
        adjacentComments,
      );
      console.log(
        `🤖 Comment generation result for post ${i + 1}:`,
        comment ? "SUCCESS" : "FAILED",
      );

      if (!comment) {
        console.log(`❌ SKIPPING post ${i + 1} - could not generate comment`);
        console.groupEnd();
        continue;
      }

      console.log(
        `✅ Generated comment for post ${i + 1}:`,
        comment.substring(0, 50) + "...",
      );

      // Check again before posting comment
      if (!isCommentingActive) {
        console.log(
          "❌ STOPPING: isCommentingActive became false before posting comment",
        );
        console.groupEnd();
        break;
      }

      // Post the comment
      console.log(
        `📝 Attempting to post comment on post ${i + 1} by ${
          authorInfo.name
        }...`,
      );
      const profileNameToUse = commentAsCompanyEnabled
        ? commentProfileName
        : "";
      const success = await postCommentOnPost(
        postContainer,
        comment,
        isCommentingActive,
        profileNameToUse,
      );
      console.log(
        `📝 Comment posting result for post ${i + 1}: ${
          success ? "SUCCESS" : "FAILED"
        }`,
      );

      if (success) {
        commentCount++;
        commentedAuthors.add(authorInfo.name);

        // Save author with timestamp and update counts
        await saveCommentedAuthorWithTimestamp(authorInfo.name); // new timestamp-based storage
        commentedAuthorsWithTimestamps.set(authorInfo.name, Date.now()); // update in-memory data

        // Save all post URNs to prevent commenting on this post again
        for (const urn of postUrns) {
          await saveCommentedPostUrn(urn);
        }

        // Save content hash as well
        if (hashRes?.hash) {
          await saveCommentedPostHash(hashRes.hash);
        }

        await updateCommentCounts();

        console.log(
          `🎉 Successfully posted comment ${commentCount}/${maxPosts} on post by ${authorInfo.name}`,
        );

        console.log(
          `Remaining posts to process: ${postContainers.length - i - 1}`,
        );
        console.log(
          `Should continue? commentCount(${commentCount}) < maxPosts(${maxPosts}) = ${
            commentCount < maxPosts
          }`,
        );
        console.log(
          `Next iteration will be: ${i + 1} < ${postContainers.length} = ${
            i + 1 < postContainers.length
          }`,
        );
        console.groupEnd();

        // Update background script with progress
        chrome.runtime.sendMessage({
          action: "updateCommentCount",
          count: commentCount,
          status: `Posted comment ${commentCount}/${maxPosts} on post by ${authorInfo.name}`,
        });

        // Check if we've reached the max posts limit
        if (commentCount >= maxPosts) {
          console.log(
            `✅ REACHED MAX POSTS LIMIT: commentCount(${commentCount}) >= maxPosts(${maxPosts}). Stopping...`,
          );

          console.groupEnd();
          break;
        }

        // Wait between comments with stop checking
        if (i < postContainers.length - 1 && commentCount < maxPosts) {
          console.log(
            `⏳ Waiting ${commentDelay} seconds before next comment...`,
          );
          console.log(
            `⏳ Delay conditions: i(${i}) < postContainers.length-1(${
              postContainers.length - 1
            }) = ${i < postContainers.length - 1}`,
          );
          console.log(
            `⏳ Delay conditions: commentCount(${commentCount}) < maxPosts(${maxPosts}) = ${
              commentCount < maxPosts
            }`,
          );

          // Break the delay into smaller chunks to check for stop signal
          const delayChunks = Math.ceil(commentDelay);
          for (
            let chunk = 0;
            chunk < delayChunks && isCommentingActive;
            chunk++
          ) {
            await wait(1000);
            if (!isCommentingActive) {
              console.log(
                "❌ STOPPING during comment delay due to stop signal",
              );
              console.groupEnd();
              break;
            }
          }

          if (!isCommentingActive) {
            console.groupEnd();
            break;
          }

          console.log(`✅ Delay completed, continuing to next post...`);
        } else {
          console.log(
            `🔚 No delay needed - this was the last post or we've reached max comments`,
          );
          console.log(
            `   - i(${i}) < postContainers.length-1(${
              postContainers.length - 1
            }): ${i < postContainers.length - 1}`,
          );
          console.log(
            `   - commentCount(${commentCount}) < maxPosts(${maxPosts}): ${
              commentCount < maxPosts
            }`,
          );
        }
      } else {
        console.log(
          `❌ Failed to post comment on post ${i + 1} by ${authorInfo.name}`,
        );
      }

      console.groupEnd();
    } catch (error) {
      console.error(`💥 Error processing post ${i + 1}:`, error);
      console.groupEnd();
    }

    // Debug the next iteration conditions
    console.log(`🔄 End of iteration ${i + 1}. Next iteration check:`);
    console.log(`   - Next i will be: ${i + 1}`);
    console.log(`   - postContainers.length: ${postContainers.length}`);
    console.log(`   - isCommentingActive: ${isCommentingActive}`);
    console.log(`   - commentCount: ${commentCount}`);
    console.log(`   - maxPosts: ${maxPosts}`);
    console.log(
      `   - Loop will continue: ${
        i + 1 < postContainers.length &&
        isCommentingActive &&
        commentCount < maxPosts
      }`,
    );
  }

  console.log(`🏁 LOOP COMPLETED. Final stats:`);
  console.log(`   - Posted ${commentCount}/${maxPosts} comments total`);
  console.log(`   - Final isCommentingActive: ${isCommentingActive}`);
  console.log(`   - Processed ${postContainers.length} total posts`);
  console.log(`   - Loop exit reason analysis:`);
  console.log(`     - Reached max posts? ${commentCount >= maxPosts}`);
  console.log(`     - Lost active status? ${!isCommentingActive}`);
  console.log(`     - Ran out of posts? ${postContainers.length === 0}`);

  console.groupEnd();
}

// (Audio stop moved to tab-audio.ts)

console.log("EngageKit content script loaded");
