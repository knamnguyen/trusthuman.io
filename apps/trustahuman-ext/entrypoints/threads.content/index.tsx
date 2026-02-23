import ReactDOM from "react-dom/client";

import { showTrissToast, hideTrissToast, setTrissLogoUrl } from "@sassy/ui/components/triss-toast";
import { trpc } from "@/lib/trpc-client";
import { useAuthStore, initAuthStoreListener } from "@/lib/auth-store";

import App from "../linkedin.content/App"; // Reuse same sidebar UI
import { useVerificationStore } from "../linkedin.content/stores/verification-store";
import { initSidebarListener } from "../linkedin.content/stores/sidebar-store";
import { initCheckHumanStore } from "../linkedin.content/stores/check-human-store";
import { initMyProfileStore, refetchMyProfile } from "../linkedin.content/stores/my-profile-store";
import { useThreadsProfileStore, initThreadsProfileStore } from "./stores/profile-store";
import { scrapeReplyContext, waitForToastUrl, isSubmitButton, SELECTORS } from "./ThreadsReplyScraper";

import "../../assets/globals.css";

// === SERVER WARMUP ===
const WARMUP_INTERVAL_MS = 55_000;
let warmupIntervalId: ReturnType<typeof setInterval> | null = null;

async function warmupBackend() {
  try {
    const { isSignedIn } = useAuthStore.getState();
    if (!isSignedIn) {
      console.log("TrustAHuman Threads: Skipping warmup (not signed in)");
      return;
    }
    await trpc.verification.warmup.query();
    console.log("TrustAHuman Threads: Backend warmed up");
  } catch (err) {
    console.debug("TrustAHuman Threads: Warmup failed", err);
  }
}

function startWarmupLoop() {
  setTimeout(() => warmupBackend(), 2000);
  warmupIntervalId = setInterval(warmupBackend, WARMUP_INTERVAL_MS);
  console.log("TrustAHuman Threads: Warmup loop started (every 55s)");
}

