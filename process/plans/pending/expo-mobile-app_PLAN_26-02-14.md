# Expo Mobile App with Clerk Authentication - Implementation Plan

**Date:** 2026-02-14
**Replaces:** `capacitor-demo-app_PLAN_26-01-26.md` (BLOCKED - Clerk incompatible with Capacitor WKWebView)
**Status:** PLAN COMPLETE - AWAITING APPROVAL
**Complexity:** COMPLEX

---

## Executive Summary

Create a production-ready Expo React Native mobile app in `/apps/expo` with Clerk authentication (Google OAuth), NativeWind styling, and tRPC API integration. This replaces the Capacitor approach which had a **fundamental blocker** — Clerk's web SDK uses cookie-based session handshakes that break in Capacitor's WKWebView on production iOS builds, causing unwanted Safari redirects.

**Why Expo over Capacitor:**
- Clerk officially supports `@clerk/clerk-expo` with token-based session persistence (no cookies)
- Built-in `tokenCache` using `expo-secure-store` (iOS Keychain) — sessions survive app restarts
- `useOAuth()` hook handles the entire Google OAuth flow including deep link callbacks
- No WKWebView cookie isolation issues — native token storage bypasses the problem entirely

---

## Goals & Success Criteria

### Primary Goals
1. Working Expo app with Clerk authentication (Google OAuth)
2. Token-based session persistence via `expo-secure-store` (survives app restart)
3. NativeWind (Tailwind CSS for React Native) styling
4. tRPC client connected to existing Bun API server
5. iPhone device testing via Expo Dev Client
6. Turborepo integration

### Success Criteria
- [ ] User can tap "Sign in with Google"
- [ ] System browser opens, Google OAuth completes
- [ ] Deep link returns to app, session established
- [ ] Session persists after app close/reopen (token-based, not cookie-based)
- [ ] Dashboard shows user info from Clerk
- [ ] tRPC calls to existing API server work with Bearer token auth
- [ ] NativeWind styles render correctly on device
- [ ] Dev server runs alongside existing Next.js app

---

## Why Capacitor Failed (Context for Deep Research)

### The Blocker (Documented)
`@clerk/clerk-react` (web SDK) manages sessions via **cookies and redirect-based handshakes**. In Capacitor's WKWebView:
1. Initial OAuth works — user signs in, deep link returns to app
2. After backgrounding/closing and reopening the app, Clerk-JS tries to refresh the session by redirecting to `https://clerk.domain.dev/v1/client/handshake?redirect_url=...`
3. WKWebView in production treats this as external navigation → opens Safari
4. Session context is lost, user is stuck in Safari

### Root Causes
- WKWebView doesn't share cookies with Safari (iOS 11+)
- Clerk's web SDK has no `tokenCache` prop — relies entirely on cookies
- `@clerk/clerk-expo` requires React Native runtime, unavailable in Capacitor
- Documented on Ionic Forum (Jul-Oct 2025) with **no verified fix**

### How Expo Solves This
- `@clerk/clerk-expo` uses **token-based** session management, not cookies
- Built-in `tokenCache` stores tokens in `expo-secure-store` (iOS Keychain)
- No redirect handshakes — tokens are validated directly
- OAuth uses `expo-web-browser` + `expo-linking` — proven, first-class support

---

## Technical Approach

### Architecture Overview

```
┌──────────────────────────────────────────┐
│  Expo App (/apps/expo)                   │
│  ┌────────────────────────────────────┐  │
│  │  React Native UI (NativeWind)     │  │
│  │  - Sign-in screen (OAuth)         │  │
│  │  - Dashboard (post-auth)          │  │
│  │  - Expo Router (file-based)       │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  @clerk/clerk-expo                │  │
│  │  - ClerkProvider + tokenCache     │  │
│  │  - useOAuth (Google)              │  │
│  │  - useAuth, useUser hooks         │  │
│  │  - expo-secure-store (Keychain)   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  tRPC Client                      │  │
│  │  - httpBatchLink to Bun server    │  │
│  │  - Bearer token auth (getToken)   │  │
│  │  - @tanstack/react-query          │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
         │
         │ HTTP + Bearer Token
         ▼
┌──────────────────────────────────────────┐
│  Existing Bun API Server                 │
│  - /api/trpc/* (fetchRequestHandler)     │
│  - CORS: * (already configured)          │
│  - Auth: clerkClient.authenticateRequest │
│  - No changes needed                     │
└──────────────────────────────────────────┘
```

