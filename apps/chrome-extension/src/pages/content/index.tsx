import wait from "@src/utils/wait";

import {
  backgroundError,
  backgroundGroup,
  backgroundGroupEnd,
  backgroundLog,
  backgroundWarn,
} from "./background-log";
import cleanupOldPostUrns from "./clean-old-post-urns";
import cleanupOldTimestampsAuthor from "./clean-old-timestamp-author";
import extractAuthorInfo from "./extract-author-info";
import extractPostContent from "./extract-post-content";
import extractPostUrns from "./extract-post-urns";
import generateComment from "./generate-comment";
import postCommentOnPost from "./post-comment-on-post";
import scrollFeedLoadPosts from "./scroll-feed-load-post";
import switchCommentProfile from "./switch-comment-profile";
import updateCommentCounts from "./update-comment-counts";

// Content script for EngageKit - Background Window Mode
// This script processes posts directly on the feed page

let isCommentingActive = false;
let commentedAuthors = new Set<string>();
let commentedAuthorsWithTimestamps = new Map<string, number>();
let postsSkippedDuplicateCount = 0;
let recentAuthorsDetectedCount = 0;
let commentedPostUrns = new Map<string, number>(); // URN -> timestamp
let postsSkippedAlreadyCommentedCount = 0;
let duplicatePostsDetectedCount = 0;
let postsSkippedTimeFilterCount = 0;
let audioContext: AudioContext | null = null;
let currentOscillator: OscillatorNode | null = null;
let audioElement: HTMLAudioElement | null = null;

