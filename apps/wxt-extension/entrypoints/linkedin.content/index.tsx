import ReactDOM from "react-dom/client";

import { loadFonts } from "../../assets/fonts-loader";
import { TRPCReactProvider } from "../../lib/trpc/client";
import { initAuthStoreListener, useAuthStore } from "../../stores/auth-store";
import App from "./App";
import { useAccountStore } from "./stores";
import { contentImpressionsCollector } from "./utils/data-fetch-mimic/content-impressions-collector";
import {
  commentsCollector,
  // postsCollector, // COMMENTED OUT - Replaced with invite count
} from "./utils/data-fetch-mimic/dashboard-activity-collectors";
import { followersCollector } from "./utils/data-fetch-mimic/followers-collector";
import { inviteCountCollector } from "./utils/data-fetch-mimic/invite-count-collector";
import { profileImpressionsCollector } from "./utils/data-fetch-mimic/profile-impressions-collector";
import { profileViewsCollector } from "./utils/data-fetch-mimic/profile-views-collector";

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
    useAuthStore
      .getState()
      .fetchAuthStatus()
      .then(() => {
        const { isSignedIn } = useAuthStore.getState();
        if (isSignedIn) {
          console.log(
            "EngageKit WXT: User already signed in, fetching account data",
          );
          useAccountStore.getState().fetchAccountData();
        }
      });

    // Auto-collect analytics data (account-specific)
    // Wait for account data to be loaded, then trigger auto-collect with account ID
    const startAutoCollect = () => {
      const accountId = useAccountStore.getState().currentLinkedIn.miniProfileId;

      if (!accountId) {
        console.warn("EngageKit WXT: No LinkedIn account ID detected, skipping auto-collect");
        return;
      }

      console.log(`EngageKit WXT: Starting auto-collect for account: ${accountId}`);

      // Auto-collect profile views (non-blocking, rate-limited to once per 24h)
      profileViewsCollector.autoCollect(accountId).catch((err) => {
        console.error(
          "EngageKit WXT: Failed to auto-collect profile views:",
          err,
        );
      });

      // Auto-collect dashboard activity (posts and comments)
      // COMMENTED OUT - Replaced with invite count
      // postsCollector.autoCollect(accountId).catch((err) => {
      //   console.error("EngageKit WXT: Failed to auto-collect posts:", err);
      // });

      commentsCollector.autoCollect(accountId).catch((err) => {
        console.error("EngageKit WXT: Failed to auto-collect comments:", err);
      });

      // Auto-collect invite count
      inviteCountCollector.autoCollect(accountId).catch((err) => {
        console.error("EngageKit WXT: Failed to auto-collect invite count:", err);
      });

      // Auto-collect followers
      followersCollector.autoCollect(accountId).catch((err) => {
        console.error("EngageKit WXT: Failed to auto-collect followers:", err);
      });

      // Auto-collect profile impressions
      profileImpressionsCollector.autoCollect(accountId).catch((err) => {
        console.error(
          "EngageKit WXT: Failed to auto-collect profile impressions:",
          err,
        );
      });

      // Auto-collect content impressions
      contentImpressionsCollector.autoCollect(accountId).catch((err) => {
        console.error(
          "EngageKit WXT: Failed to auto-collect content impressions:",
          err,
        );
      });
    };

    // Start auto-collect immediately (profile should be extracted by now)
    startAutoCollect();

    // Re-trigger auto-collect when account changes (e.g., user switches LinkedIn accounts)
    let lastAccountId = useAccountStore.getState().currentLinkedIn.miniProfileId;
    const unsubscribe = useAccountStore.subscribe((state) => {
      const currentAccountId = state.currentLinkedIn.miniProfileId;
      if (currentAccountId && currentAccountId !== lastAccountId) {
        console.log(`EngageKit WXT: Account changed to ${currentAccountId}, triggering auto-collect`);
        lastAccountId = currentAccountId;
        startAutoCollect();
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
          </TRPCReactProvider>,
        );

        console.log("EngageKit WXT: Sidebar mounted");
        return root;
      },
      onRemove: (root) => {
        cleanupAuthStore();
        unsubscribe();
        root?.unmount();
        console.log("EngageKit WXT: Sidebar unmounted");
      },
    });

    // Mount the UI
    ui.mount();
  },
});
