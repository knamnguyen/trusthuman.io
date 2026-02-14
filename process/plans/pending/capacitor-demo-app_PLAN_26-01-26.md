# Capacitor Demo App with Clerk Authentication - Implementation Plan

**Date:** 2026-01-26
**Updated:** 2026-02-13
**Status:** BLOCKED - CLERK + CAPACITOR PRODUCTION REDIRECT ISSUE UNRESOLVED
**Complexity:** COMPLEX

---

## Executive Summary

Create a production-ready Capacitor mobile app in `/apps/capacitor-demo` with Clerk authentication and Google OAuth sign-in, configured for iPhone device testing. The app will integrate seamlessly with the existing turborepo infrastructure and demonstrate the browser-based OAuth flow pattern.

---

## Goals & Success Criteria

### Primary Goals
1. ✅ Working Capacitor app with Clerk authentication
2. ✅ Google sign-in functional via Safari system browser
3. ✅ Deep link OAuth callback handling
4. ✅ iPhone device testing capability
5. ✅ Turborepo integration (scripts, build pipeline)

### Success Criteria
- [ ] User can tap "Sign in with Google"
- [ ] Safari opens, shows Google sign-in (one-tap if logged in)
- [ ] Successful redirect back to app via deep link
- [ ] Clerk session established in Capacitor app
- [ ] App builds and runs on iPhone device via Xcode
- [ ] Dev server runs alongside existing Next.js app

---

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────┐
│  Capacitor App (/apps/capacitor-demo)  │
│  ┌───────────────────────────────────┐  │
│  │  React UI (Vite + React 19)      │  │
│  │  - Login screen                   │  │
│  │  - Dashboard (post-auth)          │  │
│  │  - Deep link listener             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  @clerk/clerk-react              │  │
│  │  - ClerkProvider                  │  │
│  │  - useAuth, useUser hooks         │  │
│  │  - startOAuthFlow (custom flow)   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Capacitor Plugins               │  │
│  │  - @capacitor/core                │  │
│  │  - @capacitor/app (deep links)    │  │
│  │  - @capacitor/browser (OAuth)     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  iOS Native (ios/)                │  │
│  │  - Info.plist (deep links)        │  │
│  │  - Xcode project                  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         │ OAuth Flow
         ▼
┌─────────────────────────────────────────┐
│  Safari (System Browser)                │
│  - Google OAuth sign-in                 │
│  - Redirects to: capacitordemo://auth   │
└─────────────────────────────────────────┘
```

### OAuth Flow Sequence

```
1. User taps "Sign in with Google"
   ↓
2. App calls Clerk's startOAuthFlow({ strategy: 'oauth_google' })
   ↓
3. Capacitor Browser plugin opens Safari
   ↓
4. User signs in to Google (or one-tap if already logged in)
   ↓
5. Google redirects to: capacitordemo://auth/callback?code=...
   ↓
6. iOS recognizes custom URL scheme, opens app
   ↓
7. Capacitor App.addListener('appUrlOpen') fires
   ↓
8. Clerk completes OAuth exchange, creates session
   ↓
9. User is authenticated, navigates to dashboard
```

### Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Capacitor | ^7.0.0 | Cross-platform runtime |
| Build Tool | Vite | ^6.3.5 | Fast dev server |
| UI Library | React | 19.0.0 | From monorepo catalog |
| Auth | Clerk | ^6.12.5 | Adapted from Expo patterns |
| API Client | tRPC | ^11.0.0 | Shared with Next.js |
| Router | React Router | ^7.1.3 | Client-side routing |
| Plugins | @capacitor/app | ^7.0.0 | Deep link handling |
| Plugins | @capacitor/browser | ^7.0.0 | OAuth browser flow |
| iOS Target | iOS 16+ | - | iPhone testing |

---

## Detailed Implementation Steps

### Phase 1: Project Initialization

#### Step 1.1: Create App Structure
```bash
# Create app directory
mkdir -p apps/capacitor-demo

# Initialize package.json
pnpm init

# Install core dependencies
pnpm add @capacitor/core @capacitor/cli @capacitor/app @capacitor/browser
pnpm add react react-dom react-router-dom
pnpm add @clerk/clerk-react
pnpm add @sassy/api @sassy/ui
pnpm add vite @vitejs/plugin-react typescript

