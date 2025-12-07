# Content Script shadcn Sidebar - Implementation Plan

**Date:** 05-12-25
**Complexity:** SIMPLE
**Status:** PLANNED

## Overview

Implement a toggleable shadcn sidebar for LinkedIn pages that is injected from the Chrome extension content script. The sidebar uses a hybrid architecture with Shadow DOM for style isolation and a separate Vite build entry that produces an IIFE bundle for lazy loading.

## Goals and Success Metrics

**Goals:**

- Add toggleable shadcn sidebar to LinkedIn pages from content script
- Achieve complete style isolation using Shadow DOM
- Enable lazy loading via separate IIFE bundle
- Provide right-side positioning with offcanvas collapsible behavior

**Success Metrics:**

- Sidebar renders correctly on LinkedIn pages without style conflicts
- Toggle functionality works via button click and keyboard shortcut
- Shadow DOM prevents LinkedIn CSS from affecting sidebar
- Bundle size is reasonable (target: under 200KB minified)
- No console errors or React warnings
- Radix UI portals work correctly within Shadow DOM

## Scope

**In-Scope:**

- Separate Vite build entry for sidebar bundle (IIFE format)
- Shadow DOM mounting with CSS injection
- React rendering with SidebarProvider and Sidebar components
- Right-side positioning with offcanvas collapsible behavior
- Toggle button and keyboard shortcut
- CSS layer-stripping for Tailwind v4 compatibility
- Basic sidebar content structure (extensible later)
- Integration with existing content script

**Out-of-Scope:**

- Backend integration or data fetching
- Complex sidebar content (can be added later)
- State persistence across page reloads
- Multiple sidebar instances
- Animation customization beyond defaults

## Assumptions and Constraints

**Assumptions:**

- Existing `@sassy/ui/sidebar` component works correctly
- Tailwind CSS v4 theme.css contains all necessary CSS variables
- React 19 and all Radix UI dependencies are already installed
- Content script has permission to inject scripts and create DOM elements
- Chrome extension manifest allows inline styles and scripts

**Constraints:**

- Must use Shadow DOM for style isolation
- Bundle must be IIFE format for direct script tag injection
- Must strip @layer wrappers from Tailwind CSS for compatibility
- Must configure Radix UI portals to work within Shadow DOM
- Must not interfere with LinkedIn page functionality
- Single-session implementation (focused feature)

## Functional Requirements

1. **Sidebar Bundle Build**
   - Separate Vite entry point for sidebar
   - IIFE output format with named export
   - CSS extraction and inlining
   - Layer-stripping for Tailwind v4
   - Minification enabled

2. **Shadow DOM Setup**
   - Create Shadow DOM container on LinkedIn page
   - Inject theme CSS and sidebar CSS into Shadow DOM
   - Mount React root inside Shadow DOM
   - Configure portals for Radix UI components

3. **Sidebar Component**
   - Use `@sassy/ui/sidebar` with SidebarProvider
   - Right-side positioning (`side="right"`)
   - Offcanvas collapsible behavior (`collapsible="offcanvas"`)
   - Basic content structure (header, content, footer)
   - Toggle trigger button

4. **Content Script Integration**
   - Dynamic loading of sidebar bundle
   - Toggle state management
   - Keyboard shortcut handler (Cmd/Ctrl + B)
   - Mount/unmount lifecycle
   - Error handling and cleanup

5. **Style Isolation**
   - Complete CSS isolation via Shadow DOM
   - No style leakage from LinkedIn
   - No style leakage to LinkedIn
   - Proper z-index coordination

## Non-Functional Requirements

- **Performance:** Lazy loading, minimal bundle size, smooth animations
- **Maintainability:** Clean separation of concerns, reusable patterns
- **Compatibility:** Works across Chrome/Firefox, LinkedIn page updates
- **Accessibility:** Keyboard navigation, ARIA attributes, focus management
- **Type Safety:** Full TypeScript coverage

## Acceptance Criteria

1. Sidebar bundle builds successfully with Vite
2. Bundle is IIFE format and under 200KB minified
3. Shadow DOM mounts correctly on LinkedIn pages
4. Sidebar renders without style conflicts
5. Toggle button works correctly
6. Keyboard shortcut (Cmd/Ctrl + B) toggles sidebar
7. Right-side positioning and offcanvas behavior work
8. Radix UI portals render correctly
9. No console errors or React warnings
10. Sidebar can be mounted and unmounted cleanly
11. No interference with LinkedIn page functionality
12. TypeScript compiles without errors