// Check if we need to show the start button
let hasUserInteracted = false;

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
      await injectAndPlayContinuousSound();

      startButton.textContent = "🎵 Audio Started";

      await wait(1000);
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
        ],
        (result) => {
          backgroundLog("Content: Retrieved settings from storage:", result);

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

          backgroundLog("🎯 Starting commenting flow with settings:", {
            scrollDuration,
            commentDelay,
            maxPosts,
            styleGuide: styleGuide?.substring(0, 50) + "...",
            hasApiKey: !!apiKey,
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

          // Start the commenting flow but delay tab switching until after scrolling
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

// --- Main function to create and play the continuous audio ---
async function injectAndPlayContinuousSound(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log("🎵 Initializing Web Audio API for continuous sound...");

      // Get the AudioContext constructor, working across browsers
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;

      // Check if Web Audio API is supported
      if (!AudioContext) {
        throw new Error(
          "Web Audio API is not supported in this browser. Cannot play audio.",
        );
      }

      // Create an AudioContext instance
      // This is the gateway to using the Web Audio API
      audioContext = new AudioContext();

      // --- Sound Generation Setup ---

      // Create an OscillatorNode: This will generate the actual sound wave
      const oscillator = audioContext.createOscillator();

      // Create a GainNode: This will control the volume of the sound
      const gainNode = audioContext.createGain();

      // Create a MediaStreamDestinationNode: This allows us to take the audio
      // generated by the Web Audio API and use it as a source for an HTML <audio> element.
      const mediaStreamDestination =
        audioContext.createMediaStreamDestination();

      // Connect the nodes: Oscillator -> GainNode -> MediaStreamDestination
      // The sound flows from the oscillator, through the volume control (gain),
      // and then to the stream destination.
      oscillator.connect(gainNode);
      gainNode.connect(mediaStreamDestination);

      // --- Configure the Sound ---

      // Set the type of wave for the oscillator
      // 'sine': a pure, smooth tone
      // Other options: 'square', 'sawtooth', 'triangle'
      oscillator.type = "sine";

      // Set the frequency (pitch) of the sound in Hertz (Hz)
      // Let's pick a random frequency in a generally pleasant mid-range (e.g., between C4 and C5)
      // C4 is approx 261.63 Hz, C5 is approx 523.25 Hz
      const minFreq = 261.63;
      const maxFreq = 523.25;
      // const frequency = Math.random() * (maxFreq - minFreq) + minFreq;
      const frequency = 10000;

      //picking an inaudible frequency almost zero volume
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      // Set the volume using the GainNode
      // 0.0 is silent, 1.0 is full volume. Let's set it low to be less intrusive.
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime); // 10% volume

      // --- HTML <audio> Element Setup ---

      // Create a new HTML <audio> element
      audioElement = document.createElement("audio");

      // Set the source of the audio element to the stream from our Web Audio API setup
      audioElement.srcObject = mediaStreamDestination.stream;

      // Set the audio to autoplay
      // IMPORTANT: Browsers have autoplay restrictions. This might not work without user interaction.
      audioElement.autoplay = true;

      // Set the audio to loop continuously
      audioElement.loop = true;

      // Hide the default audio controls for background audio
      audioElement.controls = false;

      // Hide the audio element
      audioElement.style.cssText = "position: fixed; top: -9999px; opacity: 0;";

      // --- Inject into DOM and Start ---

      // Append the new audio element to the body of the document
      // This makes it part of the webpage
      document.body.appendChild(audioElement);

      // Resume AudioContext if needed (for user gesture compliance)
      const startAudioPlayback = async () => {
        if (audioContext!.state === "suspended") {
          await audioContext!.resume();
        }

        // Start the oscillator to begin generating sound
        // This needs to happen for any sound to be produced
        oscillator.start();
        currentOscillator = oscillator;

        // Attempt to play the HTML audio element
        // This is often needed due to autoplay policies, especially if audioCtx was not started by user gesture.
        const playPromise = audioElement!.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Autoplay started successfully.
              console.log(
                `✅ Playing a ${oscillator.type} wave at ${frequency.toFixed(
                  2,
                )} Hz. Audio element injected and playing.`,
              );
              resolve();
            })
            .catch((error) => {
              // Autoplay was prevented.
              console.warn("❌ Autoplay was prevented by the browser:", error);
              reject(error);
            });
        } else {
          console.log(`✅ Audio started successfully (no promise returned)`);
          resolve();
        }
      };

      startAudioPlayback();
    } catch (error) {
      console.error("❌ Audio setup failed:", error);
      reject(error);
    }
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.action === "showStartButton") {
    console.log("📱 Popup requested to show start button");
    showStartButton();
    sendResponse({ success: true });
  } else if (request.action === "startNewCommentingFlow") {
    startNewCommentingFlowWithDelayedTabSwitch(
      request.scrollDuration,
      request.commentDelay,
      request.maxPosts,
      request.styleGuide,
      request.duplicateWindow || 24, // default to 24 hours if not provided
      null as any, // overlay not available from this path
      null as any, // startButton not available from this path
      null as any, // subtitle not available from this path
      null as any, // statusPanel not available from this path
    );
    sendResponse({ success: true });
  } else if (request.action === "stopCommentingFlow") {
    console.log("Received stop signal - stopping commenting flow");
    isCommentingActive = false;
    stopTabActiveAudio();
    sendResponse({ success: true });
  } else if (request.action === "statusUpdate" && request.error) {
    // Log error details to the website console for debugging
    console.group("🚨 EngageKit Error Details");
    console.error("Error Message:", request.error.message);
  }
});

// Function to load commented authors with timestamps from local storage
async function loadCommentedAuthorsWithTimestamps(): Promise<
  Map<string, number>
> {
  const storageKey = "commented_authors_timestamps";

  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      const authorTimestamps = result[storageKey] || {};
      resolve(
        new Map(
          Object.entries(authorTimestamps).map(([name, timestamp]) => [
            name,
            Number(timestamp),
          ]),
        ),
      );
    });
  });
}

// Function to save commented author with timestamp to local storage
async function saveCommentedAuthorWithTimestamp(
  authorName: string,
): Promise<void> {
  const storageKey = "commented_authors_timestamps";
  const now = Date.now();

  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      const authorTimestamps = result[storageKey] || {};
      authorTimestamps[authorName] = now;
      chrome.storage.local.set({ [storageKey]: authorTimestamps }, () => {
        console.log(
          `Saved commented author: ${authorName} at timestamp: ${now}`,
        );
        resolve();
      });
    });
  });
}

