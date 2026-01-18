# Dynamic Style Selection Feature

## Plan Metadata

- **Feature**: Dynamic Style Selection for AI Comment Generation
- **Created**: 2026-01-18
- **Status**: IN PROGRESS
- **Complexity**: MEDIUM
- **Last Updated**: 2026-01-18

## Progress Summary

### Completed
- [x] **Step 1**: Created `constants.ts` with DEFAULT_STYLE_GUIDE, DEFAULT_MAX_WORDS, DEFAULT_CREATIVITY
- [x] **Step 1**: Created `text-utils.ts` with `truncateToWords()` function
- [x] **Step 2**: Added `StyleSelectorInput` interface and `getStyleSelectorPrompt()` to prompts.ts
- [x] **Step 2**: Added `selectCommentStyles()` method to AIService with:
  - Zod schema + `zodToJsonSchema` for guaranteed JSON output
  - `responseMimeType: "application/json"` + `responseJsonSchema`
  - Retry logic (max 3 attempts)
  - Validation of returned style IDs
- [x] **Step 3**: Added `generateDynamic` tRPC route in `ai-comments.ts`
  - Uses `accountProcedure` (requires active account)
  - Schemas in `schema-validators.ts` (generateDynamicInputSchema, generateDynamicOutputSchema)
  - Fetches all styles for account, uses AI selector, generates in parallel
  - Returns `styleId: null, styleSnapshot: null` when using hardcoded defaults
  - **Added logging for style name when generating each comment**
- [x] **Step 4**: Exported types from `@sassy/api` (DynamicStyleResult, StyleSnapshot, etc.)
  - Removed utility wrapper function (callers use trpc directly)
- [x] **Step 5**: Updated `useEngageButtons.ts` for 3-card dynamic flow
  - Uses `useSettingsDBStore.getState()` directly for settings
  - Respects `adjacentCommentsEnabled` setting
  - Dynamic mode: single `generateDynamic` call with `count: 3`
  - Static mode: 3 parallel `generateComment` calls with same style
  - **Added `▶▶▶ TRIGGERED` logging to identify which trigger fired**
- [x] **Step 5b**: Updated `useAutoEngage.ts` for 3-card dynamic flow
  - Same dynamic style selection logic as useEngageButtons
  - **Added guard to skip if `isEngageButtonGenerating` already true** (prevents duplicate requests)
  - **Added `▶▶▶ TRIGGERED` and `SKIPPED` logging**
- [x] **Step 5c**: Updated `SpacebarEngageObserver.tsx` for 3-card dynamic flow
  - Same dynamic style selection logic as useEngageButtons
  - **Added `▶▶▶ TRIGGERED` logging**
- [x] **Step 5d**: Display style/persona name in UI
  - Updated `ComposeCard.tsx` to show style name next to "Your Touch" score
  - Updated `PostPreviewSheet.tsx` to show style name next to "Your Touch" score
  - Format: `Your Touch: 45% • Professional Congratulator`

### Next Steps
- [ ] **Step 6**: Update `load-posts-to-cards.ts` for single-card dynamic flow
- [ ] **Step 7**: Update regenerate flows (ComposeCard, PostPreviewSheet) for dynamic style
- [ ] **Step 8**: Add description validation to persona router

### Files Modified/Created So Far
| File | Status |
|------|--------|
| `packages/api/src/utils/ai-service/constants.ts` | Created |
| `packages/api/src/utils/text-utils.ts` | Created |
| `packages/api/src/utils/ai-service/prompts.ts` | Modified (added StyleSelectorInput, getStyleSelectorPrompt) |
| `packages/api/src/utils/ai-service/ai-service.ts` | Modified (added selectCommentStyles with Zod schema) |
| `packages/api/package.json` | Modified (added zod-to-json-schema dependency) |
| `packages/api/src/schema-validators.ts` | Modified (added dynamic style schemas and types) |
| `packages/api/src/router/ai-comments.ts` | Modified (added generateDynamic route + style name logging) |
| `packages/api/src/index.ts` | Modified (exported new types) |
| `apps/wxt-extension/.../engage-button/useEngageButtons.ts` | Modified (dynamic style + trigger logging) |
| `apps/wxt-extension/.../engage-button/useAutoEngage.ts` | Modified (dynamic style + duplicate guard + logging) |
| `apps/wxt-extension/.../engage-button/SpacebarEngageObserver.tsx` | Modified (dynamic style + trigger logging) |
| `apps/wxt-extension/.../compose-tab/ComposeCard.tsx` | Modified (display style name in UI) |
| `apps/wxt-extension/.../compose-tab/PostPreviewSheet.tsx` | Modified (display style name in UI) |
| `packages/api/scripts/test-dynamic-style-selection.ts` | Created (test script) |

---

## Overview

Implement intelligent, context-aware style selection for AI comment generation. When the `dynamicChooseStyleEnabled` toggle is ON, the system will:

1. Fetch all user's comment styles
2. Use AI to select the 3 most appropriate styles based on post content
3. Generate comments using those selected styles
4. Return full style snapshots for history tracking

This replaces the current fixed-style approach where users manually select one default style.

---

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT (WXT Extension / Puppeteer / Webapp)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ if (dynamicChooseStyleEnabled) {                               │
│   const results = await trpc.aiComments.generateDynamic({      │
│     postContent,                                                │
│     adjacentComments,                                           │
│     count: 3,  // or 1 for single card                         │
│   });                                                          │
│                                                                 │
│   // Always returns results (falls back to default if no styles)│
│   results.forEach((result, i) => {                             │
│     updateCard(cardIds[i], result);                            │
│   });                                                          │
│ }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVER - generateDynamic route                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Fetch ALL styles for accountId (fresh, no cache)            │
│    SELECT id, name, description, content, maxWords, creativity │
│                                                                 │
│ 2. If styles.length === 0:                                     │
│    → Generate with DEFAULT_STYLE_GUIDE                         │
│    → Return [{comment, styleId: null, styleSnapshot: {...}}]   │
│                                                                 │
│ 3. If styles.length > 0:                                       │
│    a. Build selector input for each style:                     │
│       - Use description if not empty                           │
│       - Else use first 100 words of content                    │
│                                                                 │
│    b. AI Style Selector (with retry):                          │
│       Input: postContent, adjacentComments, styles summary     │
│       Output: [styleId1, styleId2, styleId3] (always 3)        │
│       Note: Repeats allowed if < 3 styles available            │
│                                                                 │
│    c. Promise.all - Generate comments in parallel:             │
│       For each selected styleId (up to count):                 │
│         → Fetch full style content                             │
│         → Generate comment with style settings                 │
│         → Return {comment, styleId, styleSnapshot}             │
│                                                                 │
│ 4. Return results array                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Server orchestration | Yes | Single round trip, reusable across all clients |
| Style selector always returns 3 | Yes | Use `[0]` for single, all 3 for engage buttons |
| Repeat styles if < 3 | Yes | Simpler than mixing with defaults |
| No client-side caching | Yes | Always fetch fresh styles on server |
| Retry on AI failure | Yes | Users must have styleSnapshot in history |
| Fallback to default | Server-side | If no styles, use DEFAULT_STYLE_GUIDE directly |
| No style used → null, null | Yes | Both styleId and styleSnapshot are null when using hardcoded defaults |

### Style Tracking Logic (Unified)

```
Was a user-created CommentStyle used?
  ├── YES → Return { styleId: "xxx", styleSnapshot: { name, content, maxWords, creativity } }
  └── NO  → Return { styleId: null, styleSnapshot: null }
```

**This applies to all scenarios:**

| Scenario | styleId | styleSnapshot |
|----------|---------|---------------|
| Dynamic OFF, user selected a default style | `"style-id"` | `{ name, content, ... }` |
| Dynamic OFF, no default selected (uses hardcoded) | `null` | `null` |
| Dynamic ON, user has styles → AI picks | `"style-id"` | `{ name, content, ... }` |
| Dynamic ON, user has 0 styles (uses hardcoded) | `null` | `null` |

**Rationale:**
- Clear semantic meaning: `null, null` = "no user style was used"
- Less data stored in DB for comments using hardcoded defaults
- History UI simpler: show "No style" when `styleSnapshot === null`
- Hardcoded defaults are constants - no need to save them per comment

---

## Implementation Tasks

### Phase 1: Server-Side Infrastructure ✅ COMPLETE

#### 1.1 Add DEFAULT_STYLE_GUIDE constant to API package ✅
- **File**: `packages/api/src/utils/ai-service/constants.ts` (created)

#### 1.2 Add selectCommentStyles method to AIService ✅
- **File**: `packages/api/src/utils/ai-service/ai-service.ts`

#### 1.3 Add style selector prompt ✅
- **File**: `packages/api/src/utils/ai-service/prompts.ts`

#### 1.4 Add generateDynamic route ✅
- **File**: `packages/api/src/router/ai-comments.ts`

#### 1.5 Add description validation to persona router
- [ ] **File**: `packages/api/src/router/persona.ts`
- [ ] **Changes**:
  - `create`: Add `z.string().max(500)` for description (100 words ~ 500 chars)
  - `update`: Add same validation
- [ ] **Note**: This is a soft limit; AI selector will truncate if needed

#### 1.6 Add utility function for truncating to N words ✅
- **File**: `packages/api/src/utils/text-utils.ts` (created)

---

### Phase 2: Client-Side Integration (WXT Extension) - MOSTLY COMPLETE

#### 2.1 Update comment-style-cache.ts ✅
- Decided NOT to add wrapper function - callers use trpc directly

#### 2.2 Update useEngageButtons.ts (3-card flow) ✅
- Dynamic mode: single `generateDynamic` call with `count: 3`
- Static mode: 3 parallel `generateComment` calls with same style