# Install dev dependencies
pnpm add -D @types/react @types/react-dom @sassy/tsconfig @sassy/eslint-config
```

**Files to Create:**
- `/apps/capacitor-demo/package.json`
- `/apps/capacitor-demo/tsconfig.json`
- `/apps/capacitor-demo/vite.config.ts`
- `/apps/capacitor-demo/capacitor.config.ts`
- `/apps/capacitor-demo/index.html`

**Key Configuration:**

`package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "with-env": "dotenv -e ../../.env --",
    "sync": "cap sync",
    "sync:ios": "cap sync ios",
    "open:ios": "cap open ios",
    "run:ios": "cap run ios",
    "clean": "git clean -xdf .cache .turbo dist ios node_modules"
  }
}
```

`capacitor.config.ts`:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.engagekit.demo',
  appName: 'EngageKit Demo',
  webDir: 'dist',
  server: {
    // For OAuth redirects
    androidScheme: 'https',
    iosScheme: 'https',
    // Dev server URL (auto-detected in dev mode)
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined,
    cleartext: true, // Allow localhost in development
  },
  plugins: {
    CapacitorCookies: {
      enabled: true, // Required for session management
    },
  },
};

export default config;
```

#### Step 1.2: Initialize Capacitor iOS
```bash
cd apps/capacitor-demo

# Initialize Capacitor (creates ios/ folder)
npx cap add ios

# Verify ios/ structure created
ls -la ios/
```

**Expected iOS Structure:**
```
ios/
├── App/
│   ├── App/
│   │   ├── Info.plist          # Deep link configuration
│   │   ├── AppDelegate.swift
│   │   └── ...
│   └── App.xcodeproj
└── Podfile
```

---

### Phase 2: Deep Link Configuration

#### Step 2.1: Configure Custom URL Scheme

**File:** `/apps/capacitor-demo/ios/App/App/Info.plist`

Add custom URL scheme for OAuth redirects:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>io.engagekit.demo</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>capacitordemo</string>
    </array>
  </dict>
</array>
```

This allows the app to handle URLs like:
- `capacitordemo://auth/callback`
- `capacitordemo://oauth/google/callback`

#### Step 2.2: Configure Clerk Redirect URLs

**Clerk Dashboard Configuration:**

1. Navigate to: https://dashboard.clerk.com
2. Select your application
3. Go to: **Paths & URLs** → **Redirect URLs**
4. Add authorized redirect URL:
   ```
   capacitordemo://oauth/callback
   ```

**Why This Matters:**
- Clerk will only redirect to allowlisted URLs for security
- The custom scheme must match iOS Info.plist configuration

---

### Phase 3: React App Structure

#### Step 3.1: Create Source Structure

```
apps/capacitor-demo/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component with ClerkProvider
├── router.tsx                  # React Router setup
├── components/
│   ├── AppUrlListener.tsx      # Deep link handler
│   ├── SignInButton.tsx        # Google OAuth button
│   └── ProtectedRoute.tsx      # Auth guard component
├── pages/
│   ├── HomePage.tsx            # Landing page
│   ├── SignInPage.tsx          # Auth screen
│   └── DashboardPage.tsx       # Post-auth screen
├── lib/
│   ├── clerk.ts                # Clerk configuration
│   └── trpc.ts                 # tRPC client setup
└── index.css                   # Tailwind imports
```

#### Step 3.2: Clerk Provider Setup

**File:** `/apps/capacitor-demo/src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { App } from './App';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
);
```

**File:** `/apps/capacitor-demo/src/App.tsx`

```tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { AppUrlListener } from './components/AppUrlListener';

export function App() {
  return (
    <BrowserRouter>
      <AppUrlListener />
      <AppRouter />
    </BrowserRouter>
  );
}
```

#### Step 3.3: Deep Link Listener

**File:** `/apps/capacitor-demo/src/components/AppUrlListener.tsx`

```tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';

export const AppUrlListener: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const listener = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('[AppUrlListener] URL opened:', event.url);

      // Extract path from deep link
      // Example: capacitordemo://oauth/callback?code=xyz
      // We want to navigate to: /oauth/callback?code=xyz

      const url = new URL(event.url);
      const path = url.pathname + url.search;

      if (path) {
        console.log('[AppUrlListener] Navigating to:', path);
        navigate(path);
      }
    });

    return () => {
      listener.remove();
    };
  }, [navigate]);

  return null; // This component renders nothing
};
```

#### Step 3.4: Google Sign-In Button

**File:** `/apps/capacitor-demo/src/components/SignInButton.tsx`

```tsx
import React from 'react';
import { useClerk } from '@clerk/clerk-react';
import { Browser } from '@capacitor/browser';
import { Button } from '@sassy/ui/button';

export const SignInButton: React.FC = () => {
  const clerk = useClerk();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      // Start OAuth flow
      const { createdSessionId, setActive } = await clerk.client.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: 'capacitordemo://oauth/callback',
        redirectUrlComplete: '/dashboard',
      });

      // If session created immediately (unlikely), set it active
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }

      // Note: The OAuth flow will:
      // 1. Open Safari via Browser plugin (handled by Clerk internally)
      // 2. User signs in to Google
      // 3. Google redirects to capacitordemo://oauth/callback
      // 4. AppUrlListener catches the deep link
      // 5. Clerk completes the session exchange

    } catch (err) {
      console.error('[SignInButton] OAuth error:', err);
      alert('Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
};
```

**Alternative Pattern (More Control):**

If we need more control over the OAuth flow, use this pattern:

```tsx
import { Browser } from '@capacitor/browser';

const handleGoogleSignIn = async () => {
  try {
    // Get OAuth URL from Clerk
    const { externalAccount } = await clerk.client.signIn.create({
      strategy: 'oauth_google',
      redirectUrl: 'capacitordemo://oauth/callback',
    });

    if (!externalAccount?.authorizationUrl) {
      throw new Error('No authorization URL returned');
    }

    // Open Safari explicitly
    await Browser.open({
      url: externalAccount.authorizationUrl,
      presentationStyle: 'popover', // iOS presentation style
    });

    // When user completes OAuth:
    // 1. Google redirects to capacitordemo://oauth/callback?code=...
    // 2. AppUrlListener catches it
    // 3. We handle the callback in a route component

  } catch (err) {
    console.error('OAuth error:', err);
  }
};
```

#### Step 3.5: OAuth Callback Handler

**File:** `/apps/capacitor-demo/src/pages/OAuthCallbackPage.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setActive } = useClerk();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Clerk automatically handles the OAuth callback
        // We just need to check if there's a session
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          throw new Error('Missing OAuth parameters');
        }

        console.log('[OAuthCallback] Handling OAuth redirect...');

        // Clerk's internal logic will complete the OAuth exchange
        // and create a session. We just wait for it.

        // Poll for active session (Clerk may take a moment)
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          const session = await clerk.client.sessions.getCurrent();

          if (session) {
            console.log('[OAuthCallback] Session created, setting active...');
            await setActive({ session: session.id });
            navigate('/dashboard', { replace: true });
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        throw new Error('Session creation timeout');

      } catch (err) {
        console.error('[OAuthCallback] Error:', err);
        setError(err instanceof Error ? err.message : 'OAuth failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setActive]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-red-600 mb-4">Sign-in Failed</h1>
        <p className="text-gray-700 mb-4">{error}</p>
        <Button onClick={() => navigate('/signin')}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-700">Completing sign-in...</p>
      </div>
    </div>
  );
};
```

#### Step 3.6: Protected Routes

**File:** `/apps/capacitor-demo/src/components/ProtectedRoute.tsx`

```tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};
```

#### Step 3.7: Router Configuration

**File:** `/apps/capacitor-demo/src/router.tsx`

```tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { HomePage } from './pages/HomePage';
import { SignInPage } from './pages/SignInPage';
import { DashboardPage } from './pages/DashboardPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export const AppRouter: React.FC = () => {
  const { isSignedIn } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={
        isSignedIn ? <Navigate to="/dashboard" replace /> : <SignInPage />
      } />

      {/* OAuth callback */}
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
```

