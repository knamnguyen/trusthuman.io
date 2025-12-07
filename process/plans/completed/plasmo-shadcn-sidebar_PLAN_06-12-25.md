# Plasmo shadcn Sidebar - Implementation Plan

**Date:** 06-12-25
**Complexity:** SIMPLE
**Status:** PLANNED

## Overview

Implement a toggleable shadcn sidebar for LinkedIn pages using Plasmo framework's built-in Shadow DOM and CSUI (Content Script UI) features. This approach leverages Plasmo's automatic Shadow DOM mounting and CSS injection capabilities, eliminating the need for manual Vite IIFE builds used in the previous chrome-extension app.

**Key Advantage over Previous Approach:**
- **Previous (chrome-extension)**: Manual Vite IIFE build + manual Shadow DOM setup + manual CSS injection + complex layer stripping
- **Current (ek-chrome-ext)**: Plasmo CSUI handles everything automatically - Shadow DOM, CSS injection, React mounting, and HMR support

## Goals and Success Metrics

**Goals:**
- Add toggleable shadcn sidebar to LinkedIn pages using Plasmo CSUI
- Leverage Plasmo's automatic Shadow DOM for style isolation
- Use `@sassy/ui/sidebar` component with minimal setup
- Enable keyboard shortcut toggle (Cmd/Ctrl + B)
- Provide right-side positioning with offcanvas collapsible behavior

**Success Metrics:**
- Sidebar renders correctly on LinkedIn pages without style conflicts
- Toggle functionality works via trigger and keyboard shortcut
- Shadow DOM prevents LinkedIn CSS interference
- No console errors or React warnings
- Radix UI portals work correctly within Plasmo's Shadow DOM
- Hot module reload works during development

## Scope

**In-Scope:**
- Plasmo content script with CSUI configuration
- Automatic Shadow DOM mounting via `getStyle()` export
- CSS injection using `data-text:` imports
- React rendering with SidebarProvider and Sidebar components
- Right-side positioning with offcanvas collapsible behavior
- Keyboard shortcut toggle (Cmd/Ctrl + B)
- Tailwind CSS setup for Plasmo
- Adding `@sassy/ui` workspace dependency
- Basic sidebar content structure

**Out-of-Scope:**
- Backend integration or data fetching
- Complex sidebar content (can be added later)
- State persistence across page reloads
- Multiple sidebar instances
- Custom animations beyond defaults

## Assumptions and Constraints

**Assumptions:**
- Plasmo 0.90.5 handles Shadow DOM and CSS injection automatically
- `@sassy/ui/sidebar` component is compatible with React 18.2.0
- Tailwind CSS can be configured for Plasmo's build system
- Radix UI portals can be configured for Shadow DOM
- `:root` to `:host(plasmo-csui)` replacement works for CSS variables

**Constraints:**
- Must use Plasmo CSUI pattern (not manual Shadow DOM)
- Must work with React 18.2.0 (not React 19 like main project)
- Must inject on LinkedIn pages only
- Must not interfere with LinkedIn functionality
- Single-session implementation (focused feature)
- CSS variables must be scoped to `:host(plasmo-csui)` not `:root`

## Functional Requirements

1. **Plasmo Content Script (CSUI)**
   - Export `PlasmoCSConfig` with LinkedIn URL matches
   - Export `getStyle()` for automatic CSS injection
   - Export `getOverlayAnchor()` for positioning
   - Default export React component with sidebar

2. **CSS Injection**
   - Import theme.css using `data-text:` syntax
   - Import Tailwind styles using `data-text:` syntax
   - Replace `:root` with `:host(plasmo-csui)` for CSS variables
   - Inject combined styles into Shadow DOM

3. **Sidebar Component**
   - Use `@sassy/ui/sidebar` with SidebarProvider
   - Right-side positioning (`side="right"`)
   - Offcanvas collapsible behavior (`collapsible="offcanvas"`)
   - Basic content structure (header, content, footer)
   - Toggle trigger button
   - Keyboard shortcut support (built into SidebarProvider)

