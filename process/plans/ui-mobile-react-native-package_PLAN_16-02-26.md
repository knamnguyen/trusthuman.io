# UI Mobile React Native Package - Plan

**Date:** 16-02-26
**Complexity:** Simple
**Status:** ⏳ PLANNED

## Overview

Create a shared `@sassy/ui-mobile-react-native` package (`packages/ui-mobile-react-native/`) that mirrors `@sassy/ui` for React Native. Built with react-native-reusables patterns (shadcn/ui equivalent for RN), NativeWind v4 + Tailwind v3, using the same HEX CSS variable theme as the web UI package and WXT extension. Enables component reuse across current and future mobile apps.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Assumptions and Constraints](#assumptions-and-constraints)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Risks and Mitigations](#risks-and-mitigations)
- [Integration Notes](#integration-notes)
- [Cursor + RIPER-5 Guidance](#cursor--riper-5-guidance)

## Goals and Success Metrics

**Goals:**
- Create a shared RN component package with react-native-reusables patterns (`@rn-primitives` + NativeWind + CVA)
- Share Neobrutalist theme using same HEX CSS variables as web UI package — no HSL conversion
- Export a Tailwind v3 preset so consuming apps get theme config in ~12 lines instead of 77
- Provide 11 core components: Text, Button, Card, Input, Label, Separator, Badge, Avatar, Switch, Progress, Skeleton
- Migrate `apps/expo/` screens to use package components

**Success Metrics:**
- Expo app renders correctly on iPhone with Neobrutalist theme colors from package
- Sign-in screen uses `Button` and `Text` from `@sassy/ui-mobile-react-native`
- Dashboard screen uses `Card`, `Button`, `Text` from package
- `apps/expo/tailwind.config.js` reduced from 77 lines to ~12 lines
- NativeWind classes from package components are not purged by Tailwind

---

## Execution Brief

**IMPORTANT:** This is a SIMPLE (one-session) plan — implement continuously without approval gates. The phases below are logical groupings for understanding flow, NOT stop points.

### Phase 1: Package Scaffolding
**What happens:** Create `packages/ui-mobile-react-native/` with `package.json` (exports mirroring `@sassy/ui`), `tsconfig.json` (extending `@sassy/tsconfig/internal-package.json`), and `src/lib/utils.ts` (`cn()` using clsx + tailwind-merge).
**Test:** Package directory exists with correct structure, TypeScript resolves imports.

### Phase 2: Theme and Tailwind Preset
**What happens:** Create `src/styles/global.css` with HEX Neobrutalist theme variables (same values as `packages/ui/src/styles/theme.css`, adapted for NativeWind `:root` / `.dark:root`). Create `tailwind-preset.js` with `var(--*)` color references matching the WXT extension pattern.
**Test:** CSS variables match web UI package values. Preset exports valid Tailwind v3 config.

### Phase 3: Core Components
**What happens:** Create 11 components in `src/ui/` following react-native-reusables patterns: Text (with TextClassContext), Button (6 variants via CVA), Card (6 sub-components), Input, Label, Separator, Badge, Avatar, Switch, Progress, Skeleton. All use `@rn-primitives/slot` for `asChild` pattern and package's own `cn()`.
**Test:** TypeScript compiles without errors. Components export correctly.

### Phase 4: Wire Up Expo App
**What happens:** Add `@sassy/ui-mobile-react-native: "workspace:*"` to `apps/expo/package.json`. Replace `tailwind.config.js` with preset-based config including package content path. Replace `global.css` with import from package (or copy HEX values as fallback).
**Test:** `pnpm install` succeeds. Metro bundles without errors.

### Phase 5: Migrate Screens
**What happens:** Update `sign-in.tsx`, `dashboard.tsx`, and `index.tsx` to import Button, Text, Card from `@sassy/ui-mobile-react-native` instead of raw React Native components.
**Test:** App loads on iPhone. Sign-in and dashboard screens render with correct styling.

**Expected Outcome:**
- `packages/ui-mobile-react-native/` package with 11 components, theme CSS, and Tailwind preset
- `apps/expo/` consuming the package with simplified tailwind config
- All screens render correctly with Neobrutalist theme on iPhone
- Foundation ready for adding more components via react-native-reusables patterns

---

## Scope

**In Scope:**
- New `packages/ui-mobile-react-native/` package
- 11 core UI components (Text, Button, Card, Input, Label, Separator, Badge, Avatar, Switch, Progress, Skeleton)
- HEX CSS variable theme (light + dark mode)
- Tailwind v3 preset for consuming apps
- `cn()` utility
- Migrate existing Expo app screens to use package
- Simplify Expo app's tailwind.config.js and global.css

**Out of Scope:**
- Complex components (Dialog, Popover, Dropdown, Accordion) — add later as needed
- Custom Neobrutalist animations (hard shadows, translate-on-press) — follow-up task
- Dark mode toggle provider — separate concern
- Font loading (Fira Sans, Artifika, JetBrains Mono) — separate task
- `lucide-react-native` icon setup
- Additional mobile apps consuming the package

---

## Assumptions and Constraints

**Assumptions:**
- NativeWind v4 + Tailwind v3 supports HEX CSS variables with `var(--*)` references (proven by WXT extension pattern)
- `@rn-primitives/slot` is compatible with React 19.1.0 and RN 0.81.5
- Metro resolves the new monorepo package without config changes (existing `nodeModulesPaths` covers it)
- `pnpm-workspace.yaml` `packages/*` glob auto-includes the new package

**Constraints:**
- Must use Tailwind v3 (NativeWind v4 requirement) — cannot use Tailwind v4 or `tooling/tailwind/` package
- Must use CommonJS for `tailwind-preset.js` (Tailwind v3 config requirement)
- Components are manually authored (not CLI-installed) since they live in a shared package, not an app

---

## Functional Requirements

- **FR-1:** Package exports components via `@sassy/ui-mobile-react-native/button`, `@sassy/ui-mobile-react-native/card`, etc.
- **FR-2:** Package exports `cn()` utility via `@sassy/ui-mobile-react-native/utils`
- **FR-3:** Package exports theme CSS via `@sassy/ui-mobile-react-native/styles/global.css`
- **FR-4:** Package exports Tailwind preset via `@sassy/ui-mobile-react-native/tailwind-preset`
- **FR-5:** Button component supports 6 variants (default, destructive, outline, secondary, ghost, link) and 4 sizes (default, sm, lg, icon)
- **FR-6:** Card component exports Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **FR-7:** Text component provides `TextClassContext` for parent-to-child style propagation (e.g., Button → Text)
- **FR-8:** All components support `className` prop for NativeWind styling
- **FR-9:** All components support `asChild` prop via `@rn-primitives/slot`
- **FR-10:** Theme CSS variables match `packages/ui/src/styles/theme.css` values exactly (HEX format)
- **FR-11:** Tailwind preset includes color, borderRadius, borderWidth, and fontFamily configuration

---

## Non-Functional Requirements

- **NFR-1:** Package uses `peerDependencies` for react, react-native, nativewind (not bundled)
- **NFR-2:** All components are TypeScript with proper type exports
- **NFR-3:** Package follows same export pattern as `@sassy/ui` for consistency

---

## Acceptance Criteria

1. ✅ `packages/ui-mobile-react-native/` exists with correct directory structure
2. ✅ `pnpm install` from monorepo root succeeds and links the package
3. ✅ `apps/expo/tailwind.config.js` uses the package's preset (under 15 lines)
4. ✅ `apps/expo/global.css` references the package's theme (not hardcoded)
5. ✅ Expo app bundles without Metro errors
6. ✅ Sign-in screen renders `Button` from package with correct primary color (#e5486c)
7. ✅ Dashboard screen renders `Card` from package with correct card background (#fbf6e5)
8. ✅ `Text` component from package renders with correct foreground color
9. ✅ NativeWind `className` prop works on all package components
10. ✅ App displays correctly on iPhone via Expo Go

---

## Implementation Checklist

### Phase 1: Package Scaffolding
- [ ] Create `packages/ui-mobile-react-native/package.json` with exports, dependencies (`@rn-primitives/slot`, `class-variance-authority`, `clsx`, `tailwind-merge`), peerDependencies, and scripts
- [ ] Create `packages/ui-mobile-react-native/tsconfig.json` extending `@sassy/tsconfig/internal-package.json` with jsx, nativewind types
- [ ] Create `packages/ui-mobile-react-native/src/lib/utils.ts` with `cn()` function (clsx + tailwind-merge)

### Phase 2: Theme and Config
- [ ] Create `packages/ui-mobile-react-native/src/styles/global.css` with HEX theme variables from `packages/ui/src/styles/theme.css` (light `:root` + dark `.dark:root`, `@tailwind` directives)
- [ ] Create `packages/ui-mobile-react-native/tailwind-preset.js` with `var(--*)` color references, `nativewind/preset`, border radius, fonts, `hairlineWidth`

### Phase 3: Core Components
- [ ] Create `src/ui/text.tsx` — Base Text with TextClassContext (must be first)
- [ ] Create `src/ui/button.tsx` — Pressable with CVA variants + TextClassContext provider
- [ ] Create `src/ui/card.tsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- [ ] Create `src/ui/input.tsx` — TextInput with border/focus styles
- [ ] Create `src/ui/label.tsx` — Form label component
- [ ] Create `src/ui/separator.tsx` — Horizontal/vertical divider
- [ ] Create `src/ui/badge.tsx` — Badge with variant support
- [ ] Create `src/ui/avatar.tsx` — Image with fallback
- [ ] Create `src/ui/switch.tsx` — Toggle switch
- [ ] Create `src/ui/progress.tsx` — Progress bar
- [ ] Create `src/ui/skeleton.tsx` — Loading placeholder with animation

### Phase 4: Wire Up Expo App
- [ ] Add `"@sassy/ui-mobile-react-native": "workspace:*"` to `apps/expo/package.json` dependencies
- [ ] Replace `apps/expo/tailwind.config.js` with preset-based config (~12 lines) including `../../packages/ui-mobile-react-native/src/**/*.{ts,tsx}` in content
- [ ] Replace `apps/expo/global.css` with `@import` from package (fallback: copy HEX values with `.dark:root` format)
- [ ] Run `pnpm install` from monorepo root

### Phase 5: Migrate Screens
- [ ] Update `apps/expo/app/(auth)/sign-in.tsx` to use Button, Text from package
- [ ] Update `apps/expo/app/(app)/dashboard.tsx` to use Card, Button, Text from package
- [ ] Update `apps/expo/app/index.tsx` to use Text from package
- [ ] Test on iPhone — verify theme colors and component rendering

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `@import` from monorepo package fails in NativeWind/Metro | Medium | Fallback: copy CSS values directly into app's global.css |
| `@rn-primitives/slot` incompatible with React 19.1 | Medium | Remove `asChild` prop, use direct composition instead |
| Tailwind class purging removes package component classes | High | Ensure content path `../../packages/ui-mobile-react-native/src/**/*.{ts,tsx}` is correct; use absolute path if needed |
| `var(--*)` doesn't resolve in NativeWind for colors | Medium | Already proven working in current Expo app (hardcoded values use same mechanism); WXT extension validates pattern |

---

## Integration Notes

**Dependencies:**
- `@rn-primitives/slot` ~1.1.0 — Slot primitive for asChild pattern
- `class-variance-authority` ^0.7.1 — Variant management (same as web shadcn/ui)
- `clsx` ^2.1.1 — Class concatenation
- `tailwind-merge` ^2.6.0 — Tailwind class deduplication

**Key Files Referenced:**
- `packages/ui/src/styles/theme.css` — Source of truth for HEX color values
- `packages/ui/package.json` — Export pattern to mirror
- `apps/wxt-extension/tailwind.config.ts` — Proven `var(--*)` pattern for Tailwind v3
- `apps/wxt-extension/assets/globals.css` — Proven HEX CSS variable pattern
- `tooling/typescript/internal-package.json` — Base tsconfig for JIT packages
- `apps/expo/metro.config.js` — Monorepo resolution (no changes needed)

**No Changes Needed:**
- `pnpm-workspace.yaml` — `packages/*` glob auto-includes
- `turbo.json` — No new env vars
- `apps/expo/metro.config.js` — Already resolves monorepo packages
- `apps/expo/babel.config.js` — NativeWind config unchanged

---

## Cursor + RIPER-5 Guidance

**Cursor Plan mode:**
- Import the Implementation Checklist directly
- Execute phases sequentially (1→5)
- After Phase 4, run `pnpm install` and verify Metro bundles
- After Phase 5, test on device

**RIPER-5 mode:**
- RESEARCH: ✅ Complete — analyzed UI package theme, WXT extension pattern, react-native-reusables docs, Expo app setup
- INNOVATE: ✅ Complete — decided on HEX (not HSL), package-level preset (not tooling/tailwind), manual components (not CLI)
- PLAN: ✅ This document
- EXECUTE: Implement per checklist above
- REVIEW: Verify all acceptance criteria on device
