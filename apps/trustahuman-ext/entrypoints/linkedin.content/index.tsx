import ReactDOM from "react-dom/client";

import { showTrissToast, hideTrissToast, setTrissLogoUrl } from "@sassy/ui/components/triss-toast";
import { trpc } from "@/lib/trpc-client";
import { useAuthStore, initAuthStoreListener } from "@/lib/auth-store";

import App from "./App";
import { useVerificationStore } from "./stores/verification-store";
import { initSidebarListener } from "./stores/sidebar-store";
import { useProfileStore, initProfileStore } from "./stores/profile-store";
import { initCheckHumanStore } from "./stores/check-human-store";
import { initMyProfileStore, refetchMyProfile } from "./stores/my-profile-store";
import {
  scrapeCommentContext,
  setLastSubmitButton,
  captureCommentUrlsBefore,
  waitForNewCommentUrl,
  type CommentUrlInfo,
} from "./PostScraper";
// Badge overlay deferred to later - using Check Human tab instead
// import { initLinkedInBadgeOverlay } from "./LinkedInBadgeOverlay";

import "../../assets/globals.css";

// === SERVER WARMUP ===
// Keeps serverless functions warm to avoid cold start delays (2-4s -> <500ms)
const WARMUP_INTERVAL_MS = 55_000; // 55 seconds (just under Vercel's 60s timeout)
let warmupIntervalId: ReturnType<typeof setInterval> | null = null;

async function warmupBackend() {
  try {
    const { isSignedIn } = useAuthStore.getState();
    if (!isSignedIn) {
      console.log("TrustAHuman: Skipping warmup (not signed in)");
      return;
    }
    await trpc.verification.warmup.query();
    console.log("TrustAHuman: Backend warmed up");
  } catch (err) {
    // Silent fail - warmup is best-effort
    console.debug("TrustAHuman: Warmup failed (expected if not authenticated)", err);
  }
}

