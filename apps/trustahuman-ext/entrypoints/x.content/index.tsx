import ReactDOM from "react-dom/client";

import { showTrissToast, hideTrissToast, setTrissLogoUrl } from "@sassy/ui/components/triss-toast";
import { trpc } from "@/lib/trpc-client";
import { useAuthStore, initAuthStoreListener } from "@/lib/auth-store";

import App from "../linkedin.content/App"; // Reuse same sidebar UI
import { useVerificationStore } from "../linkedin.content/stores/verification-store";
import { initSidebarListener } from "../linkedin.content/stores/sidebar-store";
import { initCheckHumanStore } from "../linkedin.content/stores/check-human-store";
import { initMyProfileStore, refetchMyProfile } from "../linkedin.content/stores/my-profile-store";
import { useXProfileStore, initXProfileStore } from "./stores/profile-store";
import { scrapeReplyContext, waitForSuccessToast } from "./XReplyScraper";

import "../../assets/globals.css";

// === SERVER WARMUP ===
// Keeps serverless functions warm to avoid cold start delays (2-4s -> <500ms)
const WARMUP_INTERVAL_MS = 55_000; // 55 seconds (just under Vercel's 60s timeout)
let warmupIntervalId: ReturnType<typeof setInterval> | null = null;

async function warmupBackend() {
  try {
    const { isSignedIn } = useAuthStore.getState();
    if (!isSignedIn) {
      console.log("TrustAHuman X: Skipping warmup (not signed in)");
      return;
    }
    await trpc.verification.warmup.query();
    console.log("TrustAHuman X: Backend warmed up");
  } catch (err) {
    // Silent fail - warmup is best-effort
    console.debug("TrustAHuman X: Warmup failed (expected if not authenticated)", err);
  }
}

function startWarmupLoop() {
  // Initial warmup after a short delay (let auth settle)
  setTimeout(() => {
    warmupBackend();
  }, 2000);

  // Periodic warmup every 55 seconds
  warmupIntervalId = setInterval(warmupBackend, WARMUP_INTERVAL_MS);
  console.log("TrustAHuman X: Warmup loop started (every 55s)");
}

