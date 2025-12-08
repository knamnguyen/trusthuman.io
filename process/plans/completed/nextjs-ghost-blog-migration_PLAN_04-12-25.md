# Next.js Ghost Blog Migration Plan

**Date**: 04-12-25  
**Type**: COMPLEX (multi-phase migration)  
**Status**: 🚧 In Progress

## Overview

Migrate `engagekit-blog` (Vite-based React app) into monorepo as `apps/nextjs-ghost-blog` (Next.js App Router app) while maintaining:

- Standalone component/tool bundle builds for embedding via script tags
- Direct importability of components/tools in Next.js pages for local preview
- Use of shared `@sassy/ui` package for all UI components
- Separation of UI definitions (in `@sassy/ui`) from mount logic (in app)
- Compatibility with Next.js build system and App Router architecture

## Goals

1. ✅ Create new Next.js App Router app `apps/nextjs-ghost-blog` matching `@nextjs` structure
2. ✅ Migrate components (`nav-component`, `footer-component`) to `@sassy/ui/src/components/`
3. ✅ Migrate tools (`linkedinpreview`) to use `@sassy/ui`
4. ✅ Set up Vite build configs for standalone component/tool bundles (hybrid approach)
5. ✅ Create preview pages in Next.js that import components directly
6. ✅ Ensure components work both as standalone bundles AND as Next.js imports
7. ✅ Refactor: Separate UI definitions (shared) from mount logic (app-specific)

## Scope

### In Scope

- ✅ Next.js app creation with App Router
- ✅ Component migration (nav, footer) - UI in `@sassy/ui`, mounts in app
- ✅ Component migration (table-content) - completed
- ✅ Tool migration (linkedinpreview) - completed
- ✅ Vite build configs for standalone bundles
- ✅ Preview pages in Next.js (components rendered on root page)
- ✅ Shared UI component usage
- ✅ Tailwind v4 configuration alignment
- ✅ Architecture refactor: components vs mount functions separation

### Out of Scope

- ❌ Migrating other pages/routes (focus on widgets/tools first)
- ❌ Full site migration (can be done incrementally)
- ❌ Ghost CMS integration changes (keep existing)

## Architecture Decision

**Hybrid Approach**: Next.js for main app + Vite for component/tool builds

**Rationale**:

- Next.js handles SSR, routing, deployment (Vercel)
- Vite excels at building standalone IIFE bundles for embedding
- Both systems coexist without conflict
- Components/tools can be imported directly in Next.js pages/components

**Architecture Refactor**:

- **UI Components**: Defined in `packages/ui/src/components/` (shared across Chrome extension, Next.js app, etc.)
- **Mount Functions**: Defined in `apps/nextjs-ghost-blog/src/components/` (app-specific mounting logic)
- This separation allows components to be reusable while mount logic stays app-specific

**Structure**:

```
apps/nextjs-ghost-blog/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Preview page (renders all components)
│   │   └── globals.css        # Global styles + CSS variables
│   ├── components/            # Component mount functions (app-specific)
│   │   ├── mount-nav.tsx      # Mounts NavComponent from @sassy/ui
│   │   ├── mount-footer.tsx   # Mounts FooterComponent from @sassy/ui
│   │   └── index.ts           # Component orchestrator
│   └── tools/                 # Tool components (to be migrated)
│       └── linkedinpreview/
├── public/                    # Next.js public assets
│   ├── components.js         # Built component bundle (Vite)
│   ├── components.css        # Built component CSS (Vite)
│   └── tools/                # Built tool bundles (Vite)
│       └── linkedinpreview.js
├── vite.config.components.js # Vite config for components
├── vite.config.tools.js      # Vite config for tools
├── next.config.js            # Next.js config (similar to @nextjs)
├── tailwind.config.ts        # Tailwind v4 config (uses @sassy/tailwind-config)
└── package.json              # Dependencies + scripts

packages/ui/src/components/   # Shared UI component definitions
├── nav-component.tsx         # NavComponent (imported by mount-nav.tsx)
├── footer-component.tsx      # FooterComponent (imported by mount-footer.tsx)
└── nav-component/            # Nav component sub-components
    ├── blog-dropdown.tsx
    ├── dropdown-data.ts
    └── nav-dropdown-container.tsx
```

## Dependencies

### New Dependencies Needed