4. **Tailwind CSS Setup**
   - Configure Tailwind for Plasmo
   - Create base styles file
   - Import Tailwind directives
   - Configure shared Tailwind config

5. **Workspace Dependencies**
   - Add `@sassy/ui` workspace dependency
   - Access sidebar components and theme CSS
   - Handle React version compatibility (18.2.0 vs 19)

## Non-Functional Requirements

- **Performance:** Automatic lazy loading via Plasmo, minimal bundle overhead
- **Maintainability:** Simple CSUI pattern, reusable components
- **Compatibility:** Works in Chrome, LinkedIn page updates
- **Accessibility:** Keyboard navigation, ARIA attributes, focus management
- **Type Safety:** Full TypeScript coverage with Plasmo types
- **Developer Experience:** Hot module reload during development

## Acceptance Criteria

1. Tailwind CSS configured and working in Plasmo
2. `@sassy/ui` workspace dependency added and accessible
3. Content script CSUI file created at `contents/linkedin-sidebar.tsx`
4. Sidebar renders on LinkedIn pages via Plasmo CSUI
5. Shadow DOM isolation works (no style conflicts)
6. Theme CSS variables properly scoped to `:host(plasmo-csui)`
7. Sidebar toggle trigger works correctly
8. Keyboard shortcut (Cmd/Ctrl + B) toggles sidebar
9. Right-side positioning and offcanvas behavior work
10. Radix UI Sheet (mobile) renders correctly
11. No console errors or React warnings
12. TypeScript compiles without errors
13. Hot module reload works during development

## Implementation Checklist

### Phase 1: Environment Setup (Steps 1-3)

**1. Install Tailwind CSS Dependencies**
- File: `apps/ek-chrome-ext/package.json`
- Run: `pnpm add -D tailwindcss postcss autoprefixer`
- Verify installation in `package.json` devDependencies

**2. Add Workspace Dependency for UI Components**
- File: `apps/ek-chrome-ext/package.json`
- Add to dependencies: `"@sassy/ui": "workspace:*"`
- Run: `pnpm install` to link workspace package
- Verify `@sassy/ui` is accessible

**3. Create Tailwind Configuration**
- File: `apps/ek-chrome-ext/tailwind.config.js` (new file)
- Extend shared Tailwind config from `@sassy/tailwind-config`
- Configure content paths: `["./**/*.tsx", "./**/*.ts"]`
- Add Plasmo-specific configurations if needed
- Enable JIT mode for development

### Phase 2: Styling Setup (Steps 4-5)

**4. Create Base Styles File**
- File: `apps/ek-chrome-ext/style.css` (new file)
- Add Tailwind directives:
  ```css
  @import "tailwindcss";
  ```
- Add any Plasmo-specific base styles
- This will be imported via `data-text:` in content script

**5. Create PostCSS Configuration**
- File: `apps/ek-chrome-ext/postcss.config.js` (new file)
- Configure plugins: `tailwindcss`, `autoprefixer`
- Ensure compatibility with Plasmo's build system

### Phase 3: Content Script Implementation (Steps 6-8)

**6. Create LinkedIn Sidebar Content Script**
- File: `apps/ek-chrome-ext/contents/linkedin-sidebar.tsx` (new file)
- Export `config` with type `PlasmoCSConfig`:
  - Set `matches: ["https://*.linkedin.com/*"]`
  - Set `run_at: "document_idle"` (load after page ready)
- Import types: `PlasmoCSConfig`, `PlasmoGetStyle` from `"plasmo"`
- Create directory structure: `contents/` at root level

**7. Implement CSS Injection Function**
- File: `apps/ek-chrome-ext/contents/linkedin-sidebar.tsx`
- Import theme CSS: `import themeCss from "data-text:@sassy/ui/styles/theme.css"`
- Import base styles: `import cssText from "data-text:../style.css"`
- Export `getStyle()` function with type `PlasmoGetStyle`:
  - Create style element: `document.createElement("style")`
  - Combine CSS: `${themeCss}\n${cssText}`
  - Replace `:root` with `:host(plasmo-csui)` using `replaceAll()`
  - Set `style.textContent` to modified CSS
  - Return style element