### OAuth Flow (Expo)

```
1. User taps "Sign in with Google"
   ↓
2. useOAuth({ strategy: 'oauth_google' }).startOAuthFlow()
   ↓
3. expo-web-browser opens system browser
   ↓
4. User signs in to Google (or one-tap)
   ↓
5. Google redirects to Clerk → Clerk redirects to engagekit://
   ↓
6. WebBrowser.maybeCompleteAuthSession() catches redirect
   ↓
7. Clerk returns createdSessionId
   ↓
8. setActive({ session: createdSessionId })
   ↓
9. Token stored in expo-secure-store (iOS Keychain) automatically
   ↓
10. User is authenticated, navigates to dashboard
```

### Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Expo SDK | 54 | Latest, React 19.1, RN 0.81.1 |
| Routing | Expo Router | (bundled) | File-based, auth groups |
| Auth | @clerk/clerk-expo | latest | Token-based, tokenCache built-in |
| Token Storage | expo-secure-store | (bundled) | iOS Keychain / Android Keystore |
| OAuth Browser | expo-web-browser | (bundled) | System browser for OAuth |
| Deep Linking | expo-linking | (bundled) | `engagekit://` scheme |
| Styling | NativeWind v4 | latest | Tailwind CSS for React Native |
| Tailwind | tailwindcss v3 | ^3.4.17 | Required by NativeWind v4 (NOT v4) |
| API Client | tRPC | ^11.0.0-rc.824 | From monorepo catalog |
| Query | @tanstack/react-query | ^5.67.1 | From monorepo catalog |
| Serialization | superjson | 2.2.2 | Matches server |

---

## Detailed Implementation Steps

### Phase 1: Project Initialization

#### Step 1.1: Create Expo App

```bash
cd apps
npx create-expo-app@latest expo --template blank-typescript
cd expo
```

#### Step 1.2: Configure `package.json`

```json
{
  "name": "@sassy/expo",
  "version": "0.1.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "dev:ios": "expo start --ios",
    "dev:android": "expo start --android",
    "build:dev": "eas build --profile development --platform ios",
    "build:preview": "eas build --profile preview --platform ios",
    "prebuild": "expo prebuild",
    "typecheck": "tsc --noEmit",
    "lint": "eslint",
    "clean": "rm -rf .expo ios android node_modules"
  },
  "dependencies": {
    "@clerk/clerk-expo": "latest",
    "@sassy/api": "workspace:*",
    "@tanstack/react-query": "catalog:",
    "@trpc/client": "catalog:",
    "@trpc/tanstack-react-query": "catalog:",
    "expo": "~54.0.0",
    "expo-auth-session": "~6.0.0",
    "expo-linking": "~7.0.0",
    "expo-router": "~5.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-status-bar": "~2.2.0",
    "expo-web-browser": "~14.0.0",
    "nativewind": "^4.1.0",
    "react": "19.1.0",
    "react-native": "0.81.1",
    "react-native-reanimated": "~3.17.0",
    "react-native-safe-area-context": "~5.4.0",
    "react-native-screens": "~4.10.0",
    "superjson": "2.2.2"
  },
  "devDependencies": {
    "@sassy/tsconfig": "workspace:*",
    "@types/react": "~19.0.0",
    "tailwindcss": "^3.4.17",
    "typescript": "catalog:"
  }
}
```

**Key decisions:**
- `tailwindcss@^3.4.17` — NativeWind v4 requires Tailwind v3, NOT v4
- `@sassy/api: workspace:*` — type imports only (AppRouter type)
- `main: "expo-router/entry"` — enables file-based routing

