# Sidebar Hover-to-Open Enhancement

| Field | Value |
|-------|-------|
| **Date** | 08-01-26 |
| **Complexity** | Simple |
| **Status** | ⏳ PLANNED |

## Overview

Enhance the existing shadcn sidebar component with hover-to-open functionality, a user-configurable settings toggle, and an always-visible manual toggle button. This follows patterns from the [salimi-my/shadcn-ui-sidebar](https://github.com/salimi-my/shadcn-ui-sidebar) reference implementation while maintaining the existing React Context architecture.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Scope](#scope)
- [Functional Requirements](#functional-requirements)
- [Implementation Checklist](#implementation-checklist)
- [Cursor + RIPER-5 Guidance](#cursor--riper-5-guidance)

---

## Goals and Success Metrics

| Goal | Success Metric |
|------|----------------|
| Hover-to-open functionality | Sidebar expands when hovering over collapsed sidebar (when enabled) |
| User preference toggle | Switch in sidebar footer persists to cookie |
| Manual toggle button | Always-visible button on sidebar edge toggles expand/collapse |
| No regressions | Existing keyboard shortcut (Cmd/Ctrl+B) continues working |
| Mobile compatibility | Hover logic disabled on mobile devices |

---

## Scope

### In Scope
- Extend `SidebarContextProps` with hover state (`isHover`, `hoverOpen`)
- Add `onMouseEnter`/`onMouseLeave` handlers with 100ms debounce
- Create `HoverOpenToggle` component with Switch in sidebar footer
- Create `SidebarToggleButton` component (always visible on sidebar edge)
- Cookie persistence for `hoverOpen` setting
- SSR support via cookie reading in layout

### Out of Scope
- Zustand migration (using existing React Context)
- Mobile hover behavior (touch devices excluded)
- Resizable sidebar width
- New animation library dependencies

---

## Assumptions and Constraints

1. **Architecture**: Extend existing React Context pattern, no Zustand
2. **Persistence**: Use cookie (same pattern as existing `sidebar_state`)
3. **Styling**: Use existing Tailwind classes and shadcn patterns
4. **Components**: Switch component already available in `@sassy/ui/switch`

---

## Functional Requirements

### Context Extension
- [ ] Add `isHover: boolean` - current hover state
- [ ] Add `setIsHover: (hover: boolean) => void` - debounced setter
- [ ] Add `hoverOpen: boolean` - user preference for hover behavior
- [ ] Add `setHoverOpen: (enabled: boolean) => void` - preference setter with cookie persistence

### State Computation
- [ ] Compute effective state: `open || (hoverOpen && isHover && !isMobile)`
- [ ] Debounce `setIsHover(false)` by 100ms to prevent flickering

### UI Components
- [ ] `HoverOpenToggle`: Switch + Label in sidebar footer, hidden when collapsed
- [ ] `SidebarToggleButton`: Floating button on sidebar edge, shows `<` or `>` based on state

---

## Non-Functional Requirements

- **Performance**: Debounce hover events to prevent excessive re-renders
- **Accessibility**: Toggle button has proper `aria-label`
- **SSR**: Read cookie server-side to prevent hydration mismatch

---

## Acceptance Criteria

- [ ] When `hoverOpen` is ON and sidebar is collapsed, hovering expands it
- [ ] When `hoverOpen` is ON and mouse leaves, sidebar collapses after 100ms delay
- [ ] When `hoverOpen` is OFF, hovering has no effect
- [ ] Toggle button always visible on sidebar edge
- [ ] Toggle button shows `>` when collapsed, `<` when expanded
- [ ] Clicking toggle button expands/collapses sidebar
- [ ] Switch toggle visible in footer when sidebar is expanded
- [ ] Switch toggle hidden when sidebar is collapsed
- [ ] `hoverOpen` preference persists across page refreshes (cookie)
- [ ] Cmd/Ctrl+B keyboard shortcut still works
- [ ] Mobile devices do not trigger hover expansion

---

## Implementation Checklist

### Phase 1: Core Context Changes (`packages/ui/src/ui/sidebar.tsx`)

- [ ] 1. Add `SIDEBAR_HOVER_OPEN_COOKIE` constant after line 30
- [ ] 2. Extend `SidebarContextProps` interface with hover properties (lines 37-45)
- [ ] 3. Add `defaultHoverOpen` prop to `SidebarProvider` function signature
- [ ] 4. Add `isHover` state with `useState(false)`
- [ ] 5. Add `hoverOpen` state with controlled/uncontrolled pattern
- [ ] 6. Create debounced `setIsHover` callback with `useRef` timeout
- [ ] 7. Create `setHoverOpen` callback with cookie persistence
- [ ] 8. Update `state` computation: `open || (hoverOpen && isHover && !isMobile)`
- [ ] 9. Update `contextValue` to include new properties
- [ ] 10. Add cleanup effect for hover timeout ref

### Phase 2: Mouse Handlers (`packages/ui/src/ui/sidebar.tsx`)

- [ ] 11. Destructure `setIsHover` and `hoverOpen` in `Sidebar` component
- [ ] 12. Add `onMouseEnter={() => hoverOpen && setIsHover(true)}` to sidebar-container div
- [ ] 13. Add `onMouseLeave={() => setIsHover(false)}` to sidebar-container div

### Phase 3: Dashboard Components (`apps/nextjs/src/app/(dashboard)/_components/dashboard-sidebar.tsx`)

- [ ] 14. Add imports: `Switch`, `Label`, `useSidebar`, `ChevronLeftIcon`, `ChevronRightIcon`
- [ ] 15. Create `HoverOpenToggle` component before `DashboardSidebar`
- [ ] 16. Create `SidebarToggleButton` component before `DashboardSidebar`
- [ ] 17. Add `className="relative"` to `<Sidebar>` for absolute positioning
- [ ] 18. Add `<SidebarToggleButton />` inside Sidebar
- [ ] 19. Add `<HoverOpenToggle />` in SidebarFooter above user section

### Phase 4: SSR Support (`apps/nextjs/src/app/(dashboard)/layout.tsx`)

- [ ] 20. Import `cookies` from `next/headers`
- [ ] 21. Read `sidebar_hover_open` cookie
- [ ] 22. Pass `defaultHoverOpen` prop to `SidebarProvider`

### Phase 5: Verification

- [ ] 23. Test hover-to-open when enabled
- [ ] 24. Test hover has no effect when disabled
- [ ] 25. Test toggle button expands/collapses
- [ ] 26. Test preference persists on refresh
- [ ] 27. Test keyboard shortcut still works

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hover flickering | Medium | Low | 100ms debounce on mouse leave |
| SSR hydration mismatch | Low | Medium | Read cookie server-side, `isHover` defaults to `false` |
| Mobile false positives | Low | Low | `!isMobile` check in state computation |

---

## Integration Notes

### Dependencies
- `@sassy/ui/switch` - existing component
- `@sassy/ui/label` - existing component
- `next/headers` cookies - Next.js built-in

### Files Modified
1. `/packages/ui/src/ui/sidebar.tsx` - Core context and component
2. `/apps/nextjs/src/app/(dashboard)/_components/dashboard-sidebar.tsx` - UI integration
3. `/apps/nextjs/src/app/(dashboard)/layout.tsx` - SSR cookie reading

### Cookie Schema
```
sidebar_hover_open = "true" | "false"
max-age = 604800 (7 days)
path = /
```

---

## Cursor + RIPER-5 Guidance

### Cursor Plan Mode
1. Import this checklist directly into Cursor Plan mode
2. Execute steps 1-22 sequentially
3. Verify with steps 23-27

### RIPER-5 Mode
- **RESEARCH**: ✅ Complete - sidebar.tsx and dashboard-sidebar.tsx analyzed
- **INNOVATE**: ✅ Complete - React Context approach chosen over Zustand
- **PLAN**: ✅ Complete - this document
- **EXECUTE**: Request "ENTER EXECUTE MODE" to begin implementation
- **REVIEW**: After implementation, verify all acceptance criteria

### If Scope Expands
If additional features are requested mid-implementation (e.g., resizable sidebar, animation library):
1. STOP implementation
2. Convert to COMPLEX plan
3. Add new RFC sections
4. Get approval before continuing

---

## Code Snippets Reference

### Extended Context Interface
```typescript
interface SidebarContextProps {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  // New hover properties
  isHover: boolean;
  setIsHover: (hover: boolean) => void;
  hoverOpen: boolean;
  setHoverOpen: (hoverOpen: boolean) => void;
}
```

### Debounced Hover Setter
```typescript
const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
const setIsHover = React.useCallback((value: boolean) => {
  if (hoverTimeoutRef.current) {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
  }
  if (value) {
    setIsHoverState(true);
  } else {
    hoverTimeoutRef.current = setTimeout(() => setIsHoverState(false), 100);
  }
}, []);
```

### Effective State Computation
```typescript
const effectivelyOpen = open || (hoverOpen && isHover && !isMobile);
const state = effectivelyOpen ? "expanded" : "collapsed";
```

### HoverOpenToggle Component
```tsx
function HoverOpenToggle() {
  const { hoverOpen, setHoverOpen } = useSidebar();
  return (
    <div className="flex items-center justify-between px-2 py-1.5 group-data-[collapsible=icon]:hidden">
      <Label htmlFor="hover-open" className="text-xs text-muted-foreground">
        Hover to expand
      </Label>
      <Switch
        id="hover-open"
        checked={hoverOpen}
        onCheckedChange={setHoverOpen}
        className="scale-75"
      />
    </div>
  );
}
```

### SidebarToggleButton Component
```tsx
function SidebarToggleButton() {
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === "expanded";
  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "absolute -right-3 top-1/2 -translate-y-1/2 z-20",
        "flex h-6 w-6 items-center justify-center",
        "rounded-full border bg-background shadow-sm",
        "hover:bg-accent transition-colors"
      )}
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isExpanded ? (
        <ChevronLeftIcon className="h-4 w-4" />
      ) : (
        <ChevronRightIcon className="h-4 w-4" />
      )}
    </button>
  );
}
```

---

## Behavior Matrix

| State | hoverOpen | Hover | Result |
|-------|-----------|-------|--------|
| collapsed | OFF | - | Icons visible, toggle button (>) to expand |
| collapsed | ON | No | Icons visible, toggle button (>) |
| collapsed | ON | Yes | Temporarily expanded, toggle button (<) |
| expanded | - | - | Full sidebar, toggle button (<) to collapse |

---

**Next Step**: Say "ENTER EXECUTE MODE" to begin implementation following the checklist above.
