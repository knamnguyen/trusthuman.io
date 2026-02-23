/**
 * Auth Service - Content script interface to background worker authentication
 *
 * Content scripts run on linkedin.com origin and CANNOT use ClerkProvider directly.
 * This service uses message passing to communicate with the background worker.
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
  } | null;
}

export interface BackgroundMessageRequest {
  action: "getAuthStatus" | "getToken" | "capturePhoto" | "openSetup";
  forceRefresh?: boolean;
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
  async getAuthStatus(forceRefresh?: boolean): Promise<AuthStatus> {
    try {
      const response = await chrome.runtime.sendMessage<
        BackgroundMessageRequest,
        BackgroundMessageResponse<AuthStatus>
      >({
        action: "getAuthStatus",
        forceRefresh,
      });

      if (!response?.success || !response.data) {
        return {
          isSignedIn: false,
          user: null,
          session: null,
        };
      }

      return response.data;
    } catch (error) {
      console.error("TrustAHuman authService: Error getting auth status:", error);
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

      if (!response?.success || !response.data) {
        return null;
      }

      return response.data.token;
    } catch (error) {
      console.error("TrustAHuman authService: Error getting token:", error);
      return null;
    }
  }

  /**
   * Check if user is signed in
   */
  async isAuthenticated(): Promise<boolean> {
    const status = await this.getAuthStatus();
    return status.isSignedIn;
  }
}

export const authService = new AuthService();