#### Step 1.3: Configure `app.json`

```json
{
  "expo": {
    "name": "EngageKit",
    "slug": "engagekit-mobile",
    "scheme": "engagekit",
    "version": "1.0.0",
    "orientation": "portrait",
    "newArchEnabled": true,
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "io.engagekit.mobile",
      "supportsTablet": false
    },
    "android": {
      "package": "io.engagekit.mobile",
      "adaptiveIcon": {
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": ["expo-router", "expo-secure-store"]
  }
}
```

**Critical:** `"scheme": "engagekit"` — required for OAuth deep link redirects.

---

### Phase 2: NativeWind Configuration

#### Step 2.1: Tailwind Config (v3 syntax, CommonJS)

**File:** `/apps/expo/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
  plugins: [],
};
```

#### Step 2.2: Babel Config

**File:** `/apps/expo/babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

#### Step 2.3: Metro Config

**File:** `/apps/expo/metro.config.js`

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// SDK 52+ auto-detects monorepo from pnpm-workspace.yaml
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

#### Step 2.4: Global CSS

**File:** `/apps/expo/global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### Step 2.5: NativeWind TypeScript Types

**File:** `/apps/expo/nativewind-env.d.ts`

```typescript
/// <reference types="nativewind/types" />
```

---

### Phase 3: Clerk Authentication

#### Step 3.1: Root Layout with Providers

**File:** `/apps/expo/app/_layout.tsx`

```tsx
import "../global.css";
import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { TRPCReactProvider } from "../src/utils/trpc-provider";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <TRPCReactProvider>
        <Slot />
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
```

**Key:** `tokenCache` from `@clerk/clerk-expo/token-cache` — built-in, uses `expo-secure-store` (iOS Keychain). No manual implementation needed.

#### Step 3.2: Auth Route Group

**File:** `/apps/expo/app/(auth)/_layout.tsx`

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**File:** `/apps/expo/app/(auth)/sign-in.tsx`

```tsx
import React, { useCallback, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useOAuth } from "@clerk/clerk-expo";

// MUST be called at module level
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [isLoading, setIsLoading] = React.useState(false);

  // Warm up browser on Android
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/dashboard", { scheme: "engagekit" }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // Navigation handled automatically by auth state change
      }
    } catch (err) {
      console.error("OAuth error:", JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow]);

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="w-full max-w-sm space-y-8">
        <View className="items-center">
          <Text className="text-3xl font-bold text-foreground">Welcome</Text>
          <Text className="mt-2 text-muted-foreground">Sign in to continue</Text>
        </View>

        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full rounded-lg bg-primary p-4 items-center"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-semibold">
              Sign in with Google
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
```

#### Step 3.3: Protected App Route Group

**File:** `/apps/expo/app/(app)/_layout.tsx`

```tsx
import { Text, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return <Stack />;
}
```

#### Step 3.4: Dashboard Screen

**File:** `/apps/expo/app/(app)/dashboard.tsx`

```tsx
import { View, Text, Pressable } from "react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";

export default function DashboardScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <View className="flex-1 bg-background p-6">
      <View className="bg-card rounded-lg p-6 shadow">
        <Text className="text-2xl font-bold text-card-foreground mb-4">
          Dashboard
        </Text>

        <View className="space-y-3">
          <View>
            <Text className="text-sm text-muted-foreground">Signed in as:</Text>
            <Text className="text-lg font-medium text-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>

          <View>
            <Text className="text-sm text-muted-foreground">Name:</Text>
            <Text className="text-lg font-medium text-foreground">
              {user?.fullName || "N/A"}
            </Text>
          </View>

          <Pressable
            onPress={() => signOut()}
            className="mt-4 rounded-lg border border-border p-3 items-center"
          >
            <Text className="text-foreground">Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
```

#### Step 3.5: Root Index (Redirect)

**File:** `/apps/expo/app/index.tsx`

```tsx
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/sign-in" />;
}
```

---

### Phase 4: tRPC Client Integration

#### Step 4.1: tRPC Setup

