# WXT Extension - Clerk Auth with Sidebar UI

**Plan Date:** December 12, 2025
**Status:** Updated - Awaiting Approval
**Complexity:** Medium

## Executive Summary

Migrate Clerk authentication from `chrome-extension` (Vite + CRXJS) to `wxt-extension` (WXT framework) with **sidebar-first authentication UI**. Auth UI will be embedded in LinkedIn sidebar content script. Authentication uses **button-redirect flow** (opens web app in new tab, matches chrome-extension pattern).

## Requirements

### User Requirements
1. **Sidebar Auth UI**: Primary authentication happens in LinkedIn sidebar (not popup)
2. **Button-Redirect Auth Flow**: Click button → opens web app in new tab → sign in → return and refresh
3. **Skip Popup**: Leave popup as-is, focus only on sidebar implementation
4. **Auth Flow**: Use redirect to web app (proven working in chrome-extension)

### Technical Requirements
1. Maintain tRPC v11 API compatibility
2. Session sync with web app via syncHost
3. Background script as auth source of truth
4. Content script messaging for token retrieval
5. Dynamic port configuration from `.env` and `.env.local`

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        WXT Extension                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Background Service Worker (Auth Manager)                      │
│  ├─ createClerkClient() (on-demand, fresh session)            │
│  ├─ MessageRouter (centralized message handling)              │
│  ├─ Message handlers (getToken, getAuthStatus, signOut)       │
│  ├─ Session monitoring (alarms, tab listeners)                │
│  └─ Storage: chrome.storage.local (simple direct access)      │
│                    ▲                                           │
│                    │ chrome.runtime.sendMessage                │
│                    │                                           │
│  LinkedIn Sidebar (Content Script - linkedin.com origin)      │
│  ├─ NO ClerkProvider (content script can't use it)           │
│  ├─ useBackgroundAuth() hook (messages background worker)    │
│  ├─ Auth button → opens ${syncHostUrl}/extension-auth        │
│  ├─ Auto-refresh on visibility change                        │
│  ├─ Toggle button                                             │
│  ├─ Sidebar panel (Sheet from @sassy/ui)                     │
│  └─ tRPC client                                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Authorization: Bearer <token>
                                  ▼
                       ┌────────────────────┐
                       │  Vercel API        │
                       │  (tRPC v11)        │
                       └────────────────────┘
```

## Key Decisions & Trade-offs

### Decision 1: Button-Redirect Auth vs Embedded Clerk UI

**Chosen:** Button-redirect to web app

**Rationale:**
- Chrome extension already uses this pattern successfully in popup
- Content scripts run on `linkedin.com` origin → cannot use ClerkProvider
- Avoids CSP limitations in content scripts
- Simpler implementation (no Clerk components in sidebar)
- OAuth/SAML work seamlessly
- Users familiar with web app auth flow
- Background worker syncs auth via `syncHost` + cookies

**Pattern:**
1. Sidebar checks auth via `useBackgroundAuth()` hook (messages background worker)
2. If not signed in → shows "Sign In to EngageKit" button
3. Click opens `${syncHostUrl}/extension-auth` in new tab
4. User signs in via web app (Clerk hosted UI sets cookies)
5. Background worker detects auth URL visit → auto-checks session
6. Sidebar auto-refreshes on visibility change or user can manually refresh
7. Extension checks auth with background script via `createClerkClient({ syncHost })`
8. Sidebar reloads showing authenticated state

**How Auth Sync Works:**
- Background worker: `createClerkClient({ syncHost })` reads cookies from web app domain
- Content script: Uses `chrome.runtime.sendMessage({ action: "getAuthStatus" })` to check auth
- Auto-refresh triggers: Tab visibility change, auth URL detection, periodic alarms
- No ClerkProvider needed in content script (proven pattern from chrome-extension)

**Sources:**
- [Clerk Chrome Extension Quickstart](https://clerk.com/docs/chrome-extension/getting-started/quickstart)
- Chrome extension implementation: `apps/chrome-extension/src/pages/popup/components/auth.tsx`

### Decision 2: Storage Pattern (Simplified)

**Chosen:** Direct `chrome.storage.local` access (no service class)

**Rationale:**
- Chrome extension uses complex TanStack Store + server sync for popup state
- Sidebar only needs simple open/closed state persistence
- No need for reactive store or server persistence for sidebar UI state
- Options page already uses simple direct storage pattern successfully

**Implementation:**
```typescript
// Simple direct access
chrome.storage.local.get(['sidebar_open'], (result) => {
  setIsOpen(result.sidebar_open ?? true); // default: open on first install
});

chrome.storage.local.set({ sidebar_open: false });

// Optional: Listen to changes
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.sidebar_open) {
    setIsOpen(changes.sidebar_open.newValue);
  }
});
```

### Decision 3: MessageRouter Pattern

**Chosen:** Centralized MessageRouter class in background script

**Rationale:**
- Chrome extension uses this pattern for clean organization
- Separates message handling logic from background script main file
- Type-safe with proper interfaces
- Testable (dependency injection)
- Easy to add new handlers

**Benefits:**
- Routes messages by action
- Consistent async/sync response patterns (return true/false)
- Centralized error handling
- Clean separation of concerns

### Decision 4: No ClerkProvider in Content Script

**Chosen:** Content script uses message passing only (NO ClerkProvider)

**Rationale:**
- Content scripts execute on host page origin (`linkedin.com`)
- ClerkProvider cannot establish session on non-extension origins
- Chrome-extension proves this pattern works: popup has ClerkProvider, content script does not
- Simpler architecture with clear separation of concerns
- Background worker is single source of truth for auth

**Why This Is Critical:**
- **Origin mismatch**: ClerkProvider needs `chrome-extension://ID` to work
- **Cookies**: Clerk authentication cookies are domain-specific
- **Session establishment**: Cannot create Clerk session on `linkedin.com` origin
- **iframe workaround exists** but adds complexity and doesn't match our button-redirect UX

