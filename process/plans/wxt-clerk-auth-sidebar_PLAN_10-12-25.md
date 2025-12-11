# WXT Extension - Clerk Auth with Sidebar UI

**Plan Date:** December 10, 2025
**Status:** Draft - Awaiting Approval
**Complexity:** Medium

## Executive Summary

Migrate Clerk authentication from `chrome-extension` (Vite + CRXJS) to `wxt-extension` (WXT framework) with **sidebar-first authentication UI**. Auth UI will be embedded in LinkedIn sidebar content script, with minimal popup for status/settings.

## Requirements

### User Requirements
1. **Sidebar Auth UI**: Primary authentication happens in LinkedIn sidebar (not popup)
2. **Minimal Popup**: Keep popup for quick status/settings only
3. **Smart Sidebar State**:
   - First install: Auto-inject sidebar + auto-open for auth
   - Subsequent visits: Remember open/closed state from chrome.storage
4. **Auth Flow**: Use redirect mode (proven working in chrome-extension)

### Technical Requirements
1. Maintain tRPC v11 API compatibility
2. Session sync with web app via syncHost
3. Background script as auth source of truth
4. Content script messaging for token retrieval

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        WXT Extension                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Background Service Worker (Auth Manager)                      │
│  ├─ createClerkClient() (on-demand, fresh session)            │
│  ├─ Message handlers (getToken, getAuthStatus, signOut)       │
│  ├─ Session monitoring (alarms, tab listeners)                │
│  └─ Storage sync (sidebar state persistence)                  │
│                    ▲                                           │
│                    │ chrome.runtime.sendMessage                │
│       ┌────────────┴───────────┬───────────────┐              │
│       │                        │               │              │
│  Minimal Popup          LinkedIn Sidebar       │              │
│  ├─ Auth status         (Content Script)       │              │
│  ├─ Quick settings      ├─ ClerkProvider       │              │
│  └─ Sign out            ├─ <SignIn /> (redirect mode)         │
│                         ├─ Toggle button        │              │
│                         ├─ Sidebar panel (React)│              │
│                         └─ tRPC client          │              │
│                                                 │              │
└─────────────────────────────────────────────────┴──────────────┘
                                  │
                                  │ Authorization: Bearer <token>
                                  ▼
                       ┌────────────────────┐
                       │  Vercel API        │
                       │  (tRPC v11)        │
                       └────────────────────┘
```

## Key Decisions & Trade-offs

### Decision 1: Redirect Mode vs Modal Mode

**Chosen:** Redirect mode

**Rationale:**
- Modal mode has CSP limitations in content scripts
- Redirect mode is proven working in chrome-extension
- Chrome extensions can't load remote code (required for some Clerk modal features)
- OAuth/SAML require redirects anyway (not supported in modals for extensions)

**Sources:**
- [Clerk Chrome Extension Quickstart](https://clerk.com/docs/chrome-extension/getting-started/quickstart)
- [Clerk CSP Documentation](https://clerk.com/docs/security/clerk-csp)
- [Chrome Extension CSP](https://docs.getquicker.cn/chrome/developer.chrome.com/extensions/contentSecurityPolicy.html)

### Decision 2: Content Script vs Popup for Auth UI

**Chosen:** Content script (sidebar) as primary auth UI

**Rationale:**
- User wants auth in sidebar for better UX
- Content scripts are NOT affected by page CSP (better for Clerk components)
- Can use Shadow DOM for style isolation from LinkedIn
- Popup remains for quick status checks

**Trade-offs:**
- More complex setup (need React in content script)
- Larger bundle size for content script
- Need proper style isolation

### Decision 3: Sidebar State Persistence

**Chosen:** chrome.storage.local with smart defaults

**Implementation:**
```typescript
interface SidebarState {
  isOpen: boolean;
  hasSeenAuth: boolean; // Track if user has been shown auth UI
}

// First install: { isOpen: true, hasSeenAuth: false }
// After auth: { isOpen: <user preference>, hasSeenAuth: true }
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