#### Step 3.8: Page Components

**File:** `/apps/capacitor-demo/src/pages/SignInPage.tsx`

```tsx
import React from 'react';
import { SignInButton } from '../components/SignInButton';

export const SignInPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>

        <div className="mt-8 space-y-4">
          <SignInButton />
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
```

**File:** `/apps/capacitor-demo/src/pages/DashboardPage.tsx`

```tsx
import React from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Button } from '@sassy/ui/button';

export const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Signed in as:</p>
              <p className="text-lg font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Name:</p>
              <p className="text-lg font-medium">{user?.fullName || 'N/A'}</p>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleSignOut}
                variant="outline"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 4: tRPC Integration (Optional)

If you want to demonstrate tRPC connectivity to your backend:

**File:** `/apps/capacitor-demo/src/lib/trpc.ts`

```tsx
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@sassy/api';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/trpc',
      headers: async () => {
        // Get Clerk token for auth
        const token = await window.Clerk?.session?.getToken();

        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
  transformer: superjson,
});
```

**Update:** `/apps/capacitor-demo/src/main.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './lib/trpc';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={clerkPubKey}>
          <App />
        </ClerkProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>,
);
```

---

### Phase 5: Styling & UI

#### Step 5.1: Tailwind Configuration

**File:** `/apps/capacitor-demo/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';
import baseConfig from '@sassy/tailwind-config/web';

export default {
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [baseConfig],
} satisfies Config;
```

**File:** `/apps/capacitor-demo/src/index.css`

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Add custom styles here */
```

**File:** `/apps/capacitor-demo/postcss.config.js`

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

---

### Phase 6: Environment Variables

**File:** `/apps/capacitor-demo/.env.local` (development)

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_dG9sZXJhbnQtaGFnZmlzaC0xLmNsZXJrLmFjY291bnRzLmRldiQ
VITE_CLERK_FRONTEND_API=tolerant-hagfish-1.clerk.accounts.dev
VITE_API_URL=http://localhost:3000/api/trpc
```

**Update Root:** `/tripoli/.env` (add if not present)

```bash
# Capacitor Demo App
VITE_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
VITE_CLERK_FRONTEND_API=$NEXT_PUBLIC_CLERK_FRONTEND_API
```

**File:** `/apps/capacitor-demo/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  envPrefix: 'VITE_',
});
```

---

### Phase 7: Turborepo Integration

#### Step 7.1: Update Root package.json

**File:** `/tripoli/package.json`

Add script:

```json
{
  "scripts": {
    "dev:capacitor": "turbo watch dev -F @sassy/capacitor-demo..."
  }
}
```

#### Step 7.2: Update Turbo Configuration

**File:** `/tripoli/turbo.json`

Ensure Capacitor app is included in build pipeline:

```json
{
  "globalEnv": [
    "VITE_CLERK_PUBLISHABLE_KEY",
    "VITE_CLERK_FRONTEND_API",
    "VITE_API_URL"
  ]
}
```

#### Step 7.3: Update pnpm Workspace

**File:** `/tripoli/pnpm-workspace.yaml`

Verify:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tooling/*'
```

(Should already include `apps/*`, so Capacitor app will be auto-discovered)

---

### Phase 8: iOS Device Testing Setup

#### Step 8.1: Xcode Project Configuration

1. **Open Xcode project:**
   ```bash
   cd apps/capacitor-demo
   npx cap open ios
   ```

2. **Configure Signing & Capabilities:**
   - Select "App" target in Xcode
   - Go to "Signing & Capabilities" tab
   - Select your Apple Developer Team
   - Ensure "Automatically manage signing" is checked
   - Change Bundle Identifier if needed: `io.engagekit.demo.yourname`

3. **Verify Deep Links Configuration:**
   - In Xcode, navigate to: App → App → Info.plist
   - Confirm `CFBundleURLTypes` is present (should be auto-generated from Step 2.1)

4. **Build for Device:**
   - Connect iPhone via USB
   - Select your iPhone from device dropdown (top bar)
   - Click ▶️ Run button
   - Accept code signing prompts