**Proof from chrome-extension:**
- `apps/chrome-extension/src/pages/popup/index.tsx` - Has ClerkProvider ✅
- `apps/chrome-extension/src/pages/content/index.tsx` - NO ClerkProvider ✅
- Content script uses direct `chrome.runtime.sendMessage` for auth checks

### Decision 5: Dynamic Port Configuration

**Chosen:** Read PORT from environment, calculate derived ports

**Rationale:**
- Monorepo supports multiple worktrees with different ports
- Main repo: PORT=3000, worktrees override in `.env.local`
- WXT auto-calculates: `wxtPort = PORT + 2`
- No hardcoded localhost:3000

**Priority:**
```
VITE_NGROK_URL → VITE_NEXTJS_URL → http://localhost:${PORT} → production
```

## Implementation Plan

### Phase 1: Dependencies & Setup

**1.1 Install Dependencies**

Add to `apps/wxt-extension/package.json`:
```json
{
  "dependencies": {
    "@clerk/chrome-extension": "^2.5.2",
    "@clerk/clerk-react": "^5.32.3",
    "@sassy/api": "workspace:*",
    "@sassy/ui": "workspace:*",
    "@tanstack/react-query": "^5.0.0",
    "@trpc/client": "catalog:",
    "@trpc/tanstack-react-query": "catalog:",
    "superjson": "2.2.2"
  }
}
```

**1.2 Environment Variables**

Environment variables already exist in root `.env`:
```bash
PORT=3000  # Can be overridden in .env.local for worktrees
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_FRONTEND_API="tolerant-hagfish-1.clerk.accounts.dev"
VITE_NGROK_URL=https://your-ngrok.ngrok-free.app  # optional
NEXTJS_URL=http://localhost:3000  # optional
```

### Phase 2: Utility Files

**2.1 Sync Host Utility**

**File:** `apps/wxt-extension/lib/get-sync-host.ts`

```typescript
const PROD_SYNC_HOST = "https://clerk.engagekit.io";

export const getSyncHost = (): string => {
  if (import.meta.env.VITE_NEXTJS_URL) {
    return import.meta.env.VITE_NEXTJS_URL;
  }

  if (import.meta.env.MODE === "production") {
    return PROD_SYNC_HOST;
  }

  // Development: use PORT from env
  const port = import.meta.env.VITE_PORT || import.meta.env.PORT || 3000;
  return `http://localhost:${port}`;
};

