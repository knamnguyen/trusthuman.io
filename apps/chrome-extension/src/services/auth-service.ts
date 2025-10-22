/**
 * Authentication Service for Popup
 *
 * This service communicates with the background service worker
 * for all authentication operations instead of using Clerk directly
 * in the popup context. This follows Clerk's recommended pattern
 * for Chrome extensions.
 */

export interface AuthUser {
  id: string;
  firstName?: string;
  lastName?: string;
  primaryEmailAddress?: {
    emailAddress: string;
  };
}

export interface AuthStatus {
  isSignedIn: boolean;
  user: AuthUser | null;
  session: any;
}

export interface SessionCheck {
  isValid: boolean;
  expiresAt?: number;
}

/**
 * Authentication service that communicates with background service worker
 */
export class AuthService {
  /**
   * Get fresh authentication token from background service
   */
  async getToken(): Promise<string | null> {
    try {
      console.log("AuthService: Requesting token from background...");

      const response = await chrome.runtime.sendMessage({
        action: "getFreshToken",
      });

      if (response?.token) {
        console.log(
          "AuthService: Received token, length:",
          response.token.length,
        );
        return response.token;
      }

      console.warn("AuthService: No token received from background");
      return null;
    } catch (error) {
      console.error("AuthService: Error getting token:", error);
      return null;
    }
  }

  /**
   * Sign in with temp auth token
   */
  async attachTempTokenToSession(tempToken: string) {
    console.log("AuthService: Attaching temp token to session...");
    await chrome.runtime.sendMessage({
      action: "attachTempTokenToSession",
      payload: { tempToken },
    });
    console.log("AuthService: Temp token attached to session.");
  }

  /**
   * Get current authentication status and user information
   */
  async getAuthStatus(): Promise<AuthStatus> {
    try {
      console.log("AuthService: Requesting auth status from background...");

      const response = await chrome.runtime.sendMessage({
        action: "getAuthStatus",
      });

      console.log("AuthService: Received auth status:", {
        isSignedIn: response?.isSignedIn,
        hasUser: !!response?.user,
      });

      return {
        isSignedIn: response?.isSignedIn || false,
        user: response?.user || null,
        session: response?.session || null,
      };
    } catch (error) {
      console.error("AuthService: Error getting auth status:", error);
      return {
        isSignedIn: false,
        user: null,
        session: null,
      };
    }
  }

  /**
   * Sign out user through background service
   */
  async signOut(): Promise<boolean> {
    try {
      console.log("AuthService: Requesting sign out from background...");

      const response = await chrome.runtime.sendMessage({
        action: "signOut",
      });

      console.log("AuthService: Sign out response:", response);
      return response?.success || false;
    } catch (error) {
      console.error("AuthService: Error signing out:", error);
      return false;
    }
  }

  /**
   * Check if current session is valid
   */
  async checkSession(): Promise<SessionCheck> {
    try {
      console.log("AuthService: Checking session validity...");

      const response = await chrome.runtime.sendMessage({
        action: "checkSession",
      });

      return {
        isValid: response?.isValid || false,
        expiresAt: response?.expiresAt,
      };
    } catch (error) {
      console.error("AuthService: Error checking session:", error);
      return { isValid: false };
    }
  }
}

/**
 * Singleton instance of the authentication service
 */
export const authService = new AuthService();
