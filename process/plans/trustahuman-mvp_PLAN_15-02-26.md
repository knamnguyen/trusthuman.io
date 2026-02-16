# Trust a Human - MVP Plan (Sidebar UI, No Auth)

**Date**: February 15, 2026
**Complexity**: SIMPLE (one session)
**Status**: PLANNED

---

## Overview

WXT Chrome extension in `apps/trustahuman-ext/` with a React sidebar UI (same pattern as xbooster). Detects LinkedIn comment submit clicks, captures a webcam photo via offscreen document, sends base64 to server via tRPC `publicProcedure`, calls AWS Rekognition DetectFaces, stores result, returns verified/not + confidence. Sidebar shows verification history in real time. Comment is never blocked.

---

## Architecture

```
Content Script (linkedin.com) — React sidebar in Shadow DOM
    | 1. MutationObserver detects submit button
    | 2. Click listener fires (capture phase)
    | 3. Send "capturePhoto" to background
    v
Background Service Worker
    | 4. Create offscreen document (if not exists)
    | 5. Send "startCapture" to offscreen
    v
Offscreen Document
    | 6. getUserMedia -> canvas -> base64 JPEG
    | 7. Return base64 to background
    v
Background Service Worker
    | 8. Return base64 to content script
    v
Content Script
    | 9. Call verification.analyzePhoto tRPC mutation (async)
    v
Server (tRPC publicProcedure)
    | 10. Decode base64, call Rekognition DetectFaces
    | 11. Store in HumanVerification table
    | 12. Return { verified, confidence, faceCount }
    v
Content Script
    | 13. Add result to verification-store -> sidebar auto-updates
```

---

## Extension File Structure

```
apps/trustahuman-ext/
  package.json
  tsconfig.json
  wxt.config.ts
  tailwind.config.ts
  postcss.config.mjs
  assets/
    globals.css
  lib/
    trpc-client.ts
  entrypoints/
    background/
      index.ts
    offscreen.html
    offscreen.ts
    linkedin.content/
      index.tsx
      App.tsx
      ToggleButton.tsx
      VerificationSidebar.tsx
      stores/
        sidebar-store.ts
        shadow-root-store.ts
        verification-store.ts
```

---

## Files to Create (Extension) -- 14 files

| # | File | Purpose |
|---|------|---------|
| 1 | `apps/trustahuman-ext/package.json` | Deps: wxt, react, radix (via @sassy/ui), tailwind, zustand, lucide-react, trpc |
| 2 | `apps/trustahuman-ext/tsconfig.json` | TypeScript config, extends monorepo base |
| 3 | `apps/trustahuman-ext/wxt.config.ts` | WXT config with React module, Tailwind/PostCSS in Vite, port +4 |
| 4 | `apps/trustahuman-ext/tailwind.config.ts` | Tailwind config (same pattern as xbooster) |
| 5 | `apps/trustahuman-ext/postcss.config.mjs` | PostCSS: tailwindcss, postcss-rem-to-pixel, autoprefixer |
| 6 | `apps/trustahuman-ext/assets/globals.css` | Tailwind directives + shadow DOM `:host` CSS vars |
| 7 | `apps/trustahuman-ext/lib/trpc-client.ts` | Standalone vanilla tRPC client (no auth, no React) |
| 8 | `apps/trustahuman-ext/entrypoints/background/index.ts` | Message listener for capturePhoto only |
| 9 | `apps/trustahuman-ext/entrypoints/offscreen.html` | Offscreen document HTML |
| 10 | `apps/trustahuman-ext/entrypoints/offscreen.ts` | getUserMedia capture logic |
| 11 | `apps/trustahuman-ext/entrypoints/linkedin.content/stores/sidebar-store.ts` | isOpen state (zustand) |
| 12 | `apps/trustahuman-ext/entrypoints/linkedin.content/stores/shadow-root-store.ts` | Shadow DOM ref (zustand) |
| 13 | `apps/trustahuman-ext/entrypoints/linkedin.content/stores/verification-store.ts` | Verification list + recording state (zustand) |
| 14 | `apps/trustahuman-ext/entrypoints/linkedin.content/ToggleButton.tsx` | Chevron button for sidebar toggle |
| 15 | `apps/trustahuman-ext/entrypoints/linkedin.content/VerificationSidebar.tsx` | Sidebar content: header + verification list |
| 16 | `apps/trustahuman-ext/entrypoints/linkedin.content/App.tsx` | Toggle button + Sheet container |
| 17 | `apps/trustahuman-ext/entrypoints/linkedin.content/index.tsx` | Content script entry: createShadowRootUi + verification detection logic |

