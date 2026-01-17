import ReactDOM from "react-dom/client";

import { onDomVersionChange } from "@sassy/linkedin-automation/dom/detect";

import { loadFonts } from "../../assets/fonts-loader";
import { initAuthStoreListener, useAuthStore } from "../../lib/auth-store";
import { getTrpcClient, TRPCReactProvider } from "../../lib/trpc/client";
import App from "./App";
import { useAccountStore } from "./stores";
import { initSettingsDBStoreListener, useSettingsDBStore } from "./stores/settings-db-store";
import { autoFetchAllMetrics } from "./utils/data-fetch-mimic/unified-auto-fetch";

import "../../assets/globals.css";

/**
 * Warmup the backend connection and auth cache
 * Fire-and-forget - don't wait for response
 */
const warmupBackend = () => {
  getTrpcClient()
    .user.warmup.query()
    .then(() => {
      console.log("EngageKit WXT: Backend warmup completed");
    })
    .catch((err) => {
      // Silently ignore warmup failures - it's just an optimization
      console.debug(
        "EngageKit WXT: Backend warmup failed (non-critical):",
        err,
      );
    });
};

// Periodic warmup - 55s to stay ahead of server's 60s auth cache TTL
const AUTH_CACHE_REFRESH_MS = 55_000;
let warmupIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Start periodic warmup to keep auth cache fresh on server
 * Runs every 25s (before 30s server TTL expires) while user is signed in
 */
const startPeriodicWarmup = () => {
  if (warmupIntervalId) clearInterval(warmupIntervalId);
  warmupBackend(); // Initial warmup
  warmupIntervalId = setInterval(() => {
    if (useAuthStore.getState().isSignedIn) {
      warmupBackend();
    }
  }, AUTH_CACHE_REFRESH_MS);
};

const stopPeriodicWarmup = () => {
  if (warmupIntervalId) {
    clearInterval(warmupIntervalId);
    warmupIntervalId = null;
  }
};

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Load custom fonts
    loadFonts();

    // Initialize DOM version detection (debug=true logs to console)
    const cleanupDomDetection = onDomVersionChange(() => {}, true);

    // Initialize auth store listener with callbacks to coordinate account data fetching
    // This ensures account data is fetched AFTER auth is confirmed (no race condition)
    const cleanupAuthStore = initAuthStoreListener({
      onSignIn: () => {
        console.log("EngageKit WXT: Sign-in confirmed, fetching account data");
        startPeriodicWarmup();
        useAccountStore.getState().fetchAccountData();
        // Settings are fetched by initSettingsDBStoreListener when matchingAccount is populated
      },
      onSignOut: () => {
        console.log("EngageKit WXT: Sign-out confirmed, clearing account data");
        stopPeriodicWarmup();
        useAccountStore.getState().clear();
        useSettingsDBStore.getState().clear();
      },
    });

    // Initialize settings store listener (fetches when account is selected)
    // Pass account store so settings are only fetched after matchingAccount is populated
    const cleanupSettingsStore = initSettingsDBStoreListener(useAccountStore);

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
          startPeriodicWarmup();
          useAccountStore.getState().fetchAccountData();
          // Settings are fetched by initSettingsDBStoreListener when matchingAccount is populated
        }
      });

    // Unified auto-collect for all analytics metrics
    // - Fetches ALL 6 metrics together (all-or-nothing)
    // - Rate limited by configurable interval (default 2h)
    // - Retries up to 3x with exponential backoff on failure
    const startAutoCollect = async () => {
      const accountId = useAccountStore.getState().currentLinkedIn.profileUrn;

      if (!accountId) {
        console.warn(
          "EngageKit WXT: No LinkedIn account ID detected, skipping auto-collect",
        );
        return;
      }

      console.log(
        `EngageKit WXT: Starting unified auto-collect for account: ${accountId}`,
      );

      try {
        const success = await autoFetchAllMetrics(accountId);
        if (success) {
          console.log(
            "EngageKit WXT: Unified auto-collect completed successfully",
          );
        } else {
          console.log(
            "EngageKit WXT: Unified auto-collect skipped (rate limited or failed)",
          );
        }
      } catch (err) {
        console.error("EngageKit WXT: Unified auto-collect error:", err);
      }
    };

    // Start auto-collect immediately (profile should be extracted by now)
    startAutoCollect();

    // Re-trigger auto-collect when account changes (e.g., user switches LinkedIn accounts)
    let lastAccountId = useAccountStore.getState().currentLinkedIn.profileUrn;
    const unsubscribe = useAccountStore.subscribe((state) => {
      const currentAccountId = state.currentLinkedIn.profileUrn;
      if (currentAccountId && currentAccountId !== lastAccountId) {
        console.log(
          `EngageKit WXT: Account changed to ${currentAccountId}, triggering auto-collect`,
        );
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
        return root;
      },
      onRemove: (root) => {
        stopPeriodicWarmup();
        cleanupAuthStore();
        cleanupSettingsStore();
        cleanupDomDetection();
        unsubscribe();
        root?.unmount();
        console.log("EngageKit WXT: Sidebar unmounted");
      },
    });

    // Mount the UI
    ui.mount();
  },
});
