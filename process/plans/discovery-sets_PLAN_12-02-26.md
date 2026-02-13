# Discovery Sets: LinkedIn Search Parameter Management

**Date**: February 12, 2026
**Complexity**: COMPLEX (Multi-phase)
**Implementation Approach**: Separate Columns DB Schema + Multi-Tab Extension Integration
**Execution Model**: Phase-by-Phase with Pre-Research and Post-Testing

## Overview

Build a new feature called "Discovery Sets" for the EngageKit Next.js webapp that allows users to define and manage LinkedIn search parameter configurations. Each Discovery Set represents a saved search filter (keywords, industries, job titles) that generates a LinkedIn content search URL. Users can select multiple sets, opening each in a separate browser tab for parallel content discovery. The UI follows the existing Personas pattern (card grid + right sidebar for create/edit).

**Status**: 🚧 IN PROGRESS (RFC-001 through RFC-008 completed)

---

## Quick Links

- [Context and Goals](#1-context-and-goals)
- [Execution Brief](#15-execution-brief)
- [Phased Execution Workflow](#175-phased-execution-workflow)
- [Architecture Decisions](#3-architecture-decisions-final)
- [Database Schema](#11-database-schema-prisma-style)
- [API Surface](#12-api-surface-trpc)
- [Phased Delivery Plan](#14-phased-delivery-plan)
- [RFCs](#16-rfcs)
- [Implementation Checklist](#implementation-checklist)

---

## 1. Context and Goals

EngageKit users engage with LinkedIn content through the browser extension. Currently, users can filter by Target Lists (specific profile URNs) but lack the ability to discover new content based on search criteria like keywords, industries, and author job titles. Discovery Sets fills this gap by allowing users to save LinkedIn search configurations and quickly access relevant content feeds.

**In-scope**:

- Discovery Sets management page (`/[orgSlug]/[accountSlug]/discovery-sets/`)
- CRUD operations via tRPC (create, read, update, delete, list)
- Card grid UI with right sidebar for create/edit (following Personas pattern)
- Search parameters: keywords[], keywordsMode (AND/OR), excluded[], authorJobTitle?, authorIndustries[]
- Industry multi-select with searchable dropdown (515 LinkedIn industry codes)
- URL builder utility in `@sassy/linkedin-automation` package
- PostLoadSetting integration (discoverySetEnabled, discoverySetIds[])
- Extension settings store updates
- Multi-tab opening (each selected set = one LinkedIn search tab)

**Out-of-scope (V1)**:

- Combining multiple sets into single search URL
- Real-time preview of search results
- Import/export of discovery sets
- Sharing discovery sets between accounts
- Analytics on discovery set performance
- Scheduling/automation of discovery set searches
- Integration with AI comment generation workflow

---

## 1.5 Execution Brief

### Phase 1-2: Foundation (Database Schema + URL Builder)

**What happens:** Create DiscoverySet Prisma model with separate columns for search parameters. Add discoverySetEnabled and discoverySetIds[] to PostLoadSetting. Build URL construction utility in linkedin-automation package.

**Test:** Migration applies successfully, URL builder generates valid LinkedIn search URLs, TypeScript types compile correctly.

### Phase 3-4: API Layer (tRPC Router + Validators)

**What happens:** Create discovery-set tRPC router with CRUD procedures following existing persona.ts pattern. Add Zod validators for search parameters. Implement pagination for list query.

**Test:** All procedures callable via tRPC client, authorization prevents cross-account access, infinite query pagination works.

### Phase 5-7: Web UI (Page + Components + Industry Selector)

**What happens:** Create discovery-sets page with card grid layout. Build DiscoverySetCard and DiscoverySetSidebar components following Personas pattern. Implement searchable multi-select for industry codes with category grouping.

**Test:** Page renders correctly, sidebar opens/closes, form validation works, industry selector handles 515 options smoothly.

### Phase 8-9: Extension Integration (Settings Store + Multi-Tab)

**What happens:** Update settings-db-store.ts to include discoverySetEnabled and discoverySetIds[]. Add Discovery Sets section to extension settings UI. Implement multi-tab opening logic for selected sets.

**Test:** Settings sync to DB correctly, multi-tab opening works, each tab opens correct LinkedIn search URL.

### Phase 10-11: Polish (Responsive Design + Testing)

**What happens:** Finalize mobile responsive behavior, optimize form UX, comprehensive testing across all components.

**Test:** All breakpoints work correctly, manual QA passes, no console errors.

### Expected Outcome

- Users can create/edit/delete Discovery Sets from webapp
- Each set configures: keywords (AND/OR), excluded keywords, author job title, industries
- Industry selector provides searchable dropdown with 515 options
- Extension settings show Discovery Sets toggle and multi-select
- Selecting sets and clicking "Load Posts" opens multiple LinkedIn search tabs
- Each tab shows LinkedIn content search filtered by the set's parameters

---

## 1.75 Phased Execution Workflow

**IMPORTANT**: This plan uses a phase-by-phase execution model with built-in approval gates. Each RFC follows this workflow:

### Phase Workflow Pattern

**Step 1: Pre-Phase Research**

- Read existing code patterns in codebase
- Analyze similar implementations (Personas, Target Lists)
- Identify potential blockers or unknowns
- Present findings to user for review

**Step 2: Detailed Planning**

- Based on research, create detailed implementation steps
- Specify exact files to create/modify
- Define success criteria
- Get user approval before proceeding

**Step 3: Implementation**

- Execute approved plan exactly as specified
- No deviations from approved approach
- Mid-phase check-in if phase is long (>2 hours)

**Step 4: Testing**

- Execute specific test scenarios (provided in RFC)
- Verify all acceptance criteria met
- Document any issues or deviations
- Show results to user

**Step 5: Phase Approval**

- User reviews implementation and test results
- User approves to proceed to next phase
- OR user requests changes (loop back to Step 2)

### Example Phase Execution

```
User: "Begin RFC-001: Database Schema"

Assistant (Pre-Phase Research):
- Reading existing CommentStyle model structure...
- Analyzing PostLoadSetting fields pattern...
- Checking industries.json format...
- Findings: Pattern uses separate columns, String[] for arrays, optional fields with ?
- Proposed schema matches codebase conventions
- Do you approve proceeding with this approach?

User: "Yes, proceed"

Assistant (Detailed Planning):
- Will create discovery-set.prisma in packages/db/prisma/models/
- Will add 2 fields to PostLoadSetting
- Will run migration: pnpm db:migrate dev
- Expected migration time: <1 minute
- Ready to implement?

User: "Go ahead"

Assistant (Implementation):
[Creates schema file, updates PostLoadSetting, generates migration]

Assistant (Testing):
Running post-phase tests:
✓ Migration applied successfully
✓ DiscoverySet model visible in Prisma client
✓ PostLoadSetting includes new fields
✓ No TypeScript errors

Phase RFC-001 complete. Proceed to RFC-002?
```

### Benefits of This Approach

- **User control**: Approve each phase before implementation
- **Early feedback**: Catch issues before significant work done
- **Visibility**: Clear understanding of what's being built
- **Quality**: Testing after each phase ensures incremental quality
- **Flexibility**: Easy to adjust approach based on discoveries

---

## 2. Non-Goals and Constraints

**Non-Goals**:

- Real-time search result preview in webapp
- Combining multiple discovery sets into one search URL
- Discovery set templates or presets
- Cross-account discovery set sharing
- Integration with comment queue workflow
- Mobile app support (webapp only for V1)
- Analytics dashboard for discovery set usage

**Constraints**:

- Must use existing Prisma schema patterns (separate columns, String[] for arrays)
- Must follow neobrutalist theme from `@sassy/ui`
- Must follow existing Personas UI pattern exactly
- Industry codes must use LinkedIn's official codes from industries.json
- Extension must work with existing settings-db-store pattern
- Browser support: Chrome (primary), Firefox, Safari, Edge
- Mobile responsive: minimum 375px viewport width

---

## 3. Architecture Decisions (Final)

### AD-001: Separate Columns for Search Parameters

**Decision**: Store each search parameter as dedicated typed columns instead of JSON field.

**Rationale**:

- **Codebase consistency**: All existing settings models (CommentStyle, PostLoadSetting, SubmitCommentSetting) use separate columns, not JSON
- **Type safety**: Direct Prisma types → Zod validation → react-hook-form binding without manual serialization
- **Queryability**: Can filter/search discovery sets by specific parameters if needed
- **Developer experience**: Clear schema, no JSON parsing/stringifying in code

**Schema**:

```prisma
model DiscoverySet {
  id               String   @id
  accountId        String
  name             String
  keywords         String[]
  keywordsMode     String   @default("OR")
  excluded         String[]
  authorJobTitle   String?
  authorIndustries String[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Implications**:

- Migration required for each new search parameter (acceptable trade-off)
- Form binding is straightforward with react-hook-form
- Zod validation can use z.array(z.string()) directly

### AD-002: Multi-Tab Extension Integration

**Decision**: Each selected Discovery Set opens in a separate browser tab with its LinkedIn search URL.

**Rationale**:

- **User clarity**: Each tab = one search context, easy to understand
- **No merging complexity**: Avoid complex URL combining logic
- **Parallel browsing**: User can switch between tabs to review different search results
- **Consistency**: Similar to how Target Lists would work with multiple lists

**Flow**:

1. User enables Discovery Sets in extension settings
2. User selects which sets to activate (multi-select)
3. On "Load Posts" or manual trigger, extension opens N tabs (one per selected set)
4. Each tab navigates to LinkedIn search URL for that set
5. User browses each tab independently

**Implications**:

- Need tab management (limit to prevent tab overload)
- Each tab is independent (no cross-tab coordination)
- Settings store needs discoverySetIds[] array

### AD-003: URL Builder in linkedin-automation Package

**Decision**: Place LinkedIn search URL construction logic in `packages/linkedin-automation/src/navigate/build-discovery-search-url.ts`.

**Rationale**:

- **Existing pattern**: `build-list-feed-url.ts` already exists in same location
- **Universal**: Works for both DOM v1 and v2, extension and future use cases
- **Separation of concerns**: URL logic separate from UI/extension code
- **Reusability**: Can be used by extension, webapp preview (future), CLI tools

**Function Signature**:

```typescript
interface DiscoverySearchParams {
  keywords: string[];
  keywordsMode: "AND" | "OR";
  excluded: string[];
  authorJobTitle?: string;
  authorIndustries?: string[];
}

function buildDiscoverySearchUrl(params: DiscoverySearchParams): string;
```

**Implications**:

- Must handle URL encoding for special characters
- Must match LinkedIn's expected URL parameter format
- Single source of truth for URL construction

### AD-004: PostLoadSetting Integration

**Decision**: Add `discoverySetEnabled` and `discoverySetIds[]` to existing PostLoadSetting model, mirroring the Target List pattern.

**Rationale**:

- **Consistency**: Exact same pattern as targetListEnabled + targetListIds[]
- **Existing infrastructure**: Settings store already handles PostLoadSetting
- **User familiarity**: Toggle + multi-select matches existing patterns
- **Simple implementation**: No new settings model needed

**Schema Addition**:

```prisma
model PostLoadSetting {
  // ... existing fields
  discoverySetEnabled Boolean  @default(false)
  discoverySetIds     String[]
}
```

**Implications**:

- Migration adds columns to existing table
- Settings store update handles new fields automatically
- Extension UI needs new section for Discovery Sets

### AD-005: Industry Selector with Command Palette Pattern

**Decision**: Use shadcn/ui Command component (cmdk-based) for industry selection with searchable dropdown and category grouping.

**Rationale**:

- **Handles scale**: 515 industries need search, not just scroll
- **Familiar UX**: VS Code command palette pattern is widely understood
- **Category grouping**: LinkedIn industries have natural categories
- **Keyboard accessible**: Full keyboard navigation support
- **Existing component**: shadcn/ui Command is already available

**UI Pattern**:

```
[Search industries...        ] ▼
─────────────────────────────
TECHNOLOGY
  ☑ Software Development
  ☐ IT Services and Consulting
PROFESSIONAL SERVICES
  ☐ Marketing Services
  ☐ Accounting
─────────────────────────────
Selected: [Software Development ×]
```

**Implications**:

- Need to organize industries.json into categories
- Multi-select state management in form
- Visual chips for selected industries

---

## 4. Architecture Clarification: Discovery Sets Page Location

### Why Separate Page (Not Embedded in Dashboard)?

**Decision**: Create dedicated `/[orgSlug]/[accountSlug]/discovery-sets/` page.

**Rationale**:

- **Consistency**: Follows existing pattern (Personas at `/personas/`, Target Lists at `/targeting/`)
- **Dedicated space**: Full page for managing sets without cluttering dashboard
- **Navigation clarity**: Clear sidebar item "Discovery Sets"
- **Future expansion**: Room to add analytics, bulk actions, etc.

**Alternative Considered**:

- Embed in dashboard alongside Personas → Rejected (dashboard already has achievements section planned)
- Modal-based management → Rejected (complex forms need more space)

---

## 5. High-level Data Flow

```
User navigates to /[orgSlug]/[accountSlug]/discovery-sets/
          ↓
DiscoverySetsPage component renders
          ↓
Page fires infinite query:
  trpc.discoverySet.list.useInfiniteQuery()
          ↓
tRPC procedure executes on server:
  - Validate account ownership via accountProcedure
  - Query Prisma for DiscoverySet records (filtered by accountId)
  - Return paginated results with cursor
          ↓
Cards render in grid layout
          ↓
User clicks card → Sidebar opens with form pre-filled
          ↓
User edits and saves → useMutation fires:
  trpc.discoverySet.update.useMutation()
          ↓
tRPC procedure validates and updates DB
          ↓
Query cache invalidated → UI refreshes

--- Extension Flow ---

User opens extension settings
          ↓
Settings UI shows "Discovery Sets" toggle
          ↓
Toggle enabled → Multi-select appears
          ↓
User selects discovery sets
          ↓
Settings saved via: updatePostLoad({ discoverySetEnabled, discoverySetIds })
          ↓
User clicks "Load Posts" (or trigger action)
          ↓
Extension fetches selected discovery sets from DB
          ↓
For each set, call buildDiscoverySearchUrl(params)
          ↓
Open each URL in new tab via browser.tabs.create()
          ↓
User browses LinkedIn search results in each tab
```

---

## 6. Security Posture

**Authentication**:

- All tRPC procedures use `protectedProcedure` or `accountProcedure`
- Account ownership validated before any CRUD operation
- Uses existing `hasPermissionToAccessAccount()` pattern

**Data Privacy**:

- Discovery sets are per-account (no cross-account access)
- Search parameters don't contain PII (just filter criteria)
- Industry codes are public LinkedIn data

**Input Validation**:

- Zod schemas validate all inputs
- Keywords limited to reasonable length (max 100 chars each)
- Array lengths capped (max 20 keywords, max 50 industries)

**URL Safety**:

- URL builder only generates linkedin.com URLs
- No user input directly in URL path (only encoded query params)
- XSS prevention via proper URL encoding

---

## 7. Component Details

### DiscoverySetsPage

**Location**: `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/discovery-sets/page.tsx`

**Responsibilities**:

- Render page header with title and "Create" button
- Fetch discovery sets via infinite query
- Render card grid with infinite scroll
- Manage sidebar open/close state
- Handle delete confirmation dialog

**State**:

```typescript
const [sidebarOpen, setSidebarOpen] = useState(false);
const [selectedSet, setSelectedSet] = useState<DiscoverySet | null>(null);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
```

### DiscoverySetCard

**Location**: `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/discovery-sets/_components/DiscoverySetCard.tsx`

**Responsibilities**:

- Display set name and summary
- Show keyword count, industry count
- Visual indicator when selected
- Click to open sidebar in edit mode

**Props**:

```typescript
interface DiscoverySetCardProps {
  set: DiscoverySet;
  isSelected: boolean;
  onClick: () => void;
}
```

**Display**:

```
┌─────────────────────────────┐
│ Tech Founders               │
│                             │
│ Keywords: startup, founder  │
│ Mode: OR                    │
│ Industries: 3 selected      │
│                             │
│ Created: Feb 12, 2026       │
└─────────────────────────────┘
```

### DiscoverySetSidebar

**Location**: `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/discovery-sets/_components/DiscoverySetSidebar.tsx`

**Responsibilities**:

- Create/edit form with all search parameters
- Form validation via react-hook-form + Zod
- Industry multi-select with search
- Keywords input (add/remove chips)
- Excluded keywords input (add/remove chips)
- Save/Delete buttons

**Form Fields**:

```typescript
interface DiscoverySetFormData {
  name: string;
  keywords: string[];
  keywordsMode: "AND" | "OR";
  excluded: string[];
  authorJobTitle: string;
  authorIndustries: string[];
}
```

**Layout**:

```
┌────────────────────────────┐
│ [←] Create Discovery Set   │
├────────────────────────────┤
│ Name                       │
│ [________________________] │
│                            │
│ Keywords                   │
│ [startup ×] [founder ×]    │
│ [Add keyword...]           │
│                            │
│ Keyword Mode               │
│ (●) Match ANY (OR)         │
│ ( ) Match ALL (AND)        │
│                            │
│ Excluded Keywords          │
│ [hiring ×] [job ×]         │
│ [Add excluded...]          │
│                            │
│ Author Job Title           │
│ [CEO                     ] │
│                            │
│ Author Industries          │
│ [Search industries...    ] │
│ [Software Dev ×] [IT ×]    │
├────────────────────────────┤
│ [Delete]           [Save]  │
└────────────────────────────┘
```

### IndustrySelector

**Location**: `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/discovery-sets/_components/IndustrySelector.tsx`

**Responsibilities**:

- Searchable multi-select for 515 industries
- Group by category (Technology, Manufacturing, etc.)
- Show selected industries as removable chips
- Handle keyboard navigation

**Props**:

```typescript
interface IndustrySelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}
```

**Data Structure** (for grouping):

```typescript
interface IndustryGroup {
  category: string;
  industries: { code: string; name: string }[];
}
```

### KeywordsInput

**Location**: `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/discovery-sets/_components/KeywordsInput.tsx`

**Responsibilities**:

- Text input with "Enter" to add keyword
- Display keywords as removable chips
- Validate no duplicates
- Limit max keywords (20)

**Props**:

```typescript
interface KeywordsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}
```

---

## 8. Backend Endpoints and Workers

Not applicable - all data fetched via tRPC (no dedicated backend service or workers).

---

## 9. Infrastructure Deployment

No infrastructure changes required - deploys with existing Next.js app on Vercel.

---

## 10. Database Schema (Prisma-style)

### New Model: DiscoverySet

**Location**: `packages/db/prisma/models/discovery-set.prisma`

```prisma
model DiscoverySet {
  id               String   @id @default(dbgenerated("generate_ulid()"))
  accountId        String
  name             String
  keywords         String[]
  keywordsMode     String   @default("OR") // "AND" or "OR"
  excluded         String[]
  authorJobTitle   String?
  authorIndustries String[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  linkedInAccount LinkedInAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([accountId, createdAt])
}
```

### Updated Model: PostLoadSetting

**Location**: `packages/db/prisma/models/comment/post-load-setting.prisma`

```prisma
model PostLoadSetting {
  // ... existing fields ...

  // Discovery Sets (NEW)
  discoverySetEnabled Boolean  @default(false)
  discoverySetIds     String[]
}
```

### Updated Model: LinkedInAccount

**Add relation**:

```prisma
model LinkedInAccount {
  // ... existing fields ...
  discoverySets DiscoverySet[]
}
```

---

## 11. API Surface (tRPC)

**New Router**: `packages/api/src/router/discovery-set.ts`

### Procedures

#### `list`

**Auth**: `accountProcedure`

**Input**:

```typescript
{
  cursor?: string;
  limit?: number; // default 20
}
```

**Output**:

```typescript
{
  data: DiscoverySet[];
  next: string | null; // cursor for next page
}
```

#### `create`

**Auth**: `protectedProcedure`

**Input**:

```typescript
{
  accountId: string;
  name: string;
  keywords: string[];
  keywordsMode: 'AND' | 'OR';
  excluded: string[];
  authorJobTitle?: string;
  authorIndustries: string[];
}
```

**Output**: `DiscoverySet`

#### `update`

**Auth**: `protectedProcedure`

**Input**:

```typescript
{
  id: string;
  name?: string;
  keywords?: string[];
  keywordsMode?: 'AND' | 'OR';
  excluded?: string[];
  authorJobTitle?: string | null;
  authorIndustries?: string[];
}
```

**Output**: `DiscoverySet`

#### `delete`

**Auth**: `protectedProcedure`

**Input**: `{ id: string }`

**Output**: `{ success: boolean }`

#### `findById`

**Auth**: `protectedProcedure`

**Input**: `{ id: string }`

**Output**: `DiscoverySet | null`

#### `findByIds`

**Auth**: `protectedProcedure`

**Input**: `{ ids: string[] }`

**Output**: `DiscoverySet[]`

---

## 12. Real-time Event Model

Not applicable - no WebSocket or real-time updates. Data loads on page visit and settings sync.

---

## 13. Phased Delivery Plan

### Current Status

✅ **Phase 1**: Database Schema (COMPLETED)
✅ **Phase 2**: URL Builder Utility (COMPLETED)
✅ **Phase 3**: tRPC Router (COMPLETED)
✅ **Phase 4**: Zod Validators (COMPLETED)
✅ **Phase 5**: Discovery Sets Page Structure (COMPLETED)
✅ **Phase 6**: DiscoverySetCard & Grid (COMPLETED)
✅ **Phase 7**: DiscoverySetSidebar & Form (COMPLETED)
✅ **Phase 8**: Industry Selector Component (COMPLETED)
✅ **Phase 9**: Extension Settings Integration (COMPLETED)
✅ **Phase 10**: Multi-Tab Opening Logic (COMPLETED)
⏳ **Phase 11**: Responsive Design & Polish (PLANNED)
⏳ **Phase 12**: Testing & QA (PLANNED)

**Immediate Next Steps**: Phase 11 - Responsive Design & Polish

---

## 14. Features List (MoSCoW)

### Must-Have (M)

- [M-001] Create/Edit/Delete Discovery Sets via webapp
- [M-002] Store keywords array with AND/OR mode
- [M-003] Store excluded keywords array
- [M-004] Store optional author job title filter
- [M-005] Store author industries array (LinkedIn codes)
- [M-006] Card grid UI with infinite scroll
- [M-007] Right sidebar for create/edit form
- [M-008] Industry multi-select with search (515 options)
- [M-009] Keywords input with chip display
- [M-010] PostLoadSetting integration (enabled toggle + set IDs)
- [M-011] Extension settings UI for Discovery Sets
- [M-012] Multi-tab opening (one tab per selected set)
- [M-013] URL builder generates valid LinkedIn search URLs
- [M-014] Form validation (required name, valid inputs)

### Should-Have (S)

- [S-001] Industry grouping by category in selector
- [S-002] Preview of generated LinkedIn URL (copy button)
- [S-003] Loading skeletons during data fetch
- [S-004] Empty state when no discovery sets
- [S-005] Confirmation dialog for delete
- [S-006] Toast notifications for success/error
- [S-007] Keyboard shortcuts (Escape to close sidebar)

### Could-Have (C)

- [C-001] Duplicate discovery set action
- [C-002] Search/filter discovery sets by name
- [C-003] Sort discovery sets (name, date, etc.)
- [C-004] Bulk delete multiple sets
- [C-005] Import/export discovery sets as JSON
- [C-006] "Test" button to open search URL without saving

### Won't-Have (W)

- [W-001] Combined search URL for multiple sets
- [W-002] Real-time search result preview
- [W-003] Discovery set templates/presets
- [W-004] Cross-account sharing
- [W-005] Analytics on discovery set usage
- [W-006] Scheduling/automation

---

## 15. RFCs

### RFC-001: Database Schema & Migration

**Summary**: Create DiscoverySet model and add fields to PostLoadSetting.

**Dependencies**: None

**Stage 0: Pre-Phase Research**

1. Review existing model patterns (CommentStyle, TargetList)
2. Verify industries.json exists at packages/db/industries.json
3. Check LinkedInAccount relations pattern
4. Present findings to user

**Stage 1: Create DiscoverySet Model**

1. Create `packages/db/prisma/models/discovery-set.prisma`
2. Define all columns per schema specification
3. Add LinkedInAccount relation with cascade delete
4. Add indexes for accountId and accountId+createdAt

**Stage 2: Update PostLoadSetting**

1. Add `discoverySetEnabled Boolean @default(false)`
2. Add `discoverySetIds String[]`

**Stage 3: Update LinkedInAccount**

1. Add `discoverySets DiscoverySet[]` relation

**Stage 4: Generate & Apply Migration**

1. Run `pnpm db:generate` to update Prisma client
2. Run `pnpm db:migrate dev --name add-discovery-sets`
3. Verify migration SQL is correct
4. Apply to local database

**Post-Phase Testing**:

- [ ] DiscoverySet model visible in Prisma Studio
- [ ] PostLoadSetting has new fields
- [ ] Can create DiscoverySet record via Prisma client
- [ ] Cascade delete works (delete account → sets deleted)
- [ ] No TypeScript errors

**Acceptance Criteria**:

- [ ] Migration applied successfully
- [ ] All fields have correct types
- [ ] Indexes created
- [ ] Relations work correctly

**What's Functional Now**: Database ready to store discovery sets

**Ready For**: RFC-002 (URL Builder)

---

### RFC-002: LinkedIn Search URL Builder

**Summary**: Create utility function to build LinkedIn content search URLs from discovery set parameters.

**Dependencies**: RFC-001 (Database Schema)

**Stage 0: Pre-Phase Research**

1. Review existing `build-list-feed-url.ts` pattern
2. Analyze LinkedIn search URL format from user examples
3. Test URL parameter encoding requirements
4. Present findings to user

**Stage 1: Create URL Builder Function**

1. Create `packages/linkedin-automation/src/navigate/build-discovery-search-url.ts`
2. Define TypeScript interface for params:

```typescript
export interface DiscoverySearchParams {
  keywords: string[];
  keywordsMode: "AND" | "OR";
  excluded: string[];
  authorJobTitle?: string;
  authorIndustries?: string[];
}
```

3. Implement URL construction logic:
   - Build keywords string with AND/OR operators
   - Add NOT prefixes for excluded keywords
   - Encode authorJobTitle in quotes
   - Format authorIndustries as JSON array
   - Set origin=FACETED_SEARCH
   - Set sortBy=["date_posted"]

**Stage 2: Handle Edge Cases**

1. Empty keywords array → return base URL
2. Keywords with spaces → wrap in quotes
3. Special characters → URL encode
4. Empty excluded array → skip NOT section
5. No industries → omit authorIndustry param

**Stage 3: Export & Types**

1. Add export to package.json exports map
2. Export TypeScript types
3. Add JSDoc documentation

**Post-Phase Testing**:

```typescript
// Test cases
buildDiscoverySearchUrl({
  keywords: ["startup", "founder"],
  keywordsMode: "OR",
  excluded: ["hiring"],
  authorJobTitle: "CEO",
  authorIndustries: ["4", "6"],
});
// Expected: https://www.linkedin.com/search/results/content/?keywords=(startup OR founder) NOT hiring&authorJobTitle="CEO"&authorIndustry=["4","6"]&origin=FACETED_SEARCH&sortBy=["date_posted"]
```

**Acceptance Criteria**:

- [ ] Function generates valid LinkedIn URLs
- [ ] Keywords mode (AND/OR) handled correctly
- [ ] Excluded keywords have NOT prefix
- [ ] Industry codes formatted as JSON array
- [ ] URL encoding works for special characters
- [ ] TypeScript types exported correctly

**What's Functional Now**: URL builder ready to generate search URLs

**Ready For**: RFC-003 (tRPC Router)

---

### RFC-003: tRPC Discovery Set Router

**Summary**: Create tRPC router with CRUD procedures for discovery sets.

**Dependencies**: RFC-002 (URL Builder)

**Stage 0: Pre-Phase Research**

1. Review existing persona.ts router patterns
2. Understand accountProcedure vs protectedProcedure usage
3. Review pagination utility from packages/api/src/utils/pagination.ts
4. Present findings to user

**Stage 1: Create Router File**

1. Create `packages/api/src/router/discovery-set.ts`
2. Import necessary dependencies (createTRPCRouter, protectedProcedure, accountProcedure)
3. Set up router structure

**Stage 2: Implement Permission Helper**

1. Create `hasPermissionToManageDiscoverySet(userId, discoverySetId)`
2. Delegate to `hasPermissionToAccessAccount()`
3. Return status object pattern

**Stage 3: Implement Procedures**

1. `list` - accountProcedure with cursor pagination
2. `create` - protectedProcedure with permission check
3. `update` - protectedProcedure with permission check
4. `delete` - protectedProcedure with permission check
5. `findById` - protectedProcedure with permission check
6. `findByIds` - protectedProcedure with permission check (for extension)

**Stage 4: Register Router**

1. Add to `packages/api/src/router/root.ts`
2. Export discoverySet router

**Post-Phase Testing**:

- [ ] All procedures callable via tRPC playground
- [ ] Authorization prevents cross-account access
- [ ] Pagination returns correct cursor
- [ ] CRUD operations work correctly
- [ ] findByIds returns all requested sets

**Acceptance Criteria**:

- [ ] Router registered and accessible
- [ ] All procedures have correct auth
- [ ] Pagination works for large lists
- [ ] Permission checks prevent unauthorized access
- [ ] TypeScript types inferred correctly

**What's Functional Now**: API layer ready for frontend consumption

**Ready For**: RFC-004 (Zod Validators)

---

### RFC-004: Zod Validators

**Summary**: Create Zod schemas for discovery set validation.

**Dependencies**: RFC-003 (tRPC Router)

**Stage 1: Create Validator Schemas**

1. Add to `packages/validators/src/discovery-set.ts`:

```typescript
export const discoverySetCreateSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().min(1).max(100),
  keywords: z.array(z.string().min(1).max(100)).max(20).default([]),
  keywordsMode: z.enum(["AND", "OR"]).default("OR"),
  excluded: z.array(z.string().min(1).max(100)).max(20).default([]),
  authorJobTitle: z.string().max(100).optional(),
  authorIndustries: z.array(z.string()).max(50).default([]),
});

export const discoverySetUpdateSchema = discoverySetCreateSchema
  .omit({ accountId: true })
  .partial()
  .extend({ id: z.string().min(1) });
```

**Stage 2: Export Validators**

1. Add exports to `packages/validators/src/index.ts`
2. Use in tRPC router procedures

**Post-Phase Testing**:

- [ ] Valid data passes validation
- [ ] Invalid data rejected with clear errors
- [ ] Array limits enforced
- [ ] Optional fields work correctly

**Acceptance Criteria**:

- [ ] All schemas defined and exported
- [ ] tRPC procedures use validators
- [ ] Error messages are user-friendly

**What's Functional Now**: Input validation complete

**Ready For**: RFC-005 (Page Structure)

---

### RFC-005: Discovery Sets Page Structure

**Summary**: Create the discovery sets page with basic layout following Personas pattern.

**Dependencies**: RFC-004 (Zod Validators)

**Stage 0: Pre-Phase Research**

1. Read Personas page.tsx structure
2. Understand layout patterns (header, grid, sidebar)
3. Review infinite query setup
4. Present findings to user

**Stage 1: Create Page File**

1. Create `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/discovery-sets/page.tsx`
2. Set up basic page structure with header
3. Add "Create Discovery Set" button

**Stage 2: Implement Data Fetching**

1. Set up infinite query for discovery sets
2. Implement flatMap for paginated data
3. Add loading state

**Stage 3: Implement Layout**

1. Header section with title and create button
2. Main content area for card grid
3. Sidebar container (initially hidden)
4. Delete confirmation dialog

**Stage 4: Add to Navigation**

1. Add "Discovery Sets" to sidebar navigation
2. Add appropriate icon (Search or similar)

**Post-Phase Testing**:

- [ ] Page accessible at correct URL
- [ ] Navigation link works
- [ ] Infinite query fetches data
- [ ] Loading state shows correctly
- [ ] Basic layout renders

**Acceptance Criteria**:

- [ ] Page renders without errors
- [ ] Navigation item visible
- [ ] Data fetching works
- [ ] Layout matches Personas structure

**What's Functional Now**: Page skeleton ready

**Ready For**: RFC-006 (Card Component)

---

### RFC-006: DiscoverySetCard & Grid

**Summary**: Create card component and grid layout for displaying discovery sets.

**Dependencies**: RFC-005 (Page Structure)

**Stage 1: Create Card Component**

1. Create `_components/DiscoverySetCard.tsx`
2. Display: name, keyword count, industry count, created date
3. Add selected state styling
4. Implement click handler

**Stage 2: Create Grid Layout**

1. Implement responsive grid (1-4 columns based on viewport)
2. Use CSS Grid with gap
3. Add infinite scroll trigger

**Stage 3: Integrate with Page**

1. Map discovery sets to cards
2. Handle card selection
3. Open sidebar on card click

**Post-Phase Testing**:

- [ ] Cards display correct information
- [ ] Grid responsive on all breakpoints
- [ ] Selected state visually distinct
- [ ] Infinite scroll loads more data

**Acceptance Criteria**:

- [ ] Cards render with all data
- [ ] Responsive grid works
- [ ] Selection triggers sidebar
- [ ] Neobrutalist styling applied

**What's Functional Now**: Discovery sets visible in card grid

**Ready For**: RFC-007 (Sidebar & Form)

---

### RFC-007: DiscoverySetSidebar & Form

**Summary**: Create sidebar with create/edit form for discovery sets.

**Dependencies**: RFC-006 (Card Component)

**Stage 0: Pre-Phase Research**

1. Read PersonaSidebar.tsx implementation
2. Understand form patterns with react-hook-form
3. Review Controller usage for custom inputs
4. Present findings to user

**Stage 1: Create Sidebar Component**

1. Create `_components/DiscoverySetSidebar.tsx`
2. Implement open/close with animation
3. Add header with mode indicator (Create/Edit)
4. Add footer with action buttons

**Stage 2: Implement Form**

1. Set up react-hook-form with zodResolver
2. Add name input field
3. Add keywordsMode radio group
4. Add authorJobTitle input

**Stage 3: Create Keywords Input Component**

1. Create `_components/KeywordsInput.tsx`
2. Implement chip display for keywords
3. Add input for new keywords
4. Handle Enter key to add
5. Handle X click to remove

**Stage 4: Integrate with Page**

1. Connect form to create/update mutations
2. Handle form reset on mode change
3. Implement delete with confirmation

**Post-Phase Testing**:

- [ ] Sidebar opens/closes smoothly
- [ ] Form validation works
- [ ] Create mutation saves correctly
- [ ] Update mutation saves changes
- [ ] Delete removes set

**Acceptance Criteria**:

- [ ] Form renders all fields
- [ ] Validation messages display
- [ ] CRUD operations work
- [ ] Sidebar transitions smooth

**What's Functional Now**: Full CRUD via sidebar form (except industries)

**Ready For**: RFC-008 (Industry Selector)

---

### RFC-008: Industry Selector Component

**Summary**: Create searchable multi-select component for 515 LinkedIn industries.

**Dependencies**: RFC-007 (Sidebar & Form)

**Stage 0: Pre-Phase Research**

1. Review industries.json structure
2. Analyze shadcn/ui Command component
3. Plan category grouping logic
4. Present findings to user

**Stage 1: Create Industry Data Structure**

1. Create `_components/industry-data.ts`
2. Import industries.json
3. Organize into category groups
4. Export typed data structure

**Stage 2: Create Industry Selector Component**

1. Create `_components/IndustrySelector.tsx`
2. Use Popover + Command pattern from shadcn/ui
3. Implement search filtering
4. Group by category with headers

**Stage 3: Implement Multi-Select**

1. Track selected industries state
2. Toggle selection on item click
3. Display selected as chips below input
4. Handle remove from chips

**Stage 4: Integrate with Form**

1. Use Controller from react-hook-form
2. Bind value and onChange
3. Test form submission with industries

**Post-Phase Testing**:

- [ ] All 515 industries searchable
- [ ] Categories display correctly
- [ ] Multi-select works
- [ ] Chips display and removable
- [ ] Form includes selected industries

**Acceptance Criteria**:

- [ ] Search finds industries by name
- [ ] Categories group industries
- [ ] Selection persists in form
- [ ] Keyboard navigation works

**What's Functional Now**: Complete form with all fields

**Ready For**: RFC-009 (Extension Settings)

---

### RFC-009: Extension Settings Integration

**Summary**: Add Discovery Sets section to extension settings and update settings store.

**Dependencies**: RFC-008 (Industry Selector)

**Stage 0: Pre-Phase Research**

1. Read settings-db-store.ts patterns
2. Review TargetListSelector component
3. Understand updatePostLoad flow
4. Present findings to user

**Stage 1: Update Settings Store Types**

1. Update PostLoadSettingDB interface
2. Add discoverySetEnabled and discoverySetIds
3. Update fetchSettings to include new fields

**Stage 2: Update Settings API**

1. Ensure postLoad.upsert handles new fields
2. Test settings save/load with new fields

**Stage 3: Create Discovery Set Selector UI**

1. Create DiscoverySetSelector component in extension
2. Fetch available sets via tRPC
3. Implement checkbox multi-select
4. Handle enable/disable toggle

**Stage 4: Integrate into Settings Sheet**

1. Add Discovery Sets section
2. Show toggle and selector
3. Wire up to updatePostLoad

**Post-Phase Testing**:

- [ ] Settings persist to database
- [ ] Toggle enables/disables feature
- [ ] Selected sets saved correctly
- [ ] Settings load on extension open

**Acceptance Criteria**:

- [ ] New fields in settings store
- [ ] UI shows discovery sets
- [ ] Selection persists
- [ ] Optimistic updates work

**What's Functional Now**: Extension can enable and select discovery sets

**Ready For**: RFC-010 (Multi-Tab Opening)

---

### RFC-010: Multi-Tab Opening Logic

**Summary**: Implement logic to open multiple LinkedIn search tabs for selected discovery sets.

**Dependencies**: RFC-009 (Extension Settings)

**Stage 0: Pre-Phase Research**

1. Review existing target list tab opening
2. Understand browser.tabs.create API
3. Plan tab management (limits, order)
4. Present findings to user

**Stage 1: Fetch Selected Sets on Trigger**

1. When "Load Posts" triggered, check discoverySetEnabled
2. If enabled, fetch sets by discoverySetIds via findByIds
3. Handle empty selection gracefully

**Stage 2: Generate URLs**

1. Import buildDiscoverySearchUrl from linkedin-automation
2. Map each set to its search URL
3. Log URLs for debugging

**Stage 3: Open Tabs**

1. For each URL, call browser.tabs.create
2. Open in background (not active)
3. Limit to reasonable number (e.g., max 5 tabs)
4. Show warning if more than limit selected

**Stage 4: Handle Edge Cases**

1. No sets selected → show message
2. Too many sets → show warning, open first N
3. Extension popup closes → tabs still open
4. Tab creation fails → error handling

**Post-Phase Testing**:

- [ ] Single set opens one tab
- [ ] Multiple sets open multiple tabs
- [ ] URLs are correct
- [ ] Tab limit enforced
- [ ] Errors handled gracefully

**Acceptance Criteria**:

- [ ] Tabs open on trigger
- [ ] Each tab has correct URL
- [ ] Limit prevents tab overload
- [ ] Works across browsers

**What's Functional Now**: Full extension integration complete

**Ready For**: RFC-011 (Polish)

---

### RFC-011: Responsive Design & Polish

**Summary**: Finalize responsive behavior, accessibility, and visual polish.

**Dependencies**: RFC-010 (Multi-Tab Opening)

**Stage 1: Mobile Responsive Audit**

1. Test on various viewport sizes
2. Fix card grid spacing on mobile
3. Ensure sidebar works on mobile
4. Test industry selector on mobile

**Stage 2: Accessibility**

1. Add ARIA labels
2. Test keyboard navigation
3. Ensure focus management
4. Verify color contrast

**Stage 3: Visual Polish**

1. Verify neobrutalist theme consistency
2. Check loading states
3. Polish animations/transitions
4. Add empty states

**Stage 4: Error Handling**

1. Network error states
2. Validation error display
3. Toast notifications

**Post-Phase Testing**:

- [ ] Works on mobile/tablet/desktop
- [ ] Keyboard navigation complete
- [ ] All states handled gracefully
- [ ] No console errors

**Acceptance Criteria**:

- [ ] Fully responsive
- [ ] Accessible (WCAG AA)
- [ ] Polished UI
- [ ] Error states handled

**What's Functional Now**: Production-ready UI

**Ready For**: RFC-012 (Testing)

---

### RFC-012: Testing & QA

**Summary**: Comprehensive testing coverage for discovery sets feature.

**Dependencies**: RFC-011 (Responsive Design)

**Stage 1: Unit Tests**

1. Test URL builder function
2. Test industry grouping logic
3. Test form validation schemas

**Stage 2: Integration Tests**

1. Test tRPC procedures
2. Test settings sync
3. Test form submission flow

**Stage 3: Manual QA**

1. Test complete user flow (webapp)
2. Test extension flow
3. Test edge cases
4. Cross-browser testing

**Stage 4: Bug Fixes**

1. Document and prioritize bugs
2. Fix critical issues
3. Create tickets for minor issues

**Post-Phase Testing**:

- [ ] All tests pass
- [ ] No critical bugs
- [ ] Feature works end-to-end

**Acceptance Criteria**:

- [ ] Unit test coverage >80%
- [ ] Integration tests pass
- [ ] Manual QA approved
- [ ] Ready for production

**What's Functional Now**: Feature fully tested and ready

**Ready For**: Production Deployment

---

## 16. Rules (for this project)

### Tech Stack

- **Frontend**: React 18, Next.js 15 (App Router), TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (neobrutalist theme)
- **Forms**: react-hook-form, Zod
- **Data Fetching**: tRPC, React Query
- **Database**: Prisma ORM, PostgreSQL (Supabase)
- **Extension**: WXT framework, Zustand stores

### Code Standards

- Follow existing codebase conventions
- TypeScript strict mode (no `any` types)
- Prefer functional components with hooks
- Use named exports (no default except page.tsx)
- Destructure props in component signature

### Architecture Patterns

- tRPC procedures return plain objects
- Co-locate components in `_components/` folder
- Tailwind utilities first
- Follow existing Personas pattern for UI

### Performance

- Infinite query for lists (not load-all)
- Memoize expensive computations
- Lazy load heavy components

### Security

- All procedures require authentication
- Validate account ownership
- Sanitize all user input via Zod

---

## 17. Verification (Comprehensive Review)

### Gap Analysis

**Addressed**:

- Database schema fully specified
- URL builder logic detailed
- Extension integration planned
- UI components mapped to existing patterns

**Minor Gaps** (acceptable for V1):

- Exact toast message text (left to implementation)
- Specific animation durations (use Tailwind defaults)
- Error message wording (use existing patterns)

### Quality Assessment

| Criteria            | Score   | Reason                                         |
| ------------------- | ------- | ---------------------------------------------- |
| **Completeness**    | 95/100  | All must-have features specified               |
| **Clarity**         | 90/100  | Clear patterns from existing code              |
| **Feasibility**     | 100/100 | All features implementable with existing stack |
| **Maintainability** | 95/100  | Follows established codebase patterns          |

---

## 18. Change Management

**Change Request Process**:

1. Classify change (New feature, Modify, Remove, Scope change)
2. Analyze impact (Components affected, Timeline)
3. Determine strategy (Immediate, Schedule, Defer)
4. Update plan sections
5. Communicate decision

---

## 19. Ops Runbook

### Deployment

**Pre-Deployment**:

- [ ] All RFCs completed
- [ ] Tests passing
- [ ] Database migration tested on staging
- [ ] Manual QA approved

**Deployment Steps**:

1. Create feature branch: `feature/discovery-sets`
2. Implement RFCs 1-12 in order
3. Submit PR with screenshots
4. Code review (2 approvals)
5. Merge to main
6. Deploy to staging
7. Run smoke tests
8. Deploy to production

### Rollback

- Revert PR if critical bug
- Migration is additive (safe to keep)
- No data loss risk

---

## 20. Acceptance Criteria (Versioned)

### V1.0 (MVP Launch)

**Functional**:

- [ ] Create/Edit/Delete discovery sets via webapp
- [ ] Keywords with AND/OR mode
- [ ] Excluded keywords
- [ ] Author job title filter
- [ ] Author industries multi-select
- [ ] Card grid with infinite scroll
- [ ] Sidebar form with validation
- [ ] Industry selector with search
- [ ] Extension settings toggle
- [ ] Extension set selector
- [ ] Multi-tab opening on trigger

**Non-Functional**:

- [ ] Page load <3s
- [ ] Responsive on mobile/tablet/desktop
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] No console errors

---

## 21. Future Work

### Post-V1 Enhancements

**Phase 2**:

- URL preview with copy button
- Duplicate discovery set
- Search/filter sets by name
- Analytics on set usage

**Phase 3**:

- Combined search URL option
- Discovery set templates
- Import/export as JSON
- Integration with comment workflow

---

## Implementation Checklist (Complete Workflow)

**Phase 1: Database Schema** ✅ COMPLETED

- [x] Create discovery-set.prisma model file
- [x] Add fields to PostLoadSetting (discoverySetEnabled, discoverySetIds)
- [x] Update LinkedInAccount relations
- [x] Generate and apply migration
- [x] Note: Fixed ID generation to use application-side ULID (generate_ulid() DB function doesn't exist)

**Phase 2: URL Builder** ✅ COMPLETED

- [x] Create build-discovery-search-url.ts in linkedin-automation package
- [x] Implement URL construction logic (keywords AND/OR, excluded, authorJobTitle, authorIndustries)
- [x] Handle edge cases
- [x] Export types and function

**Phase 3: tRPC Router** ✅ COMPLETED

- [x] Create discovery-set.ts router
- [x] Implement permission helper (hasPermissionToManageDiscoverySet)
- [x] Implement all procedures (create, list, findById, update, delete)
- [x] Register in root.ts

**Phase 4: Validators** ✅ COMPLETED

- [x] Create Zod schemas (discoverySetCreateSchema, discoverySetUpdateSchema)
- [x] Export from @sassy/db/schema-validators
- [x] Applied to tRPC procedures
- [x] Note: Used auto-generated Prisma schemas with .omit() and .pick()

**Phase 5: Page Structure** ✅ COMPLETED

- [x] Create page.tsx at /[orgSlug]/[accountSlug]/discovery-sets/
- [x] Set up infinite query
- [x] Implement basic layout (card grid + sidebar)
- [x] Add navigation item to sidebar

**Phase 6: Card & Grid** ✅ COMPLETED

- [x] Create DiscoverySetCard component
- [x] Implement responsive grid
- [x] Add infinite scroll
- [x] Integrate with page
- [x] Delete confirmation dialog

**Phase 7: Sidebar & Form** ✅ COMPLETED

- [x] Create DiscoverySetSidebar
- [x] Implement form with react-hook-form + Zod
- [x] Create KeywordsInput component
- [x] Connect to mutations
- [x] Note: Fixed Select vs RadioGroup (RadioGroup doesn't exist in shadcn/ui)
- [x] Note: Fixed authorJobTitle type (undefined → null)

**Phase 8: Industry Selector** ✅ COMPLETED

- [x] Create IndustrySelector component with Command pattern
- [x] Implement infinite scroll for loading 515 industries
- [x] Implement multi-select with chips
- [x] Integrate with form
- [x] Fixed search: Replaced broken FlexSearch worker with simple filter-based search
- [x] Search now correctly finds "Marketing Services" and all industries

**Phase 9: Extension Settings** ✅ COMPLETED

- [x] Update settings store defaults (discoverySetEnabled, discoverySetIds)
- [x] Create DiscoverySetSelector UI component
- [x] Integrate into SettingsSheet
- [x] Test persistence
- [x] Optimized preview to use cached list data instead of extra API call

**Phase 10: Multi-Tab Opening** ✅ COMPLETED

- [x] Fetch selected sets on trigger (via findByIds in useLoadPosts)
- [x] Generate URLs via builder (buildDiscoverySearchUrl)
- [x] Implement tab opening (openTabViaBackground)
- [x] Handle edge cases (graceful fallback if sets not found)

**Phase 11: Polish** ⏳ PLANNED

- [ ] Mobile responsive audit
- [ ] Accessibility improvements
- [ ] Visual polish
- [ ] Error handling

**Phase 12: Testing** ⏳ PLANNED

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual QA
- [ ] Bug fixes

**Total Estimated Time**: 20-24 hours (3-4 days)

---

## Cursor + RIPER-5 Guidance

### Cursor Plan Mode

**Import Checklist**: Copy RFC implementation checklists directly into Cursor Plan mode for step-by-step execution.

**Workflow**:

1. Start with RFC-001 (Database Schema)
2. Execute each checklist item sequentially
3. After each RFC, update status strip in this plan file
4. Reattach this plan to future sessions for context

### RIPER-5 Mode

**Mode Sequence**:

1. **RESEARCH**: ✅ Complete (Personas pattern, Target List pattern, industries.json analyzed)
2. **INNOVATE**: ✅ Complete (Separate columns, multi-tab, linkedin-automation package decided)
3. **PLAN**: ✅ Complete - Plan approved and in execution
4. **EXECUTE**: 🚧 IN PROGRESS (RFC-001 through RFC-008 completed)
5. **REVIEW**: Pending (after all RFCs complete)

**Current Progress (EXECUTE Mode)**:

- ✅ RFC-001: Database Schema (fixed ULID generation)
- ✅ RFC-002: URL Builder (build-discovery-search-url.ts)
- ✅ RFC-003: tRPC Router (discovery-set.ts)
- ✅ RFC-004: Zod Validators (schema-validators.ts)
- ✅ RFC-005: Page Structure (page.tsx + navigation)
- ✅ RFC-006: Card & Grid (DiscoverySetCard)
- ✅ RFC-007: Sidebar & Form (DiscoverySetSidebar, KeywordsInput)
- ✅ RFC-008: Industry Selector (IndustrySelector with fixed search)
- ✅ RFC-009: Extension Settings (selector UI, caching optimization)
- ✅ RFC-010: Multi-Tab Opening (useLoadPosts integration)
- ⏳ RFC-011: Polish
- ⏳ RFC-012: Testing

**Key Fixes Applied During Execution**:

1. Database: Removed `generate_ulid()` default (function doesn't exist), using application-side ULID via `ulid()` from `ulidx`
2. Validators: Used auto-generated Prisma schemas instead of manual Zod definitions
3. Form: Changed RadioGroup to Select component (RadioGroup doesn't exist)
4. Form: Fixed authorJobTitle type (undefined → null for Prisma compatibility)
5. Search: Replaced broken FlexSearch worker with simple filter-based search

---

**Next Step**: Complete RFC-009 (DiscoverySetSelector UI in extension), then RFC-010 (multi-tab opening logic).