// Function to check if author was commented on within the specified time window
function hasCommentedOnAuthorRecently(
  authorName: string,
  commentedAuthors: Map<string, number>,
  hoursWindow: number,
): boolean {
  const timestamp = commentedAuthors.get(authorName);
  if (!timestamp) return false;

  const now = Date.now();
  const hoursInMs = hoursWindow * 60 * 60 * 1000;

  return now - timestamp < hoursInMs;
}

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

// Function to update skipped post counter
async function updateSkippedPostCounter(): Promise<void> {
  postsSkippedDuplicateCount++;
  recentAuthorsDetectedCount++; // For now both counters increment together
  duplicatePostsDetectedCount++; // For now, both author filter skips and post URN skips increment this

  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        postsSkippedDuplicate: postsSkippedDuplicateCount,
        recentAuthorsDetected: recentAuthorsDetectedCount,
        duplicatePostsDetected: duplicatePostsDetectedCount,
      },
      () => {
        console.log(
          `Updated counters - Posts skipped: ${postsSkippedDuplicateCount}, Recent authors: ${recentAuthorsDetectedCount}, Duplicate posts detected: ${duplicatePostsDetectedCount}`,
        );

        // Send real-time update to popup
        chrome.runtime.sendMessage({
          action: "realTimeCountUpdate",
          skippedCount: postsSkippedDuplicateCount,
          recentAuthorsCount: recentAuthorsDetectedCount,
          duplicatePostsDetectedCount: duplicatePostsDetectedCount,
        });

        resolve();
      },
    );
  });
}

// Function to load commented post URNs from storage
async function loadCommentedPostUrns(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["commented_post_urns"], (result) => {
      const storedUrns = result.commented_post_urns || {};
      commentedPostUrns = new Map(
        Object.entries(storedUrns).map(([urn, timestamp]) => [
          urn,
          Number(timestamp),
        ]),
      );
      console.log(
        `Loaded ${commentedPostUrns.size} commented post URNs from storage`,
      );
      resolve();
    });
  });
}

// Function to save a commented post URN with timestamp
async function saveCommentedPostUrn(urn: string): Promise<void> {
  const timestamp = Date.now();
  commentedPostUrns.set(urn, timestamp);

  return new Promise((resolve) => {
    const urnsObject = Object.fromEntries(commentedPostUrns);
    chrome.storage.local.set({ commented_post_urns: urnsObject }, () => {
      console.log(
        `Saved commented post URN: ${urn} at timestamp: ${timestamp}`,
      );
      resolve();
    });
  });
}

// Function to check if we've already commented on a post URN
function hasCommentedOnPostUrn(urn: string): boolean {
  return commentedPostUrns.has(urn);
}

