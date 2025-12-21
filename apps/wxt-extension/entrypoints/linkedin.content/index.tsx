import ReactDOM from "react-dom/client";

import App from "./App";
import { loadFonts } from "../../assets/fonts-loader";
import { TRPCReactProvider } from "../../lib/trpc/client";

import "../../assets/globals.css";

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("EngageKit WXT: LinkedIn content script loaded");

    // Load custom fonts
    loadFonts();

    const ui = await createShadowRootUi(ctx, {
      name: "engagekit-sidebar",
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        // Create wrapper div to avoid React warning about mounting to body
        const app = document.createElement("div");
        app.id = "engagekit-root";
        container.append(app);

        // Create React root and render
        // NO ClerkProvider - content script runs on linkedin.com origin
        // Auth handled via background worker + message passing
        const root = ReactDOM.createRoot(app);

        root.render(
          <TRPCReactProvider>
            <App portalContainer={container} />
          </TRPCReactProvider>
        );

        console.log("EngageKit WXT: Sidebar mounted");
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
        console.log("EngageKit WXT: Sidebar unmounted");
      },
    });

    // Mount the UI
    ui.mount();
  },
});