#### 2.3 Update useAutoEngage.ts (3-card flow) ✅
- Same pattern as useEngageButtons
- Added guard to prevent duplicate requests when programmatic click triggers this

#### 2.4 Update SpacebarEngageObserver.tsx (3-card flow) ✅
- Same pattern as useEngageButtons

#### 2.5 Update load-posts-to-cards.ts (single-card flow)
- [ ] **File**: `apps/wxt-extension/entrypoints/linkedin.content/utils/load-posts-to-cards.ts`
- [ ] **Changes**: Similar pattern but with `count: 1`

#### 2.6 Update ComposeCard.tsx (regenerate flow)
- [x] Display style name in UI ✅
- [ ] Add dynamic mode for regenerate button

#### 2.7 Update PostPreviewSheet.tsx (regenerate flow)
- [x] Display style name in UI ✅
- [ ] Add dynamic mode for regenerate button

---

### Phase 3: Testing & Verification

#### 3.1 Manual testing scenarios
- [ ] **Scenario 1**: User has 0 styles → should fall back to default, `styleId: null, styleSnapshot: null`
- [ ] **Scenario 2**: User has 1 style → should repeat same style 3 times, each with valid styleSnapshot
- [ ] **Scenario 3**: User has 2 styles → should use both, repeat one
- [ ] **Scenario 4**: User has 5+ styles → should select 3 different appropriate styles
- [ ] **Scenario 5**: Engage button with dynamic ON → 3 cards with different styles and snapshots
- [ ] **Scenario 6**: Load Posts with dynamic ON → each card gets appropriate style
- [ ] **Scenario 7**: Regenerate with dynamic ON → new style selection
- [ ] **Scenario 8**: Submit comment with style → verify styleId and styleSnapshot saved to DB
- [ ] **Scenario 9**: Submit comment without style (null/null) → verify nulls saved correctly
- [ ] **Scenario 10**: Dynamic OFF, no default selected → verify `styleId: null, styleSnapshot: null`
- [ ] **Scenario 11**: Dynamic OFF, default selected → verify styleId and styleSnapshot populated

#### 3.2 Edge cases
- [ ] **Empty description**: Verify first 100 words of content used
- [ ] **AI selector fails**: Verify retry works, eventually succeeds
- [ ] **Very long post content**: Verify no timeout issues
- [ ] **Concurrent requests**: Verify no race conditions

---

## Files to Modify/Create

### New Files
| File | Purpose | Status |
|------|---------|--------|
| `packages/api/src/utils/ai-service/constants.ts` | Default style constants | ✅ Created |
| `packages/api/src/utils/text-utils.ts` | Text utility functions | ✅ Created |

### Modified Files
| File | Changes | Status |
|------|---------|--------|
| `packages/api/src/utils/ai-service/ai-service.ts` | Add `selectCommentStyles()` method | ✅ Done |
| `packages/api/src/utils/ai-service/prompts.ts` | Add `getStyleSelectorPrompt()` | ✅ Done |
| `packages/api/src/router/ai-comments.ts` | Add `generateDynamic` route | ✅ Done |
| `packages/api/src/router/persona.ts` | Add description max length validation | ⏳ Pending |
| `apps/wxt-extension/.../engage-button/useEngageButtons.ts` | Add dynamic mode branch | ✅ Done |
| `apps/wxt-extension/.../engage-button/useAutoEngage.ts` | Add dynamic mode branch | ✅ Done |
| `apps/wxt-extension/.../engage-button/SpacebarEngageObserver.tsx` | Add dynamic mode branch | ✅ Done |
| `apps/wxt-extension/.../utils/load-posts-to-cards.ts` | Add dynamic mode branch | ⏳ Pending |
| `apps/wxt-extension/.../compose-tab/ComposeCard.tsx` | Display style name + regenerate | ✅ Display / ⏳ Regenerate |
| `apps/wxt-extension/.../compose-tab/PostPreviewSheet.tsx` | Display style name + regenerate | ✅ Display / ⏳ Regenerate |

---

## Rollback Plan

If issues arise:
1. Set `dynamicChooseStyleEnabled` to `false` in database for affected accounts
2. The existing non-dynamic flow remains unchanged and will be used
3. No database migrations required - this is purely additive

---

## Future Enhancements (Out of Scope)

- ~~Display selected style name badge on each card~~ ✅ DONE
- Style performance analytics (which styles get more engagement)
- User feedback loop to improve AI style selection
- Caching style list on server for performance optimization

---

## Dependencies

- Existing `generateComment` method in AIService (reused)
- Existing `CommentStyle` database model (no changes)
- Existing `dynamicChooseStyleEnabled` flag in `CommentGenerateSetting` (already exists, not used)

---

## Approval Checklist

- [x] Architecture reviewed
- [x] No breaking changes to existing flows
- [x] Fallback behavior confirmed
- [x] All client entry points identified
- [x] Testing scenarios defined