## Implementation Checklist

### Phase 1: Build Configuration (Steps 1-3)

**1. Create Sidebar Entry Point**

- File: `apps/chrome-extension/src/pages/content/sidebar-bundle/index.tsx`
- Create directory structure: `src/pages/content/sidebar-bundle/`
- Define `mountSidebar(container: HTMLElement)` function
- Define `unmountSidebar()` function
- Export both functions on window object for IIFE access
- Add proper TypeScript types

**2. Create Sidebar Wrapper Component**

- File: `apps/chrome-extension/src/pages/content/sidebar-bundle/LinkedInSidebar.tsx`
- Import `Sidebar`, `SidebarProvider`, `SidebarTrigger`, etc. from `@sassy/ui/sidebar`
- Configure `side="right"` and `collapsible="offcanvas"`
- Create basic structure: SidebarHeader, SidebarContent, SidebarFooter
- Add placeholder content (can be extended later)
- Add SidebarTrigger button in header
- Handle shadow DOM portal configuration

**3. Configure Vite Build for Sidebar Bundle**

- File: `apps/chrome-extension/vite.config.sidebar.ts` (new file)
- Import base config from `vite.config.base.ts`
- Add sidebar entry point: `sidebar: './src/pages/content/sidebar-bundle/index.tsx'`
- Configure output format: IIFE with global name `EngageKitSidebar`
- Set output directory: `dist_chrome/sidebar/` (separate from main build)
- Configure CSS extraction: `cssCodeSplit: false` (single CSS file)
- Add layer-stripping PostCSS plugin (copy from ghost-blog pattern)
- Enable minification
- Add to package.json scripts: `"build:sidebar": "vite build --config vite.config.sidebar.ts"`

### Phase 2: Sidebar Component Implementation (Steps 4-6)

**4. Implement Sidebar Mount Function**

- File: `apps/chrome-extension/src/pages/content/sidebar-bundle/index.tsx`
- Import React, ReactDOM, and LinkedInSidebar component
- Create `mountSidebar(container: HTMLElement)` function:
  - Check if already mounted (prevent duplicates)
  - Create React root with `createRoot(container)`
  - Wrap LinkedInSidebar with SidebarProvider
  - Handle initial open state (defaultOpen: false)
  - Store root reference for unmounting
  - Return cleanup function
- Create `unmountSidebar()` function:
  - Unmount React root if exists
  - Clean up event listeners
  - Remove Shadow DOM container

**5. Implement Shadow DOM CSS Injection**

- File: `apps/chrome-extension/src/pages/content/sidebar-bundle/index.tsx`
- Add helper function `injectStyles(shadowRoot: ShadowRoot)`:
  - Fetch theme.css from `@sassy/ui/styles/theme.css`
  - Fetch sidebar.css from build output
  - Create style elements
  - Inject into shadow root head
  - Add z-index overrides for LinkedIn compatibility
- Call during mount process before React rendering

**6. Configure Radix UI Portals for Shadow DOM**

- File: `apps/chrome-extension/src/pages/content/sidebar-bundle/LinkedInSidebar.tsx`
- Add TooltipProvider with portal container set to shadow root
- Configure Sheet component portal target
- Add context for shadow root reference
- Ensure all Radix portals render inside shadow root

### Phase 3: Content Script Integration (Steps 7-9)

**7. Create Sidebar Manager Module**

- File: `apps/chrome-extension/src/pages/content/sidebar-manager.ts`
- Define `SidebarManager` class with methods:
  - `loadSidebar()`: Dynamically load sidebar bundle script
  - `createShadowContainer()`: Create Shadow DOM container
  - `mountSidebar()`: Call bundle's mount function
  - `unmountSidebar()`: Call bundle's unmount function
  - `toggleSidebar()`: Toggle visibility
  - `isLoaded()`: Check if sidebar is loaded
  - `isMounted()`: Check if sidebar is mounted
- Handle script loading with Promise
- Store references to Shadow DOM container and mount state
- Add error handling for failed loads

**8. Add Sidebar Toggle Button to LinkedIn Page**

- File: `apps/chrome-extension/src/pages/content/sidebar-manager.ts`
- Create toggle button element with EngageKit branding
- Position: Fixed, top-right of page (outside sidebar)
- Style: Rounded button with icon (Cmd+B hint)
- Inject after page load
- Add click handler to toggle sidebar
- Style with inline CSS (no external dependencies)