- This enables automatic Shadow DOM CSS injection

**8. Implement Overlay Anchor (Optional)**
- File: `apps/ek-chrome-ext/contents/linkedin-sidebar.tsx`
- Export `getOverlayAnchor()` function (optional):
  - Return `document.body` for body-level positioning
  - Or return specific element if needed
- Plasmo will position CSUI relative to anchor
- Can be omitted to use default positioning

### Phase 4: Sidebar Component (Steps 9-11)

**9. Create Sidebar Wrapper Component**
- File: `apps/ek-chrome-ext/components/LinkedInSidebar.tsx` (new file)
- Import sidebar components from `@sassy/ui/sidebar`:
  - `Sidebar`, `SidebarProvider`, `SidebarContent`
  - `SidebarHeader`, `SidebarFooter`, `SidebarTrigger`
- Configure `Sidebar` props:
  - `side="right"` for right-side positioning
  - `collapsible="offcanvas"` for slide-in/out behavior
- Create basic structure:
  - `SidebarHeader` with title and trigger button
  - `SidebarContent` with placeholder content
  - `SidebarFooter` with branding

**10. Integrate Sidebar into Content Script**
- File: `apps/ek-chrome-ext/contents/linkedin-sidebar.tsx`
- Import `LinkedInSidebar` component
- Import `SidebarProvider` from `@sassy/ui/sidebar`
- Default export function component:
  ```tsx
  export default function LinkedInSidebarCSUI() {
    return (
      <SidebarProvider defaultOpen={false}>
        <LinkedInSidebar />
      </SidebarProvider>
    )
  }
  ```
- Set `defaultOpen={false}` to start collapsed
- Keyboard shortcut handled automatically by SidebarProvider

**11. Add Toggle Trigger to Sidebar**
- File: `apps/ek-chrome-ext/components/LinkedInSidebar.tsx`
- Import `SidebarTrigger` from `@sassy/ui/sidebar`
- Add `SidebarTrigger` button in `SidebarHeader`:
  - Use as icon button with toggle functionality
  - Built-in `toggleSidebar()` handler from `useSidebar()` hook
- Add accessible label: `<span className="sr-only">Toggle Sidebar</span>`

### Phase 5: Radix UI Portal Configuration (Steps 12-13)

**12. Configure Shadow DOM Context for Portals**
- File: `apps/ek-chrome-ext/components/LinkedInSidebar.tsx`
- Radix UI portals default to `document.body` (breaks in Shadow DOM)
- Create Shadow Root context provider if needed:
  - Use React context to pass shadow root reference
  - Or rely on Plasmo's automatic portal handling
- Test if Sheet component (mobile sidebar) works without changes
- If portals fail, manually configure portal containers

**13. Test and Fix Portal Issues**
- Test mobile sidebar (Sheet component from `@sassy/ui/sidebar`)
- Test tooltips if added (TooltipProvider is in SidebarProvider)
- Verify all Radix portals render inside shadow root
- Add explicit portal container props if needed:
  - Sheet: `container={shadowRoot}`
  - Tooltip: May need custom TooltipProvider
- Plasmo's CSUI should handle this automatically, but verify

### Phase 6: Testing and Polish (Steps 14-15)