**File:** `/apps/expo/src/utils/trpc.ts`

```tsx
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@sassy/api";

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();
```

#### Step 4.2: tRPC Provider

**File:** `/apps/expo/src/utils/trpc-provider.tsx`

```tsx
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useAuth } from "@clerk/clerk-expo";
import SuperJSON from "superjson";
import { TRPCProvider } from "./trpc";
import type { AppRouter } from "@sassy/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  });
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [queryClient] = useState(() => makeQueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: SuperJSON,
          url: `${API_URL}/api/trpc`,
          async headers() {
            const headers: Record<string, string> = {
              "x-trpc-source": "expo-react-native",
            };
            const token = await getToken();
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

**Key:** `getToken()` from `@clerk/clerk-expo` returns a JWT. The existing Bun API server at `/packages/api/src/trpc.ts` already validates Bearer tokens via `clerkClient.authenticateRequest()`. No server-side changes needed.

---

### Phase 5: TypeScript Configuration

**File:** `/apps/expo/tsconfig.json`

```json
{
  "extends": "@sassy/tsconfig/base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022"],
    "types": ["nativewind/types"],
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "nativewind-env.d.ts"],
  "exclude": ["node_modules", "ios", "android", ".expo"]
}
```

---

### Phase 6: Environment Variables

**File:** `/apps/expo/.env.local`

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dG9sZXJhbnQtaGFnZmlzaC0xLmNsZXJrLmFjY291bnRzLmRldiQ
EXPO_PUBLIC_API_URL=http://localhost:8040
```

**Note:** Expo uses `EXPO_PUBLIC_` prefix (not `NEXT_PUBLIC_` or `VITE_`).

---

### Phase 7: Turborepo Integration

**Update:** Root `turbo.json` — add Expo env vars to `globalEnv`:

```json
{
  "globalEnv": [
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "EXPO_PUBLIC_API_URL"
  ]
}
```

**Update:** Root `package.json` — add script:

```json
{
  "scripts": {
    "dev:expo": "turbo watch dev -F @sassy/expo..."
  }
}
```

The `pnpm-workspace.yaml` already includes `apps/*`, so the Expo app will be auto-discovered.

**Note on `.npmrc`:** May need `node-linker=hoisted` for React Native/Metro compatibility with pnpm.

---

### Phase 8: Device Testing

#### Development Build

```bash
cd apps/expo

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Or specifically for iOS
pnpm dev:ios
```

For physical device testing:
1. Install **Expo Go** on iPhone from App Store
2. Scan QR code from terminal
3. Or use `npx expo run:ios` for native build with dev client

#### Production-Like Build (EAS)

```bash
# First time: initialize EAS
npx eas-cli init

# Development build (includes dev menu)
npx eas build --profile development --platform ios

# Preview build (production-like, no dev menu)
npx eas build --profile preview --platform ios
```

---

## File Structure Summary

```
apps/expo/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx              # Root layout (providers)
│   ├── index.tsx                # Entry redirect
│   ├── (auth)/                  # Auth route group (unauthenticated)
│   │   ├── _layout.tsx          # Auth stack layout
│   │   └── sign-in.tsx          # Google OAuth sign-in
│   └── (app)/                   # App route group (authenticated)
│       ├── _layout.tsx          # Protected layout (auth guard)
│       └── dashboard.tsx        # Post-auth dashboard
├── src/
│   └── utils/
│       ├── trpc.ts              # tRPC context
│       └── trpc-provider.tsx    # tRPC + React Query provider
├── global.css                   # Tailwind base imports
├── app.json                     # Expo config (scheme, bundle ID)
├── babel.config.js              # Babel + NativeWind
├── metro.config.js              # Metro + NativeWind
├── tailwind.config.js           # Tailwind v3 + NativeWind preset
├── tsconfig.json                # TypeScript config
├── nativewind-env.d.ts          # NativeWind type declarations
├── package.json                 # Dependencies
└── .env.local                   # Environment variables
```

**Total new files:** ~15
**Modified files:** 2 (root turbo.json, root package.json)