**9. Integrate Sidebar Manager with Content Script**

- File: `apps/chrome-extension/src/pages/content/index.tsx`
- Import SidebarManager
- Initialize SidebarManager on page load
- Add keyboard shortcut listener (Cmd/Ctrl + B)
- Load and mount sidebar on first toggle
- Handle cleanup on extension unload
- Add error handling and logging

### Phase 4: CSS and Styling (Steps 10-11)

**10. Set Up Theme CSS for Shadow DOM**

- File: `packages/ui/src/styles/theme.css` (already exists, verify completeness)
- Verify all sidebar CSS variables are present:
  - `--sidebar`, `--sidebar-foreground`
  - `--sidebar-primary`, `--sidebar-primary-foreground`
  - `--sidebar-accent`, `--sidebar-accent-foreground`
  - `--sidebar-border`, `--sidebar-ring`
  - `--sidebar-width`, `--sidebar-width-icon`
- Verify base styles are included
- No changes needed if variables already exist

**11. Add Layer-Stripping PostCSS Plugin**

- File: `apps/chrome-extension/vite.config.sidebar.ts`
- Copy `stripCssLayers()` function from `apps/ghost-blog/vite.config.tools.js`:
  ```typescript
  function stripCssLayers() {
    return {
      postcssPlugin: "strip-css-layers",
      Once(root) {
        root.walkAtRules("layer", (atRule) => {
          atRule.replaceWith(atRule.nodes);
        });
      },
    };
  }
  stripCssLayers.postcss = true;
  ```
- Add to PostCSS plugins array: `[tailwindcss(), stripCssLayers()]`
- This ensures Tailwind CSS classes work correctly in Shadow DOM

### Phase 5: Manifest and Build Updates (Steps 12-13)

**12. Update Chrome Extension Manifest**

- File: `apps/chrome-extension/manifest.json`
- Add sidebar bundle to `web_accessible_resources`:
  ```json
  {
    "resources": ["sidebar/sidebar.js", "sidebar/sidebar.css"],
    "matches": ["https://*.linkedin.com/*"]
  }
  ```
- Verify content script permissions are sufficient
- No additional permissions needed (already has activeTab, storage)

**13. Update Build Scripts**

- File: `apps/chrome-extension/package.json`
- Add sidebar build script: `"build:sidebar": "vite build --config vite.config.sidebar.ts"`
- Update main build script to include sidebar: `"build:chrome": "pnpm build:sidebar && vite build --config vite.config.chrome.ts"`
- Ensure dev script includes sidebar watch: `"dev:chrome": "concurrently \"vite build --watch --config vite.config.sidebar.ts\" \"vite build --watch --config vite.config.chrome.ts\""`
- Add to root package.json if needed

### Phase 6: Testing and Polish (Steps 14-15)

**14. Test Core Functionality**

- Build sidebar bundle: `pnpm build:sidebar`
- Verify output in `dist_chrome/sidebar/`: `sidebar.js` and `sidebar.css`
- Check bundle size (should be under 200KB minified)
- Load extension in Chrome
- Navigate to LinkedIn page
- Click toggle button - verify sidebar appears
- Test keyboard shortcut (Cmd/Ctrl + B)
- Test right-side positioning
- Test offcanvas collapse behavior
- Verify no style conflicts with LinkedIn
- Check console for errors

**15. Polish and Edge Cases**

- Handle rapid toggle clicks (debounce if needed)
- Ensure sidebar state persists during navigation (if desired)
- Add loading indicator during bundle load
- Handle failed bundle loads gracefully
- Test across different LinkedIn pages (feed, profile, messages)
- Verify Radix UI tooltips and portals work
- Test keyboard navigation within sidebar
- Add comments and documentation to code
- Run TypeScript type check: `pnpm typecheck`
- Run linter: `pnpm lint`

## Dependencies

**Existing Dependencies (No Installation Needed):**

- React 19.0.0
- ReactDOM 19.0.0
- @sassy/ui (sidebar component)
- Radix UI components (all installed)
- Tailwind CSS v4
- Vite 6.3.5
- TypeScript 5.7.3

**Build Tools:**

- @vitejs/plugin-react (already installed)
- @tailwindcss/postcss (already installed)
- postcss (already installed)

**No new dependencies required.**

## Risks and Mitigations