#### Step 8.2: Trust Developer Certificate on iPhone

On first run, iPhone will block the app:

1. On iPhone: Settings → General → VPN & Device Management
2. Find your Apple Developer account
3. Tap "Trust [Your Name]"
4. Go back and launch the app again

#### Step 8.3: Development Workflow

**For live reload during development:**

```bash
# Terminal 1: Start Vite dev server
cd apps/capacitor-demo
pnpm dev

# Terminal 2: Sync and run on device
pnpm sync:ios
pnpm run:ios
```

**Key Points:**
- Vite dev server must be accessible from iPhone
- Use your computer's local IP (not localhost)
- Update `capacitor.config.ts`:
  ```typescript
  server: {
    url: 'http://192.168.1.XXX:5173', // Your computer's IP
    cleartext: true,
  }
  ```

**For production build:**

```bash
# Build the app
pnpm build

# Sync to iOS
pnpm sync:ios

# Open in Xcode and run
pnpm open:ios
```

---

### Phase 9: Testing Checklist

#### Pre-Flight Checks
- [ ] Vite dev server runs on port 5173
- [ ] Next.js app still runs on port 3000 (no conflicts)
- [ ] Environment variables loaded correctly
- [ ] Clerk publishable key is valid
- [ ] iPhone connected via USB and trusted

#### OAuth Flow Testing
- [ ] App launches on iPhone
- [ ] Tap "Sign in with Google" button
- [ ] Safari opens automatically
- [ ] Google sign-in page loads
- [ ] User selects Google account (or one-tap if logged in)
- [ ] Safari shows "Opening in EngageKit Demo" or similar
- [ ] App opens via deep link
- [ ] Loading indicator appears
- [ ] Dashboard loads with user info
- [ ] User name and email displayed correctly

#### Session Persistence Testing
- [ ] Close app completely (swipe up in app switcher)
- [ ] Reopen app
- [ ] User still signed in (goes directly to dashboard)
- [ ] Sign out button works
- [ ] After sign out, redirected to sign-in page

#### Error Handling Testing
- [ ] Test with airplane mode (should show error)
- [ ] Test with invalid OAuth callback (should show error)
- [ ] Test with cancelled OAuth flow (user cancels in Safari)

---

## File Structure Summary

Final directory structure:

```
apps/capacitor-demo/
├── ios/                          # Auto-generated by Capacitor
│   ├── App/
│   │   ├── App/
│   │   │   ├── Info.plist        # Deep link config (manual edit)
│   │   │   ├── AppDelegate.swift
│   │   │   └── ...
│   │   └── App.xcodeproj
│   └── Podfile
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Root component
│   ├── router.tsx                # React Router config
│   ├── index.css                 # Tailwind imports
│   ├── components/
│   │   ├── AppUrlListener.tsx    # Deep link handler
│   │   ├── SignInButton.tsx      # Google OAuth button
│   │   └── ProtectedRoute.tsx    # Auth guard
│   ├── pages/
│   │   ├── HomePage.tsx          # Landing
│   │   ├── SignInPage.tsx        # Auth screen
│   │   ├── DashboardPage.tsx     # Post-auth
│   │   └── OAuthCallbackPage.tsx # OAuth handler
│   └── lib/
│       ├── clerk.ts              # Clerk config (if needed)
│       └── trpc.ts               # tRPC client (optional)
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite config
├── capacitor.config.ts           # Capacitor config
├── tailwind.config.ts            # Tailwind config
├── postcss.config.js             # PostCSS config
├── index.html                    # HTML entry
└── .env.local                    # Local env vars
```

**Total new files:** ~25
**Modified files:** 3 (root package.json, turbo.json, .env)

---

## Dependencies & Versions

### Core Dependencies
```json
{
  "@capacitor/app": "^7.0.0",
  "@capacitor/browser": "^7.0.0",
  "@capacitor/cli": "^7.0.0",
  "@capacitor/core": "^7.0.0",
  "@clerk/clerk-react": "^5.26.2",
  "@sassy/api": "workspace:*",
  "@sassy/ui": "workspace:*",
  "@tanstack/react-query": "catalog:",
  "@trpc/client": "catalog:",
  "react": "catalog:react19",
  "react-dom": "catalog:react19",
  "react-router-dom": "^7.1.3",
  "superjson": "2.2.2"
}
```