## Files to Create (Shared Packages) -- 2 files

| # | File | Purpose |
|---|------|---------|
| 18 | `packages/db/prisma/models/tools/verification.prisma` | HumanVerification model (userId optional) |
| 19 | `packages/api/src/router/tools/verification.ts` | Rekognition tRPC router (publicProcedure) |

## Files to Modify -- 3 files

| # | File | Change |
|---|------|--------|
| 20 | `packages/db/prisma/models/user.prisma` | Add `humanVerifications HumanVerification[]` relation |
| 21 | `packages/api/src/router/root.ts` | Register `verificationRouter` |
| 22 | `packages/api/package.json` | Add `@aws-sdk/client-rekognition` |

**Total: 22 files** (19 create + 3 modify)

---

## Detailed Specifications

### 1. `apps/trustahuman-ext/package.json`

```json
{
  "name": "@sassy/trustahuman-ext",
  "description": "Trust a Human - LinkedIn Comment Verification (MVP)",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "pnpm with-env wxt",
    "with-env": "dotenv -e ../../.env --",
    "with-env:prod": "dotenv -e ../../.env.prod --",
    "build": "pnpm with-env:prod wxt build",
    "zip": "wxt zip",
    "compile": "tsc --noEmit",
    "postinstall": "wxt prepare",
    "clean": "git clean -xdf .cache .turbo .output dist node_modules"
  },
  "dependencies": {
    "@sassy/api": "workspace:^",
    "@sassy/ui": "workspace:*",
    "@trpc/client": "catalog:",
    "clsx": "^2.1.1",
    "lucide-react": "^0.511.0",
    "react": "catalog:react19",
    "react-dom": "catalog:react19",
    "superjson": "catalog:",
    "tailwind-merge": "^2.6.0",
    "zustand": "^5.0.9"
  },
  "devDependencies": {
    "@sassy/tsconfig": "workspace:*",
    "@types/chrome": "^0.0.323",
    "@types/react": "catalog:react19",
    "@types/react-dom": "catalog:react19",
    "@wxt-dev/module-react": "^1.1.2",
    "autoprefixer": "^10.4.21",
    "dotenv-cli": "^8.0.0",
    "postcss": "^8.5.6",
    "postcss-rem-to-pixel": "^4.1.2",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "catalog:",
    "vite-tsconfig-paths": "^5.1.4",
    "wxt": "^0.19.29"
  }
}
```

---

### 2. `apps/trustahuman-ext/tsconfig.json`

```json
{
  "extends": "../../tooling/typescript/base.json",
  "compilerOptions": {
    "target": "esnext",
    "types": ["vite/client", "node", "chrome"],
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "entrypoints",
    "lib",
    "*.ts",
    ".wxt/wxt.d.ts"
  ]
}
```

---

### 3. `apps/trustahuman-ext/wxt.config.ts`

Port offset `+4` (wxt-extension uses +2, xbooster uses +3). Inline PostCSS config in Vite matching xbooster pattern (tailwindcss + postcss-rem-to-pixel + autoprefixer).

