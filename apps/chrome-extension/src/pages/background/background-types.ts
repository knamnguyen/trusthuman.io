/**
 * Background Types
 *
 * Shared interfaces and types used across background script components
 * This file centralizes all type definitions to ensure consistency
 */

export interface AutoCommentingState {
  isRunning: boolean;
  styleGuide: string;
  apiKey: string;
  scrollDuration: number;
  commentDelay: number;
  maxPosts: number;
  duplicateWindow: number;
  commentCount: number;
  feedTabId?: number;
  originalTabId?: number;
}

export interface CommentGeneratorConfig {
  apiKey: string;
  styleGuide: string;
}

export interface CommentGeneratorError {
  message: string;
  stack?: string;
  name: string;
  apiKey: string;
  styleGuide: string;
  postContentLength: number;
  timestamp: string;
  type?: string;
}

export interface MessageHandler {
  (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean | void;
}

export interface MessageRouterDependencies {
  autoCommentingState: AutoCommentingState;
  sendStatusUpdate: (
    status: string,
    updates?: Partial<AutoCommentingState>,
  ) => void;
  updateTodayComments: (newCount: number) => void;
  startAutoCommenting: (
    styleGuide: string,
    scrollDuration: number,
    commentDelay: number,
    maxPosts: number,
    duplicateWindow: number,
    browserbaseMode: boolean,
  ) => Promise<void>;
  generateComment: (postContent: string) => Promise<string>;
}

export interface StatusUpdateMessage {
  action: "statusUpdate";
  status: string;
  commentCount?: number;
  isRunning?: boolean;
  [key: string]: any;
}

export interface BackgroundLogMessage {
  action: "backgroundLog";
  level: "error" | "warn" | "group" | "groupEnd" | "log";
  args: any[];
}

export interface StartAutoCommentingMessage {
  action: "startAutoCommenting";
  styleGuide: string;
  apiKey: string;
  scrollDuration: number;
  commentDelay: number;
  maxPosts: number;
  duplicateWindow: number;
}

export interface GenerateCommentMessage {
  action: "generateComment";
  postContent: string;
}