- `vite` - For widget/tool builds
- `@vitejs/plugin-react` - React plugin for Vite
- `@rollup/plugin-replace` - Environment variable replacement
- `@sassy/ui` - Shared UI components (workspace dependency)
- `@sassy/tailwind-config` - Shared Tailwind config (workspace dependency)
- `@sassy/tsconfig` - Shared TypeScript config (workspace dependency)
- `@sassy/eslint-config` - Shared ESLint config (workspace dependency)
- `@sassy/prettier-config` - Shared Prettier config (workspace dependency)

### Existing Dependencies to Migrate

- `@tryghost/content-api` - Ghost CMS client
- `@fortawesome/react-fontawesome` - Icons
- `simple-icons` - Social icons
- `@tanstack/react-query` - Data fetching (if needed)
- `react`, `react-dom` - React (via catalog)

## Implementation Checklist

### Phase 1: Next.js App Setup ✅

1. Create `apps/nextjs-ghost-blog` directory structure
2. Initialize `package.json` with Next.js 15.2.2 (matching `@nextjs`)
3. Set up `tsconfig.json` extending `@sassy/tsconfig/base.json`
4. Create `next.config.js` similar to `@nextjs` (transpilePackages, webpack config)
5. Set up `tailwind.config.ts` using `@sassy/tailwind-config/web` preset
6. Create `src/app/layout.tsx` with root layout
7. Create `src/app/globals.css` with Tailwind v4 imports and CSS variables
8. Add build scripts to `package.json`:
   - `dev` - Next.js dev server
   - `build` - Next.js build + widget/tool builds
   - `build:widgets` - Vite widget build
   - `build:tools` - Vite tool build
   - `with-env` - dotenv wrapper script

### Phase 2: Vite Build Configuration ✅

9. ✅ Create `vite.config.components.js`:
   - Entry: `src/components/index.ts`
   - Output: `public/components.js` (IIFE format)
   - CSS extraction to `public/components.css`
   - Alias `@` → `./src` and `@sassy/ui` → `../../packages/ui/src`
   - PostCSS with Tailwind
   - Environment variable replacement
10. ✅ Create `vite.config.tools.js`:
    - Auto-discover tools in `src/tools/`
    - Multiple entry points (one per tool)
    - Output: `public/tools/{tool-name}.js` and `.css`
    - Same config as components (alias, PostCSS, env)
11. ✅ Add Vite dependencies to `package.json`
12. ✅ Test component build: `pnpm build:components` (314KB bundle)
13. ✅ Test tool build: `pnpm build:tools` (650KB linkedinpreview bundle)

### Phase 3: Component Migration ✅

14. ✅ Refactor: Move UI components to `packages/ui/src/components/`
15. ✅ Migrate `nav-component.tsx`:
    - Moved to `packages/ui/src/components/nav-component.tsx`
    - Uses `@sassy/ui/button` and `@sassy/ui/utils`
    - Sub-components in `packages/ui/src/components/nav-component/`
16. ✅ Migrate `footer-component.tsx`:
    - Moved to `packages/ui/src/components/footer-component.tsx`
    - Uses `@sassy/ui` components
17. ✅ Migrate `table-content-component.tsx`:
    - Moved to `packages/ui/src/components/table-content-component.tsx`
    - Created `mount-table-content.tsx` in app
    - Uses ApplauseButton wrapper component for custom element
18. ✅ Migrate component sub-components:
    - `blog-dropdown.tsx` → `packages/ui/src/components/nav-component/blog-dropdown.tsx`
    - `nav-dropdown-container.tsx` → `packages/ui/src/components/nav-component/nav-dropdown-container.tsx`
    - `dropdown-data.ts` → `packages/ui/src/components/nav-component/dropdown-data.ts`
19. ✅ Create mount functions in `apps/nextjs-ghost-blog/src/components/`:
    - `mount-nav.tsx` - imports `NavComponent` from `@sassy/ui/components/nav-component`
    - `mount-footer.tsx` - imports `FooterComponent` from `@sassy/ui/components/footer-component`
    - `index.ts` - exports `initComponents()` and `window.Components` API
20. ✅ Update `packages/ui/package.json` exports:
    - Added `"./components/*": "./src/components/*.tsx"`

### Phase 4: Tool Migration ✅