export const getSyncHostUrl = () => {
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }
  if (import.meta.env.VITE_NEXTJS_URL) {
    return import.meta.env.VITE_NEXTJS_URL;
  }
  if (import.meta.env.MODE === "production") {
    return "https://engagekit.io";
  }

  // Development: use PORT from env
  const port = import.meta.env.VITE_PORT || import.meta.env.PORT || 3000;
  return `http://localhost:${port}`;
};
```

**2.2 Auth Service**

**File:** `apps/wxt-extension/lib/auth-service.ts`

```typescript
export interface AuthUser {
  id: string;
  firstName?: string;
  lastName?: string;
  primaryEmailAddress?: { emailAddress: string };
}

export interface AuthStatus {
  isSignedIn: boolean;
  user: AuthUser | null;
  session: any;
}

export class AuthService {
  async getToken(): Promise<string | null> {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getFreshToken",
      });
      return response?.token || null;
    } catch (error) {
      console.error("AuthService: Error getting token:", error);
      return null;
    }
  }

  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getAuthStatus",
      });
      return {
        isSignedIn: response?.isSignedIn || false,
        user: response?.user || null,
        session: response?.session || null,
      };
    } catch (error) {
      console.error("AuthService: Error getting auth status:", error);
      return { isSignedIn: false, user: null, session: null };
    }
  }

  async signOut(): Promise<boolean> {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "signOut",
      });
      return response?.success || false;
    } catch (error) {
      console.error("AuthService: Error signing out:", error);
      return false;
    }
  }
}

export const authService = new AuthService();
```

### Phase 3: Background Script with MessageRouter

**3.1 Background Types**

**File:** `apps/wxt-extension/entrypoints/background/background-types.ts`

```typescript
export interface MessageRouterDependencies {
  getClerkClient: () => Promise<any>;
}