---

## Monorepo Package Compatibility

| Package | Reusable? | Notes |
|---------|-----------|-------|
| `@sassy/api` | Type imports only | `import type { AppRouter }` — actual API runs on Bun server |
| `@sassy/db` | No | Server-side only. All DB access via tRPC |
| `@sassy/ui` | No | Web-only (Radix UI, shadcn). Build native components inline or use `react-native-reusables` |
| `@sassy/tsconfig` | Yes | Base config extends cleanly, add `jsx` and NativeWind types |
| `@sassy/tailwind-config` | No | Uses Tailwind v4. Expo needs Tailwind v3 with NativeWind preset |
| `@sassy/validators` | Yes | Zod schemas work cross-platform |

---

## Known Limitations & Trade-offs

### 1. Tailwind Version Mismatch
- **Issue:** NativeWind v4 requires Tailwind CSS v3; monorepo uses Tailwind v4
- **Solution:** Expo app has its own `tailwindcss@^3.4.17` devDependency
- **Impact:** Color theme duplicated from `tooling/tailwind/base.ts` into `tailwind.config.js`

### 2. No Shared UI Components
- **Issue:** `@sassy/ui` is entirely web-based (Radix, shadcn)
- **Solution:** Build React Native components directly in Expo app
- **Impact:** UI effort not shared with web. Future: create `@sassy/ui-native`

### 3. Metro Bundler vs Turbo
- **Issue:** Metro has its own module resolution, may conflict with pnpm symlinks
- **Solution:** May need `node-linker=hoisted` in `.npmrc`
- **Impact:** Minimal — well-documented Expo monorepo pattern

### 4. `@sassy/api` Server Dependencies
- **Issue:** Metro may try to resolve server-only packages when importing types
- **Solution:** Use `import type` only. If issues, add server packages to Metro `resolver.blockList`
- **Impact:** Low risk — type-only imports are usually tree-shaken

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OAuth flow doesn't complete on device | Low | High | Clerk + Expo is officially supported; use `useOAuth` pattern exactly as documented |
| NativeWind styles not rendering | Medium | Medium | Follow exact 4-file config (babel, metro, tailwind, global.css) |
| Metro can't resolve monorepo packages | Low | Medium | SDK 52+ auto-detects; fallback: `node-linker=hoisted` |
| Token persistence fails on app restart | Low | High | Built-in `tokenCache` uses `expo-secure-store` (Keychain) — battle-tested |
| tRPC calls fail from device | Low | Medium | Bun server already has CORS `*`; use device's network IP for API_URL |

---

## Capacitor Demo App Disposition

The existing `/apps/capacitor-demo` should be:
1. **Kept as reference** — the Clerk web SDK OAuth flow code is useful documentation
2. **Not deleted** — may be useful if Clerk ever ships a Capacitor SDK
3. **Marked as archived** in any documentation

---

## Approval Status

**PLAN STATUS:** COMPLETE - READY FOR REVIEW

Once approved, implementation follows these phases:
1. Project initialization (Phase 1)
2. NativeWind configuration (Phase 2)
3. Clerk authentication (Phase 3)
4. tRPC client integration (Phase 4)
5. TypeScript configuration (Phase 5)
6. Environment variables (Phase 6)
7. Turborepo integration (Phase 7)
8. Device testing (Phase 8)

**Estimated Complexity:** Complex (new framework, monorepo integration)
**Estimated Files:** ~15 new files, 2 modified
**Critical Path:** NativeWind config → Clerk auth → tRPC integration → Device testing

---

## References

### Official Documentation
- [Clerk Expo Quickstart](https://clerk.com/docs/quickstarts/expo)
- [Clerk Expo OAuth Guide](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/)

### Community Resources
- [Clerk Expo Starter](https://github.com/clerk/clerk-expo-quickstart)
- [Capacitor Blocker — Ionic Forum Thread](https://forum.ionicframework.com/t/ios-webview-redirects-to-safari-after-clerk-authentication-production-vs-development-issue/248720)