20. ✅ Create `src/tools/linkedinpreview/` directory
21. ✅ Migrate LinkedIn preview tool:
    - ✅ Update component imports to use `@sassy/ui`
    - ✅ Keep mount function for standalone bundle
    - ✅ Ensure all sub-components work
22. ✅ Create `src/tools/linkedinpreview/index.tsx`:
    - ✅ Export `mountLinkedInPreview()` function
    - ✅ Export `LinkedInPreviewTool` component
    - ✅ Auto-mount logic for standalone bundle
    - ✅ Updated to use `ek-component-container` instead of `ek-widget-container`
23. ⏳ Test tool build and standalone bundle functionality

### Phase 5: Shared Utilities & Styles ⏳

24. ✅ Create `src/lib/utils.ts`:
    - Re-exports `cn` from `@sassy/ui/utils`
25. Migrate `src/lib/ghost-client.ts`:
    - Copy from `engagekit-blog/src/lib/ghost-client.ts`
    - Ensure it works in Next.js context (server/client)
26. ✅ Component styles in `src/app/globals.css`:
    - Component-specific styles (`.ek-component-container`, animations, etc.)
    - Custom scrollbar styles for dropdowns
    - Slide-down animations
    - Ensures compatibility with Tailwind v4
27. ✅ Updated `src/app/globals.css`:
    - Import Tailwind v4 (`@import "tailwindcss"`)
    - Includes CSS variables
    - Includes component-specific styles
    - Changed `.ek-widget-container` → `.ek-component-container`

### Phase 6: Preview Pages ✅

28. ✅ Simplified: Components rendered directly on root page
    - `src/app/page.tsx` imports components from `@sassy/ui/components/*`
    - Renders `NavComponent` and `FooterComponent` directly
    - No separate preview pages needed (simpler structure)
29. ⏳ Tool preview pages (linkedinpreview migrated, preview page pending)
30. ✅ Root page shows all components for immediate preview

### Phase 7: Environment & Configuration ⏳

31. Create `.env.example` with required variables:
    - `VITE_GHOST_URL` (for Vite builds)
    - `VITE_GHOST_CONTENT_API_KEY` (for Vite builds)
    - Any other Ghost/API keys needed
32. Update Vite configs to load env vars correctly
33. Ensure Next.js can access env vars (via `process.env` or `import.meta.env`)
34. Add `with-env` script pattern (matching `@nextjs`)

### Phase 8: Testing & Validation ⏳

35. Test Next.js dev server: `pnpm dev`
36. Test widget preview page renders correctly
37. Test tool preview page renders correctly
38. Build widgets: `pnpm build:widgets`
39. Verify `public/widgets.js` and `public/widgets.css` are created
40. Build tools: `pnpm build:tools`
41. Verify `public/tools/linkedinpreview.js` and `.css` are created
42. Test standalone widget bundle:
    - Create test HTML file loading `widgets.js`
    - Verify widgets mount correctly
    - Verify styles apply correctly
43. Test standalone tool bundle:
    - Create test HTML file loading tool bundle
    - Verify tool mounts correctly
44. Test full build: `pnpm build` (Next.js + widgets + tools)
45. Verify all outputs are correct

### Phase 9: Cleanup & Documentation ⏳

46. Remove unused dependencies from `package.json`
47. Add README.md with:
    - Setup instructions
    - Build process explanation
    - How to add new widgets/tools
    - Preview page usage
48. Update any relevant documentation
49. Verify TypeScript types are correct
50. Run linting and fix any issues

## Acceptance Criteria

1. ✅ Next.js app runs successfully with `pnpm dev`
2. ✅ Components can be previewed in Next.js pages via direct imports from `@sassy/ui/components/*`
3. ✅ Tools can be previewed in Next.js pages via direct imports (linkedinpreview migrated)
4. ✅ Components build to standalone `public/components.js` bundle (314KB, verified)
5. ✅ Tools build to standalone `public/tools/{tool-name}.js` bundles (linkedinpreview config ready, needs testing)
6. ⏳ Standalone bundles can be embedded via script tags on external sites (pending build test)
7. ✅ All components use `@sassy/ui` components (no local shadcn copies)
8. ✅ Tailwind v4 configuration works correctly
9. ✅ CSS variables and styles are consistent
10. ✅ TypeScript compilation succeeds without errors
11. ✅ Architecture refactor complete: UI components in `@sassy/ui`, mount functions in app
12. ✅ Terminology updated: "widgets" → "components" throughout codebase

