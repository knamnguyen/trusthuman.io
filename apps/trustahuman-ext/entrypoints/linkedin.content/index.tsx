import ReactDOM from "react-dom/client";

import { trpc } from "@/lib/trpc-client";

import App from "./App";
import { useVerificationStore } from "./stores/verification-store";

import "../../assets/globals.css";

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
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

    // === VERIFICATION DETECTION LOGIC ===
    const instrumented = new WeakSet<HTMLElement>();

    const selectors = [
      'button[data-view-name="comment-post"]',
      'form.comments-comment-box__form button[type="submit"]',
    ];

    function instrumentButton(btn: HTMLElement) {
      if (instrumented.has(btn)) return;
      instrumented.add(btn);
      console.log("TrustAHuman: Instrumented button", btn);

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
      // 1. Capture photo via background
      console.log("TrustAHuman: Sending capturePhoto to background");
      const response = await chrome.runtime.sendMessage({
        action: "capturePhoto",
      });
      console.log("TrustAHuman: capturePhoto response", response);
      if (!response?.base64) {
        console.warn("TrustAHuman: No base64 returned, camera denied or failed");
        return;
      }

      // 2. Call tRPC (async, don't block comment)
      try {
        console.log("TrustAHuman: Calling analyzePhoto, base64 length:", response.base64.length);
        const result = await trpc.verification.analyzePhoto.mutate({
          photoBase64: response.base64,
        });
        console.log("TrustAHuman: analyzePhoto result", result);

        // 3. Add to verification store -> sidebar auto-updates
        useVerificationStore.getState().addVerification({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          action: "comment",
          platform: "linkedin",
          verified: result.verified,
          confidence: result.confidence,
          faceCount: result.faceCount,
          photoBase64: response.base64,
          boundingBox: result.boundingBox ?? null,
        });
        console.log("TrustAHuman: Verification added to store");
      } catch (err) {
        console.error("TrustAHuman: verification failed", err);
      }
    }

    function scanForButtons(root: Element | Document = document) {
      for (const sel of selectors) {
        const buttons = root.querySelectorAll<HTMLElement>(sel);
        if (buttons.length > 0) {
          console.log(`TrustAHuman: Found ${buttons.length} buttons for "${sel}"`);
        }
        buttons.forEach(instrumentButton);
      }
    }

    scanForButtons();

    const observer = new MutationObserver(() => scanForButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("TrustAHuman: Content script loaded, watching selectors:", selectors);
  },
});
