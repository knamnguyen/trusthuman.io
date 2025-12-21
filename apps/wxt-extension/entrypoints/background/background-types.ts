/**
 * Background Worker Types for WXT Extension
 *
 * Defines types for message handling and dependencies
 */

import type { createClerkClient } from "@clerk/chrome-extension/background";

/**
 * Auth-related message actions
 */
export type MessageAction = "getAuthStatus" | "getToken" | "signOut";

/**
 * Message request from content script
 */
export interface MessageRequest {
  action: MessageAction;
}

/**
 * Message response to content script
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Auth status returned to content script
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

/**
 * Message handler function type
 */
export type MessageHandler = (
  request: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => boolean | void;

/**
 * Dependencies required by MessageRouter
 */
export interface MessageRouterDependencies {
  getClerkClient: () => Promise<Awaited<ReturnType<typeof createClerkClient>>>;
}