Add to root `.env`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_NGROK_URL=https://your-ngrok.ngrok-free.app  # optional
NEXTJS_URL=http://localhost:3000  # optional
```

### Phase 2: Utility Files

**2.1 Sync Host Utility**

**File:** `apps/wxt-extension/lib/get-sync-host.ts`

```typescript
const PROD_SYNC_HOST = "https://clerk.engagekit.io";
const DEV_SYNC_HOST = "http://localhost:3000";

export const getSyncHost = (): string => {
  return import.meta.env.MODE === "production"
    ? PROD_SYNC_HOST
    : DEV_SYNC_HOST;
};

export const getSyncHostUrl = () => {
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }
  if (import.meta.env.VITE_NEXTJS_URL) {
    return import.meta.env.VITE_NEXTJS_URL;
  }
  return import.meta.env.MODE === "production"
    ? "https://engagekit.io"
    : "http://localhost:3000";
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

**2.3 Sidebar Storage Service**

**File:** `apps/wxt-extension/lib/sidebar-storage.ts`

```typescript
interface SidebarState {
  isOpen: boolean;
  hasSeenAuth: boolean;
}

const STORAGE_KEY = "engagekit_sidebar_state";

export class SidebarStorageService {
  async getState(): Promise<SidebarState> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {
      isOpen: true, // Default: open on first install
      hasSeenAuth: false,
    };
  }

  async setState(state: Partial<SidebarState>): Promise<void> {
    const current = await this.getState();
    await chrome.storage.local.set({
      [STORAGE_KEY]: { ...current, ...state },
    });
  }

  async setOpen(isOpen: boolean): Promise<void> {
    await this.setState({ isOpen });
  }

  async markAuthSeen(): Promise<void> {
    await this.setState({ hasSeenAuth: true });
  }
}

export const sidebarStorage = new SidebarStorageService();
```

### Phase 3: Background Script

**File:** `apps/wxt-extension/entrypoints/background.ts`

```typescript
import { createClerkClient } from "@clerk/chrome-extension/background";
import { getSyncHost } from "../lib/get-sync-host";

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

  // Auth service
  const authService = {
    async getToken(): Promise<string | null> {
      try {
        const clerk = await getClerkClient();
        if (!clerk.session) return null;
        return await clerk.session.getToken();
      } catch (error) {
        console.error("Background: Error getting token:", error);
        return null;
      }
    },

    async getAuthStatus() {
      try {
        const clerk = await getClerkClient();
        return {
          isSignedIn: !!clerk.session,
          user: clerk.user || null,
          session: clerk.session || null,
        };
      } catch (error) {
        console.error("Background: Error getting auth status:", error);
        return { isSignedIn: false, user: null, session: null };
      }
    },

    async signOut() {
      try {
        const clerk = await getClerkClient();
        if (clerk.session) {
          await clerk.signOut();
        }
        return { success: true };
      } catch (error) {
        console.error("Background: Error signing out:", error);
        return { success: false };
      }
    },

    async checkSession() {
      try {
        const clerk = await getClerkClient();
        if (!clerk.session) return { isValid: false };
        const token = await clerk.session.getToken();
        return {
          isValid: !!token,
          expiresAt: clerk.session.expireAt.getTime(),
        };
      } catch (error) {
        console.error("Background: Error checking session:", error);
        return { isValid: false };
      }
    },
  };

  // Message handlers
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case "getFreshToken":
        authService.getToken().then((token) => sendResponse({ token }));
        return true;

      case "getAuthStatus":
        authService.getAuthStatus().then((status) => sendResponse(status));
        return true;

      case "signOut":
        authService.signOut().then((result) => sendResponse(result));
        return true;

      case "checkSession":
        authService.checkSession().then((result) => sendResponse(result));
        return true;
    }
  });

  // Session monitoring
  chrome.runtime.onStartup.addListener(() => {
    console.log("Background: Extension startup");
    authService.getAuthStatus();
  });

  chrome.runtime.onInstalled.addListener((details) => {
    console.log("Background: Extension installed/updated:", details.reason);

    // First install: ensure sidebar opens
    if (details.reason === "install") {
      chrome.storage.local.set({
        engagekit_sidebar_state: {
          isOpen: true,
          hasSeenAuth: false,
        },
      });
    }

    authService.getAuthStatus();
  });

  // Monitor auth URL visits
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      const authDomains = [
        "clerk.accounts.dev",
        "clerk.dev",
        "localhost:3000",
        "engagekit.io",
      ];

      const isAuthUrl = authDomains.some((domain) =>
        tab.url?.includes(domain)
      );

      if (isAuthUrl) {
        setTimeout(() => authService.getAuthStatus(), 2000);
      }
    }
  });

  // Periodic auth checks via alarms
  chrome.alarms.create("authCheck", { periodInMinutes: 2 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "authCheck") {
      authService.getAuthStatus();
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
    return "http://localhost:3000/api/trpc";
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

### Phase 5: Clerk Provider

**File:** `apps/wxt-extension/components/clerk-provider.tsx`

```typescript
import { ReactNode } from "react";
import { ClerkProvider as BaseClerkProvider } from "@clerk/chrome-extension";
import { getSyncHost } from "../lib/get-sync-host";

