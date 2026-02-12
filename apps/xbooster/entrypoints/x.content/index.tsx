import ReactDOM from "react-dom/client";

import { initStealthHeaders } from "@/lib/x-stealth-headers";

import App from "./App";

import "../../assets/globals.css";

export default defineContentScript({
  matches: ["https://*.x.com/*", "https://x.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "xbooster-sidebar",
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        const appEl = document.createElement("div");
        appEl.id = "xbooster-root";
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

    // Initialize stealth headers early (non-blocking)
    // so they are ready by the time the first API call happens
    initStealthHeaders().catch((err) => {
      console.warn("xBooster: Stealth headers init error:", err);
    });

    console.log("xBooster: Content script loaded");
  },
});