```typescript
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "wxt";

const basePort = parseInt(process.env.PORT || "3000");
const wxtPort = basePort + 4;

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",

  runner: {
    disabled: true,
  },

  dev: {
    server: {
      port: wxtPort,
    },
  },

  manifest: {
    name: "Trust a Human",
    description: "Verify you are human when commenting on LinkedIn",
    version: "0.1.0",
    permissions: ["offscreen", "storage"],
    host_permissions: [
      "https://*.linkedin.com/*",
      "http://localhost/*",
    ],
  },

  vite: () => ({
    plugins: [tsconfigPaths()],
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
    esbuild: {
      charset: "ascii",
    },
  }),
});
```

---

### 4. `apps/trustahuman-ext/tailwind.config.ts`

Same as xbooster. Content paths scan entrypoints and @sassy/ui.

```typescript
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
```

---

### 5. `apps/trustahuman-ext/postcss.config.mjs`

Same as xbooster.

```javascript
export default {
  plugins: {
    tailwindcss: {},
    "postcss-rem-to-pixel": {
      rootValue: 16,
      propList: ["*"],
      selectorBlackList: [],
    },
    autoprefixer: {},
  },
};
```

---

### 6. `apps/trustahuman-ext/assets/globals.css`

Same shadow DOM approach as xbooster, but with Trust a Human brand colors (green/trust theme instead of xBooster blue).

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :host,
  :host *,
  :host *::before,
  :host *::after {
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
  }

  :host {
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :host {
    --background: #ffffff;
    --foreground: #0a0a0a;
    --card: #ffffff;
    --card-foreground: #0a0a0a;
    --popover: #ffffff;
    --popover-foreground: #0a0a0a;
    --primary: #16a34a;
    --primary-foreground: #ffffff;
    --secondary: #f5f5f4;
    --secondary-foreground: #0a0a0a;
    --muted: #f5f5f4;
    --muted-foreground: #737373;
    --accent: #f0fdf4;
    --accent-foreground: #0a0a0a;
    --destructive: #ef4444;
    --destructive-foreground: #ffffff;
    --border: #e5e5e5;
    --input: #e5e5e5;
    --ring: #16a34a;
    --radius: 8px;
    --font-sans: system-ui, -apple-system, sans-serif;
    --shadow-2xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  }

  :host,
  :host * {
    border-color: var(--border);
  }

  :host {
    color: var(--foreground);
    display: block;
  }

  :host * {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  }

  :host *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  :host *::-webkit-scrollbar-track {
    background: transparent;
  }

  :host *::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  :host *::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
}
```

Note: No `background-color` on `:host` (unlike xbooster) since this overlays LinkedIn. The sidebar's SheetContent has its own background.

---

### 7. `apps/trustahuman-ext/lib/trpc-client.ts`

Standalone vanilla tRPC client. No auth headers, no React.

```typescript
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@sassy/api";

const API_URL = import.meta.env.VITE_APP_URL || "http://localhost:3000";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
```

---

### 8. `apps/trustahuman-ext/entrypoints/background/index.ts`

Minimal background worker. Only handles `capturePhoto` messages. Same as previous plan.

```typescript
export default defineBackground(() => {
  console.log("TrustAHuman - Background loaded");

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "capturePhoto") {
      handleCapturePhoto().then(sendResponse).catch((err) => {
        console.error("capturePhoto error:", err);
        sendResponse({ base64: null });
      });
      return true; // async response
    }

    if (message.action === "captureResult") {
      return false;
    }
  });

  async function handleCapturePhoto(): Promise<{ base64: string | null }> {
    const hasDoc = await chrome.offscreen.hasDocument();
    if (!hasDoc) {
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: "Capture webcam for human verification",
      });
    }

    const base64 = await new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10000);

      const listener = (msg: any) => {
        if (msg.action === "captureResult") {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(listener);
          resolve(msg.base64 ?? null);
        }
      };
      chrome.runtime.onMessage.addListener(listener);

      chrome.runtime.sendMessage({ action: "startCapture" });
    });

    try {
      await chrome.offscreen.closeDocument();
    } catch { /* already closed */ }

    return { base64 };
  }
});
```

---

### 9. `apps/trustahuman-ext/entrypoints/offscreen.html`

```html
<!doctype html>
<html>
  <head><title>TrustAHuman Offscreen</title></head>
  <body>
    <canvas id="canvas" width="640" height="480" style="display:none;"></canvas>
    <script type="module" src="./offscreen.ts"></script>
  </body>