### Dev Dependencies
```json
{
  "@sassy/eslint-config": "workspace:*",
  "@sassy/prettier-config": "workspace:*",
  "@sassy/tailwind-config": "workspace:*",
  "@sassy/tsconfig": "workspace:*",
  "@tailwindcss/postcss": "^4.1.8",
  "@types/react": "catalog:react19",
  "@types/react-dom": "catalog:react19",
  "@vitejs/plugin-react": "^4.3.4",
  "dotenv-cli": "^8.0.0",
  "tailwindcss": "^4.1.8",
  "typescript": "catalog:",
  "vite": "^6.3.5"
}
```

---

## BLOCKER: Clerk + Capacitor Production Redirect Issue

**Status:** UNRESOLVED - REQUIRES DEEP RESEARCH VERIFICATION

### Problem Statement

After initial OAuth login succeeds, **Capacitor apps in production keep redirecting users to Safari** instead of maintaining the session within the app's WKWebView. This is a fundamental architectural incompatibility between `@clerk/clerk-react` (web SDK) and Capacitor's iOS WKWebView.

### How It Manifests

```
1. User opens app → taps "Sign in with Google" → Safari opens → OAuth completes → deep link returns to app ✅
2. User backgrounds or closes app
3. User reopens app
4. Clerk-JS tries to refresh session via HTTP redirect to:
   https://clerk.your-domain.dev/v1/client/handshake?redirect_url=...
5. WKWebView (in production) treats this as external navigation → opens Safari ❌
6. User is stuck in Safari looking at a Clerk handshake URL
7. Session context is lost
```

### Root Causes

#### 1. `@clerk/clerk-react` relies on cookie-based session management
- Clerk's web SDK (`clerk-js`) manages sessions via cookies and redirect-based "handshakes"
- This works in browsers but breaks in Capacitor's WKWebView in production builds
- The handshake flow involves redirecting to Clerk's domain, which WKWebView delegates to Safari

#### 2. WKWebView cookie isolation on iOS
- WKWebView does NOT share cookies with Safari or SFSafariViewController (since iOS 11)
- Each has its own isolated cookie jar
- Clerk's cookie-based session refresh cannot work across these boundaries
- This is a documented WebKit limitation: https://bugs.webkit.org/show_bug.cgi?id=213510

#### 3. Production vs Development discrepancy
- **Development:** WebView loads from `http://localhost:5173` — cookies work somewhat normally
- **Production:** WebView loads from `capacitor://` or `https://localhost` scheme — cookie and navigation policies are stricter, causing Clerk handshake redirects to break

#### 4. No official Clerk SDK for Capacitor
- Clerk officially supports `@clerk/clerk-expo` for React Native/Expo with a `tokenCache` prop that uses `expo-secure-store` — token-based, no cookies
- `@clerk/clerk-react` (web SDK) has NO `tokenCache` prop — it relies entirely on cookies
- `@clerk/clerk-expo` requires React Native runtime, which Capacitor does not provide

### Community Evidence

- **Ionic Forum (Jul-Oct 2025):** Documented production issue with NO verified fix — https://forum.ionicframework.com/t/ios-webview-redirects-to-safari-after-clerk-authentication-production-vs-development-issue/248720
- **Capacitor cookie issues (long-standing):** https://github.com/ionic-team/capacitor/issues/1373, https://github.com/ionic-team/capacitor/issues/6809
- **`allowNavigation` in production:** Capacitor maintainer confirms it works but is officially "not recommended" — https://github.com/ionic-team/capacitor/discussions/4895

### Potential Solutions (To Be Verified)

#### Option A: `allowNavigation` + Clerk domain whitelisting
- Add all Clerk domains to `capacitor.config.ts` `server.allowNavigation`
- Keeps Clerk's handshake redirects inside WKWebView instead of opening Safari
- **Risk:** Officially not recommended for production; may lose "app context"
- **Confidence:** LOW — no one has confirmed this fully solves it

