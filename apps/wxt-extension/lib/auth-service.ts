/**
 * Auth Service - Content script interface to background worker authentication
 *
 * This service provides message-based authentication for content scripts.
 * Content scripts run on linkedin.com origin and CANNOT use ClerkProvider directly.
 *
 * Pattern:
 * 1. Content script calls authService methods
 * 2. authService sends chrome.runtime.sendMessage to background worker
 * 3. Background worker has ClerkProvider and handles actual auth
 * 4. Background worker responds with auth status
 */

export interface AuthStatus {
  isSignedIn: boolean;
  user: {
    id: string;
    emailAddress: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
  } | null;
  session: {
    id: string;
    lastActiveToken: {
      jwt: string;
    } | null;
  } | null;
}

export interface BackgroundMessageRequest {
  action: "getAuthStatus" | "getToken" | "signOut";
}

export interface BackgroundMessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class AuthService {
  /**
   * Get current authentication status from background worker
   */
  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const response = await chrome.runtime.sendMessage<
        BackgroundMessageRequest,
        BackgroundMessageResponse<AuthStatus>
      >({
        action: "getAuthStatus",
      });

      if (!response.success || !response.data) {
        return {
          isSignedIn: false,
          user: null,
          session: null,
        };
      }

      return response.data;
    } catch (error) {
      console.error("authService: Error getting auth status:", error);
      return {
        isSignedIn: false,
        user: null,
        session: null,
      };
    }
  }

  /**
   * Get fresh JWT token from background worker
   */
  async getToken(): Promise<string | null> {
    try {
      const response = await chrome.runtime.sendMessage<
        BackgroundMessageRequest,
        BackgroundMessageResponse<{ token: string | null }>
      >({
        action: "getToken",
      });

      if (!response.success || !response.data) {
        return null;
      }

      return response.data.token;
    } catch (error) {
      console.error("authService: Error getting token:", error);
      return null;
    }
  }

  /**
   * Sign out via background worker
   */
  async signOut(): Promise<boolean> {
    try {
      const response = await chrome.runtime.sendMessage<
        BackgroundMessageRequest,
        BackgroundMessageResponse<{ success: boolean }>
      >({
        action: "signOut",
      });

      return response.success && response.data?.success === true;
    } catch (error) {
      console.error("authService: Error signing out:", error);
      return false;
    }
  }
}

export const authService = new AuthService();
