# WXT Extension POC - LinkedIn Sidebar

## Plan Metadata
- **Feature:** WXT Extension POC with LinkedIn Sidebar
- **Complexity:** SIMPLE (one-session)
- **Created:** 06-12-25
- **Status:** 🚧 In Progress

## What's Functional Now
- Nothing yet (new project)

## Goals

1. Create new `wxt-extension` app in turborepo
2. Configure WXT with React, TypeScript, Tailwind v4
3. Implement content script that injects toggleable sidebar on LinkedIn
4. Use Shadow DOM for complete style isolation
5. Leverage existing `@sassy/ui` sidebar component
6. Validate the approach works before full migration

## Non-Goals (Future Work)

- Clerk authentication integration
- tRPC client setup
- trpc-browser for background/content communication
- Full feature parity with existing chrome-extension

---

## Technical Specifications

### Directory Structure

```
apps/wxt-extension/
├── package.json
├── wxt.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── assets/
│   ├── globals.css          # Tailwind + theme variables
│   └── icon.png
├── public/
│   └── (static assets)
├── components/
│   └── ui/
│       └── (local shadcn components if needed)
├── utils/
│   └── cn.ts                 # Tailwind merge utility
└── entrypoints/
    ├── background.ts
    ├── popup/
    │   ├── index.html
    │   ├── main.tsx
    │   └── App.tsx
    └── linkedin.content/
        ├── index.tsx         # Content script entry
        ├── App.tsx           # Main React component
        ├── ToggleButton.tsx  # Half-pill toggle
        ├── LinkedInSidebar.tsx
        └── style.css         # Content script styles
```

### Key Configuration Files

**wxt.config.ts:**
- `extensionApi: "chrome"`
- `modules: ["@wxt-dev/module-react"]`
- Vite config for workspace package resolution
- PostCSS plugin for Tailwind v4 layer stripping (if needed)

**package.json dependencies:**
- `wxt: ^0.19.x`
- `@wxt-dev/module-react`
- `react`, `react-dom` (catalog:react19)
- `@sassy/ui: workspace:*`
- `tailwindcss: catalog:` (v4)
- `@tailwindcss/postcss: catalog:`

### Content Script Specifications

- **Target:** `https://*.linkedin.com/*`
- **Shadow DOM name:** `engagekit-sidebar`
- **Position:** `overlay` (fixed positioning)
- **CSS Injection:** `cssInjectionMode: 'ui'`

### Toggle Button Specs

- Position: Fixed, right edge, vertically centered
- Style: Half-pill (rounded on left, flat on right edge)
- Size: ~40px height, ~20px visible width
- Icon: Chevron left (◀) when closed, chevron right (▶) when open
- Z-index: 9999

### Sidebar Specs

- Width: `25vw` (1/4 screen)
- Position: Right side, full height
- Animation: Slide in/out (`collapsible="offcanvas"`)
- Components: SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter
- Z-index: 9998 (below toggle)

---

## Implementation Checklist

### Phase 1: Project Setup (Steps 1-4)

- [ ] **1. Create wxt-extension directory structure**
  - Create `apps/wxt-extension/` directory
  - Create subdirectories: `entrypoints/`, `assets/`, `components/`, `utils/`, `public/`

- [ ] **2. Create package.json**
  - Name: `@sassy/wxt-extension`
  - Add dependencies: wxt, @wxt-dev/module-react, react, react-dom
  - Add devDependencies: tailwindcss, @tailwindcss/postcss, typescript, @types/react
  - Add workspace dependencies: `@sassy/ui: workspace:*`
  - Add scripts: dev, build, zip, postinstall

- [ ] **3. Create wxt.config.ts**
  - Configure extensionApi: "chrome"
  - Add @wxt-dev/module-react module
  - Configure Vite for workspace package resolution
  - Add manifest settings (name, description, permissions)

- [ ] **4. Create TypeScript and Tailwind configs**
  - tsconfig.json extending `.wxt/tsconfig.json`
  - tailwind.config.ts with content paths and @sassy/tailwind-config preset
  - postcss.config.mjs with @tailwindcss/postcss

### Phase 2: Base Extension Setup (Steps 5-6)

- [ ] **5. Create globals.css with theme**
  - Import Tailwind directives
  - Copy theme variables from `@sassy/ui/styles/theme.css`
  - Add sidebar-specific CSS variables

- [ ] **6. Create basic entrypoints**
  - `entrypoints/background.ts` - minimal background script
  - `entrypoints/popup/` - basic popup with React (index.html, main.tsx, App.tsx)
  - Verify extension loads in Chrome

### Phase 3: Content Script Implementation (Steps 7-10)

- [ ] **7. Create content script entry point**
  - File: `entrypoints/linkedin.content/index.tsx`
  - Import style.css
  - Configure defineContentScript with matches, cssInjectionMode
  - Use createShadowRootUi to mount React app
  - Handle mount/unmount lifecycle

- [ ] **8. Create App.tsx with state management**
  - File: `entrypoints/linkedin.content/App.tsx`
  - useState for sidebar open/close
  - Render ToggleButton and LinkedInSidebar
  - Pass state and handlers as props

- [ ] **9. Create ToggleButton component**
  - File: `entrypoints/linkedin.content/ToggleButton.tsx`
  - Fixed position on right edge
  - Half-pill design with border-radius
  - Chevron icon that flips based on state
  - onClick handler to toggle sidebar

- [ ] **10. Create LinkedInSidebar component**
  - File: `entrypoints/linkedin.content/LinkedInSidebar.tsx`
  - Import from @sassy/ui/sidebar
  - Configure: side="right", collapsible="offcanvas"
  - Width: 25vw
  - Basic content: header, placeholder content, footer

### Phase 4: Testing & Validation (Steps 11-12)

- [ ] **11. Create content script styles**
  - File: `entrypoints/linkedin.content/style.css`
  - Import globals.css
  - Add z-index overrides for LinkedIn compatibility
  - Test layer stripping if needed for Tailwind v4

- [ ] **12. Test extension on LinkedIn**
  - Run `pnpm dev` in wxt-extension
  - Load unpacked extension in Chrome
  - Navigate to LinkedIn
  - Verify: toggle button visible, sidebar opens/closes, styles isolated
  - Document any issues

---

## Acceptance Criteria

1. ✅ Extension builds successfully with `pnpm build`
2. ✅ Extension loads in Chrome without errors
3. ✅ Toggle button appears on LinkedIn pages (right edge, half-pill)
4. ✅ Clicking toggle opens/closes sidebar with slide animation
5. ✅ Sidebar uses shadcn components from @sassy/ui
6. ✅ Styles are isolated (no leakage to/from LinkedIn)
7. ✅ Sidebar width is ~25vw
8. ✅ Z-index layering correct (toggle > sidebar > LinkedIn content)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Tailwind v4 @layer conflicts | PostCSS plugin to strip layers |
| @sassy/ui imports fail in WXT | Configure Vite resolve.alias in wxt.config.ts |
| Radix portals render outside Shadow DOM | Use PortalTargetContext pattern |
| CSS variables not available | Inline theme CSS in globals.css |

---

## Future Integration Notes (Not in POC)

- **Clerk Auth:** Will need background script with Clerk client, message passing to content script
- **tRPC:** Use trpc-browser or custom message relay through background
- **Full Migration:** Once POC validated, migrate remaining features from chrome-extension

---

## Deviations & Lessons Learned

(To be filled during/after implementation)


