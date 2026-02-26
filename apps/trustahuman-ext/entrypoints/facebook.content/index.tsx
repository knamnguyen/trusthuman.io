import ReactDOM from "react-dom/client";

import { showTrissToast, hideTrissToast, setTrissLogoUrl } from "@sassy/ui/components/triss-toast";
import { trpc } from "@/lib/trpc-client";
import { useAuthStore, initAuthStoreListener, fetchAuthStatusWithRetry } from "@/lib/auth-store";
import { executeVerification, type VerificationResult } from "@/lib/verification-flow";

import App from "./App";
import { initSidebarListener } from "./stores/sidebar-store";
import { useProfileStore, initProfileStore } from "./stores/profile-store";
import { initCheckHumanStore } from "../linkedin.content/stores/check-human-store";
import { initMyProfileStore, refetchMyProfile } from "../linkedin.content/stores/my-profile-store";
import { useVerificationStore } from "../linkedin.content/stores/verification-store";
import { scrapeCommentContext, setLastSubmitButton, SELECTORS } from "./PostScraper";

import "../../assets/globals.css";

// === SERVER WARMUP ===
const WARMUP_INTERVAL_MS = 55_000;
let warmupIntervalId: ReturnType<typeof setInterval> | null = null;

async function warmupBackend() {
  try {
    const { isSignedIn } = useAuthStore.getState();
    if (!isSignedIn) {
      console.log("TrustAHuman FB: Skipping warmup (not signed in)");
      return;
    }
    await trpc.verification.warmup.query();
    console.log("TrustAHuman FB: Backend warmed up");
  } catch (err) {
    console.debug("TrustAHuman FB: Warmup failed", err);
  }
}

function startWarmupLoop() {
  setTimeout(() => warmupBackend(), 2000);
  warmupIntervalId = setInterval(warmupBackend, WARMUP_INTERVAL_MS);
  console.log("TrustAHuman FB: Warmup loop started (every 55s)");
}