export type MessageHandler = (
  request: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => boolean | void;
```

**3.2 MessageRouter**

**File:** `apps/wxt-extension/entrypoints/background/message-router.ts`

```typescript
import type {
  MessageHandler,
  MessageRouterDependencies,
} from "./background-types";

/**
 * Message Router Service
 *
 * SERVICE CLASS - Handles message routing and processing
 * - Routes incoming messages to appropriate handlers
 * - Organizes all message handling logic in clean methods
 * - Manages async response patterns consistently
 * - Centralizes message validation and error handling
 */

export class MessageRouter {
  private dependencies: MessageRouterDependencies;

  constructor(dependencies: MessageRouterDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Main message handler that routes messages to appropriate handlers
   */
  handleMessage: MessageHandler = (request, sender, sendResponse) => {
    switch (request.action) {
      case "getFreshToken":
        return this.handleGetFreshToken(request, sender, sendResponse);
      case "getAuthStatus":
        return this.handleGetAuthStatus(request, sender, sendResponse);
      case "signOut":
        return this.handleSignOut(request, sender, sendResponse);
      case "checkSession":
        return this.handleCheckSession(request, sender, sendResponse);
      default:
        console.warn("MessageRouter: Unknown action:", request.action);
        sendResponse({ success: false, error: "Unknown action" });
        return false;
    }
  };

  private handleGetFreshToken: MessageHandler = (
    request,
    sender,
    sendResponse,
  ) => {
    this.dependencies
      .getClerkClient()
      .then(async (clerk) => {
        if (!clerk.session) {
          sendResponse({ token: null });
          return;
        }
        const token = await clerk.session.getToken();
        sendResponse({ token });
      })
      .catch((error) => {
        console.error("MessageRouter: Error getting token:", error);
        sendResponse({ token: null });
      });
    return true; // Async response
  };

  private handleGetAuthStatus: MessageHandler = (
    request,
    sender,
    sendResponse,
  ) => {
    this.dependencies
      .getClerkClient()
      .then((clerk) => {
        sendResponse({
          isSignedIn: !!clerk.session,
          user: clerk.user || null,
          session: clerk.session || null,
        });
      })
      .catch((error) => {
        console.error("MessageRouter: Error getting auth status:", error);
        sendResponse({ isSignedIn: false, user: null, session: null });
      });
    return true; // Async response
  };

  private handleSignOut: MessageHandler = (request, sender, sendResponse) => {
    this.dependencies
      .getClerkClient()
      .then(async (clerk) => {
        if (clerk.session) {
          await clerk.signOut();
        }
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("MessageRouter: Error signing out:", error);
        sendResponse({ success: false });
      });
    return true; // Async response
  };

  private handleCheckSession: MessageHandler = (
    request,
    sender,
    sendResponse,
  ) => {
    this.dependencies
      .getClerkClient()
      .then(async (clerk) => {
        if (!clerk.session) {
          sendResponse({ isValid: false });
          return;
        }
        const token = await clerk.session.getToken();
        sendResponse({
          isValid: !!token,
          expiresAt: clerk.session.expireAt.getTime(),
        });
      })
      .catch((error) => {
        console.error("MessageRouter: Error checking session:", error);
        sendResponse({ isValid: false });
      });
    return true; // Async response
  };
}
```

**3.3 Background Script**

**File:** `apps/wxt-extension/entrypoints/background.ts`

```typescript
import { createClerkClient } from "@clerk/chrome-extension/background";
import { getSyncHost } from "../lib/get-sync-host";
import { MessageRouter } from "./background/message-router";

export default defineBackground(() => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const syncHost = getSyncHost();

  if (!publishableKey) {
    throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required");
  }

  console.log("Background: Initializing with syncHost:", syncHost);

  // On-demand Clerk client (always creates fresh instance)
  const getClerkClient = async () => {
    return createClerkClient({ publishableKey, syncHost });
  };

  // Initialize MessageRouter
  const messageRouter = new MessageRouter({
    getClerkClient,
  });

  // Register message handler
  chrome.runtime.onMessage.addListener(messageRouter.handleMessage);

  // Session monitoring
  chrome.runtime.onStartup.addListener(() => {
    console.log("Background: Extension startup");
  });

  chrome.runtime.onInstalled.addListener((details) => {
    console.log("Background: Extension installed/updated:", details.reason);

    // First install: ensure sidebar opens
    if (details.reason === "install") {
      chrome.storage.local.set({
        sidebar_open: true,
      });
    }
  });

  // Monitor auth URL visits
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      const authDomains = [
        "clerk.accounts.dev",
        "clerk.dev",
        "localhost",
        "engagekit.io",
      ];

      const isAuthUrl = authDomains.some((domain) =>
        tab.url?.includes(domain)
      );

      if (isAuthUrl) {
        // Refresh auth status after potential sign-in
        setTimeout(async () => {
          const clerk = await getClerkClient();
          const isSignedIn = !!clerk.session;
          console.log("Background: Auth check after URL visit:", { isSignedIn });

          // Notify content scripts of auth state change
          if (isSignedIn) {
            chrome.runtime.sendMessage({
              action: "authStateChanged",
              isSignedIn: true
            }).catch(() => {
              // Content script may not be loaded yet, ignore error
            });
          }
        }, 2000);
      }
    }
  });

  // Periodic auth checks via alarms
  chrome.alarms.create("authCheck", { periodInMinutes: 2 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "authCheck") {
      getClerkClient().then((clerk) => {
        console.log("Background: Periodic auth check:", {
          isSignedIn: !!clerk.session,
        });
      });
    }
  });
});
```

### Phase 4: tRPC Client

**4.1 Query Client**

**File:** `apps/wxt-extension/lib/trpc/query-client.ts`

```typescript
import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
      },
    },
  });
```

**4.2 tRPC Client**

**File:** `apps/wxt-extension/lib/trpc/client.ts`

```typescript
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";
import type { AppRouter } from "@sassy/api";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  return (clientQueryClientSingleton ??= createQueryClient());
};

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

const getServerUrl = (): string => {
  if (import.meta.env.VITE_NGROK_URL) {
    return `${import.meta.env.VITE_NGROK_URL}/api/trpc`;
  }
  if (import.meta.env.VITE_NEXTJS_URL) {
    return `${import.meta.env.VITE_NEXTJS_URL}/api/trpc`;
  }
  if (import.meta.env.DEV) {
    const port = import.meta.env.VITE_PORT || import.meta.env.PORT || 3000;
    return `http://localhost:${port}/api/trpc`;
  }
  return "https://engagekit.io/api/trpc";
};

const getClerkToken = async (): Promise<string | null> => {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getFreshToken",
    });
    return response?.token || null;
  } catch (error) {
    console.error("tRPC: Error getting token:", error);
    return null;
  }
};

