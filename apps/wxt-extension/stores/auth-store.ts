/**
 * Auth Store - Zustand store for authentication state
 *
 * Replaces useBackgroundAuth hook with a singleton store.
 * All components share the same state - no broadcasting needed.
 *
 * Pattern:
 * 1. Initialize on content script load
 * 2. Listen for authStateChanged messages from background
 * 3. Components use useAuthStore() to access/update auth state
 */

import { create } from "zustand";

import type { AuthStatus } from "../lib/auth-service";
import { authService } from "../lib/auth-service";

interface AuthState {
  isSignedIn: boolean;
  isLoaded: boolean;
  isSigningOut: boolean;
  user: AuthStatus["user"];
  session: AuthStatus["session"];
}

interface AuthActions {
  /**
   * Fetch auth status from background worker
   */
  fetchAuthStatus: () => Promise<void>;

  /**
   * Sign out via background worker
   */
  signOut: () => Promise<boolean>;

  /**
   * Clear auth state (called on sign out)
   */
  clear: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  isSignedIn: false,
  isLoaded: false,
  isSigningOut: false,
  user: null,
  session: null,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  fetchAuthStatus: async () => {
    try {
      const status = await authService.getAuthStatus();
      console.log("AuthStore: Fetched auth status:", {
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
      console.error("AuthStore: Error fetching auth status:", error);
      set({ isLoaded: true });
    }
  },

  signOut: async () => {
    set({ isSigningOut: true });
    try {
      const success = await authService.signOut();
      if (success) {
        console.log("AuthStore: Sign out successful");
        set({
          isSignedIn: false,
          user: null,
          session: null,
        });
      }
      return success;
    } catch (error) {
      console.error("AuthStore: Error signing out:", error);
      return false;
    } finally {
      set({ isSigningOut: false });
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
 *
 * @param onSignIn - Callback to run after sign-in is confirmed (e.g., fetch account data)
 * @param onSignOut - Callback to run after sign-out (e.g., clear account data)
 */
export function initAuthStoreListener(options?: {
  onSignIn?: () => void;
  onSignOut?: () => void;
}) {
  // Listen for auth state changes from background (e.g., sign-in via extension-auth page)
  const listener = (message: { action: string; isSignedIn?: boolean }) => {
    if (message.action === "authStateChanged") {
      console.log("AuthStore: Received authStateChanged:", message.isSignedIn);
      if (message.isSignedIn) {
        // User signed in externally, fetch fresh auth status then trigger callback
        useAuthStore
          .getState()
          .fetchAuthStatus()
          .then(() => {
            const { isSignedIn } = useAuthStore.getState();
            if (isSignedIn && options?.onSignIn) {
              console.log("AuthStore: Auth confirmed, triggering onSignIn callback");
              options.onSignIn();
            }
          });
      } else {
        // User signed out externally, clear state and trigger callback
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
