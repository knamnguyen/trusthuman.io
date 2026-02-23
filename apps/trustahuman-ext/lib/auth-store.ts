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

export const useAuthStore = create<AuthStore>((set) => ({
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
