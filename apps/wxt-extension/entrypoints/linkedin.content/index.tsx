import ReactDOM from "react-dom/client";

import App from "./App";
import { loadFonts } from "../../assets/fonts-loader";

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
        const root = ReactDOM.createRoot(app);

        root.render(<App portalContainer={container} />);

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