**14. Test Core Functionality**
- Run Plasmo dev server: `pnpm dev`
- Load extension in Chrome (chrome://extensions/)
- Enable developer mode, click "Load unpacked"
- Select `apps/ek-chrome-ext/build/chrome-mv3-dev` directory
- Navigate to LinkedIn page (https://www.linkedin.com/feed/)
- Verify sidebar appears and is initially collapsed
- Click trigger button - sidebar should slide in from right
- Click again - sidebar should slide out
- Test keyboard shortcut (Cmd/Ctrl + B)
- Verify no style conflicts with LinkedIn
- Check console for errors

**15. Cross-Browser and Edge Case Testing**
- Test across different LinkedIn pages:
  - Feed: https://www.linkedin.com/feed/
  - Profile: https://www.linkedin.com/in/*
  - Messages: https://www.linkedin.com/messaging/
  - Job search: https://www.linkedin.com/jobs/
- Test mobile responsive behavior (resize browser)
- Test rapid toggle clicks (ensure stability)
- Verify sidebar state doesn't persist across reloads (expected)
- Check TypeScript compilation: `pnpm run build`
- Verify hot module reload during development
- Test Radix UI tooltips and Sheet component

## Dependencies

**Existing Dependencies (Already Installed):**
- plasmo: 0.90.5
- react: 18.2.0
- react-dom: 18.2.0
- typescript: 5.3.3

**To Install (Step 1):**
- tailwindcss: latest
- postcss: latest
- autoprefixer: latest

**To Add (Step 2):**
- @sassy/ui: workspace:* (provides sidebar component and theme CSS)

**Workspace Dependencies Accessed:**
- @sassy/ui/sidebar - Sidebar components
- @sassy/ui/styles/theme.css - Theme CSS variables
- @sassy/tailwind-config - Shared Tailwind configuration
- All Radix UI dependencies (inherited from @sassy/ui)

**Note on React Version:**
- ek-chrome-ext uses React 18.2.0
- Main project uses React 19
- @sassy/ui is compatible with both (peer dependency)
- No conflicts expected

## Risks and Mitigations

**Risk 1:** Radix UI portals break in Plasmo Shadow DOM
- **Mitigation:** Plasmo's CSUI handles portals automatically; test early and configure manually if needed

**Risk 2:** CSS variable scoping fails (`:root` vs `:host(plasmo-csui)`)
- **Mitigation:** Use `replaceAll()` in `getStyle()` to convert all `:root` to `:host(plasmo-csui)`

**Risk 3:** Tailwind CSS not working in Plasmo
- **Mitigation:** Follow Plasmo Tailwind documentation, use PostCSS configuration, test early

**Risk 4:** React version mismatch (18.2.0 vs 19)
- **Mitigation:** @sassy/ui has peer dependency on React, should work with both; test compatibility

**Risk 5:** LinkedIn page updates break sidebar injection
- **Mitigation:** Use broad URL matches, test across LinkedIn pages, add error handling

**Risk 6:** Keyboard shortcut conflicts with LinkedIn
- **Mitigation:** Cmd/Ctrl + B is sidebar standard; monitor for conflicts, make configurable if needed

## Integration Notes

- **Plasmo CSUI Pattern:** Use `contents/` directory for content scripts, export config and React component
- **Shadow DOM:** Automatic via Plasmo's CSUI, accessed through `getStyle()` export
- **CSS Injection:** Use `data-text:` imports to load CSS as strings, inject via `getStyle()`
- **CSS Variable Scoping:** Replace `:root` with `:host(plasmo-csui)` to scope variables to shadow root
- **Radix Portals:** Plasmo handles automatically, but test Sheet and Tooltip components
- **Keyboard Shortcut:** Built into `SidebarProvider`, no additional setup needed
- **State Management:** React state within sidebar, no external state needed initially
- **Hot Reload:** Plasmo provides automatic HMR during development
- **Build Output:** Plasmo builds to `build/chrome-mv3-dev` (dev) or `build/chrome-mv3-prod` (prod)

## File Structure After Implementation

```
apps/ek-chrome-ext/
├── contents/
│   └── linkedin-sidebar.tsx       # Plasmo CSUI content script
├── components/
│   └── LinkedInSidebar.tsx        # Sidebar wrapper component
├── style.css                      # Base Tailwind styles
├── tailwind.config.js             # Tailwind configuration
├── postcss.config.js              # PostCSS configuration
├── package.json                   # Updated with dependencies
├── popup.tsx                      # Existing popup (unchanged)
├── tsconfig.json                  # Existing config (unchanged)
└── build/
    └── chrome-mv3-dev/            # Plasmo build output
        └── (generated files)
```

## Post-Implementation Verification

After completing all steps, verify:

1. Run `pnpm dev` - Plasmo dev server starts
2. Load extension in Chrome (chrome://extensions/, Load unpacked)
3. Navigate to LinkedIn feed (https://www.linkedin.com/feed/)
4. Sidebar is initially collapsed (not visible)
5. No console errors on page load
6. Inspect element shows `plasmo-csui` shadow root with sidebar
7. Click trigger button (if visible) - sidebar slides in from right
8. Press Cmd/Ctrl + B - sidebar toggles
9. Sidebar shows EngageKit branding without style conflicts
10. LinkedIn styles don't leak into sidebar
11. Sidebar styles don't leak to LinkedIn
12. TypeScript compiles: `pnpm run build`
13. Hot module reload works (edit component, see changes)
14. Mobile responsive (resize browser, Sheet component works)

## Known Limitations

- Sidebar state doesn't persist across page reloads (expected for CSUI)
- Initial render may have slight delay due to content script injection
- Keyboard shortcut hardcoded to Cmd/Ctrl + B (configurable later)
- Single sidebar instance only (multiple sidebars not supported)
- Requires active LinkedIn page (doesn't work on other sites)

## Future Enhancements (Out of Scope)

- Add rich sidebar content (activity feed, notifications, settings)
- Persist sidebar state across sessions using chrome.storage
- Add resize handle for adjustable width
- Add multiple sidebar positions (left, top, bottom)
- Make keyboard shortcut configurable
- Add sidebar templates for different contexts
- Improve accessibility (ARIA labels, screen reader support)
- Add analytics for sidebar usage
- Support multiple sidebar instances

## Comparison: Plasmo CSUI vs Previous Vite IIFE Approach

| Aspect | Previous (chrome-extension) | Current (ek-chrome-ext) |
|--------|----------------------------|-------------------------|
| **Shadow DOM** | Manual `attachShadow()` | Automatic via Plasmo CSUI |
| **CSS Injection** | Manual style element creation | `getStyle()` export |
| **React Mounting** | Manual `createRoot()` + render | Default export component |
| **Bundle Format** | Vite IIFE build | Plasmo automatic bundling |
| **Layer Stripping** | Custom PostCSS plugin | Not needed |
| **Build Config** | Separate `vite.config.sidebar.ts` | Plasmo handles it |
| **Hot Reload** | Complex setup | Built-in HMR |
| **Type Safety** | Manual types | Plasmo types included |
| **Developer Experience** | Complex, manual setup | Simple, declarative |

**Why Plasmo CSUI is Better:**
1. **Less code:** ~50% reduction in boilerplate
2. **Automatic Shadow DOM:** No manual setup
3. **Built-in HMR:** Instant feedback during development
4. **Type safety:** Plasmo provides TypeScript types
5. **Simpler CSS:** No layer stripping needed
6. **Maintainability:** Declarative pattern, easier to understand

## References

- **Plasmo CSUI Documentation:** https://docs.plasmo.com/framework/content-scripts-ui
- **Plasmo CSS Documentation:** https://docs.plasmo.com/framework/content-scripts-ui/styling
- **Plasmo TypeScript Types:** https://docs.plasmo.com/framework/typescript
- **Sidebar Component:** `packages/ui/src/ui/sidebar.tsx`
- **Theme CSS:** `packages/ui/src/styles/theme.css`
- **Reference Implementation:** `apps/chrome-extension/src/pages/content/sidebar-bundle/LinkedInSidebar.tsx` (old approach)

---

## PLAN MODE COMPLETION

Plan complete. Review carefully.

**Say 'ENTER EXECUTE MODE' when ready to implement.**

Note: This is a critical safety checkpoint. EXECUTE mode will follow this plan with 100% fidelity.