const getTrpcClient = (opts?: { assumedUserToken?: string }) => {
  return createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (op) =>
          import.meta.env.DEV ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchLink({
        url: getServerUrl(),
        transformer: SuperJSON,
        async headers() {
          const clerkToken = await getClerkToken();
          const headers: Record<string, string> = {
            "x-trpc-source": "wxt-extension",
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          };

          if (opts?.assumedUserToken) {
            headers["x-assumed-user-token"] = opts.assumedUserToken;
          }

          if (clerkToken) {
            headers.Authorization = `Bearer ${clerkToken}`;
          }

          return headers;
        },
      }),
    ],
  });
};

export const getStandaloneTRPCClient = (config?: {
  assumedUserToken?: string;
}) => {
  return getTrpcClient(config);
};

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(getTrpcClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

### Phase 5: Clerk Provider (REMOVED - Not Needed)

**DECISION: ClerkProvider is NOT needed in content script**

**Why:**
- Content script runs on `linkedin.com` origin
- ClerkProvider requires `chrome-extension://` origin to work
- Chrome-extension implementation proves this: popup has ClerkProvider, content script does not
- We use button-redirect pattern (no Clerk UI components in sidebar)
- Auth handled entirely via background worker + message passing

**This file should NOT be created.** Remove from checklist.

### Phase 6: Auth Hook with Auto-Refresh

**File:** `apps/wxt-extension/hooks/use-background-auth.ts`

```typescript
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
    const status = await authService.getAuthStatus();
    setAuthStatus(status);
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
      if (message.action === "authStateChanged") {
        console.log("Auth state changed, refreshing...");
        refreshAuth();
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // Auto-refresh when user returns to tab (after signing in on web)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !authStatus.isSignedIn) {
        console.log("Tab visible and not signed in, checking auth...");
        refreshAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signOut = async (): Promise<boolean> => {
    setIsSigningOut(true);
    try {
      const success = await authService.signOut();
      if (success) {
        setAuthStatus({ isSignedIn: false, user: null, session: null });
      }
      return success;
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
```

### Phase 7: LinkedIn Sidebar Content Script

**7.1 Content Script Entry Point (NO ClerkProvider)**

**File:** `apps/wxt-extension/entrypoints/linkedin.content/index.tsx`

Update existing file to add providers (tRPC only, NO ClerkProvider):

```typescript
import { createRoot } from "react-dom/client";
import App from "./App";
import { TRPCReactProvider } from "../../lib/trpc/client";
import "../../assets/globals.css";

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Get sidebar state from storage
    const result = await chrome.storage.local.get(['sidebar_open']);
    const initialOpen = result.sidebar_open ?? true; // default: open on first install

    // Create UI container with Shadow DOM for style isolation
    const ui = await createShadowRootUi(ctx, {
      name: "engagekit-sidebar",
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        // Create sidebar container
        const sidebarContainer = document.createElement("div");
        sidebarContainer.id = "engagekit-sidebar-root";
        container.append(sidebarContainer);

        // Mount React app with providers
        // NO ClerkProvider - content script runs on linkedin.com origin
        const root = createRoot(sidebarContainer);
        root.render(
          <TRPCReactProvider>
            <App initialOpen={initialOpen} />
          </TRPCReactProvider>
        );

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    // Mount the UI to page
    ui.mount();
  },
});
```

**7.2 Sidebar App Component**

**File:** `apps/wxt-extension/entrypoints/linkedin.content/App.tsx`

Update existing file to add auth state:

```typescript
import { useState, useEffect } from "react";
import { LinkedInSidebar } from "./LinkedInSidebar";
import { ToggleButton } from "./ToggleButton";

interface AppProps {
  initialOpen: boolean;
}

export default function App({ initialOpen }: AppProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [showOpenButton, setShowOpenButton] = useState(!initialOpen);

  const handleToggle = async () => {
    const newState = !isOpen;
    setIsOpen(newState);

    // Save to storage
    await chrome.storage.local.set({ sidebar_open: newState });

    // Handle button visibility with animation delay
    if (newState) {
      setShowOpenButton(false);
    } else {
      setTimeout(() => setShowOpenButton(true), 300);
    }
  };

  return (
    <>
      {showOpenButton && <ToggleButton onToggle={handleToggle} />}
      <LinkedInSidebar isOpen={isOpen} onClose={handleToggle} />
    </>
  );
}
```

**7.3 Sidebar Panel**

**File:** `apps/wxt-extension/entrypoints/linkedin.content/LinkedInSidebar.tsx`

Update existing file to add auth UI:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sassy/ui/card";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@sassy/ui/sheet";
import { Button } from "@sassy/ui/button";
import { useBackgroundAuth } from "../../hooks/use-background-auth";
import { getSyncHostUrl } from "../../lib/get-sync-host";

interface LinkedInSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LinkedInSidebar({ isOpen, onClose }: LinkedInSidebarProps) {
  const { isSignedIn, isLoaded, user, refreshAuth } = useBackgroundAuth();

  const handleSignInClick = () => {
    const syncHostUrl = getSyncHostUrl();
    const authUrl = `${syncHostUrl}/extension-auth`;
    chrome.tabs.create({ url: authUrl });
  };

  const handleRefreshAuth = async () => {
    await refreshAuth();
    if (!isSignedIn) {
      alert(
        "Still not signed in. Please complete sign-in in the web app first, then try again."
      );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[25vw] max-w-[400px] min-w-[320px] overflow-y-auto"
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-lg font-bold text-white">E</span>
              </div>
              <SheetTitle className="text-xl font-bold">EngageKit</SheetTitle>
            </div>
            <SheetClose />
          </div>
          <SheetDescription>
            Your AI-powered LinkedIn engagement assistant
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 py-4">
          {!isLoaded ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-sm text-gray-600">Loading...</p>
              </CardContent>
            </Card>
          ) : !isSignedIn ? (
            // Not signed in - show auth UI
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔐 Authentication Required</CardTitle>
                <CardDescription>
                  Sign in to your EngageKit account to start using the extension
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSignInClick}
                  className="w-full"
                  size="lg"
                >
                  Sign In to EngageKit
                </Button>

                <Button
                  onClick={handleRefreshAuth}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Already signed in? Refresh
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  This will open the EngageKit web app for secure authentication
                </p>
              </CardContent>
            </Card>
          ) : (
            // Signed in - show authenticated content
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Welcome back! 👋</CardTitle>
                  <CardDescription>
                    Signed in as {user?.firstName || "User"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Your sidebar is ready. Additional features will appear here.
                  </p>
                </CardContent>
              </Card>

              {/* Add more authenticated UI components here */}
            </>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <p className="text-xs text-gray-500">EngageKit v0.0.1</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

**7.4 Toggle Button**

**File:** `apps/wxt-extension/entrypoints/linkedin.content/ToggleButton.tsx`

Keep existing implementation (no changes needed).

### Phase 8: Manifest Configuration

**File:** `apps/wxt-extension/wxt.config.ts`

```typescript
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",

  runner: {
    disabled: true,
  },

  manifest: {
    name: "EngageKit",
    description: "LinkedIn engagement automation with AI",
    version: "0.0.1",

    permissions: [
      "activeTab",
      "tabs",
      "storage",       // For sidebar state
      "cookies",       // Required for Clerk
      "alarms",        // For periodic auth checks
    ],

    host_permissions: [
      "http://localhost:*/*",  // Dynamic port support
      "https://*.linkedin.com/*",
      "https://*.clerk.accounts.dev/*",
      "https://*.clerk.dev/*",
      "https://engagekit.io/*",
      "https://accounts.engagekit.io/*",
      "https://clerk.engagekit.io/*",
      "https://*.ngrok-free.app/*",  // ngrok support
    ],

    web_accessible_resources: [
      {
        resources: ["fonts/*"],
        matches: ["https://*.linkedin.com/*"],
      },
    ],
  },

  vite: () => ({
    plugins: [tsconfigPaths()],
    define: {
      "import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      ),
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        process.env.VITE_CLERK_PUBLISHABLE_KEY,
      ),
      "import.meta.env.VITE_NGROK_URL": JSON.stringify(
        process.env.VITE_NGROK_URL,
      ),
      "import.meta.env.VITE_NEXTJS_URL": JSON.stringify(
        process.env.NEXTJS_URL,
      ),
      "import.meta.env.PORT": JSON.stringify(
        process.env.PORT || "3000",
      ),
      "import.meta.env.VITE_PORT": JSON.stringify(
        process.env.PORT || "3000",
      ),
    },
    css: {
      postcss: {
        plugins: [
          require("tailwindcss"),
          require("postcss-rem-to-pixel")({
            rootValue: 16,
            propList: ["*"],
            selectorBlackList: [],
          }),
          require("autoprefixer"),
        ],
      },
    },
  }),
});
```

### Phase 9: Web App Configuration

**Clerk Dashboard - Add Extension Origin**

Via API:
```bash
curl -X PATCH https://api.clerk.com/v1/instance \
  -H "Authorization: Bearer {{CLERK_SECRET_KEY}}" \
  -H "Content-type: application/json" \
  -d '{"allowed_origins": ["chrome-extension://<EXTENSION_ID>"]}'
```

Or via Clerk Dashboard:
1. Go to Clerk Dashboard
2. Navigate to "Instance Settings" → "Allowed Origins"
3. Add: `chrome-extension://<EXTENSION_ID>`

## Testing Plan

### Test 1: First Install Experience
1. Install extension for first time
2. Navigate to LinkedIn
3. **Expected**: Sidebar auto-opens
4. **Expected**: Shows "Sign In to EngageKit" button
5. Click button → opens web app in new tab
6. Sign in via web app
7. Return to LinkedIn, click "Already signed in? Refresh"
8. **Expected**: Sidebar shows authenticated state with user name

### Test 2: Sidebar State Persistence
1. Close sidebar
2. Refresh LinkedIn page
3. **Expected**: Sidebar remains closed
4. Open sidebar
5. Refresh page
6. **Expected**: Sidebar opens automatically

### Test 3: Authentication Flow
1. Click "Sign In to EngageKit" button
2. **Expected**: New tab opens to `${syncHostUrl}/extension-auth`
3. Complete auth flow in web app
4. Return to LinkedIn
5. Click "Already signed in? Refresh"
6. **Expected**: Sidebar updates to show authenticated state
7. **Expected**: Background script has valid token

### Test 4: Token Retrieval
1. Make tRPC call from sidebar (future feature)
2. **Expected**: Token fetched from background
3. **Expected**: API call succeeds with auth
4. **Expected**: Token refresh works after expiry

### Test 5: Sign Out
1. Add sign-out functionality to sidebar
2. Click sign out
3. **Expected**: Session cleared in background
4. **Expected**: Sidebar shows sign-in UI
5. **Expected**: API calls no longer authenticated

### Test 6: Dynamic Port Configuration
1. Set `PORT=3010` in `.env.local`
2. Start dev server
3. **Expected**: Extension connects to `http://localhost:3010`
4. **Expected**: tRPC calls go to correct port
5. **Expected**: Auth redirects use correct port

## Critical Implementation Notes

### 1. Shadow DOM for Style Isolation
Use WXT's `createShadowRootUi` to prevent LinkedIn CSS from affecting sidebar:
```typescript
const ui = await createShadowRootUi(ctx, {
  name: "engagekit-sidebar",
  position: "overlay",
  anchor: "body",
  // ...
});
```

### 2. Auth Button Pattern
Sidebar shows button that opens web app (not embedded Clerk UI):
```typescript
const handleSignInClick = () => {
  const syncHostUrl = getSyncHostUrl();
  const authUrl = `${syncHostUrl}/extension-auth`;
  chrome.tabs.create({ url: authUrl });
};
```

### 3. Simple Storage Pattern
Direct `chrome.storage.local` access (no service class needed):
```typescript
// Read
const result = await chrome.storage.local.get(['sidebar_open']);
const isOpen = result.sidebar_open ?? true;

// Write
await chrome.storage.local.set({ sidebar_open: false });
```

### 4. MessageRouter Pattern
Centralized message handling with dependency injection:
```typescript
const messageRouter = new MessageRouter({
  getClerkClient,
});

chrome.runtime.onMessage.addListener(messageRouter.handleMessage);
```

### 5. Dynamic Port Resolution
Use environment variables with fallbacks:
```typescript
const port = import.meta.env.VITE_PORT || import.meta.env.PORT || 3000;
const serverUrl = `http://localhost:${port}/api/trpc`;
```

## Migration Checklist

- [ ] Install dependencies
- [ ] Create lib/get-sync-host.ts with dynamic port support
- [ ] Create lib/auth-service.ts
- [ ] Create lib/trpc/client.ts and query-client.ts
- [ ] Create entrypoints/background/background-types.ts
- [ ] Create entrypoints/background/message-router.ts
- [ ] Update entrypoints/background.ts with MessageRouter + auth state notifications
- [ ] ~~Create components/clerk-provider.tsx~~ (REMOVED - not needed)
- [ ] Create hooks/use-background-auth.ts with auto-refresh on visibility change
- [ ] Update entrypoints/linkedin.content/index.tsx (add TRPCReactProvider only, NO ClerkProvider)
- [ ] Update entrypoints/linkedin.content/App.tsx (add storage)
- [ ] Update entrypoints/linkedin.content/LinkedInSidebar.tsx (add auth UI with conditional rendering)
- [ ] Update wxt.config.ts (add dynamic port support)
- [ ] Configure Clerk allowed_origins
- [ ] Test first install flow
- [ ] Test sidebar state persistence
- [ ] Test button-redirect auth flow
- [ ] Test auth refresh functionality (manual + auto on visibility change)
- [ ] Test auto-refresh when returning from sign-in tab
- [ ] Test dynamic port configuration

## Success Criteria

1. ✅ First install: Sidebar auto-opens on LinkedIn
2. ✅ Sidebar shows "Sign In to EngageKit" button when not authenticated
3. ✅ Button opens web app in new tab for authentication
4. ✅ Auth syncs via `syncHost` - background worker reads web app cookies
5. ✅ Auto-refresh on visibility change detects sign-in without manual button click
6. ✅ Background worker notifies content script when auth URL detected
7. ✅ Manual "Already signed in? Refresh" button works as fallback
8. ✅ Sidebar state persists across page reloads
9. ✅ Background script provides fresh tokens via message passing
10. ✅ MessageRouter handles all message types correctly
11. ✅ Dynamic port configuration works for worktrees
12. ✅ Simple storage pattern works without service class
13. ✅ NO ClerkProvider in content script (proven pattern from chrome-extension)

## References

- **Existing Implementation:** `apps/chrome-extension/`
- **Auth Pattern:** `apps/chrome-extension/src/pages/popup/components/auth.tsx`
- **MessageRouter Pattern:** `apps/chrome-extension/src/pages/background/message-router.ts`
- **Storage Pattern:** `apps/chrome-extension/src/pages/options/utils/storage.ts`
- **Clerk Chrome Extension:** https://clerk.com/docs/chrome-extension/getting-started/quickstart
- **WXT Framework:** https://wxt.dev/
- **WXT Content Scripts:** https://wxt.dev/guide/essentials/content-scripts.html
- **tRPC v11:** https://trpc.io/

## Key Architectural Decisions Summary

### Why NO ClerkProvider in Content Script?

**Technical Reason:**
- Content scripts run on host page origin (`linkedin.com`)
- ClerkProvider requires `chrome-extension://ID` origin to establish session
- Attempting to use ClerkProvider on `linkedin.com` origin will fail

**Proven Pattern:**
- Existing `chrome-extension` implementation confirms this
- Popup has ClerkProvider (extension origin) ✅
- Content script has NO ClerkProvider (host page origin) ✅
- Content script uses message passing to background worker for auth

**How Auth Works Instead:**
1. Background worker: `createClerkClient({ syncHost })` on extension origin
2. Content script: `chrome.runtime.sendMessage({ action: "getAuthStatus" })`
3. Background worker: Responds with `{ isSignedIn, user, session }`
4. Content script: Renders UI based on auth status

### Auth Sync Mechanism

**Web App → Extension Sync:**
- User signs in on web app → Clerk sets cookies on web app domain
- Background worker calls `createClerkClient({ syncHost })` → reads cookies
- Extension automatically gets session from web app

**Auto-Refresh Triggers:**
1. **Visibility change**: When user returns to LinkedIn tab after signing in
2. **Auth URL detection**: Background worker detects visits to auth domains
3. **Periodic checks**: Every 2 minutes via chrome.alarms
4. **Manual refresh**: "Already signed in? Refresh" button as fallback

## Open Questions

1. **Should sidebar have sign-out button in authenticated state?** (or rely on web app sign-out)
2. **Should we show toast notifications when auth state changes?** (e.g., "Signed in successfully")
3. **Should sidebar width be configurable?** (current: 25vw, max 400px, min 320px)
4. **Should we add keyboard shortcut to toggle sidebar?** (e.g., Ctrl+Shift+E)
5. **Should we reduce auto-refresh frequency** if it causes performance issues?