// Function to update the post already commented counter
async function updatePostAlreadyCommentedCounter(): Promise<void> {
  postsSkippedAlreadyCommentedCount++;
  duplicatePostsDetectedCount++; // For now, both counters increment together

  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        postsSkippedAlreadyCommented: postsSkippedAlreadyCommentedCount,
        duplicatePostsDetected: duplicatePostsDetectedCount,
      },
      () => {
        console.log(
          `Updated post already commented counter: ${postsSkippedAlreadyCommentedCount}`,
        );
        console.log(
          `Updated duplicate posts detected counter: ${duplicatePostsDetectedCount}`,
        );

        // Send real-time update to popup
        chrome.runtime.sendMessage({
          action: "realTimeCountUpdate",
          postsSkippedAlreadyCommentedCount: postsSkippedAlreadyCommentedCount,
          duplicatePostsDetectedCount: duplicatePostsDetectedCount,
        });

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
) {
  isCommentingActive = true;
  console.log(`🚀 Starting new commenting flow with parameters:`);
  backgroundLog(`🚀 Starting new commenting flow with parameters:`);
  console.log(`   - scrollDuration: ${scrollDuration}`);
  console.log(`   - commentDelay: ${commentDelay}`);
  console.log(`   - maxPosts: ${maxPosts}`);
  console.log(`   - isCommentingActive: ${isCommentingActive}`);
  backgroundLog(
    `   - scrollDuration: ${scrollDuration}, commentDelay: ${commentDelay}, maxPosts: ${maxPosts}, isCommentingActive: ${isCommentingActive}`,
  );

  backgroundLog("🎭 Applied LinkedIn background tab bypass techniques");

  // // Start anti-throttling mechanisms to prevent tab throttling
  // keepTabActiveAudio();

  //starts the always active core
  // window.alwaysActive.enable();

  // Load commented authors with timestamps, post URNs, and counters from local storage
  commentedAuthorsWithTimestamps = await loadCommentedAuthorsWithTimestamps();
  await loadCommentedPostUrns();
  await loadCounters();

  // Retrieve desired company profile name (if any) from storage once per session
  const commentProfileName: string = await new Promise((resolve) => {
    chrome.storage.local.get(["commentProfileName"], (r) => {
      resolve((r.commentProfileName as string) || "");
    });
  });

  // Clean up old timestamp entries and post URNs to prevent storage bloat
  await cleanupOldTimestampsAuthor();
  await cleanupOldPostUrns(commentedPostUrns);

  // For backward compatibility, also load today's authors
  commentedAuthors = await loadTodayCommentedAuthors();
  console.log(
    `Loaded ${commentedAuthorsWithTimestamps.size} authors with timestamps and ${commentedAuthors.size} authors for today`,
  );
  console.log(
    `Loaded counters - Posts skipped: ${postsSkippedDuplicateCount}, Recent authors: ${recentAuthorsDetectedCount}`,
  );
  backgroundLog(
    `Loaded ${commentedAuthorsWithTimestamps.size} authors with timestamps and ${commentedAuthors.size} authors for today`,
  );
  backgroundLog(
    `Loaded counters - Posts skipped: ${postsSkippedDuplicateCount}, Recent authors: ${recentAuthorsDetectedCount}`,
  );

  try {
    console.log(`Starting new commenting flow with max ${maxPosts} posts...`);
    backgroundLog(`Starting new commenting flow with max ${maxPosts} posts...`);

    // Step 1: Scroll down for specified duration to load posts
    console.log(`📜 Step 1: Scrolling feed for ${scrollDuration} seconds...`);
    backgroundLog(`📜 Step 1: Scrolling feed for ${scrollDuration} seconds...`);
    await scrollFeedLoadPosts(scrollDuration, isCommentingActive, statusPanel);

    // IMPORTANT: Only move to original tab AFTER scrolling is completely finished
    console.log(
      "📜 Step 1.5: Scrolling completed, now moving back to original tab...",
    );
    backgroundLog(
      "📜 Step 1.5: Scrolling completed, now moving back to original tab...",
    );
    chrome.runtime.sendMessage({
      action: "moveToOriginalTab",
    });

    // Wait a moment for tab switch to complete
    await wait(2000);

    if (!isCommentingActive) {
      console.log("❌ Commenting stopped during scroll phase");
      backgroundLog("❌ Commenting stopped during scroll phase");
      stopTabActiveAudio();
      return;
    }

    // Step 2: Scroll back to top
    console.log("📜 Step 2: Scrolling back to top...");
    backgroundLog("📜 Step 2: Scrolling back to top...");
    window.scrollTo({ top: 0, behavior: "smooth" });
    await wait(2000);

    // Update overlay status after scrolling is complete (if overlay elements exist)
    if (overlay && startButton && subtitle) {
      startButton.textContent =
        "✅ Posts loaded! You can now move away from this tab";
      startButton.style.background = "#28a745";
      startButton.style.fontSize = "20px";
      subtitle.textContent =
        "All posts have been loaded. Switching to automation mode...";

      // Wait a moment to show the message, then remove overlay
      await wait(3000);
      overlay.remove();
      backgroundLog("📜 🎭 Overlay removed after successful post loading");
    }

    if (!isCommentingActive) {
      console.log("❌ Commenting stopped during scroll to top");
      backgroundLog("❌ Commenting stopped during scroll to top");
      stopTabActiveAudio();
      return;
    }

    // Step 3: Find all posts and process them
    console.log("📜 Step 3: Processing all posts on feed...");
    console.log(`   - maxPosts parameter: ${maxPosts}`);
    console.log(`   - commentDelay parameter: ${commentDelay}`);
    console.log(
      `   - isCommentingActive before processing: ${isCommentingActive}`,
    );
    backgroundLog(
      `📜 Step 3: Processing all posts on feed... maxPosts: ${maxPosts}, commentDelay: ${commentDelay}, isCommentingActive: ${isCommentingActive}`,
    );

    await processAllPostsFeed(
      commentDelay,
      maxPosts,
      duplicateWindow,
      styleGuide,
      commentProfileName,
    );

    console.log(`📜 Step 3 completed. Final state:`);
    console.log(`   - isCommentingActive: ${isCommentingActive}`);
    backgroundLog(
      `📜 Step 3 completed. Final isCommentingActive: ${isCommentingActive}`,
    );

    // Stop anti-throttling mechanisms
    stopTabActiveAudio();

    // Only notify completion if we weren't stopped
    if (isCommentingActive) {
      console.log("🏁 Sending completion message to background script...");
      backgroundLog("🏁 Sending completion message to background script...");
      chrome.runtime.sendMessage({
        action: "commentingCompleted",
      });
    } else {
      console.log(
        "🛑 Not sending completion message because commenting was stopped",
      );
      backgroundLog(
        "🛑 Not sending completion message because commenting was stopped",
      );
    }
  } catch (error) {
    console.error("💥 Error in new commenting flow:", error);
    backgroundError("💥 Error in new commenting flow:", error);
    isCommentingActive = false;
    stopTabActiveAudio();
  }
}