interface ClerkProviderProps {
  children: ReactNode;
}

const publishableKey = import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const SYNC_HOST = getSyncHost();
const EXTENSION_URL = chrome.runtime.getURL(".");

if (!publishableKey) {
  throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required");
}

export const ClerkProvider = ({ children }: ClerkProviderProps) => {
  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      syncHost={SYNC_HOST}
      afterSignOutUrl={`${EXTENSION_URL}popup.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}popup.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}popup.html`}
    >
      {children}
    </BaseClerkProvider>
  );
};
```

### Phase 6: Auth Hook

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

  const refreshAuth = async () => {
    const status = await authService.getAuthStatus();
    setAuthStatus(status);
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

**7.1 Content Script Entry Point**

**File:** `apps/wxt-extension/entrypoints/linkedin.content/index.tsx`

```typescript
import { createRoot } from "react-dom/client";
import App from "./App";
import { sidebarStorage } from "../../lib/sidebar-storage";
import "../../assets/globals.css";

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // Get sidebar state
    const state = await sidebarStorage.getState();

    // Create UI container with Shadow DOM for style isolation
    const ui = await createShadowRootUi(ctx, {
      name: "engagekit-sidebar",
      position: "inline",
      onMount: (container) => {
        // Create sidebar container
        const sidebarContainer = document.createElement("div");
        sidebarContainer.id = "engagekit-sidebar-root";
        container.append(sidebarContainer);

        // Mount React app
        const root = createRoot(sidebarContainer);
        root.render(<App initialOpen={state.isOpen} />);

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

```typescript
import { useState, useEffect } from "react";
import { ClerkProvider } from "../../components/clerk-provider";
import { TRPCReactProvider } from "../../lib/trpc/client";
import { SidebarPanel } from "./components/SidebarPanel";
import { ToggleButton } from "./components/ToggleButton";
import { sidebarStorage } from "../../lib/sidebar-storage";

interface AppProps {
  initialOpen: boolean;
}

export default function App({ initialOpen }: AppProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const handleToggle = async () => {
    const newState = !isOpen;
    setIsOpen(newState);
    await sidebarStorage.setOpen(newState);
  };

  return (
    <ClerkProvider>
      <TRPCReactProvider>
        <div className="engagekit-extension-root">
          <ToggleButton isOpen={isOpen} onToggle={handleToggle} />
          {isOpen && <SidebarPanel onClose={() => handleToggle()} />}
        </div>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
```

**7.3 Toggle Button**

**File:** `apps/wxt-extension/entrypoints/linkedin.content/components/ToggleButton.tsx`

```typescript
import { Button } from "@sassy/ui/button";

interface ToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ToggleButton({ isOpen, onToggle }: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed right-4 top-20 z-[9999] rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
      title={isOpen ? "Close EngageKit" : "Open EngageKit"}
    >
      {isOpen ? "✕" : "💬"}
    </button>
  );
}
```

**7.4 Sidebar Panel**

**File:** `apps/wxt-extension/entrypoints/linkedin.content/components/SidebarPanel.tsx`

```typescript
import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useBackgroundAuth } from "../../../hooks/use-background-auth";
import { sidebarStorage } from "../../../lib/sidebar-storage";

interface SidebarPanelProps {
  onClose: () => void;
}

export function SidebarPanel({ onClose }: SidebarPanelProps) {
  const { isSignedIn, isLoaded, user } = useBackgroundAuth();

  // Mark auth as seen when user signs in
  const handleSignInSuccess = async () => {
    await sidebarStorage.markAuthSeen();
  };

  if (!isLoaded) {
    return (
      <div className="fixed right-0 top-0 z-[9998] h-screen w-96 bg-white shadow-xl">
        <div className="flex h-full items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 z-[9998] flex h-screen w-96 flex-col bg-white shadow-xl">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">EngageKit</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <SignedOut>
          <div className="flex h-full items-center justify-center">
            <SignIn
              afterSignInUrl={window.location.href}
              afterSignUpUrl={window.location.href}
              routing="path"
            />
          </div>
        </SignedOut>

        <SignedIn>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Signed in as</p>
                <p className="font-medium">{user?.firstName || "User"}</p>
              </div>
              <UserButton afterSignOutUrl={window.location.href} />
            </div>

            {/* Your authenticated sidebar content here */}
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">
                Sidebar content for authenticated users
              </p>
            </div>
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
```

### Phase 8: Minimal Popup

**8.1 Popup Entry Point**

**File:** `apps/wxt-extension/entrypoints/popup/main.tsx`

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../../assets/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**8.2 Popup App**

**File:** `apps/wxt-extension/entrypoints/popup/App.tsx`

```typescript
import { useEffect, useState } from "react";
import { authService } from "../../lib/auth-service";
import type { AuthStatus } from "../../lib/auth-service";
import { Button } from "@sassy/ui/button";

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthStatus();
  }, []);

  const loadAuthStatus = async () => {
    setIsLoading(true);
    const status = await authService.getAuthStatus();
    setAuthStatus(status);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    await loadAuthStatus();
  };

  const openLinkedIn = () => {
    chrome.tabs.create({ url: "https://www.linkedin.com" });
  };

  if (isLoading) {
    return (
      <div className="min-w-64 p-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-w-64 p-4">
      <h1 className="mb-4 text-xl font-bold">EngageKit</h1>

      {authStatus?.isSignedIn ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-gray-600">Signed in as</p>
            <p className="font-medium">
              {authStatus.user?.firstName || "User"}
            </p>
          </div>

          <Button onClick={openLinkedIn} className="w-full">
            Open LinkedIn
          </Button>

          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Open LinkedIn to sign in via the sidebar
          </p>
          <Button onClick={openLinkedIn} className="w-full">
            Open LinkedIn
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Phase 9: Manifest Configuration

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
      "http://localhost:3000/*",
      "https://*.linkedin.com/*",
      "https://*.clerk.accounts.dev/*",
      "https://*.clerk.dev/*",
      "https://engagekit.io/*",
      "https://accounts.engagekit.io/*",
      "https://clerk.engagekit.io/*",
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

### Phase 10: Web App Configuration

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
3. **Expected**: Sidebar auto-opens with sign-in UI
4. Sign in via redirect
5. **Expected**: Sidebar shows authenticated state

### Test 2: Sidebar State Persistence
1. Close sidebar
2. Refresh LinkedIn page
3. **Expected**: Sidebar remains closed
4. Open sidebar
5. Refresh page
6. **Expected**: Sidebar opens automatically

### Test 3: Authentication Flow
1. Click sign in within sidebar
2. Complete auth flow
3. **Expected**: Redirects back to LinkedIn
4. **Expected**: Sidebar updates to show authenticated state
5. **Expected**: Background script has valid token

### Test 4: Token Retrieval
1. Make tRPC call from sidebar
2. **Expected**: Token fetched from background
3. **Expected**: API call succeeds with auth
4. **Expected**: Token refresh works after 60+ seconds

### Test 5: Sign Out
1. Click sign out in sidebar (or popup)
2. **Expected**: Session cleared in background
3. **Expected**: Sidebar shows sign-in UI
4. **Expected**: API calls no longer authenticated

### Test 6: Minimal Popup
1. Click extension icon
2. **Expected**: Popup shows auth status
3. If authenticated: Shows user name and sign out button
4. If not authenticated: Shows "Open LinkedIn" button

## Critical Implementation Notes

### 1. Shadow DOM for Style Isolation
Use WXT's `createShadowRootUi` to prevent LinkedIn CSS from affecting sidebar:
```typescript
const ui = await createShadowRootUi(ctx, {
  name: "engagekit-sidebar",
  position: "inline",
  // ...
});
```

### 2. Clerk Redirect URLs
Since sidebar is on LinkedIn page, use:
```typescript
<SignIn
  afterSignInUrl={window.location.href}  // Current LinkedIn page
  afterSignUpUrl={window.location.href}
  routing="path"
/>
```

### 3. Content Script Bundle Size
Sidebar includes full React + Clerk + tRPC stack. Consider:
- Code splitting if bundle gets large
- Lazy loading authenticated components
- Minimize dependencies

### 4. First Install Detection
Background script sets initial storage on install:
```typescript
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({
      engagekit_sidebar_state: {
        isOpen: true,
        hasSeenAuth: false,
      },
    });
  }
});
```

## Migration Checklist

- [ ] Install dependencies
- [ ] Create lib/get-sync-host.ts
- [ ] Create lib/auth-service.ts
- [ ] Create lib/sidebar-storage.ts
- [ ] Create lib/trpc/client.ts and query-client.ts
- [ ] Update entrypoints/background.ts
- [ ] Create components/clerk-provider.tsx
- [ ] Create hooks/use-background-auth.ts
- [ ] Create entrypoints/linkedin.content/ (full sidebar)
- [ ] Create entrypoints/popup/ (minimal status UI)
- [ ] Update wxt.config.ts
- [ ] Add environment variables
- [ ] Configure Clerk allowed_origins
- [ ] Test first install flow
- [ ] Test sidebar state persistence
- [ ] Test authentication flow
- [ ] Test token retrieval and API calls

## Success Criteria

1. ✅ First install: Sidebar auto-opens on LinkedIn for auth
2. ✅ Sidebar state persists across page reloads
3. ✅ Users can sign in via sidebar (redirect mode)
4. ✅ Authenticated users see sidebar content
5. ✅ Background script provides fresh tokens
6. ✅ tRPC API calls work with authentication
7. ✅ Minimal popup shows auth status
8. ✅ Sign out works from both sidebar and popup

## References

- **Existing Implementation:** `apps/chrome-extension/`
- **Clerk Chrome Extension:** https://clerk.com/docs/chrome-extension/getting-started/quickstart
- **Clerk CSP:** https://clerk.com/docs/security/clerk-csp
- **WXT Framework:** https://wxt.dev/
- **WXT Content Scripts:** https://wxt.dev/guide/essentials/content-scripts.html
- **tRPC v11:** https://trpc.io/

## Open Questions

1. **Should sidebar have multiple tabs/sections?** (e.g., Auth, Settings, Activity)
2. **Should we show notifications when auth state changes?** (e.g., "Signed out" toast)
3. **Should sidebar width be configurable?** (current: fixed 384px)
4. **Should we add keyboard shortcut to toggle sidebar?** (e.g., Ctrl+Shift+E)