</html>
```

---

### 10. `apps/trustahuman-ext/entrypoints/offscreen.ts`

```typescript
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "startCapture") {
    capturePhoto();
    return true;
  }
});

async function capturePhoto() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    // Wait 500ms for camera warmup
    await new Promise((r) => setTimeout(r, 500));

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, 640, 480);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.replace("data:image/jpeg;base64,", "");

    stream.getTracks().forEach((t) => t.stop());

    chrome.runtime.sendMessage({ action: "captureResult", base64 });
  } catch (err) {
    console.error("Camera capture failed:", err);
    chrome.runtime.sendMessage({ action: "captureResult", base64: null });
  }
}
```

---

### 11. `apps/trustahuman-ext/entrypoints/linkedin.content/stores/sidebar-store.ts`

```typescript
import { create } from "zustand";

interface SidebarStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
```

---

### 12. `apps/trustahuman-ext/entrypoints/linkedin.content/stores/shadow-root-store.ts`

```typescript
import { create } from "zustand";

interface ShadowRootStore {
  shadowRoot: HTMLElement | null;
  setShadowRoot: (el: HTMLElement | null) => void;
}

export const useShadowRootStore = create<ShadowRootStore>((set) => ({
  shadowRoot: null,
  setShadowRoot: (shadowRoot) => set({ shadowRoot }),
}));
```

---

### 13. `apps/trustahuman-ext/entrypoints/linkedin.content/stores/verification-store.ts`

```typescript
import { create } from "zustand";

export interface Verification {
  id: string;
  timestamp: Date;
  action: "comment";
  platform: "linkedin";
  verified: boolean;
  confidence: number;
  faceCount: number;
}

interface VerificationStore {
  verifications: Verification[];
  isRecording: boolean;
  addVerification: (v: Verification) => void;
  setRecording: (r: boolean) => void;
}

export const useVerificationStore = create<VerificationStore>((set) => ({
  verifications: [],
  isRecording: true,
  addVerification: (v) =>
    set((state) => ({
      verifications: [v, ...state.verifications],
    })),
  setRecording: (isRecording) => set({ isRecording }),
}));
```

---

### 14. `apps/trustahuman-ext/entrypoints/linkedin.content/ToggleButton.tsx`

Same pattern as xbooster ToggleButton. Uses `@sassy/ui/button` and lucide-react chevrons.

```typescript
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@sassy/ui/button";