function startWarmupLoop() {
  // Initial warmup after a short delay (let auth settle)
  setTimeout(() => {
    warmupBackend();
  }, 2000);

  // Periodic warmup every 55 seconds
  warmupIntervalId = setInterval(warmupBackend, WARMUP_INTERVAL_MS);
  console.log("TrustAHuman: Warmup loop started (every 55s)");
}

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Set Triss logo URL for toast notifications
    setTrissLogoUrl(chrome.runtime.getURL("/trusthuman-logo.svg"));

    // Initialize auth store and listener for background auth state changes
    initAuthStoreListener();
    // Fetch initial auth status
    useAuthStore.getState().fetchAuthStatus();

    // Initialize sidebar listener for popup communication
    initSidebarListener();

    // === DETECT LOGGED-IN PROFILE ON PAGE LOAD ===
    // Uses ProfileStore pattern - fetches immediately and stores in Zustand
    initProfileStore();

    // === PREFETCH CHECK HUMAN DATA ===
    // If on a profile page, prefetch verification data so it's ready when sidebar opens
    initCheckHumanStore();

    // === FETCH MY PROFILE ===
    // Load user's own profile for sidebar mini-profile display
    initMyProfileStore();

    // === START SERVER WARMUP LOOP ===
    startWarmupLoop();

    // Badge overlay deferred - using Check Human tab instead

    // === SHADOW ROOT UI ===
    const ui = await createShadowRootUi(ctx, {
      name: "trustahuman-sidebar",
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        const appEl = document.createElement("div");
        appEl.id = "trustahuman-root";
        container.append(appEl);

        const root = ReactDOM.createRoot(appEl);
        root.render(<App shadowRoot={container} />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();

    // === TYPING DETECTION ===
    let typingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isCurrentlyTyping = false;

    const commentBoxSelectors = [
      // LinkedIn comment box variations
      '.comments-comment-box__form textarea',
      '.comments-comment-texteditor__content [contenteditable="true"]',
      'div[data-placeholder="Add a comment…"]',
      '.ql-editor[data-placeholder]',
      // More generic selectors for LinkedIn's editor
      '.editor-content [contenteditable="true"]',
      '[role="textbox"][contenteditable="true"]',
      '.comments-comment-box [contenteditable="true"]',
      // The actual comment input area
      '.feed-shared-update-v2 [contenteditable="true"]',
      'form.comments-comment-box__form [contenteditable="true"]',
    ];

    function handleTypingStart() {
      if (!isCurrentlyTyping) {
        isCurrentlyTyping = true;
        console.log("TrustAHuman: User started typing");
        showTrissToast("typing");
      }

      // Reset the typing timeout
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }

      // If user stops typing for 2 seconds, hide the typing toast
      typingTimeoutId = setTimeout(() => {
        if (isCurrentlyTyping) {
          isCurrentlyTyping = false;
          console.log("TrustAHuman: User stopped typing");
          hideTrissToast();
        }
      }, 2000);
    }

    function instrumentCommentBox(element: HTMLElement) {
      if (element.dataset.trustahuman === "instrumented") return;
      element.dataset.trustahuman = "instrumented";

      console.log("TrustAHuman: Instrumented comment box", element);

      element.addEventListener("input", handleTypingStart);
      element.addEventListener("keydown", (e) => {
        // Don't trigger typing toast for Enter or meta keys (submit shortcuts)
        if (e.key !== "Enter" && !e.metaKey && !e.ctrlKey) {
          handleTypingStart();
        }
      });
      element.addEventListener("focus", () => {
        console.log("TrustAHuman: Comment box focused");
      });
    }

    function scanForCommentBoxes(root: Element | Document = document) {
      for (const sel of commentBoxSelectors) {
        const elements = root.querySelectorAll<HTMLElement>(sel);
        if (elements.length > 0) {
          console.log(`TrustAHuman: Found ${elements.length} comment boxes for "${sel}"`);
        }
        elements.forEach(instrumentCommentBox);
      }
    }

    // === VERIFICATION DETECTION LOGIC ===
    const instrumentedButtons = new WeakSet<HTMLElement>();

    const submitButtonSelectors = [
      // V2 DOM (React SSR + SDUI) - Feed pages
      'button[data-view-name="comment-post"]',
      'button[data-view-name="comment-reply-post"]',
      // V1 DOM (Ember.js) - Single post pages (/posts/...)
      'button.comments-comment-box__submit-button--cr',
      // Legacy fallback
      'form.comments-comment-box__form button[type="submit"]',
    ];

    function instrumentButton(btn: HTMLElement) {
      if (instrumentedButtons.has(btn)) return;
      instrumentedButtons.add(btn);
      console.log("TrustAHuman: Instrumented submit button", btn);

      btn.addEventListener(
        "click",
        () => {
          console.log("TrustAHuman: Submit button clicked, starting verification");
          setLastSubmitButton(btn);
          handleVerification(btn).catch(console.error);
        },
        { capture: true },
      );
    }

    // === KEYBOARD SHORTCUT DETECTION (Ctrl+Enter / Cmd+Enter) ===
    const instrumentedCommentBoxesForKeyboard = new WeakSet<HTMLElement>();

    function instrumentCommentBoxForKeyboard(element: HTMLElement) {
      if (instrumentedCommentBoxesForKeyboard.has(element)) return;
      instrumentedCommentBoxesForKeyboard.add(element);

      element.addEventListener("keydown", (e) => {
        // Check for Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          console.log("TrustAHuman: Ctrl/Cmd+Enter detected in comment box");

          // Find the submit button - try multiple container patterns
          let submitBtn: HTMLElement | null = null;

          // Button selectors for V2 (data-view-name) and V1 (class-based)
          const btnSelectors = [
            'button[data-view-name="comment-post"]',
            'button[data-view-name="comment-reply-post"]',
            'button.comments-comment-box__submit-button--cr',
            'button[type="submit"]',
          ].join(', ');

          // Try form first
          const form = element.closest("form");
          if (form) {
            submitBtn = form.querySelector(btnSelectors) as HTMLElement | null;
          }

          // Try comment box container (V1 DOM uses this class)
          if (!submitBtn) {
            const commentBox = element.closest('.comments-comment-box, .comments-comment-box__form, .comments-comment-box--cr');
            if (commentBox) {
              submitBtn = commentBox.querySelector(btnSelectors) as HTMLElement | null;
            }
          }

          // Try parent containers more broadly
          if (!submitBtn) {
            let parent = element.parentElement;
            for (let i = 0; i < 10 && parent && !submitBtn; i++) {
              submitBtn = parent.querySelector(btnSelectors) as HTMLElement | null;
              parent = parent.parentElement;
            }
          }

          if (submitBtn) {
            console.log("TrustAHuman: Found submit button for Ctrl+Enter, clicking it");
            e.preventDefault(); // Prevent default behavior
            setLastSubmitButton(submitBtn);
            // Click the button to submit the comment
            submitBtn.click();
            // handleVerification will be triggered by our click listener on the button
          } else {
            console.log("TrustAHuman: Could not find submit button for Ctrl+Enter");
          }
        }
      });
    }

    function scanForCommentBoxesKeyboard(root: Element | Document = document) {
      for (const sel of commentBoxSelectors) {
        const elements = root.querySelectorAll<HTMLElement>(sel);
        elements.forEach(instrumentCommentBoxForKeyboard);
      }
    }

    async function handleVerification(submitButton: HTMLElement) {
      // Clear typing state
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
        typingTimeoutId = null;
      }
      isCurrentlyTyping = false;

      // 0. Capture comment URLs BEFORE submission (for extracting new comment URL later)
      const commentUrlsBefore = captureCommentUrlsBefore(submitButton);

      // 0.5. Scrape context BEFORE showing toast (DOM might change after submit)
      const commentContext = scrapeCommentContext(submitButton);

      // Get profile from store (already loaded on page init)
      const userProfile = useProfileStore.getState().profile;

      // === DETAILED DEBUG LOGGING ===
      console.log("=".repeat(60));
      console.log("TrustAHuman LinkedIn: VERIFICATION DATA DEBUG");
      console.log("=".repeat(60));

      console.log("\n📍 LOCATION:");
      console.log("  URL:", window.location.href);
      console.log("  Page type:", detectPageType());

      console.log("\n👤 LOGGED-IN USER PROFILE (sent to API as userProfile):");
      console.log("  profileUrl:", userProfile?.profileUrl || "❌ MISSING");
      console.log("  profileHandle:", userProfile?.profileHandle || "❌ MISSING");
      console.log("  displayName:", userProfile?.displayName || "❌ MISSING");
      console.log("  avatarUrl:", userProfile?.avatarUrl ? "✅ Present" : "❌ MISSING");

      console.log("\n📝 RAW SCRAPED DATA (from DOM):");
      console.log("  commentText:", commentContext?.commentText || "❌ MISSING");
      console.log("  postUrl:", commentContext?.post?.postUrl || "❌ MISSING");
      console.log("  postAuthorName (RAW):", commentContext?.post?.postAuthorName || "❌ MISSING");
      console.log("  postAuthorAvatarUrl:", commentContext?.post?.postAuthorAvatarUrl ? "✅ Present" : "❌ MISSING");
      console.log("  postTextSnippet:", commentContext?.post?.postTextSnippet?.substring(0, 100) || "❌ MISSING");

      console.log("\n📤 STANDARDIZED API PAYLOAD (activity object):");
      console.log("  commentText:", commentContext?.commentText || "");
      console.log("  commentUrl:", "⏳ (extracted after submit)");
      console.log("  parentUrl:", commentContext?.post?.postUrl || "");
      console.log("  parentAuthorName:", commentContext?.post?.postAuthorName || "LinkedIn User");
      console.log("  parentAuthorAvatarUrl:", commentContext?.post?.postAuthorAvatarUrl || "");
      console.log("  parentTextSnippet:", (commentContext?.post?.postTextSnippet || "").substring(0, 100));

      console.log("\n🔗 COMMENT URLs BEFORE:", commentUrlsBefore.size);
      console.log("=".repeat(60));

      // Helper to detect page type
      function detectPageType(): string {
        const url = window.location.href;
        if (url.includes("/feed/")) return "Feed";
        if (url.includes("/posts/")) return "Single Post";
        if (url.includes("/in/")) return "Profile";
        if (url.includes("/company/")) return "Company Page";
        return "Unknown";
      }

      // 1. Show "submitted" toast
      console.log("TrustAHuman: Showing submitted toast");
      showTrissToast("submitted");

      // 1.5. Wait for new comment to appear and extract its URL (async, in background)
      const commentUrlPromise = waitForNewCommentUrl(submitButton, commentUrlsBefore, 5000);

      // Wait a moment for the submitted toast to be visible
      await sleep(1500);

      // 2. Show "capturing" toast
      console.log("TrustAHuman: Showing capturing toast");
      showTrissToast("capturing");

      // 3. Capture photo via background
      console.log("TrustAHuman: Sending capturePhoto to background");
      const response = await chrome.runtime.sendMessage({
        action: "capturePhoto",
      });
      console.log("TrustAHuman: capturePhoto response", response);

      if (!response?.base64) {
        console.warn("TrustAHuman: No base64 returned, camera denied or failed");
        showTrissToast("camera_needed", "Camera access needed to verify you're human", {
          label: "Grant Camera Access",
          onClick: () => {
            chrome.runtime.sendMessage({ action: "openSetup" });
            hideTrissToast();
          },
        });
        return;
      }

      // 4. Show "verifying" toast
      console.log("TrustAHuman: Showing verifying toast");
      showTrissToast("verifying");

      // 5. Check if authenticated
      const { isSignedIn } = useAuthStore.getState();

      // 5.5. Await comment URL extraction (started earlier)
      const newCommentInfo = await commentUrlPromise;
      console.log("\n🔗 NEW COMMENT INFO (after submit):");
      console.log("  commentUrl:", newCommentInfo?.url || "❌ NOT FOUND");
      console.log("  commentUrn:", newCommentInfo?.urn || "❌ NOT FOUND");

      if (!isSignedIn || !userProfile || !commentContext) {
        // Fall back to local-only verification (analyzePhoto)
        console.log("TrustAHuman: Not authenticated or missing context, using local verification");
        try {
          const result = await trpc.verification.analyzePhoto.mutate({
            photoBase64: response.base64,
          });
          console.log("TrustAHuman: analyzePhoto result", result);

          if (result.verified) {
            showTrissToast("verified", "Verified! Sign in to track your stats.");
          } else {
            showTrissToast("not_verified");
          }

          // Add to local store (photo not stored for privacy)
          useVerificationStore.getState().addVerification({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            action: "linkedin_comment",
            platform: "linkedin",
            verified: result.verified,
            confidence: result.confidence,
            faceCount: result.faceCount,
            // Include comment data for card display (standardized schema)
            commentText: commentContext?.commentText || "",
            commentUrl: newCommentInfo?.url,
            parentUrl: commentContext?.post.postUrl || "",
            parentAuthorName: commentContext?.post.postAuthorName || "LinkedIn User",
            parentAuthorAvatarUrl: commentContext?.post.postAuthorAvatarUrl || "",
            parentTextSnippet: commentContext?.post.postTextSnippet || "",
          });

        } catch (err) {
          console.error("TrustAHuman: analyzePhoto failed", err);
          showTrissToast("not_verified", "Verification failed. Try again.");
        }
      } else {
        // Full verification with submitActivity
        try {
          console.log("TrustAHuman: Calling submitActivity");
          const result = await trpc.verification.submitActivity.mutate({
            photoBase64: response.base64,
            platform: "linkedin",
            userProfile: {
              profileUrl: userProfile.profileUrl,
              profileHandle: userProfile.profileHandle,
              displayName: userProfile.displayName,
              avatarUrl: userProfile.avatarUrl,
            },
            activity: {
              commentText: commentContext.commentText,
              commentUrl: newCommentInfo?.url,
              parentUrl: commentContext.post.postUrl,
              parentAuthorName: commentContext.post.postAuthorName || "LinkedIn User",
              parentAuthorAvatarUrl: commentContext.post.postAuthorAvatarUrl || "",
              parentTextSnippet: commentContext.post.postTextSnippet || "",
            },
          });
          console.log("TrustAHuman: submitActivity result", result);

          if (result.verified) {
            if (result.isFirstVerification) {
              showTrissToast("verified", `Welcome Human #${result.humanNumber}! You're verified!`);
            } else {
              showTrissToast("verified", `Verified! ${result.totalVerifications} activities`);
            }
          } else {
            showTrissToast("not_verified");
          }

          // Add to local store (photo not stored for privacy)
          useVerificationStore.getState().addVerification({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            action: "linkedin_comment",
            platform: "linkedin",
            verified: result.verified,
            confidence: result.confidence,
            faceCount: 1,
            // Include comment data for card display (standardized schema)
            commentText: commentContext.commentText,
            commentUrl: newCommentInfo?.url,
            parentUrl: commentContext.post.postUrl,
            parentAuthorName: commentContext.post.postAuthorName || "LinkedIn User",
            parentAuthorAvatarUrl: commentContext.post.postAuthorAvatarUrl || "",
            parentTextSnippet: commentContext.post.postTextSnippet || "",
          });

          // Refetch profile to update stats in sidebar
          if (result.verified) {
            refetchMyProfile();
          }

        } catch (err: any) {
          console.error("TrustAHuman: submitActivity failed", err);

          // Handle specific errors
          if (err?.message?.includes("UNAUTHORIZED")) {
            showTrissToast("not_verified", "Please sign in to verify.");
          } else if (err?.message?.includes("already linked")) {
            showTrissToast("not_verified", "This profile is linked to another account.");
          } else {
            showTrissToast("not_verified", "Verification failed. Try again.");
          }
        }
      }

      // 7. Wait, then show photo_deleted toast
      await sleep(3000);
      console.log("TrustAHuman: Showing photo_deleted toast");
      showTrissToast("photo_deleted");

      // 8. Wait, then hide toast (back to idle)
      await sleep(3000);
      hideTrissToast();
      console.log("TrustAHuman: Flow complete, toast hidden");
    }

    function scanForButtons(root: Element | Document = document) {
      for (const sel of submitButtonSelectors) {
        const buttons = root.querySelectorAll<HTMLElement>(sel);
        if (buttons.length > 0) {
          console.log(`TrustAHuman: Found ${buttons.length} buttons for "${sel}"`);
        }
        buttons.forEach(instrumentButton);
      }
    }

    // Initial scan
    scanForCommentBoxes();
    scanForButtons();
    scanForCommentBoxesKeyboard();

    // Watch for new elements
    const observer = new MutationObserver(() => {
      scanForCommentBoxes();
      scanForButtons();
      scanForCommentBoxesKeyboard();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("TrustAHuman: Content script loaded");
    console.log("TrustAHuman: Watching comment boxes:", commentBoxSelectors);
    console.log("TrustAHuman: Watching submit buttons:", submitButtonSelectors);
    console.log("TrustAHuman: Keyboard shortcuts enabled (Ctrl/Cmd+Enter)");
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