**Risk 1:** Shadow DOM breaks Radix UI portals

- **Mitigation:** Configure portal containers to shadow root, test early

**Risk 2:** CSS layer-stripping breaks Tailwind styles

- **Mitigation:** Use proven pattern from ghost-blog, verify output CSS

**Risk 3:** Bundle size too large (over 200KB)

- **Mitigation:** Use code splitting, lazy load heavy components, verify bundle analysis

**Risk 4:** LinkedIn page updates break sidebar injection

- **Mitigation:** Use robust selectors, test across LinkedIn pages, add error handling

**Risk 5:** Multiple sidebar instances on SPA navigation

- **Mitigation:** Check for existing sidebar before mounting, clean up on unmount

**Risk 6:** Z-index conflicts with LinkedIn modals

- **Mitigation:** Use very high z-index (2147483647), test with LinkedIn overlays

## Integration Notes

- **Shadow DOM:** Use `attachShadow({ mode: 'open' })` for debugging access
- **IIFE Bundle:** Global name `EngageKitSidebar` exposes `mount` and `unmount` functions
- **CSS Loading:** Inject theme.css and sidebar.css as style elements in shadow root
- **Radix Portals:** All portals must target shadow root container, not document.body
- **Content Script:** Load sidebar lazily on first toggle to minimize initial impact
- **Keyboard Shortcut:** Use standard Cmd/Ctrl + B (matches VS Code sidebar toggle)
- **State Management:** Use React state within sidebar, no external state needed initially
- **Error Handling:** Log errors to console, show user-friendly messages on failures

## File Structure After Implementation

```
apps/chrome-extension/
├── src/
│   └── pages/
│       └── content/
│           ├── sidebar-bundle/
│           │   ├── index.tsx           # Mount/unmount functions (IIFE entry)
│           │   └── LinkedInSidebar.tsx  # Sidebar wrapper component
│           ├── sidebar-manager.ts       # Sidebar lifecycle manager
│           └── index.tsx                # Main content script (updated)
├── vite.config.sidebar.ts               # Sidebar build config
├── dist_chrome/
│   └── sidebar/
│       ├── sidebar.js                   # IIFE bundle
│       └── sidebar.css                  # Extracted styles
└── manifest.json                        # Updated with web_accessible_resources
```

## Post-Implementation Verification

After completing all steps, verify:

1. Run `pnpm build:sidebar` - builds successfully
2. Check `dist_chrome/sidebar/sidebar.js` - exists and under 200KB
3. Check `dist_chrome/sidebar/sidebar.css` - exists and contains sidebar styles
4. Load extension in Chrome (chrome://extensions/)
5. Navigate to LinkedIn feed (https://www.linkedin.com/feed/)
6. Toggle button appears in top-right
7. Click toggle - sidebar slides in from right
8. Sidebar shows content without style conflicts
9. Click toggle again - sidebar slides out
10. Press Cmd/Ctrl + B - sidebar toggles
11. No console errors
12. TypeScript compiles without errors
13. Sidebar persists across LinkedIn SPA navigation (if implemented)

## Known Limitations

- Initial toggle has slight delay due to lazy loading (expected)
- Sidebar content is basic placeholder (can be extended)
- No state persistence across page reloads (can be added with chrome.storage)
- No animation customization beyond defaults (can be added later)
- Single sidebar instance only (multiple sidebars not supported)

## Future Enhancements (Out of Scope)

- Add rich sidebar content (activity feed, notifications, settings)
- Persist sidebar state across sessions
- Add resize handle for adjustable width
- Add multiple sidebar positions (left, right, top, bottom)
- Add sidebar templates for different contexts
- Add keyboard shortcuts for sidebar actions
- Add accessibility improvements (ARIA labels, screen reader support)
- Add analytics for sidebar usage

## References

- **Reference Pattern:** `apps/ghost-blog/vite.config.tools.js` (IIFE build, layer-stripping)
- **Sidebar Component:** `packages/ui/src/ui/sidebar.tsx`
- **Theme CSS:** `packages/ui/src/styles/theme.css`
- **Existing Injection Pattern:** `apps/chrome-extension/src/pages/content/approve-flow/inject-sidebar.ts`

---

## PLAN MODE COMPLETION

Plan complete. Review carefully.

**Say 'ENTER EXECUTE MODE' when ready to implement.**

Note: This is a critical safety checkpoint. EXECUTE mode will follow this plan with 100% fidelity.