export default defineContentScript({
  matches: ["https://x.com/*", "https://twitter.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Set Triss logo URL for toast notifications
    setTrissLogoUrl(chrome.runtime.getURL("/trusthuman-logo.svg"));

    // Initialize auth store listener
    initAuthStoreListener();
    useAuthStore.getState().fetchAuthStatus();

    // Initialize sidebar listener for popup communication
    initSidebarListener();

    // Detect logged-in X profile
    initXProfileStore();

    // === PREFETCH CHECK HUMAN DATA ===
    // If on a profile page, prefetch verification data so it's ready when sidebar opens
    initCheckHumanStore();

    // === FETCH MY PROFILE ===
    // Load user's own profile for sidebar mini-profile display
    initMyProfileStore();

    // === START SERVER WARMUP LOOP ===
    startWarmupLoop();

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

    const tweetBoxSelector = '[data-testid="tweetTextarea_0"]';

    function handleTypingStart() {
      if (!isCurrentlyTyping) {
        isCurrentlyTyping = true;
        console.log("TrustAHuman X: User started typing");
        showTrissToast("typing");
      }

      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }

      typingTimeoutId = setTimeout(() => {
        if (isCurrentlyTyping) {
          isCurrentlyTyping = false;
          console.log("TrustAHuman X: User stopped typing");
          hideTrissToast();
        }
      }, 2000);
    }

    function instrumentTweetBox(element: HTMLElement) {
      if (element.dataset.trustahuman === "instrumented") return;
      element.dataset.trustahuman = "instrumented";

      console.log("TrustAHuman X: Instrumented tweet box", element);

      element.addEventListener("input", handleTypingStart);
      element.addEventListener("keydown", (e) => {
        handleTypingStart();

        // Check for Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac) to trigger verification
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          console.log("TrustAHuman X: Ctrl/Cmd+Enter detected, triggering verification");
          if (!pendingVerification) {
            handleVerification().catch(console.error);
          }
        }
      });
    }

    function scanForTweetBoxes(root: Element | Document = document) {
      const elements = root.querySelectorAll<HTMLElement>(tweetBoxSelector);
      elements.forEach(instrumentTweetBox);
    }

    // === REPLY SUBMISSION DETECTION ===
    const instrumentedButtons = new WeakSet<HTMLElement>();
    const submitButtonSelector = '[data-testid="tweetButton"]';

    // Track pending verifications to avoid duplicates
    let pendingVerification = false;

    function instrumentSubmitButton(btn: HTMLElement) {
      if (instrumentedButtons.has(btn)) return;
      instrumentedButtons.add(btn);
      console.log("TrustAHuman X: Instrumented submit button", btn);

      btn.addEventListener(
        "click",
        () => {
          if (pendingVerification) {
            console.log("TrustAHuman X: Verification already pending, skipping");
            return;
          }
          console.log("TrustAHuman X: Submit button clicked, starting verification");
          handleVerification().catch(console.error);
        },
        { capture: true }
      );
    }

    async function handleVerification() {
      pendingVerification = true;

      try {
        // Clear typing state
        if (typingTimeoutId) {
          clearTimeout(typingTimeoutId);
          typingTimeoutId = null;
        }
        isCurrentlyTyping = false;

        // 0. Scrape reply context BEFORE submission (DOM might change)
        const replyContext = scrapeReplyContext();
        const userProfile = useXProfileStore.getState().profile;

        // === DETAILED DEBUG LOGGING ===
        console.log("=".repeat(60));
        console.log("TrustAHuman X: VERIFICATION DATA DEBUG");
        console.log("=".repeat(60));

        console.log("\n📍 LOCATION:");
        console.log("  URL:", window.location.href);
        console.log("  Page type:", detectXPageType());

        console.log("\n👤 LOGGED-IN USER PROFILE:");
        console.log("  profileUrl:", userProfile?.profileUrl || "❌ MISSING");
        console.log("  profileHandle:", userProfile?.profileHandle || "❌ MISSING");
        console.log("  displayName:", userProfile?.displayName || "❌ MISSING");
        console.log("  avatarUrl:", userProfile?.avatarUrl ? "✅ Present" : "❌ MISSING");

        console.log("\n💬 REPLY DATA:");
        console.log("  replyText:", replyContext?.replyText || "❌ MISSING");
        console.log("  replyText length:", replyContext?.replyText?.length || 0);

        console.log("\n🐦 TWEET CONTEXT (being replied to):");
        console.log("  tweetAuthorName:", replyContext?.tweetAuthorName || "❌ MISSING");
        console.log("  tweetAuthorHandle:", replyContext?.tweetAuthorHandle || "❌ MISSING");
        console.log("  tweetAuthorAvatarUrl:", replyContext?.tweetAuthorAvatarUrl ? "✅ Present" : "❌ MISSING");
        console.log("  tweetTextSnippet:", replyContext?.tweetTextSnippet?.substring(0, 100) || "❌ MISSING");

        console.log("=".repeat(60));

        // Helper to detect page type
        function detectXPageType(): string {
          const url = window.location.href;
          if (url.includes("/status/")) return "Single Tweet / Thread";
          if (url.includes("/home")) return "Home Feed";
          if (url.includes("/compose/")) return "Compose Modal";
          if (url.match(/x\.com\/[^/]+$/)) return "Profile";
          return "Unknown";
        }

        if (!replyContext) {
          console.warn("TrustAHuman X: No reply context found, aborting");
          return;
        }

        // 1. Show "submitted" toast
        console.log("TrustAHuman X: Showing submitted toast");
        showTrissToast("submitted");

        // 2. Wait for success toast to appear (contains reply URL)
        const toastResult = await waitForSuccessToast(10000);
        console.log("\n🔗 REPLY URL (from success toast):");
        console.log("  success:", toastResult.success);
        console.log("  replyUrl:", toastResult.replyUrl || "❌ NOT FOUND");
        console.log("  message:", toastResult.message || "none");

        if (!toastResult.success) {
          console.warn("TrustAHuman X: Reply submission failed or rate limited:", toastResult.message);
          showTrissToast("not_verified", toastResult.message || "Reply failed");
          await sleep(3000);
          hideTrissToast();
          return;
        }

        // 3. Show "capturing" toast
        console.log("TrustAHuman X: Showing capturing toast");
        showTrissToast("capturing");

        // 4. Capture photo via background
        console.log("TrustAHuman X: Sending capturePhoto to background");
        const response = await chrome.runtime.sendMessage({
          action: "capturePhoto",
        });
        console.log("TrustAHuman X: capturePhoto response", response);

        if (!response?.base64) {
          console.warn("TrustAHuman X: No base64 returned, camera denied or failed");
          showTrissToast("camera_needed", "Camera access needed to verify you're human", {
            label: "Grant Camera Access",
            onClick: () => {
              chrome.runtime.sendMessage({ action: "openSetup" });
              hideTrissToast();
            },
          });
          return;
        }

        // 5. Show "verifying" toast
        console.log("TrustAHuman X: Showing verifying toast");
        showTrissToast("verifying");

        // 6. Check authentication and submit
        const { isSignedIn } = useAuthStore.getState();

        if (!isSignedIn || !userProfile) {
          // Local-only verification
          console.log("TrustAHuman X: Not authenticated, using local verification");
          try {
            const result = await trpc.verification.analyzePhoto.mutate({
              photoBase64: response.base64,
            });
            console.log("TrustAHuman X: analyzePhoto result", result);

            if (result.verified) {
              showTrissToast("verified", "Verified! Sign in to track your stats.");
            } else {
              showTrissToast("not_verified");
            }

            // Add to local store (standardized schema)
            useVerificationStore.getState().addVerification({
              id: crypto.randomUUID(),
              timestamp: new Date(),
              action: "x_reply",
              platform: "x",
              verified: result.verified,
              confidence: result.confidence,
              faceCount: result.faceCount,
              commentText: replyContext.replyText,
              commentUrl: toastResult.replyUrl,
              parentUrl: replyContext.tweetAuthorHandle ? `https://x.com/${replyContext.tweetAuthorHandle}` : undefined,
              parentAuthorName: replyContext.tweetAuthorName || "X User",
              parentAuthorAvatarUrl: replyContext.tweetAuthorAvatarUrl || "",
              parentTextSnippet: replyContext.tweetTextSnippet || "",
            });
          } catch (err) {
            console.error("TrustAHuman X: analyzePhoto failed", err);
            showTrissToast("not_verified", "Verification failed. Try again.");
          }
        } else {
          // Full verification with submitActivity
          try {
            console.log("TrustAHuman X: Calling submitActivity");
            const result = await trpc.verification.submitActivity.mutate({
              photoBase64: response.base64,
              platform: "x",
              userProfile: {
                profileUrl: userProfile.profileUrl,
                profileHandle: userProfile.profileHandle,
                displayName: userProfile.displayName,
                avatarUrl: userProfile.avatarUrl,
              },
              activity: {
                commentText: replyContext.replyText,
                commentUrl: toastResult.replyUrl,
                parentUrl: replyContext.tweetAuthorHandle ? `https://x.com/${replyContext.tweetAuthorHandle}` : undefined,
                parentAuthorName: replyContext.tweetAuthorName || "X User",
                parentAuthorAvatarUrl: replyContext.tweetAuthorAvatarUrl || "",
                parentTextSnippet: replyContext.tweetTextSnippet || "",
              },
            });
            console.log("TrustAHuman X: submitActivity result", result);

            if (result.verified) {
              if (result.isFirstVerification) {
                showTrissToast("verified", `Welcome Human #${result.humanNumber}! You're verified!`);
              } else {
                showTrissToast("verified", `Verified! ${result.totalVerifications} activities`);
              }
            } else {
              showTrissToast("not_verified");
            }

            // Add to local store (standardized schema)
            useVerificationStore.getState().addVerification({
              id: crypto.randomUUID(),
              timestamp: new Date(),
              action: "x_reply",
              platform: "x",
              verified: result.verified,
              confidence: result.confidence,
              faceCount: 1,
              commentText: replyContext.replyText,
              commentUrl: toastResult.replyUrl,
              parentUrl: replyContext.tweetAuthorHandle ? `https://x.com/${replyContext.tweetAuthorHandle}` : undefined,
              parentAuthorName: replyContext.tweetAuthorName || "X User",
              parentAuthorAvatarUrl: replyContext.tweetAuthorAvatarUrl || "",
              parentTextSnippet: replyContext.tweetTextSnippet || "",
            });

            // Refetch profile to update stats in sidebar
            if (result.verified) {
              refetchMyProfile();
            }
          } catch (err: any) {
            console.error("TrustAHuman X: submitActivity failed", err);

            if (err?.message?.includes("UNAUTHORIZED")) {
              showTrissToast("not_verified", "Please sign in to verify.");
            } else if (err?.message?.includes("already linked")) {
              showTrissToast("not_verified", "This profile is linked to another account.");
            } else {
              showTrissToast("not_verified", "Verification failed. Try again.");
            }
          }
        }

        // 7. Photo deleted confirmation
        await sleep(3000);
        console.log("TrustAHuman X: Showing photo_deleted toast");
        showTrissToast("photo_deleted");

        // 8. Hide toast
        await sleep(3000);
        hideTrissToast();
        console.log("TrustAHuman X: Flow complete, toast hidden");
      } finally {
        pendingVerification = false;
      }
    }

    function scanForButtons(root: Element | Document = document) {
      const buttons = root.querySelectorAll<HTMLElement>(submitButtonSelector);
      buttons.forEach(instrumentSubmitButton);
    }

    // Initial scan
    scanForTweetBoxes();
    scanForButtons();

    // Watch for new elements (X is an SPA)
    const observer = new MutationObserver(() => {
      scanForTweetBoxes();
      scanForButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("TrustAHuman X: Content script loaded");
    console.log("TrustAHuman X: Watching tweet boxes:", tweetBoxSelector);
    console.log("TrustAHuman X: Watching submit buttons:", submitButtonSelector);
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