export default defineContentScript({
  matches: ["https://www.threads.net/*", "https://threads.net/*", "https://www.threads.com/*", "https://threads.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Set Triss logo URL for toast notifications
    setTrissLogoUrl(chrome.runtime.getURL("/trusthuman-logo.svg"));

    // Initialize auth store and listener
    initAuthStoreListener();
    useAuthStore.getState().fetchAuthStatus();

    // Initialize sidebar listener for popup communication
    initSidebarListener();

    // Detect logged-in Threads profile
    initThreadsProfileStore();

    // Prefetch Check Human data if on a profile page
    initCheckHumanStore();

    // Load user's own profile for sidebar
    initMyProfileStore();

    // Start server warmup loop
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

    // Threads uses contenteditable divs for input
    const replyBoxSelectors = SELECTORS.replyInput;

    function handleTypingStart() {
      if (!isCurrentlyTyping) {
        isCurrentlyTyping = true;
        console.log("TrustAHuman Threads: User started typing");
        showTrissToast("typing");
      }

      if (typingTimeoutId) clearTimeout(typingTimeoutId);

      typingTimeoutId = setTimeout(() => {
        if (isCurrentlyTyping) {
          isCurrentlyTyping = false;
          console.log("TrustAHuman Threads: User stopped typing");
          hideTrissToast();
        }
      }, 2000);
    }

    function instrumentReplyBox(element: HTMLElement) {
      if (element.dataset.trustahuman === "instrumented") return;
      element.dataset.trustahuman = "instrumented";

      console.log("TrustAHuman Threads: Instrumented reply box", element);
      element.addEventListener("input", handleTypingStart);
      element.addEventListener("keydown", (e: KeyboardEvent) => {
        handleTypingStart();

        // Detect Ctrl+Enter or Cmd+Enter to submit
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          console.log("TrustAHuman Threads: Ctrl+Enter detected");
          if (!pendingVerification) {
            handleVerification().catch(console.error);
          }
        }
      });
    }

    function scanForReplyBoxes(root: Element | Document = document) {
      for (const sel of replyBoxSelectors) {
        try {
          const elements = root.querySelectorAll<HTMLElement>(sel);
          elements.forEach(instrumentReplyBox);
        } catch {
          // Skip invalid selector
        }
      }
    }

    // === SUBMIT BUTTON DETECTION ===
    const instrumentedButtons = new WeakSet<HTMLElement>();
    let pendingVerification = false;

    function instrumentSubmitButton(button: HTMLElement) {
      if (instrumentedButtons.has(button)) return;

      // Only instrument if it's actually a submit button (not reply icon)
      if (!isSubmitButton(button)) return;

      instrumentedButtons.add(button);

      console.log("TrustAHuman Threads: Instrumented submit button", button);

      button.addEventListener(
        "click",
        () => {
          if (pendingVerification) {
            console.log("TrustAHuman Threads: Verification already pending, skipping");
            return;
          }
          console.log("TrustAHuman Threads: Submit button clicked");
          handleVerification().catch(console.error);
        },
        { capture: true }
      );
    }

    function scanForSubmitButtons(root: Element | Document = document) {
      // Scan all role="button" elements and filter with isSubmitButton
      const buttons = root.querySelectorAll<HTMLElement>('div[role="button"]');
      buttons.forEach((btn) => {
        instrumentSubmitButton(btn);
      });
    }

    async function handleVerification() {
      if (pendingVerification) return;
      pendingVerification = true;

      try {
        // Clear typing state
        if (typingTimeoutId) {
          clearTimeout(typingTimeoutId);
          typingTimeoutId = null;
        }
        isCurrentlyTyping = false;

        // Scrape context BEFORE showing toast
        const replyContext = scrapeReplyContext();
        const userProfile = useThreadsProfileStore.getState().profile;

        console.log("TrustAHuman Threads: Reply context", replyContext);
        console.log("TrustAHuman Threads: User profile", userProfile);

        // Skip if no reply text
        if (!replyContext?.replyText?.trim()) {
          console.log("TrustAHuman Threads: No reply text found, skipping verification");
          return;
        }

        // Show "submitted" toast
        showTrissToast("submitted");

        // Wait for toast to appear with activity URL
        console.log("TrustAHuman Threads: Waiting for toast URL...");
        const activityUrl = await waitForToastUrl(8000);
        console.log("TrustAHuman Threads: Activity URL from toast:", activityUrl);

        // Show "capturing" toast
        showTrissToast("capturing");

        // Capture photo via background
        const response = await chrome.runtime.sendMessage({
          action: "capturePhoto",
        });

        if (!response?.base64) {
          console.warn("TrustAHuman Threads: No base64 returned, camera denied or failed");
          showTrissToast("not_verified", "Camera not available. Grant access in settings.");
          return;
        }

        // Show "verifying" toast
        showTrissToast("verifying");

        const { isSignedIn } = useAuthStore.getState();

        if (!isSignedIn || !userProfile || !replyContext) {
          // Local-only verification
          console.log("TrustAHuman Threads: Not authenticated, using local verification");
          try {
            const result = await trpc.verification.analyzePhoto.mutate({
              photoBase64: response.base64,
            });

            if (result.verified) {
              showTrissToast("verified", "Verified! Sign in to track your stats.");
            } else {
              showTrissToast("not_verified");
            }

            // Add to local store
            useVerificationStore.getState().addVerification({
              id: crypto.randomUUID(),
              timestamp: new Date(),
              action: "threads_reply",
              platform: "threads",
              verified: result.verified,
              confidence: result.confidence,
              faceCount: result.faceCount,
              commentText: replyContext?.replyText || "",
              commentUrl: activityUrl || undefined,
              parentUrl: replyContext?.parent.postUrl || undefined,
              parentAuthorName: replyContext?.parent.authorUsername || "Threads User",
              parentAuthorAvatarUrl: replyContext?.parent.authorAvatarUrl || "",
              parentTextSnippet: replyContext?.parent.textSnippet || "",
            });
          } catch (err) {
            console.error("TrustAHuman Threads: analyzePhoto failed", err);
            showTrissToast("not_verified", "Verification failed. Try again.");
          }
        } else {
          // Full verification with submitActivity
          try {
            console.log("TrustAHuman Threads: Calling submitActivity");
            const result = await trpc.verification.submitActivity.mutate({
              photoBase64: response.base64,
              platform: "threads",
              userProfile: {
                profileUrl: userProfile.profileUrl,
                profileHandle: userProfile.profileHandle,
                displayName: userProfile.displayName ?? undefined,
                avatarUrl: userProfile.avatarUrl ?? undefined,
              },
              activity: {
                commentText: replyContext.replyText,
                commentUrl: activityUrl ?? undefined,
                parentUrl: replyContext.parent.postUrl ?? undefined,
                parentAuthorName: replyContext.parent.authorUsername || "Threads User",
                parentAuthorAvatarUrl: replyContext.parent.authorAvatarUrl || "",
                parentTextSnippet: replyContext.parent.textSnippet || "",
              },
            });

            if (result.verified) {
              if (result.isFirstVerification) {
                showTrissToast("verified", `Welcome Human #${result.humanNumber}! You're verified!`);
              } else {
                showTrissToast("verified", `Verified! ${result.totalVerifications} activities`);
              }
            } else {
              showTrissToast("not_verified");
            }

            // Add to local store
            useVerificationStore.getState().addVerification({
              id: crypto.randomUUID(),
              timestamp: new Date(),
              action: "threads_reply",
              platform: "threads",
              verified: result.verified,
              confidence: result.confidence,
              faceCount: 1,
              commentText: replyContext.replyText,
              commentUrl: activityUrl || undefined,
              parentUrl: replyContext.parent.postUrl || undefined,
              parentAuthorName: replyContext.parent.authorUsername || "Threads User",
              parentAuthorAvatarUrl: replyContext.parent.authorAvatarUrl || "",
              parentTextSnippet: replyContext.parent.textSnippet || "",
            });

            // Refetch profile to update stats
            if (result.verified) {
              refetchMyProfile();
            }
          } catch (err: any) {
            console.error("TrustAHuman Threads: submitActivity failed", err);

            if (err?.message?.includes("UNAUTHORIZED")) {
              showTrissToast("not_verified", "Please sign in to verify.");
            } else if (err?.message?.includes("already linked")) {
              showTrissToast("not_verified", "This profile is linked to another account.");
            } else {
              showTrissToast("not_verified", "Verification failed. Try again.");
            }
          }
        }

        // Show photo_deleted toast
        await sleep(3000);
        showTrissToast("photo_deleted");

        // Hide toast
        await sleep(3000);
        hideTrissToast();
        console.log("TrustAHuman Threads: Flow complete");
      } finally {
        pendingVerification = false;
      }
    }

    // Initial scan
    scanForReplyBoxes();
    scanForSubmitButtons();

    // Watch for new elements (Threads is an SPA)
    const observer = new MutationObserver(() => {
      scanForReplyBoxes();
      scanForSubmitButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("TrustAHuman Threads: Content script loaded");
    console.log("TrustAHuman Threads: Watching reply boxes:", replyBoxSelectors);
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
