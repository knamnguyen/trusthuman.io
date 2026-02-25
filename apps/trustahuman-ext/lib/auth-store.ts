/**
 * Auth Store - Zustand store for authentication state
 *
 * All components share the same state.
 * Listens for authStateChanged messages from background.
 */

import { create } from "zustand";

import type { AuthStatus } from "./auth-service";
import { authService } from "./auth-service";

interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: AuthStatus["user"];
  session: AuthStatus["session"];
}

interface AuthActions {
  fetchAuthStatus: (forceRefresh?: boolean) => Promise<void>;
  clear: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  isSignedIn: false,
  isLoaded: false,
  user: null,
  session: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  fetchAuthStatus: async (forceRefresh?: boolean) => {
    try {
      const status = await authService.getAuthStatus(forceRefresh);
      console.log("TrustAHuman AuthStore: Fetched auth status:", {
        isSignedIn: status.isSignedIn,
        userId: status.user?.id,
      });
      set({
        isSignedIn: status.isSignedIn,
        user: status.user,
        session: status.session,
        isLoaded: true,
      });
    } catch (error) {
      console.error("TrustAHuman AuthStore: Error fetching auth status:", error);
      set({ isLoaded: true });
    }
  },

  clear: () => {
    set({
      isSignedIn: false,
      user: null,
      session: null,
    });
  },
}));

/**
 * Fetch auth status with retry logic
 * Clerk cookie sync may take a moment after page load
 */
export async function fetchAuthStatusWithRetry(maxRetries = 3, delayMs = 1500) {
  for (let i = 0; i < maxRetries; i++) {
    await useAuthStore.getState().fetchAuthStatus(i > 0); // Force refresh on retry
    const { isSignedIn } = useAuthStore.getState();

    if (isSignedIn) {
      console.log(`TrustAHuman AuthStore: Signed in on attempt ${i + 1}`);
      return true;
    }

    if (i < maxRetries - 1) {
      console.log(`TrustAHuman AuthStore: Not signed in, retrying in ${delayMs}ms (attempt ${i + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  console.log("TrustAHuman AuthStore: Not signed in after all retries");
  return false;
}

/**
 * Initialize auth store listener for background messages
 * Call this from content script initialization
 */
export function initAuthStoreListener(options?: {
  onSignIn?: () => void;
  onSignOut?: () => void;
}) {
  const listener = (message: { action: string; isSignedIn?: boolean }) => {
    if (message.action === "authStateChanged") {
      console.log("TrustAHuman AuthStore: Received authStateChanged:", message.isSignedIn);
      if (message.isSignedIn) {
        useAuthStore
          .getState()
          .fetchAuthStatus()
          .then(() => {
            const { isSignedIn } = useAuthStore.getState();
            if (isSignedIn && options?.onSignIn) {
              options.onSignIn();
            }
          });
      } else {
        useAuthStore.getState().clear();
        options?.onSignOut?.();
      }
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}

// Storage key for tracking if we've prompted sign-in this session
const SIGN_IN_PROMPTED_KEY = "trusthuman_signin_prompted";

/**
 * Check if user is signed in after initial load, and auto-redirect to sign-in if not.
 * Uses session storage to only prompt once per browser session.
 */
export function autoPromptSignIn() {
  // Check if we've already prompted in this session
  const alreadyPrompted = sessionStorage.getItem(SIGN_IN_PROMPTED_KEY);
  if (alreadyPrompted) {
    console.log("TrustAHuman AuthStore: Already prompted sign-in this session, skipping");
    return;
  }

  // Wait for auth status to be loaded, then check if signed in
  const unsubscribe = useAuthStore.subscribe((state) => {
    if (state.isLoaded) {
      unsubscribe();

      if (!state.isSignedIn) {
        console.log("TrustAHuman AuthStore: User not signed in, auto-redirecting to sign-in");
        // Mark as prompted so we don't keep redirecting
        sessionStorage.setItem(SIGN_IN_PROMPTED_KEY, "true");
        // Open sign-in page via background
        chrome.runtime.sendMessage({ action: "openSignIn" });
      } else {
        console.log("TrustAHuman AuthStore: User already signed in");
      }
    }
  });

  // Also check current state in case already loaded
  const { isLoaded, isSignedIn } = useAuthStore.getState();
  if (isLoaded) {
    unsubscribe();
    if (!isSignedIn) {
      console.log("TrustAHuman AuthStore: User not signed in (immediate check), auto-redirecting");
      sessionStorage.setItem(SIGN_IN_PROMPTED_KEY, "true");
      chrome.runtime.sendMessage({ action: "openSignIn" });
    }
  }
}