export default defineContentScript({
  matches: ["https://*.facebook.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Set Triss logo URL for toast notifications
    setTrissLogoUrl(chrome.runtime.getURL("/trusthuman-logo.svg"));

    // Initialize auth store and listener
    initAuthStoreListener();
    // Use retry logic since Clerk cookie sync may take a moment
    fetchAuthStatusWithRetry();

    // Initialize sidebar listener for popup communication
    initSidebarListener();

    // Detect logged-in profile on page load
    initProfileStore();

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

    // TODO: Fill in after DOM inspection
    const commentBoxSelectors = SELECTORS.commentInput.length > 0
      ? SELECTORS.commentInput
      : [
          // Fallback selectors - update after inspection
          '[contenteditable="true"][role="textbox"]',
          '[data-lexical-editor="true"]',
        ];

    function handleTypingStart() {
      if (!isCurrentlyTyping) {
        isCurrentlyTyping = true;
        console.log("TrustAHuman FB: User started typing");
        showTrissToast("typing");
      }

      if (typingTimeoutId) clearTimeout(typingTimeoutId);

      typingTimeoutId = setTimeout(() => {
        if (isCurrentlyTyping) {
          isCurrentlyTyping = false;
          console.log("TrustAHuman FB: User stopped typing");
          hideTrissToast();
        }
      }, 2000);
    }

    function getCommentText(element: HTMLElement): string {
      // Extract text from Lexical editor
      const paragraphs = element.querySelectorAll("p");
      if (paragraphs.length > 0) {
        const text = Array.from(paragraphs)
          .map((p) => p.textContent?.trim() || "")
          .filter(Boolean)
          .join("\n");
        if (text) return text;
      }
      // Fallback to innerText
      return element.innerText?.trim() || element.textContent?.trim() || "";
    }

    // Track last known text per element (Facebook clears text before keydown fires)
    const lastKnownText = new WeakMap<HTMLElement, string>();

    function instrumentCommentBox(element: HTMLElement) {
      if (element.dataset.trustahuman === "instrumented") return;
      element.dataset.trustahuman = "instrumented";

      console.log("TrustAHuman FB: Instrumented comment box", element);

      // Track text on input events (before Facebook clears it)
      element.addEventListener("input", () => {
        handleTypingStart();
        const text = getCommentText(element);
        if (text.length > 0) {
          lastKnownText.set(element, text);
        }
      });

      element.addEventListener("keydown", (e) => {
        // Detect bare Enter key (Facebook's submit shortcut)
        if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          // Use last known text since Facebook clears input before keydown
          const text = lastKnownText.get(element) || "";
          console.log("TrustAHuman FB: Enter pressed, lastKnownText:", text);

          if (text.length > 0) {
            console.log("TrustAHuman FB: Enter key detected with content, triggering verification");
            lastKnownText.delete(element); // Clear after use

            // Find submit button and trigger verification
            const submitContainer = document.querySelector<HTMLElement>("#focused-state-composer-submit");
            if (submitContainer) {
              setLastSubmitButton(submitContainer);
              handleVerification(submitContainer, text).catch(console.error);
            } else {
              console.warn("TrustAHuman FB: Enter pressed but no submit button found");
            }
          }
        }
      });
    }

    function scanForCommentBoxes(root: Element | Document = document) {
      for (const sel of commentBoxSelectors) {
        const elements = root.querySelectorAll<HTMLElement>(sel);
        if (elements.length > 0) {
          console.log(`TrustAHuman FB: Found ${elements.length} comment boxes for "${sel}"`);
        }
        elements.forEach(instrumentCommentBox);
      }
    }

    // === SUBMIT BUTTON DETECTION ===
    // Facebook uses a stable ID for the submit button container: #focused-state-composer-submit
    // This appears when user focuses on comment input
    const instrumentedSubmitContainers = new WeakSet<HTMLElement>();

    // Track pending verifications to avoid duplicates
    let pendingVerification = false;

    function instrumentSubmitContainer(container: HTMLElement) {
      if (instrumentedSubmitContainers.has(container)) return;
      instrumentedSubmitContainers.add(container);
      console.log("TrustAHuman FB: Instrumented submit container", container);

      // Listen on the container - clicks bubble up from the button inside
      container.addEventListener(
        "click",
        () => {
          if (pendingVerification) {
            console.log("TrustAHuman FB: Verification already pending, skipping");
            return;
          }
          console.log("TrustAHuman FB: Submit container clicked, starting verification");
          setLastSubmitButton(container);
          handleVerification(container).catch(console.error);
        },
        { capture: true }
      );
    }

    function scanForSubmitContainers(root: Element | Document = document) {
      // Primary: Look for the stable ID
      const containers = root.querySelectorAll<HTMLElement>("#focused-state-composer-submit");
      if (containers.length > 0) {
        console.log(`TrustAHuman FB: Found ${containers.length} submit containers by ID`);
      }
      containers.forEach(instrumentSubmitContainer);

      // Fallback: aria-label="Comment" buttons
      const buttons = root.querySelectorAll<HTMLElement>('div[role="button"][aria-label="Comment"]');
      buttons.forEach((btn) => {
        // Find parent container or use button directly
        const container = btn.closest("#focused-state-composer-submit") as HTMLElement || btn;
        instrumentSubmitContainer(container);
      });
    }

    // NOTE: Keyboard shortcut (Ctrl+Enter) detection DISABLED for Facebook
    // Facebook's Ctrl+Enter behavior is inconsistent and causes issues.
    // Users must click the submit button to trigger verification.

    async function handleVerification(submitButton: HTMLElement, preCapuredCommentText?: string) {
      // Guard against duplicate calls
      if (pendingVerification) {
        console.log("TrustAHuman FB: Verification already pending, skipping");
        return;
      }
      pendingVerification = true;

      try {
        // Clear typing state
        if (typingTimeoutId) {
          clearTimeout(typingTimeoutId);
          typingTimeoutId = null;
        }
        isCurrentlyTyping = false;

        // Scrape context BEFORE showing toast (DOM may change after submission)
        const commentContext = scrapeCommentContext(submitButton);
        const userProfile = useProfileStore.getState().profile;

        // Use pre-captured text if provided (Enter key detection captures before Facebook clears)
        if (preCapuredCommentText) {
          commentContext.commentText = preCapuredCommentText;
        }

        console.log("TrustAHuman FB: Comment context", commentContext);
        console.log("TrustAHuman FB: User profile", userProfile);

        // Skip if no comment text (empty submission)
        if (!commentContext?.commentText?.trim()) {
          console.log("TrustAHuman FB: No comment text found, skipping verification");
          return;
        }

        // Show "submitted" toast
        showTrissToast("submitted");
        await sleep(1500);

        // Use shared verification flow (handles camera vs biometric based on preferences)
        await executeVerification(
          {
            platform: "facebook",
            userProfile: userProfile ? {
              profileUrl: userProfile.profileUrl,
              profileHandle: userProfile.profileHandle,
              displayName: userProfile.displayName ?? undefined,
              avatarUrl: userProfile.avatarUrl ?? undefined,
            } : null,
            commentContext: {
              commentText: commentContext.commentText,
              commentUrl: undefined, // Facebook comments don't have direct URLs
              post: {
                postUrl: commentContext.post.postUrl ?? undefined,
                postAuthorName: commentContext.post.postAuthorName || "Facebook User",
                postAuthorAvatarUrl: commentContext.post.postAuthorAvatarUrl || "",
                postTextSnippet: commentContext.post.postTextSnippet || "",
              },
            },
          },
          (result: VerificationResult) => {
            // Add to local store
            useVerificationStore.getState().addVerification({
              id: crypto.randomUUID(),
              timestamp: new Date(),
              action: "facebook_comment",
              platform: "facebook",
              verified: result.verified,
              confidence: result.confidence ?? 0,
              faceCount: 1,
              commentText: commentContext.commentText,
              commentUrl: undefined,
              parentUrl: commentContext.post.postUrl || undefined,
              parentAuthorName: commentContext.post.postAuthorName || "Facebook User",
              parentAuthorAvatarUrl: commentContext.post.postAuthorAvatarUrl || "",
              parentTextSnippet: commentContext.post.postTextSnippet || "",
            });

            // Refetch profile to update stats
            if (result.verified) {
              refetchMyProfile();
            }
          }
        );

        console.log("TrustAHuman FB: Flow complete");
      } finally {
        pendingVerification = false;
      }
    }

    // Initial scan
    scanForCommentBoxes();
    scanForSubmitContainers();

    // Watch for new elements (Facebook is an SPA)
    const observer = new MutationObserver(() => {
      scanForCommentBoxes();
      scanForSubmitContainers();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("TrustAHuman FB: Content script loaded");
    console.log("TrustAHuman FB: Watching comment boxes:", commentBoxSelectors);
    console.log("TrustAHuman FB: Watching submit container: #focused-state-composer-submit");
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
