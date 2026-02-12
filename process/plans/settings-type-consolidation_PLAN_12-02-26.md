# Settings Type Consolidation - Use Auto-Generated Zod Schemas

**Date:** 2026-02-12
**Complexity:** SIMPLE
**Status:** ⏳ PLANNED

## Overview

Refactor the settings type architecture to eliminate manual type/interface duplication. Currently, adding a new setting field requires updating 7 different files manually. This plan consolidates to use Prisma auto-generated Zod schemas as the single source of truth, reducing update points from 7 to 2 (Prisma schema + `pnpm db:generate`).

## Quick Links

- [Goals](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Requirements](#functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)

## Status Strip

| Phase | Status |
|-------|--------|
| Validators Package Refactor | ⏳ PLANNED |
| WXT Store Types Refactor | ⏳ PLANNED |
| Queue Types Refactor | ⏳ PLANNED |
| Manual Construction Removal | ⏳ PLANNED |
| Testing | ⏳ PLANNED |

---

## Goals and Success Metrics

### Goals
1. **Eliminate manual type duplication** - Single source of truth from Prisma schema
2. **Reduce maintenance burden** - Adding a new setting requires only Prisma + db:generate
3. **Improve type safety** - Derived types ensure consistency across packages
4. **Prevent bugs** - No more "forgot to update interface X" errors

### Success Metrics
- Update points reduced from 7 → 2
- All existing functionality works unchanged
- TypeScript compilation passes with no type errors
- Adding a test field only requires Prisma schema change + db:generate

---

## Execution Brief

### Phase 1: Validators Package Refactor
**What happens:** Replace manual Zod schemas in `@sassy/validators` with re-exports from `@sassy/db/schema-validators`. Create derived upsert schemas using `.omit().partial()`.
**Test:** `pnpm typecheck` passes in validators and api packages.

### Phase 2: WXT Store Types Refactor
**What happens:** Replace `PostLoadSettingDB` interface with type derived from auto-generated Zod schema. Update `DEFAULT_POST_LOAD` to use schema defaults or remove if possible.
**Test:** `pnpm typecheck` passes in wxt-extension.

### Phase 3: Queue Types Refactor
**What happens:** Replace `PostLoadSettings` interface in `target-list-queue.ts` with Zod-derived type using `.omit()`. Update `TargetListQueueState` to use new type.
**Test:** `pnpm typecheck` passes, queue functionality works.

### Phase 4: Manual Construction Removal
**What happens:** Replace manual object construction in `useLoadPosts.ts` with spread operator pattern. TypeScript will ensure all fields are included.
**Test:** Target list queue flow works end-to-end.

### Expected Outcome
- [ ] `@sassy/validators` re-exports from `@sassy/db/schema-validators`
- [ ] `PostLoadSettingDB` type derived from Zod schema
- [ ] `PostLoadSettings` type derived using `.omit()`
- [ ] Manual field-by-field object construction replaced with spreads
- [ ] Adding a new setting field only requires Prisma + db:generate

---

## Scope

### In Scope
- `PostLoadSetting` type consolidation
- `SubmitCommentSetting` type consolidation (same pattern)
- `CommentGenerateSetting` type consolidation (same pattern)
- Update imports across api router and wxt-extension
- Replace manual object construction with spread operators

### Out of Scope
- Other Prisma models (not settings-related)
- Changing any runtime behavior
- New features or settings
- Database migrations

---

## Assumptions and Constraints

### Assumptions
1. Auto-generated Zod schemas from `zod-prisma-types` are correct and complete
2. `@sassy/db/schema-validators` export path works in all environments
3. WXT extension can import from `@sassy/db` packages

### Constraints
1. Must maintain backwards compatibility - no runtime behavior changes
2. All existing tests must pass
3. No circular dependency issues between packages

---

## Functional Requirements

### FR-1: Validators Package
- [ ] Remove manual `postLoadSettingSchema` - use auto-generated
- [ ] Remove manual `submitCommentSettingSchema` - use auto-generated
- [ ] Remove manual `commentGenerateSettingSchema` - use auto-generated
- [ ] Create derived upsert schemas using `.omit({ accountId, createdAt, updatedAt }).partial()`
- [ ] Re-export types for API consumers

### FR-2: API Router
- [ ] Update imports to use new schema exports
- [ ] Verify tRPC input validation still works

### FR-3: WXT Settings Store
- [ ] Replace `PostLoadSettingDB` interface with derived type
- [ ] Replace `SubmitCommentSettingDB` interface with derived type
- [ ] Replace `CommentGenerateSettingDB` interface with derived type
- [ ] Update default objects to use Zod `.parse()` with defaults or explicit defaults

### FR-4: WXT Queue Types
- [ ] Replace `PostLoadSettings` interface with `Omit<PostLoadSetting, 'accountId' | 'createdAt' | 'updatedAt'>`
- [ ] Replace `CommentGenerateSettings` interface similarly
- [ ] Update `TargetListQueueState` type

### FR-5: Manual Construction
- [ ] Replace manual object construction in `useLoadPosts.ts` with spread pattern:
  ```typescript
  const { accountId, createdAt, updatedAt, ...settingsForQueue } = postLoadSettings;
  ```

---

## Non-Functional Requirements

- **Type Safety:** No `any` types, full TypeScript inference
- **Bundle Size:** No significant increase (Zod already in bundle)
- **Build Time:** No significant increase

---

## Acceptance Criteria

- [ ] **AC-1:** `pnpm typecheck` passes across all packages
- [ ] **AC-2:** `pnpm build` succeeds for wxt-extension
- [ ] **AC-3:** Adding a test field to Prisma schema + db:generate automatically propagates to all types
- [ ] **AC-4:** API settings endpoints work (get/upsert)
- [ ] **AC-5:** WXT settings UI loads and saves correctly
- [ ] **AC-6:** Target list queue flow works (multi-tab navigation)
- [ ] **AC-7:** No runtime errors in console
- [ ] **AC-8:** Manual `PostLoadSettings` interface in target-list-queue.ts is removed
- [ ] **AC-9:** Manual object construction in useLoadPosts.ts is replaced with spread

---

## Implementation Checklist

Copy this checklist into Cursor Plan mode for step-by-step execution:

```
[ ] 1. Update packages/validators/src/settings.ts:
      - Import schemas from @sassy/db/schema-validators
      - Re-export PostLoadSettingSchema, SubmitCommentSettingSchema, CommentGenerateSettingSchema
      - Create derived upsert schemas: PostLoadSettingUpsertSchema = Schema.omit({...}).partial()
      - Export inferred types

[ ] 2. Run pnpm typecheck in packages/validators to verify exports work

[ ] 3. Update packages/api/src/router/settings.ts:
      - Verify imports still work (should be unchanged if re-exports are correct)
      - Test that tRPC procedures compile

[ ] 4. Run pnpm typecheck in packages/api to verify router compiles

[ ] 5. Update apps/wxt-extension/.../stores/settings-db-store.ts:
      - Import PostLoadSetting type from @sassy/validators (or @sassy/db/schema-validators)
      - Replace PostLoadSettingDB interface with: type PostLoadSettingDB = PostLoadSetting
      - Do same for SubmitCommentSettingDB and CommentGenerateSettingDB
      - Update defaultPostLoadSetting to match (may need explicit defaults)

[ ] 6. Run pnpm typecheck in wxt-extension to verify store compiles

[ ] 7. Update apps/wxt-extension/.../stores/target-list-queue.ts:
      - Import PostLoadSetting from @sassy/validators
      - Replace PostLoadSettings interface with:
        type PostLoadSettings = Omit<PostLoadSetting, 'accountId' | 'createdAt' | 'updatedAt'>
      - Do same for CommentGenerateSettings if applicable

[ ] 8. Update apps/wxt-extension/.../hooks/useLoadPosts.ts:
      - Replace manual settingsForQueue construction (lines 137-154) with:
        const { accountId, createdAt, updatedAt, ...settingsForQueue } = postLoadSettings;
      - TypeScript will now auto-include all fields

[ ] 9. Run pnpm typecheck across entire monorepo: pnpm typecheck

[ ] 10. Build wxt-extension: pnpm --filter wxt-extension build

[ ] 11. Manual test: Load extension, verify settings UI works

[ ] 12. Manual test: Run target list queue flow, verify multi-tab navigation works

[ ] 13. Verification test: Add a dummy field to Prisma schema, run db:generate,
       verify TypeScript errors appear in useLoadPosts.ts spread (field missing from source)
       Then remove dummy field

[ ] 14. Clean up: Remove any commented-out old code, update any stale comments
```

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Circular dependency between packages | Medium | High | Check import graph before merging; @sassy/validators may need to import from @sassy/db |
| WXT bundler can't resolve @sassy/db | Low | High | Test build early; may need explicit external config |
| Type inference breaks in complex generics | Low | Medium | Keep explicit type annotations where needed |
| Runtime behavior change | Low | High | No logic changes, only type refactoring |

---

## Integration Notes

### Package Dependencies (after refactor)
```
@sassy/db
  └── generates: zod-prisma-validators (Zod schemas)

@sassy/validators
  └── imports from: @sassy/db/schema-validators
  └── exports: derived upsert schemas + types

@sassy/api
  └── imports from: @sassy/validators

wxt-extension
  └── imports from: @sassy/validators (types only)
```

### Files Modified
1. `packages/validators/src/settings.ts` - Major refactor
2. `packages/api/src/router/settings.ts` - Import verification
3. `apps/wxt-extension/.../stores/settings-db-store.ts` - Type replacement
4. `apps/wxt-extension/.../stores/target-list-queue.ts` - Type replacement
5. `apps/wxt-extension/.../hooks/useLoadPosts.ts` - Spread pattern

### No Changes Needed
- Prisma schema (already has all fields)
- Database (no migrations)
- API endpoints (same behavior)
- UI components (same props)

---

## Cursor + RIPER-5 Guidance

### Cursor Plan Mode
1. Import the Implementation Checklist above
2. Execute steps 1-14 sequentially
3. Run typecheck after each major file change
4. Stop and verify if any step fails

### RIPER-5 Mode
- **RESEARCH:** ✅ Completed (architecture analysis done)
- **INNOVATE:** ✅ Completed (approach decided)
- **PLAN:** ✅ This document
- **EXECUTE:** Request explicitly with "ENTER EXECUTE MODE"
- **REVIEW:** After implementation, verify all acceptance criteria

### If Scope Expands
- If circular dependency issues arise, may need to restructure package exports
- If WXT bundler issues, may need to keep some manual types
- Update this plan before continuing

---

## Future Enhancements

After this consolidation:
1. Apply same pattern to other Prisma models
2. Consider generating TypeScript types directly from Prisma (skip Zod for non-API types)
3. Add automated test that verifies Prisma schema matches all derived types
4. Document the "add a new setting" workflow in CLAUDE.md