#### Option B: Custom native plugin to intercept Clerk handshake
- Write a Capacitor plugin overriding `WKNavigationDelegate.decidePolicyForNavigationAction`
- Detect Clerk handshake URLs (`*/v1/client/handshake*`) and handle via `fetch()` inside WebView
- **Risk:** Complex, fragile, breaks if Clerk changes internal URLs
- **Confidence:** MEDIUM — architecturally sound but high maintenance

#### Option C: Token-based session persistence (replicate Expo pattern)
- After OAuth, extract Clerk session token via `getToken()`
- Store in `@capacitor-community/secure-storage` (iOS Keychain)
- On app restart, restore token from secure storage, bypass cookie-based handshake
- **Risk:** `@clerk/clerk-react` may not support overriding its internal session management
- **Confidence:** MEDIUM — the Expo SDK does this, but unclear if web SDK allows it

#### Option D: Switch auth provider (Auth0 / Supabase Auth)
- Auth0 has an official Ionic/Capacitor quickstart with PKCE flow: https://auth0.com/docs/quickstart/native/ionic-react/interactive
- Supabase Auth also has documented Capacitor patterns
- **Risk:** Requires rearchitecting auth across the whole platform
- **Confidence:** HIGH — these are proven paths

#### Option E: Switch to Expo/React Native
- Use `@clerk/clerk-expo` with `tokenCache` + `expo-secure-store` (official first-class support)
- Abandons Capacitor entirely for the mobile app
- **Risk:** Different mobile framework, new build pipeline
- **Confidence:** HIGH — Clerk's officially supported mobile path

### Questions for Deep Research Verification

1. Has anyone successfully used `@clerk/clerk-react` in a Capacitor iOS production app without the Safari redirect issue?
2. Does `allowNavigation` with Clerk domains (`*.clerk.accounts.dev`, `*.clerk.com`) fully resolve the handshake redirect in production builds?
3. Can Clerk's web SDK session management be overridden to use token-based persistence instead of cookies?
4. Is there a Capacitor plugin or native workaround that intercepts WKWebView navigation to prevent Clerk handshakes from opening Safari?
5. Has Clerk announced any plans for a Capacitor SDK or documented a recommended Capacitor integration path?

---

## Known Limitations & Trade-offs

### 1. No Prebuilt Clerk UI Components for Native
- **Issue:** Clerk's `<SignIn />` component doesn't work in Capacitor
- **Workaround:** Using custom UI with `@clerk/clerk-react` hooks
- **Impact:** More code to write, but more control over UX

### 2. OAuth Requires System Browser
- **Issue:** Google blocks OAuth in embedded webviews
- **Solution:** Use `@capacitor/browser` to open Safari
- **Impact:** User leaves app momentarily (standard mobile pattern)

### 3. Session Persistence Complexity (SEE BLOCKER ABOVE)
- **Issue:** Capacitor webview doesn't share cookies with Safari
- **Previous assumption:** "Clerk handles token-based session storage internally" — **THIS IS WRONG**
- **Reality:** `@clerk/clerk-react` uses cookie-based sessions with redirect handshakes that break in production WKWebView
- **Impact:** CRITICAL — this is the primary blocker for production viability

### 4. Development Workflow
- **Issue:** iPhone can't access `localhost:5173`
- **Solution:** Use computer's local IP address
- **Impact:** Must update `capacitor.config.ts` for dev vs. prod

### 5. No Hot Module Replacement on Device
- **Issue:** Vite HMR doesn't work in iOS Capacitor app
- **Workaround:** Use live reload (full page refresh) or rebuild
- **Impact:** Slower development iteration

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Clerk session handshake redirects to Safari in production** | **HIGH** | **CRITICAL** | **UNRESOLVED — see BLOCKER section above** |
| Clerk OAuth callback doesn't work in Capacitor | Medium | High | Extensive testing; fallback to email/password auth if needed |
| Deep link conflicts with existing apps | Low | Medium | Use unique URL scheme (`capacitordemo://`) |
| Session not persisting after app restart | **HIGH** | **CRITICAL** | **Cookie-based sessions break in WKWebView — requires architectural solution** |
| Google OAuth blocks Capacitor webview | Low | Critical | Already using Browser plugin (system browser) |
| iOS code signing issues during device testing | Medium | Low | Clear documentation for code signing steps |
| Port conflicts with existing Next.js app | Low | Low | Use port 5173 (Vite default, different from Next.js 3000) |

