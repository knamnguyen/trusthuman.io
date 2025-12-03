import { useEffect, useState } from "react";

import type { AuthStatus } from "../services/auth-service";
import { authService } from "../services/auth-service";

/**
 * Custom hook that provides authentication state via background service worker
 * This replaces Clerk hooks in the popup context
 */
export const useBackgroundAuth = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isSignedIn: false,
    user: null,
    session: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Load initial authentication status
  useEffect(() => {
    const loadAuthStatus = async () => {
      try {
        console.log("useBackgroundAuth: Loading initial auth status...");
        const status = await authService.getAuthStatus();
        setAuthStatus(status);
        setIsLoaded(true);
        console.log("useBackgroundAuth: Auth status loaded:", {
          isSignedIn: status.isSignedIn,
          hasUser: !!status.user,
        });
      } catch (error) {
        console.error("useBackgroundAuth: Error loading auth status:", error);
        setIsLoaded(true);
      }
    };

    loadAuthStatus();
  }, []);

  /**
   * Sign out user
   */
  const signOut = async (): Promise<boolean> => {
    setIsSigningOut(true);

    try {
      console.log("useBackgroundAuth: Signing out...");
      const success = await authService.signOut();

      if (success) {
        setAuthStatus({
          isSignedIn: false,
          user: null,
          session: null,
        });
        console.log("useBackgroundAuth: Sign out successful");
      }

      return success;
    } catch (error) {
      console.error("useBackgroundAuth: Error during sign out:", error);
      return false;
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * Refresh authentication status
   */
  const refreshAuth = async () => {
    try {
      console.log("useBackgroundAuth: Refreshing auth status...");
      const status = await authService.getAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error("useBackgroundAuth: Error refreshing auth status:", error);
    }
  };

  /**
   * Check if session is still valid
   */
  const checkSession = async () => {
    try {
      const sessionCheck = await authService.checkSession();

      if (!sessionCheck.isValid && authStatus.isSignedIn) {
        // Session is invalid, update auth status
        setAuthStatus({
          isSignedIn: false,
          user: null,
          session: null,
        });
      }

      return sessionCheck;
    } catch (error) {
      console.error("useBackgroundAuth: Error checking session:", error);
      return { isValid: false };
    }
  };

  return {
    // Auth state (compatible with Clerk hooks)
    isSignedIn: authStatus.isSignedIn,
    isLoaded,
    user: authStatus.user,
    session: authStatus.session,

    // Auth actions
    signOut,
    refreshAuth,
    checkSession,

    // UI state
    isSigningOut,

    // Raw auth status
    authStatus,
  };
};
