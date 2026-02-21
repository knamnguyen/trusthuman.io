import ReactDOM from "react-dom/client";

import { showTrissToast, hideTrissToast, setTrissLogoUrl } from "@sassy/ui/components/triss-toast";
import { trpc } from "@/lib/trpc-client";

import App from "./App";
import { useVerificationStore } from "./stores/verification-store";

import "../../assets/globals.css";

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Set Triss logo URL for toast notifications
    setTrissLogoUrl(chrome.runtime.getURL("/trusthuman-logo.svg"));

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
      element.addEventListener("keydown", handleTypingStart);
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
      'button[data-view-name="comment-post"]',
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
          handleVerification().catch(console.error);
        },
        { capture: true },
      );
    }

    async function handleVerification() {
      // Clear typing state
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
        typingTimeoutId = null;
      }
      isCurrentlyTyping = false;

      // 1. Show "submitted" toast
      console.log("TrustAHuman: Showing submitted toast");
      showTrissToast("submitted");

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
        showTrissToast("not_verified", "Camera not available. Grant access in settings.");
        return;
      }

      // 4. Show "verifying" toast
      console.log("TrustAHuman: Showing verifying toast");
      showTrissToast("verifying");

      // 5. Call tRPC to analyze photo
      try {
        console.log("TrustAHuman: Calling analyzePhoto, base64 length:", response.base64.length);
        const result = await trpc.verification.analyzePhoto.mutate({
          activityType: "linkedin_comment",
          photoBase64: response.base64,
        });
        console.log("TrustAHuman: analyzePhoto result", result);

        // 6. Show verified/not_verified toast
        if (result.verified) {
          console.log("TrustAHuman: Showing verified toast");
          showTrissToast("verified");
        } else {
          console.log("TrustAHuman: Showing not_verified toast");
          showTrissToast("not_verified");
        }

        // 7. Add to verification store -> sidebar auto-updates
        useVerificationStore.getState().addVerification({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          action: "linkedin_comment",
          platform: "linkedin",
          verified: result.verified,
          confidence: result.confidence,
          faceCount: result.faceCount,
          photoBase64: response.base64,
          boundingBox: null,
        });
        console.log("TrustAHuman: Verification added to store");

        // 8. Wait, then show photo_deleted toast
        await sleep(3000);
        console.log("TrustAHuman: Showing photo_deleted toast");
        showTrissToast("photo_deleted");

        // 9. Wait, then hide toast (back to idle)
        await sleep(3000);
        hideTrissToast();
        console.log("TrustAHuman: Flow complete, toast hidden");

      } catch (err) {
        console.error("TrustAHuman: verification failed", err);
        showTrissToast("not_verified", "Verification failed. Try again.");
      }
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

    // Watch for new elements
    const observer = new MutationObserver(() => {
      scanForCommentBoxes();
      scanForButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("TrustAHuman: Content script loaded");
    console.log("TrustAHuman: Watching comment boxes:", commentBoxSelectors);
    console.log("TrustAHuman: Watching submit buttons:", submitButtonSelectors);
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