interface ToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ToggleButton({ isOpen, onToggle }: ToggleButtonProps) {
  return (
    <Button
      onClick={onToggle}
      variant="primary"
      size="icon"
      className="z-10"
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      title={isOpen ? "Close Trust a Human" : "Open Trust a Human"}
    >
      {isOpen ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  );
}
```

---

### 15. `apps/trustahuman-ext/entrypoints/linkedin.content/VerificationSidebar.tsx`

The sidebar content. Shows header with recording indicator, and a scrollable list of verification cards.

```typescript
import { ShieldCheck } from "lucide-react";
import { SheetContent, SheetHeader, SheetTitle } from "@sassy/ui/sheet";

import { ToggleButton } from "./ToggleButton";
import { useShadowRootStore } from "./stores/shadow-root-store";
import { useVerificationStore } from "./stores/verification-store";

interface VerificationSidebarProps {
  onClose: () => void;
}

export function VerificationSidebar({ onClose }: VerificationSidebarProps) {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const { verifications, isRecording } = useVerificationStore();

  return (
    <SheetContent
      side="right"
      className="z-[9999] w-[340px] min-w-[340px] gap-0"
      portalContainer={shadowRoot}
    >
      {/* Close button */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>

      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Trust a Human
        </SheetTitle>
        {/* Recording indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isRecording ? "bg-green-500 animate-pulse" : "bg-gray-300"
            }`}
          />
          {isRecording ? "Monitoring LinkedIn" : "Paused"}
        </div>
      </SheetHeader>

      {/* Verification list */}
      <div className="flex-1 overflow-y-auto p-4">
        {verifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            No verifications yet. Post a comment on LinkedIn to trigger a check.
          </p>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => (
              <div
                key={v.id}
                className={`rounded-lg border p-3 ${
                  v.verified
                    ? "border-green-200 bg-green-50"
                    : "border-yellow-200 bg-yellow-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {v.action}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {v.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      v.verified ? "text-green-700" : "text-yellow-700"
                    }`}
                  >
                    {v.verified ? "Verified" : "Not verified"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(v.confidence)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SheetContent>
  );
}
```

---

### 16. `apps/trustahuman-ext/entrypoints/linkedin.content/App.tsx`

Same pattern as xbooster App.tsx. Toggle button on right edge, Sheet for sidebar.

```typescript
import { useEffect, useState } from "react";
import { Sheet } from "@sassy/ui/sheet";

import { ToggleButton } from "./ToggleButton";
import { VerificationSidebar } from "./VerificationSidebar";
import { useShadowRootStore } from "./stores/shadow-root-store";
import { useSidebarStore } from "./stores/sidebar-store";

interface AppProps {
  shadowRoot: HTMLElement;
}

export default function App({ shadowRoot }: AppProps) {
  const { isOpen, setIsOpen } = useSidebarStore();
  const setShadowRoot = useShadowRootStore((s) => s.setShadowRoot);
  const [showOpenButton, setShowOpenButton] = useState(true);

  useEffect(() => {
    setShadowRoot(shadowRoot);
  }, [shadowRoot, setShadowRoot]);

  useEffect(() => {
    if (isOpen) {
      setShowOpenButton(false);
    } else {
      const timer = setTimeout(() => setShowOpenButton(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      {showOpenButton && (
        <div className="fixed top-1/2 right-0 z-[9999] -translate-y-1/2">
          <ToggleButton isOpen={false} onToggle={() => setIsOpen(true)} />
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <VerificationSidebar onClose={() => setIsOpen(false)} />
      </Sheet>
    </>
  );
}
```

---

### 17. `apps/trustahuman-ext/entrypoints/linkedin.content/index.tsx`

Content script entry point. Creates Shadow DOM UI (same as xbooster) AND runs verification detection logic (MutationObserver + click listeners).

```typescript
import ReactDOM from "react-dom/client";
import { trpc } from "@/lib/trpc-client";
import { useVerificationStore } from "./stores/verification-store";
import App from "./App";
import "../../assets/globals.css";

export default defineContentScript({
  matches: ["https://*.linkedin.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // === SHADOW ROOT UI ===
    const ui = await createShadowRootUi(ctx, {
      name: "trustahuman-sidebar",
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        const appEl = document.createElement("div");
        appEl.id = "trustahuman-root";
        container.append(appEl);

        const root = ReactDOM.createRoot(appEl);
        root.render(<App shadowRoot={container} />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();

    // === VERIFICATION DETECTION LOGIC ===
    const instrumented = new WeakSet<HTMLElement>();

    const selectors = [
      'button[data-view-name="comment-post"]',
      'form.comments-comment-box__form button[type="submit"]',
    ];

    function instrumentButton(btn: HTMLElement) {
      if (instrumented.has(btn)) return;
      instrumented.add(btn);

      btn.addEventListener(
        "click",
        () => {
          handleVerification().catch(console.error);
        },
        { capture: true },
      );
    }

    async function handleVerification() {
      // 1. Capture photo via background
      const response = await chrome.runtime.sendMessage({
        action: "capturePhoto",
      });
      if (!response?.base64) return; // camera denied or failed

      // 2. Call tRPC (async, don't block comment)
      try {
        const result = await trpc.verification.analyzePhoto.mutate({
          photoBase64: response.base64,
        });

        // 3. Add to verification store -> sidebar auto-updates
        useVerificationStore.getState().addVerification({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          action: "comment",
          platform: "linkedin",
          verified: result.verified,
          confidence: result.confidence,
          faceCount: result.faceCount,
        });
      } catch (err) {
        console.error("TrustAHuman: verification failed", err);
      }
    }

    function scanForButtons(root: Element | Document = document) {
      for (const sel of selectors) {
        root.querySelectorAll<HTMLElement>(sel).forEach(instrumentButton);
      }
    }

    scanForButtons();

    const observer = new MutationObserver(() => scanForButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("TrustAHuman: Content script loaded");
  },
});
```

---

### 18. `packages/db/prisma/models/tools/verification.prisma`

Same as previous plan. `userId` optional.

```prisma
model HumanVerification {
  id          String   @id @default(uuid())
  userId      String?
  verified    Boolean
  confidence  Float
  faceCount   Int
  rawResponse Json
  actionType  String   @default("linkedin_comment")
  actionUrl   String?
  createdAt   DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}
```

---

### 19. `packages/api/src/router/tools/verification.ts`

Same as previous plan. Uses `publicProcedure`.

```typescript
import { RekognitionClient, DetectFacesCommand } from "@aws-sdk/client-rekognition";
import { z } from "zod";
import { db } from "@sassy/db";
import { createTRPCRouter, publicProcedure } from "../../trpc";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const verificationRouter = () =>
  createTRPCRouter({
    analyzePhoto: publicProcedure
      .input(z.object({
        photoBase64: z.string(),
        userId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.photoBase64, "base64");

        const response = await rekognition.send(
          new DetectFacesCommand({
            Image: { Bytes: buffer },
            Attributes: ["DEFAULT"],
          })
        );

        const faces = response.FaceDetails ?? [];
        const faceCount = faces.length;
        const confidence = faces[0]?.Confidence ?? 0;
        const verified = faceCount === 1 && confidence >= 90;

        await db.humanVerification.create({
          data: {
            userId: input.userId ?? null,
            verified,
            confidence,
            faceCount,
            rawResponse: response as any,
            actionType: "linkedin_comment",
          },
        });

        return { verified, confidence, faceCount };
      }),
  });
```

---

### 20. `packages/db/prisma/models/user.prisma` (MODIFY)

Add after the `commentAnalyses CommentAnalysis[]` line:

```prisma
humanVerifications HumanVerification[]
```

---

### 21. `packages/api/src/router/root.ts` (MODIFY)

Add import:
```typescript
import { verificationRouter } from "./tools/verification";
```

Add to `createTRPCRouter({...})`:
```typescript
verification: verificationRouter(),
```

---

### 22. `packages/api/package.json` (MODIFY)

Add to `dependencies`:
```json
"@aws-sdk/client-rekognition": "^3.700.0"
```

---

## Implementation Steps

### Phase 1: Database + API

1. Create `packages/db/prisma/models/tools/verification.prisma` with HumanVerification model
2. Add `humanVerifications HumanVerification[]` to User model in `packages/db/prisma/models/user.prisma`
3. Run `pnpm db:generate` then `pnpm db:push`
4. Add `@aws-sdk/client-rekognition` to `packages/api/package.json` and run `pnpm install`
5. Create `packages/api/src/router/tools/verification.ts` with `analyzePhoto` publicProcedure
6. Register `verificationRouter` in `packages/api/src/router/root.ts`

### Phase 2: Extension Scaffold

7. Create `apps/trustahuman-ext/package.json` (React, Radix via @sassy/ui, Tailwind, Zustand, lucide-react, tRPC)
8. Create `apps/trustahuman-ext/tsconfig.json`
9. Create `apps/trustahuman-ext/wxt.config.ts` (React module, Tailwind/PostCSS in Vite, port +4)
10. Create `apps/trustahuman-ext/tailwind.config.ts`
11. Create `apps/trustahuman-ext/postcss.config.mjs`
12. Create `apps/trustahuman-ext/assets/globals.css` (shadow DOM `:host` CSS vars, green theme)
13. Create `apps/trustahuman-ext/lib/trpc-client.ts` (vanilla, no auth)

### Phase 3: Background + Offscreen

14. Create `apps/trustahuman-ext/entrypoints/background/index.ts` (capturePhoto message handler)
15. Create `apps/trustahuman-ext/entrypoints/offscreen.html`
16. Create `apps/trustahuman-ext/entrypoints/offscreen.ts` (getUserMedia capture)

### Phase 4: Sidebar UI

17. Create `apps/trustahuman-ext/entrypoints/linkedin.content/stores/sidebar-store.ts`
18. Create `apps/trustahuman-ext/entrypoints/linkedin.content/stores/shadow-root-store.ts`
19. Create `apps/trustahuman-ext/entrypoints/linkedin.content/stores/verification-store.ts`
20. Create `apps/trustahuman-ext/entrypoints/linkedin.content/ToggleButton.tsx`
21. Create `apps/trustahuman-ext/entrypoints/linkedin.content/VerificationSidebar.tsx`
22. Create `apps/trustahuman-ext/entrypoints/linkedin.content/App.tsx`
23. Create `apps/trustahuman-ext/entrypoints/linkedin.content/index.tsx` (content script entry + verification detection)

### Phase 5: Build + Test

24. Run `pnpm install` from monorepo root
25. Run `pnpm --filter @sassy/trustahuman-ext dev` to verify WXT builds
26. Load extension in Chrome, navigate to LinkedIn, test sidebar opens/closes and comment verification works

---

## Acceptance Criteria

- [ ] `apps/trustahuman-ext/` builds with zero Clerk/auth dependencies
- [ ] Extension loads in Chrome without errors
- [ ] Toggle button visible on right edge of LinkedIn
- [ ] Clicking toggle opens sidebar with "Trust a Human" header
- [ ] Sidebar shows recording indicator (green pulsing dot)
- [ ] Sidebar shows "No verifications yet" when empty
- [ ] Clicking LinkedIn comment submit triggers webcam capture (async, never blocks)
- [ ] After verification completes, new card appears in sidebar with timestamp, action, verified/not, confidence %
- [ ] Server calls Rekognition DetectFaces and stores result with `userId: null`
- [ ] Camera denial does not break comment flow or sidebar
- [ ] Both extensions (EngageKit + TrustAHuman) coexist without port conflict (wxt-ext:+2, xbooster:+3, trustahuman:+4)

---

## Dependencies

- `@aws-sdk/client-rekognition` (new, server-side only)
- `@sassy/ui` (existing, provides Sheet, Button, SheetContent, SheetHeader, SheetTitle)
- Existing AWS credentials (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- Existing tRPC server at `VITE_APP_URL/api/trpc`
- Same `.env` file (loaded via `dotenv-cli`)

## Risks

1. **Camera permission**: Browser prompts once for the extension origin. If denied, silently skip.
2. **Offscreen document lifecycle**: Only one per extension. Handle create/destroy properly.
3. **Base64 size**: 640x480 JPEG at 0.8 quality is ~30-50KB. Fine for tRPC.
4. **No auth means no user tracking**: Results stored with `userId: null`. Acceptable for MVP testing.
5. **Public endpoint**: `analyzePhoto` is unauthenticated. Acceptable for MVP. Lock down before production.