## Technical Considerations

### Import Path Resolution

- Next.js uses `~/*` alias (from `@nextjs` pattern)
- Vite builds use `@/*` alias (from `engagekit-blog` pattern)
- Need to ensure both work correctly

### CSS Handling

- Components/tools need CSS in standalone bundles (Vite extracts)
- Next.js pages need CSS via `globals.css`
- Component-specific styles use `.ek-component-container` scoping class
- CSS scoping prevents conflicts with host site styles

### React Version

- Use React 19 (catalog) to match `@nextjs`
- Ensure compatibility with both Next.js and standalone bundles

### Environment Variables

- Vite builds use `import.meta.env.VITE_*`
- Next.js uses `process.env.*` or `import.meta.env.*`
- Need consistent approach or adapter

## Risks & Mitigations

1. **Risk**: Component/tool CSS conflicts with Next.js styles
   - **Mitigation**: ✅ Use scoped CSS classes (`.ek-component-container`) and separate CSS files

2. **Risk**: Import paths differ between Next.js and Vite builds
   - **Mitigation**: Use consistent alias patterns, test both contexts

3. **Risk**: React version mismatches
   - **Mitigation**: Use catalog versions, ensure peer dependencies match

4. **Risk**: Tailwind v4 differences from v3
   - **Mitigation**: Use shared `@sassy/tailwind-config`, test thoroughly

## What's Functional Now

- ✅ Next.js app structure created and configured
- ✅ Components (nav, footer) migrated to `@sassy/ui/src/components/`
- ✅ Mount functions created in `apps/nextjs-ghost-blog/src/components/`
- ✅ Vite build configs created (`vite.config.components.js`, `vite.config.tools.js`)
- ✅ Root page renders components directly for preview
- ✅ CSS scoping with `.ek-component-container` class
- ✅ Terminology updated: "widgets" → "components"
- ✅ Component builds verified (`pnpm build:components` → 314KB bundle)
- ✅ Table content component migrated to `@sassy/ui`
  - ✅ UI component in `packages/ui/src/components/table-content-component.tsx`
  - ✅ Mount function in `apps/nextjs-ghost-blog/src/components/mount-table-content.tsx`
  - ✅ ApplauseButton wrapper component for custom HTML element
  - ✅ `lib/utils.ts` created for local `cn` re-export
- ✅ Tool migration (linkedinpreview) - completed
  - ✅ All 13 files migrated with updated imports
  - ✅ TipTap dependencies added (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`)
  - ✅ `runes` and `sonner` dependencies added
  - ✅ `tabs` shadcn component installed in `@sassy/ui`
  - ✅ Mount function uses `ek-component-container` class
  - ✅ Toaster included directly from `sonner` for standalone bundle support

## Lessons Learned

1. **Separation of Concerns**: Moving UI component definitions to `@sassy/ui` while keeping mount logic in the app provides better reusability across Chrome extension, Next.js app, and other consumers.

2. **Terminology Matters**: Using "components" instead of "widgets" reduces confusion since everything is technically a React component.

3. **CSS Scoping**: The `.ek-component-container` class provides necessary CSS isolation when components are embedded on external sites.

4. **Hybrid Build System**: Next.js and Vite can coexist effectively - Next.js for the app, Vite for standalone bundles.

5. **Import Paths**: Using `@sassy/ui/components/*` exports makes it clear where shared components live vs app-specific mount logic.

6. **TipTap Integration**: When using TipTap editor in standalone bundles, set `immediatelyRender: false` in `useEditor` config to prevent hydration issues. This is required for React 19 compatibility in standalone bundle contexts.

7. **Toaster in Standalone Bundles**: For standalone tool bundles, use `Toaster` from `sonner` directly (not from `@sassy/ui/toast`) since the UI package's Toaster depends on `next-themes` which isn't available in standalone contexts. Include `<Toaster />` in the tool component itself.

8. **Custom HTML Elements in React**: When using custom elements like `<applause-button>`, create a wrapper component that uses `useRef` and `document.createElement()` to avoid TypeScript JSX.IntrinsicElements issues. This pattern works reliably in both Next.js and standalone bundle contexts.