// Function to process all posts on the feed
async function processAllPostsFeed(
  commentDelay: number,
  maxPosts: number,
  duplicateWindow: number,
  styleGuide: string,
  commentProfileName: string,
): Promise<void> {
  console.group("🎯 PROCESSING ALL POSTS - DETAILED DEBUG");
  backgroundGroup("🎯 PROCESSING ALL POSTS - DETAILED DEBUG");
  console.log(
    `🎯 Starting to process posts on feed (max ${maxPosts} posts)...`,
  );
  backgroundLog(
    `🎯 Starting to process posts on feed (max ${maxPosts} posts)...`,
  );

  // Find all post containers using the top-level div[data-id] structure
  const postContainers = document.querySelectorAll("div[data-id]");
  console.log(
    `🎯 Found ${postContainers.length} post containers with selector: div[data-id]`,
  );
  backgroundLog(
    `🎯 Found ${postContainers.length} post containers with selector: div[data-id]`,
  );

  // Let's also try alternative selectors to see what we find
  const altSelector1 = document.querySelectorAll(".feed-shared-update-v2");
  const altSelector2 = document.querySelectorAll(
    '[data-urn*="urn:li:activity"]',
  );
  const altSelector3 = document.querySelectorAll(
    ".feed-shared-update-v2__content",
  );

  console.log(`🎯 Alternative selector results:`);
  console.log(`   - .feed-shared-update-v2: ${altSelector1.length} elements`);
  console.log(
    `   - [data-urn*="urn:li:activity"]: ${altSelector2.length} elements`,
  );
  console.log(
    `   - .feed-shared-update-v2__content: ${altSelector3.length} elements`,
  );
  backgroundLog(
    `🎯 Alternative selector results: .feed-shared-update-v2: ${altSelector1.length}, [data-urn*="urn:li:activity"]: ${altSelector2.length}, .feed-shared-update-v2__content: ${altSelector3.length}`,
  );

  if (postContainers.length === 0) {
    console.error(
      "🚨 NO POSTS FOUND! This is why the automation stops immediately.",
    );
    console.error(
      "🚨 The page might not be fully loaded or the selector is wrong.",
    );
    backgroundError(
      "🚨 NO POSTS FOUND! This is why the automation stops immediately.",
    );
    backgroundError(
      "🚨 The page might not be fully loaded or the selector is wrong.",
    );
    console.groupEnd();
    backgroundGroupEnd();
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

    try {
      console.log(
        `🔍 Processing post ${i + 1}/${
          postContainers.length
        } (commented: ${commentCount}/${maxPosts})`,
      );

      // Scroll to the post
      postContainer.scrollIntoView({ behavior: "smooth", block: "center" });
      await wait(1000);

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
        // Update the post already commented counter
        await updatePostAlreadyCommentedCounter();
        console.groupEnd();
        continue;
      }

      // STEP 2: Check for author duplicate (within time window)
      const authorInfo = extractAuthorInfo(postContainer);
      if (!authorInfo) {
        console.log(
          `⏭️ SKIPPING post ${i + 1} - could not extract author info`,
        );
        console.groupEnd();
        continue;
      }

      // Check if we've commented on this author within the time window
      if (
        hasCommentedOnAuthorRecently(
          authorInfo.name,
          commentedAuthorsWithTimestamps,
          duplicateWindow,
        )
      ) {
        console.log(
          `⏭️ SKIPPING post ${i + 1} - already commented on ${
            authorInfo.name
          } within ${duplicateWindow} hours`,
        );

        // Update counters
        await updateSkippedPostCounter();

        console.groupEnd();
        continue;
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

      // Generate comment using direct tRPC call
      console.log(`🤖 Generating comment for post ${i + 1}...`);
      const comment = await generateComment(postAuthorContent, styleGuide);
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
      const success = await postCommentOnPost(
        postContainer,
        comment,
        isCommentingActive,
        commentProfileName,
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

        await updateCommentCounts();

        console.log(
          `🎉 Successfully posted comment ${commentCount}/${maxPosts} on post by ${authorInfo.name}`,
        );
        backgroundLog(
          `🎉 Successfully posted comment ${commentCount}/${maxPosts} on post by ${authorInfo.name}`,
        );
        console.group(`📊 Progress Update After Successful Comment`);
        console.log(
          `Comments posted this session: ${commentCount}/${maxPosts}`,
        );
        console.log(
          `Authors commented on today:`,
          Array.from(commentedAuthors),
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
        backgroundLog(
          `📊 Progress Update: ${commentCount}/${maxPosts} comments posted. Remaining posts: ${
            postContainers.length - i - 1
          }. Should continue: ${commentCount < maxPosts}`,
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
          backgroundLog(
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
  backgroundLog(
    `🏁 LOOP COMPLETED. Final stats: Posted ${commentCount}/${maxPosts} comments total. Final isCommentingActive: ${isCommentingActive}. Processed ${postContainers.length} total posts.`,
  );
  backgroundLog(
    `🏁 Loop exit reason: Reached max posts? ${
      commentCount >= maxPosts
    }, Lost active status? ${!isCommentingActive}, Ran out of posts? ${
      postContainers.length === 0
    }`,
  );
  console.groupEnd();
  backgroundGroupEnd();
}

// Function to update time filter skipped counter
async function updateTimeFilterSkippedCounter(): Promise<void> {
  postsSkippedTimeFilterCount++;

  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        postsSkippedTimeFilter: postsSkippedTimeFilterCount,
      },
      () => {
        console.log(
          `Updated time filter skipped counter: ${postsSkippedTimeFilterCount}`,
        );

        // Send real-time update to popup
        chrome.runtime.sendMessage({
          action: "realTimeCountUpdate",
          postsSkippedTimeFilterCount: postsSkippedTimeFilterCount,
        });

        resolve();
      },
    );
  });
}

function stopTabActiveAudio() {
  try {
    console.log("🔇 Stopping continuous audio...");

    if (currentOscillator) {
      currentOscillator.stop();
      currentOscillator = null;
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.remove();
      audioElement = null;
    }

    if (audioContext && audioContext.state !== "closed") {
      audioContext.close();
      audioContext = null;
    }

    console.log("🔇 Continuous audio stopped");
  } catch (error) {
    console.warn("⚠️ Error stopping audio:", error);
  }
}

console.log("EngageKit content script loaded - Background Window Mode");
