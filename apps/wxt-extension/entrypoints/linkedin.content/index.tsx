import ReactDOM from "react-dom/client";

import App from "./App";
import { loadFonts } from "../../assets/fonts-loader";
import { initAuthStoreListener, useAuthStore } from "../../stores/auth-store";
import { TRPCReactProvider } from "../../lib/trpc/client";
import { useAccountStore } from "./stores";

import "../../assets/globals.css";

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("EngageKit WXT: LinkedIn content script loaded");

    // Load custom fonts
    loadFonts();

    // Initialize auth store listener with callbacks to coordinate account data fetching
    // This ensures account data is fetched AFTER auth is confirmed (no race condition)
    const cleanupAuthStore = initAuthStoreListener({
      onSignIn: () => {
        console.log("EngageKit WXT: Sign-in confirmed, fetching account data");
        useAccountStore.getState().fetchAccountData();
      },
      onSignOut: () => {
        console.log("EngageKit WXT: Sign-out confirmed, clearing account data");
        useAccountStore.getState().clear();
      },
    });

    // Always extract current LinkedIn profile from page (for SignInOverlay)
    useAccountStore.getState().refreshCurrentLinkedIn();

    // Fetch initial auth status and account data if already signed in
    useAuthStore.getState().fetchAuthStatus().then(() => {
      const { isSignedIn } = useAuthStore.getState();
      if (isSignedIn) {
        console.log("EngageKit WXT: User already signed in, fetching account data");
        useAccountStore.getState().fetchAccountData();
      }
    });

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
            <App shadowRoot={container} />
          </TRPCReactProvider>
        );

        console.log("EngageKit WXT: Sidebar mounted");
        return root;
      },
      onRemove: (root) => {
        cleanupAuthStore();
        root?.unmount();
        console.log("EngageKit WXT: Sidebar unmounted");
      },
    });

    // Mount the UI
    ui.mount();
  },
});
