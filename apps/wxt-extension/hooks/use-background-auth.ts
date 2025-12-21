/**
 * useBackgroundAuth Hook
 *
 * React hook for content scripts to access authentication via background worker.
 * NO ClerkProvider needed - uses message passing to background worker.
 *
 * Features:
 * - Auto-refresh on visibility change (when user returns to tab after signing in)
 * - Listen for auth state change broadcasts from background worker
 * - Manual refresh via refreshAuth()
 * - Sign out functionality
 */

import { useEffect, useState } from "react";

import type { AuthStatus } from "../lib/auth-service";
import { authService } from "../lib/auth-service";

export const useBackgroundAuth = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isSignedIn: false,
    user: null,
    session: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const refreshAuth = async () => {
    console.log("useBackgroundAuth: refreshAuth() called");
    try {
      const status = await authService.getAuthStatus();
      console.log("useBackgroundAuth: Received auth status:", {
        isSignedIn: status.isSignedIn,
        userId: status.user?.id,
        sessionId: status.session?.id,
        userObject: status.user,
      });
      setAuthStatus(status);
    } catch (error) {
      console.error("useBackgroundAuth: Error refreshing auth:", error);
    }
  };

  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        const status = await authService.getAuthStatus();
        setAuthStatus(status);
      } catch (error) {
        console.error("useBackgroundAuth: Error loading status:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadAuthStatus();

    // Listen for auth state changes from background worker
    const listener = (message: any) => {
      console.log("useBackgroundAuth: Received message:", message);
      if (message.action === "authStateChanged") {
        console.log("useBackgroundAuth: Auth state changed, refreshing...", {
          isSignedIn: message.isSignedIn,
        });
        refreshAuth();
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // Auto-refresh when user returns to tab (after signing in on web)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !authStatus.isSignedIn) {
        console.log(
          "useBackgroundAuth: Tab visible and not signed in, checking auth...",
        );
        refreshAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // Run once on mount

  const signOut = async (): Promise<boolean> => {
    setIsSigningOut(true);
    try {
      const success = await authService.signOut();
      if (success) {
        setAuthStatus({ isSignedIn: false, user: null, session: null });
      }
      return success;
    } catch (error) {
      console.error("useBackgroundAuth: Error signing out:", error);
      return false;
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    isSignedIn: authStatus.isSignedIn,
    isLoaded,
    user: authStatus.user,
    session: authStatus.session,
    signOut,
    refreshAuth,
    isSigningOut,
  };
};
