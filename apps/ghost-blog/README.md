# Next.js Ghost Blog

Next.js App Router application for building and previewing embeddable components and tools.

## Overview

This app provides:

- **Components**: Embeddable React components (nav, footer, etc.) built as standalone bundles
- **Tools**: Standalone tools (LinkedIn preview, etc.) built as separate bundles
- **Preview Pages**: Next.js pages for locally previewing components/tools before deployment

## Architecture

**Hybrid Build System**:

- **Next.js**: Handles the main app (pages, routing, SSR)
- **Vite**: Builds standalone component/tool bundles for embedding via script tags

## Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start Next.js dev server
pnpm dev

# Build Next.js app
pnpm build:nextjs

# Build components bundle
pnpm build:components

# Build tools bundle
pnpm build:tools

# Build everything
pnpm build
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx           # Home page
│   └── preview/
│       ├── components/       # Component preview pages
│       └── tools/         # Tool preview pages
├── components/               # Component mount functions
│   ├── nav-component.tsx
│   ├── footer-component.tsx
│   ├── mount-nav.tsx      # Navigation mount function
│   ├── mount-footer.tsx   # Footer mount function
│   └── index.ts           # Component orchestrator
├── tools/                 # Tool components
│   └── linkedinpreview/
└── lib/                  # Shared utilities
    └── utils.ts          # cn() helper
```

## Building Standalone Bundles

### Components

Components are built into a single bundle:

- **Output**: `public/components.js` and `public/components.css`
- **Entry**: `src/components/index.ts`
- **Format**: IIFE (Immediately Invoked Function Expression)

### Tools

Each tool is built separately:

- **Output**: `public/tools/{tool-name}.js` and `public/tools/{tool-name}.css`
- **Entry**: `src/tools/{tool-name}/index.tsx`
- **Format**: IIFE

## Embedding Components/Tools

After building, the bundles can be embedded on any website:

```html
<!-- Components -->
<link rel="stylesheet" href="https://your-domain.com/components.css" />
<script src="https://your-domain.com/components.js"></script>

<!-- Tools -->
<link
  rel="stylesheet"
  href="https://your-domain.com/tools/linkedinpreview.css"
/>
<script src="https://your-domain.com/tools/linkedinpreview.js"></script>
```

## Adding New Components

1. Create component in `packages/ui/src/components/`
2. Create mount function in `src/components/mount-{name}.tsx`:

   ```typescript
   import React from "react";
   import ReactDOM from "react-dom/client";

   import { YourComponent } from "@sassy/ui/components/your-component";

   import "~/app/globals.css";

   export function mountYourComponent(rootSelector = "#your-component-root") {
     let mountPoint = document.querySelector(rootSelector);
     if (!mountPoint) {
       mountPoint = document.createElement("div");
       mountPoint.id = "your-component-root";
       document.body.appendChild(mountPoint);
     }
     mountPoint.classList.add("ek-component-container");
     ReactDOM.createRoot(mountPoint).render(React.createElement(YourComponent));
   }
   ```

3. Add to `src/components/index.ts`:
   ```typescript
   import { mountYourComponent } from "./mount-your-component";
   export function initComponents() {
     mountYourComponent();
     // ... other components
   }
   window.Components = { mountYourComponent, ... };
   ```

## Adding New Tools

1. Create tool directory: `src/tools/{tool-name}/`
2. Create `index.tsx` with mount function and component export
3. Tool will be auto-discovered by `vite.config.tools.js`

## Preview Pages

- `/` - Preview all components on the home page
- `/preview/tools` - Preview all tools

Components/tools can be imported directly in Next.js pages for local preview.