---

## Success Validation

### Minimum Viable Demo (MVP)
- [x] Capacitor app builds for iOS
- [x] App installs on iPhone
- [x] Sign-in button visible
- [x] Tapping button opens Safari
- [x] OAuth flow completes
- [x] App receives deep link
- [x] User sees dashboard with their info

### Extended Validation
- [ ] Session persists after app restart
- [ ] Sign-out works correctly
- [ ] Multiple sign-ins work (cached session reuse)
- [ ] Error states handled gracefully
- [ ] tRPC calls work (optional)
- [ ] UI matches design system
- [ ] No console errors in production build

---

## Documentation to Create

1. **README.md** - Setup and development instructions
2. **TESTING.md** - Testing checklist and troubleshooting
3. **DEPLOYMENT.md** - App Store submission guide (future)
4. **ARCHITECTURE.md** - Technical architecture documentation

---

## Future Enhancements

After successful demo:

1. **Add More Auth Methods**
   - Email/password sign-in
   - Apple sign-in (required for App Store)
   - Phone number authentication

2. **Implement Full Feature Set**
   - tRPC integration with backend
   - Push notifications via Capacitor Push plugin
   - Biometric authentication (Face ID/Touch ID)
   - Offline support with local storage

3. **Production Readiness**
   - App Store submission process
   - TestFlight beta testing
   - Production environment configuration
   - Analytics integration

4. **Cross-Platform Support**
   - Add Android support (`npx cap add android`)
   - Test OAuth flow on Android devices
   - Configure Android deep links

---

## Approval Status

**PLAN STATUS:** ⛔ BLOCKED — PENDING DEEP RESEARCH VERIFICATION

**Blocker:** The Clerk + Capacitor production Safari redirect issue must be resolved before proceeding. The app scaffolding exists but cannot ship to production without a verified solution to session persistence in WKWebView.

**Next Step:** Verify the blocker via Claude Deep Research with the 5 questions listed in the BLOCKER section. Based on findings, either:
- Proceed with a verified workaround (Options A-C)
- Pivot auth provider (Option D)
- Pivot mobile framework to Expo (Option E)

Once blocker is resolved, implementation follows these phases:
1. Project initialization (Steps 1.1-1.2)
2. Deep link configuration (Steps 2.1-2.2)
3. React app structure (Steps 3.1-3.8)
4. **Session persistence solution (NEW — based on deep research findings)**
5. tRPC integration - optional (Phase 4)
6. Styling & UI (Steps 5.1)
7. Environment variables (Phase 6)
8. Turborepo integration (Steps 7.1-7.3)
9. iOS device testing setup (Steps 8.1-8.3)
10. Testing & validation (Phase 9)

**Estimated Complexity:** Complex (multi-phase, new app, iOS configuration, **auth architecture TBD**)
**Estimated Files:** ~25 new files, 3 modified (may increase depending on solution)
**Critical Path:** **Resolve blocker** → Deep link configuration → OAuth flow → Session persistence → Device testing

---

## References & Resources

### Documentation
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [Clerk React Documentation](https://clerk.com/docs/references/react)
- [Clerk OAuth Flows](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections)
- [Google OAuth Best Practices](https://developers.googleblog.com/2016/08/modernizing-oauth-interactions-in-native-apps.html)

### Community Resources
- [Aaron Saunders Ionic + Clerk Demo](https://github.com/aaronksaunders/ionic-vue-clerk-tutorial-start)
- [Clerk Mobile OAuth Discussion](https://github.com/orgs/supabase/discussions/11548)
- [Capacitor OAuth2 Plugin](https://github.com/capacitor-community/generic-oauth2)

### Tools
- [Apple Developer Portal](https://developer.apple.com)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Context7 Capacitor Docs](https://context7.com/docs/ionic-team/capacitor-docs)
- [Context7 Clerk Docs](https://context7.com/docs/clerk/clerk-docs)
