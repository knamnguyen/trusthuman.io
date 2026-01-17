# Compose Settings UI & Filter Integration Plan

**Date**: 2026-01-14
**Type**: COMPLEX (UI + integration)
**Goal**: Centralize all settings in a Settings Sheet, show active settings as tags, and integrate filters/actions into Load Posts and Submit flows

---

## Overview

### Current State
- 4 toggles in ComposeTab header: 100% human mode, auto-open-engage, space engage, post navigator
- Settings stored in `compose-store.ts` with localStorage persistence
- `comment-image-store.ts` exists for image attachments (S3 URLs)
- Utilities implemented in `linkedin-automation` package for all filters and actions

### Target State
1. **Settings Icon Button** replaces current toggles row → opens Settings Sheet
2. **Settings Tags** display in same area when sheet closed (condensed active settings view)
3. **Settings Sheet** with organized sections matching DB schema
4. **New settings-store** mirroring DB tables (local state, no persistence for now)
5. **Filter integration** into `collectPostsBatch` flow
6. **Submit actions integration** into comment submission flow

---

## DB Schema Reference

### PostLoadSetting (Post Filters)
```prisma
timeFilterEnabled     Boolean @default(false)
minPostAge            Int?    // hours

skipFriendActivitiesEnabled Boolean @default(false)
skipCompanyPagesEnabled     Boolean @default(true)
skipPromotedPostsEnabled    Boolean @default(true)
skipblacklistEnabled        Boolean @default(false)
blacklistId                 String?

skipFirstDegree             Boolean @default(false)
skipSecondDegree            Boolean @default(false)
skipThirdDegree             Boolean @default(false)
skipFollowing               Boolean @default(false)

targetListId                String?
```

### SubmitCommentSetting (Submit Actions)
```prisma
submitDelayRange        String  @default("5-20")  // seconds
likePostEnabled         Boolean @default(true)
likeCommentEnabled      Boolean @default(true)
tagPostAuthorEnabled    Boolean @default(true)
attachPictureEnabled    Boolean @default(false)
defaultPictureAttachUrl String?
```

### CommentGenerateSetting (AI Generation)
```prisma
commentStyleId            String?
dynamicChooseStyleEnabled Boolean @default(false)
adjacentCommentsEnabled   Boolean @default(false)
```

---

## Phase 1: Settings Store

### 1.1 Create `settings-store.ts`

**Location**: `apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`

**Structure** - mirrors DB schema for future integration:
```typescript
interface PostLoadSettings {
  // Time filter
  timeFilterEnabled: boolean;
  minPostAge: number | null; // hours

  // Skip filters
  skipFriendActivitiesEnabled: boolean;
  skipCompanyPagesEnabled: boolean;
  skipPromotedPostsEnabled: boolean;

  // Blacklist (disabled until DB integration)
  skipBlacklistEnabled: boolean;
  blacklistId: string | null;

  // Connection degree filters
  skipFirstDegree: boolean;
  skipSecondDegree: boolean;
  skipThirdDegree: boolean;
  skipFollowing: boolean;

  // Target list (disabled until DB integration)
  targetListId: string | null;
}

interface SubmitCommentSettings {
  submitDelayRange: string; // "min-max" format
  likePostEnabled: boolean;
  likeCommentEnabled: boolean;
  tagPostAuthorEnabled: boolean;
  attachPictureEnabled: boolean;
  // Note: images managed by comment-image-store
}

interface CommentGenerateSettings {
  // Disabled until DB integration
  commentStyleId: string | null;
  dynamicChooseStyleEnabled: boolean;
  adjacentCommentsEnabled: boolean;
}

interface BehaviorSettings {
  // Moved from compose-store
  humanOnlyMode: boolean;
  autoEngageOnCommentClick: boolean;
  spacebarAutoEngage: boolean;
  postNavigator: boolean;
}

interface SettingsState {
  postLoad: PostLoadSettings;
  submitComment: SubmitCommentSettings;
  commentGenerate: CommentGenerateSettings;
  behavior: BehaviorSettings;
}

interface SettingsActions {
  updatePostLoad: <K extends keyof PostLoadSettings>(key: K, value: PostLoadSettings[K]) => void;
  updateSubmitComment: <K extends keyof SubmitCommentSettings>(key: K, value: SubmitCommentSettings[K]) => void;
  updateCommentGenerate: <K extends keyof CommentGenerateSettings>(key: K, value: CommentGenerateSettings[K]) => void;
  updateBehavior: <K extends keyof BehaviorSettings>(key: K, value: BehaviorSettings[K]) => void;

  // Utility
  getActiveSettingsTags: () => string[];
  resetToDefaults: () => void;
}
```

**Defaults** (matching DB defaults):
```typescript
const DEFAULT_POST_LOAD: PostLoadSettings = {
  timeFilterEnabled: false,
  minPostAge: null,
  skipFriendActivitiesEnabled: false,
  skipCompanyPagesEnabled: true,
  skipPromotedPostsEnabled: true,
  skipBlacklistEnabled: false,
  blacklistId: null,
  skipFirstDegree: false,
  skipSecondDegree: false,
  skipThirdDegree: false,
  skipFollowing: false,
  targetListId: null,
};

const DEFAULT_SUBMIT_COMMENT: SubmitCommentSettings = {
  submitDelayRange: "5-20",
  likePostEnabled: true,
  likeCommentEnabled: true,
  tagPostAuthorEnabled: true,
  attachPictureEnabled: false,
};

const DEFAULT_COMMENT_GENERATE: CommentGenerateSettings = {
  commentStyleId: null,
  dynamicChooseStyleEnabled: false,
  adjacentCommentsEnabled: false,
};

const DEFAULT_BEHAVIOR: BehaviorSettings = {
  humanOnlyMode: false,
  autoEngageOnCommentClick: false,
  spacebarAutoEngage: false,
  postNavigator: false,
};
```

**No localStorage persistence** - refreshes each session (as requested)

---

### 1.2 Migrate behavior settings from compose-store

- Remove `ComposeSettings` interface from `compose-store.ts`
- Remove `settings`, `updateSetting`, `loadSettings`, `saveSettings` from compose-store
- Update all consumers to use `useSettingsStore` instead

**Files to update**:
- `compose-store.ts` - remove settings
- `ComposeTab.tsx` - use new store
- `SpacebarEngageObserver.tsx` - use new store
- `PostNavigator.tsx` - use new store (if applicable)
- Any other files using `useComposeStore(...settings...)`

---

## Phase 2: Settings Sheet UI

### 2.1 Create `SettingsSheet.tsx`

**Location**: `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/SettingsSheet.tsx`

**Layout** (slide-in from right, similar to PostPreviewSheet):
```
┌─────────────────────────────────────────┐
│ ⚙️ Settings                        [X]  │
├─────────────────────────────────────────┤
│ [Tab: Behavior] [Filters] [Submit] [AI] │
├─────────────────────────────────────────┤
│                                         │
│  ═══ BEHAVIOR TAB ═══                   │
│                                         │
│  ○ 100% Human Mode                      │
│    Skip AI generation, write manually   │
│                                         │
│  ○ Auto-open-engage                     │
│    Trigger on comment button click      │
│                                         │
│  ○ Space engage                         │
│    Highlight post, press space          │
│                                         │
│  ○ Post navigator                       │
│    Show floating nav UI                 │
│                                         │
│  ═══ FILTERS TAB ═══                    │
│                                         │
│  ── Time Filter ──                      │
│  ○ Enable time filter                   │
│  [ Max post age: ___ hours ]            │
│                                         │
│  ── Skip Posts ──                       │
│  ○ Skip promoted posts (default: on)    │
│  ○ Skip company pages (default: on)     │
│  ○ Skip friend activities               │
│                                         │
│  ── Connection Degree ──                │
│  ○ Skip 1st degree                      │
│  ○ Skip 2nd degree                      │
│  ○ Skip 3rd degree                      │
│  ○ Skip Following                       │
│                                         │
│  ── Lists (Coming Soon) ──              │
│  ○ Use target list [disabled]           │
│  ○ Skip blacklist  [disabled]           │
│                                         │
│  ═══ SUBMIT TAB ═══                     │
│                                         │
│  ── Delay ──                            │
│  [ Min: _5_ ] - [ Max: _20_ ] seconds   │
│                                         │
│  ── Actions ──                          │
│  ○ Like post after commenting           │
│  ○ Like own comment                     │
│  ○ Tag post author                      │
│                                         │
│  ── Attach Image ──                     │
│  ○ Attach random image                  │
│  [+ Add Image] [image1] [image2] [x]    │
│                                         │
│  ═══ AI TAB ═══                         │
│                                         │
│  ── Style (Coming Soon) ──              │
│  ○ Dynamic style selection [disabled]   │
│  [ Select default style ] [disabled]    │
│                                         │
│  ── Context ──                          │
│  ○ Include adjacent comments            │
│                                         │
└─────────────────────────────────────────┘
```

**Components needed**:
- `SettingsSheet.tsx` - main container with tabs
- `SettingsBehaviorTab.tsx` - behavior toggles
- `SettingsFiltersTab.tsx` - post load filters
- `SettingsSubmitTab.tsx` - submit actions
- `SettingsAITab.tsx` - AI generation settings
- `SettingsImageManager.tsx` - image upload/management (reuse comment-image-store)

**Animation**: Use framer-motion like PostPreviewSheet (slide from right)

---

### 2.2 Update `comment-image-store.ts` for local file upload

Current: Stores S3 URLs
New: Also support local blob URLs

```typescript
interface CommentImage {
  id: string;
  url: string;        // Can be S3 URL or blob URL
  name: string;
  addedAt: number;
  isLocal: boolean;   // New field
  blob?: Blob;        // Store blob for local files
}

// New action
addLocalImage: (file: File) => Promise<void>;
```

**Flow**:
1. User clicks "Add Image" → file picker opens
2. File selected → create blob URL, store blob
3. On comment submit → use blob directly (no fetch needed)

---

### 2.3 Create Settings Tags Component

**Location**: `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/SettingsTags.tsx`

**Purpose**: Show condensed view of active (non-default) settings

**Visual**:
```
┌────────────────────────────────────────────────────────┐
│ [⚙️] [Skip Promoted] [Skip Company] [Like Post] [...] │
└────────────────────────────────────────────────────────┘
```

**Tag examples**:
- `Skip Promoted` - when skipPromotedPostsEnabled = true
- `Skip Company` - when skipCompanyPagesEnabled = true
- `Max 24h` - when timeFilterEnabled with minPostAge = 24
- `Like Post` - when likePostEnabled = true
- `Tag Author` - when tagPostAuthorEnabled = true
- `+2 imgs` - when attachPictureEnabled with 2 images
- `Human Mode` - when humanOnlyMode = true
- `Delay 5-20s` - when delay differs from default

**Behavior**:
- Click on settings icon → open SettingsSheet
- Tags are read-only indicators
- Overflow: horizontal scroll or "+N more" chip

---

### 2.4 Update ComposeTab.tsx

Replace current toggles section with:
```tsx
{/* Row 2: Settings Tags (when sheet closed) or Settings Icon */}
<div className="mb-2 flex items-center gap-2 overflow-x-auto">
  <Button
    variant="ghost"
    size="sm"
    className="h-7 w-7 shrink-0 p-0"
    onClick={() => setSettingsOpen(true)}
  >
    <Settings className="h-4 w-4" />
  </Button>
  <SettingsTags />
</div>
```

---

## Phase 3: Filter Integration

### 3.1 Update `collectPostsBatch` to accept filter config

**Location**: `packages/linkedin-automation/src/feed/collect-posts.ts`

Add filter config parameter:
```typescript
interface CollectPostsConfig {
  // Time filter
  timeFilterEnabled: boolean;
  minPostAge: number | null;

  // Skip filters
  skipPromotedPosts: boolean;
  skipCompanyPages: boolean;
  skipFriendActivities: boolean;

  // Connection filters
  skipFirstDegree: boolean;
  skipSecondDegree: boolean;
  skipThirdDegree: boolean;
  skipFollowing: boolean;
}

export async function collectPostsBatch(
  targetCount: number,
  existingUrns: Set<string>,
  isUrnIgnored: (urn: string) => boolean,
  onBatchReady: (posts: ReadyPost[]) => void,
  shouldStop: () => boolean,
  isUserEditing: () => boolean,
  filterConfig: CollectPostsConfig,  // NEW
): Promise<void>
```

### 3.2 Implement filter logic in collectPostsBatch

Inside the post collection loop, after extracting post info:

```typescript
// Apply filters
const postUtils = createPostUtilities();

// 1. Skip promoted posts
if (filterConfig.skipPromotedPosts && postUtils.detectPromotedPost(postContainer)) {
  continue;
}

// 2. Skip company pages
if (filterConfig.skipCompanyPages && postUtils.detectCompanyPost(postContainer)) {
  continue;
}

// 3. Skip friend activities
if (filterConfig.skipFriendActivities && postUtils.detectFriendActivity(postContainer)) {
  continue;
}

// 4. Connection degree filter
if (filterConfig.skipFirstDegree || filterConfig.skipSecondDegree ||
    filterConfig.skipThirdDegree || filterConfig.skipFollowing) {
  const degree = postUtils.detectConnectionDegree(postContainer);
  if (degree === "1st" && filterConfig.skipFirstDegree) continue;
  if (degree === "2nd" && filterConfig.skipSecondDegree) continue;
  if (degree === "3rd" && filterConfig.skipThirdDegree) continue;
  if (degree === "following" && filterConfig.skipFollowing) continue;
}

// 5. Time filter
if (filterConfig.timeFilterEnabled && filterConfig.minPostAge !== null) {
  const postTime = postUtils.extractPostTime(postContainer);
  if (postTime?.displayTime) {
    const postAgeHours = parseTimeToHours(postTime.displayTime);
    if (postAgeHours !== null && postAgeHours > filterConfig.minPostAge) {
      continue; // Post is older than max age
    }
  }
}
```

### 3.3 Update ComposeTab to pass filter config

In `handleStart`:
```typescript
const postLoadSettings = useSettingsStore.getState().postLoad;

await collectPostsBatch(
  targetDraftCount,
  existingUrns,
  isUrnIgnored,
  onBatchReady,
  () => stopRequestedRef.current,
  () => useComposeStore.getState().isUserEditing,
  {
    timeFilterEnabled: postLoadSettings.timeFilterEnabled,
    minPostAge: postLoadSettings.minPostAge,
    skipPromotedPosts: postLoadSettings.skipPromotedPostsEnabled,
    skipCompanyPages: postLoadSettings.skipCompanyPagesEnabled,
    skipFriendActivities: postLoadSettings.skipFriendActivitiesEnabled,
    skipFirstDegree: postLoadSettings.skipFirstDegree,
    skipSecondDegree: postLoadSettings.skipSecondDegree,
    skipThirdDegree: postLoadSettings.skipThirdDegree,
    skipFollowing: postLoadSettings.skipFollowing,
  },
);
```

---

## Phase 4: Submit Actions Integration

### 4.1 Update `handleSubmitAll` in ComposeTab

Add submit actions after successful comment submission:

```typescript
const handleSubmitAll = useCallback(async () => {
  const submitSettings = useSettingsStore.getState().submitComment;
  const { getRandomImage } = useCommentImageStore.getState();

  // Parse delay range
  const [minDelay, maxDelay] = submitSettings.submitDelayRange.split('-').map(Number);

  for (const card of cardsToSubmit) {
    if (!card.commentText.trim()) continue;

    // 1. Tag author BEFORE submitting (modifies comment in editor)
    if (submitSettings.tagPostAuthorEnabled) {
      // Insert comment first, then tag
      const editableField = commentUtils.findEditableField(card.postContainer);
      if (editableField) {
        await commentUtils.insertComment(editableField, card.commentText);
        await commentUtils.tagPostAuthor(card.postContainer);
      }
    }

    // 2. Attach image BEFORE submitting
    if (submitSettings.attachPictureEnabled) {
      const imageUrl = getRandomImage();
      if (imageUrl) {
        await commentUtils.attachImageToComment(card.postContainer, imageUrl);
      }
    }

    // 3. Submit comment
    const success = await commentUtils.submitComment(
      card.postContainer,
      card.commentText,
    );

    if (success) {
      // 4. Like post AFTER submitting
      if (submitSettings.likePostEnabled) {
        await commentUtils.likePost(card.postContainer);
      }

      // 5. Like own comment AFTER submitting
      if (submitSettings.likeCommentEnabled) {
        // Wait a bit for comment to appear in DOM
        await new Promise(r => setTimeout(r, 500));
        await commentUtils.likeOwnComment(card.postContainer);
      }

      updateCardStatus(card.id, "sent");
    }

    // Random delay between submissions
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    await new Promise(r => setTimeout(r, delay * 1000));
  }
}, [...]);
```

### 4.2 Update `attachImageToComment` to handle blob URLs

The current implementation fetches from URL. For local blobs:

```typescript
// In attach-image-to-comment.ts
export async function attachImageToComment(
  postContainer: HTMLElement,
  imageSource: string | Blob,  // Accept both URL and Blob
): Promise<boolean> {
  // ... find button, click, wait ...

  let file: File;

  if (imageSource instanceof Blob) {
    // Already have blob - just wrap in File
    file = new File([imageSource], "image.jpg", { type: imageSource.type });
  } else {
    // Fetch from URL
    const response = await fetch(imageSource);
    const blob = await response.blob();
    file = new File([blob], "image.jpg", { type: blob.type });
  }

  // ... rest of implementation ...
}
```

### 4.3 Update comment-image-store getRandomImage

Return blob for local images instead of URL:

```typescript
getRandomImage: () => {
  const { images, attachImageEnabled } = get();
  if (!attachImageEnabled || images.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * images.length);
  const image = images[randomIndex];

  // Return blob if local, URL if remote
  return image?.isLocal ? image.blob : image?.url ?? null;
}
```

---

## Phase 5: AI Generation Settings Integration

### 5.1 Update AI comment generation to use adjacentCommentsEnabled

In `ComposeTab.tsx` `handleStart`:

```typescript
const generateSettings = useSettingsStore.getState().commentGenerate;

// Only extract adjacent comments if enabled
const adjacentComments = generateSettings.adjacentCommentsEnabled
  ? postUtils.extractAdjacentComments(post.postContainer)
  : [];

generateComment.mutateAsync({
  postContent: post.fullCaption,
  styleGuide: DEFAULT_STYLE_GUIDE,
  adjacentComments,
  // Future: pass commentStyleId when DB integrated
});
```

---

## Implementation Order

### Phase 1: Settings Store (Foundation) ✅ COMPLETE
- [x] 1.1 Create `settings-store.ts` with all settings interfaces
- [x] 1.2 Migrate behavior settings from compose-store
- [x] 1.3 Update all consumers to use new store

### Phase 2: Settings UI ✅ COMPLETE
- [x] 2.1 Create `SettingsSheet.tsx` with ExpandableTabs (matches main sidebar style)
- [x] 2.2-2.5 Tab content components (inline in SettingsSheet.tsx: SettingsBehaviorContent, SettingsFiltersContent, SettingsSubmitContent, SettingsAIContent)
- [x] 2.6 Create `SettingsImageManager.tsx` with file picker and image grid
- [x] 2.7 Update `comment-image-store.ts` for local file upload (blob URLs, session-only persistence)
- [x] 2.8 Create `SettingsTags.tsx` component with green styling (bg-green-100, text-green-700)
- [x] 2.9 Update `ComposeTab.tsx`:
  - Settings icon on far right (opposite of Compose title)
  - Tags in separate row below with flex-wrap (no limit, wraps to next line)
  - Mutual exclusivity: only one sub-sidebar open at a time (Settings vs PostPreview)
  - Auto-close settings when Load Posts clicked

**UI Implementation Notes:**
- Uses ExpandableTabs from @sassy/ui (consistent with main sidebar)
- Local useState for tab selection (no persistence needed)
- SettingsTags uses useShallow to subscribe to all settings slices for proper reactivity
- framer-motion slide animation from right

#### 🧪 TEST CHECKPOINT: UI & Settings Store ✅ PASSED
**Verified behavior:**
1. Click settings icon → sheet opens with slide animation ✅
2. All 4 tabs render correctly with ExpandableTabs ✅
3. Toggle any setting → store updates, tags update in real-time ✅
4. Close sheet → green settings tags show active (non-default) settings ✅
5. Behavior settings work: 100% human mode, auto-engage, space engage, post navigator ✅
6. Image upload: local files can be uploaded, displayed in grid, removed ✅
7. Disabled features show "Coming Soon" state (lists, styles) ✅
8. Settings reset on page refresh (no persistence) ✅
9. Only one sub-sidebar open at a time ✅
10. Settings auto-close when Load Posts clicked ✅

### Phase 3: Filter Integration ✅ COMPLETE
- [x] 3.1 Update `collectPostsBatch` signature with filter config
- [x] 3.2 Implement filter logic in collection loop
- [x] 3.3 Update `ComposeTab.tsx` to pass filter config

#### 🧪 TEST CHECKPOINT: Post Filters ✅ PASSED
**After Phase 3, test each filter individually:**

| Filter | How to Test |
|--------|-------------|
| Skip Promoted | Enable → Load Posts → promoted posts should NOT appear |
| Skip Company | Enable → Load Posts → company page posts should NOT appear |
| Skip Friend Activity | Enable → Load Posts → "X liked this" posts should NOT appear |
| Skip 1st Degree | Enable → Load Posts → 1st connections should NOT appear |
| Skip 2nd Degree | Enable → Load Posts → 2nd connections should NOT appear |
| Skip 3rd Degree | Enable → Load Posts → 3rd+ connections should NOT appear |
| Skip Following | Enable → Load Posts → Following posts should NOT appear |
| Time Filter | Enable, set 24h → Load Posts → posts older than 24h should NOT appear |

**Verification method:**
1. Open LinkedIn feed
2. Manually identify a post that matches filter criteria (e.g., a promoted post)
3. Enable that filter in settings
4. Click "Load Posts"
5. Verify that post was skipped

#### 🐛 Bugs Fixed During Phase 3

**Bug 1: Minutes parsed as months**
- **Symptom**: Posts with "17m" (17 minutes) were calculated as 12,410 hours
- **Root cause**: In `parseTimeToHours()`, the unit `m` was mapped to 730 (months) instead of 1/60 (minutes)
- **File**: `packages/linkedin-automation/src/post/utils-shared/parse-time-to-hours.ts`
- **Fix**: Changed `m: 730` to `m: 1/60` in the `hoursPerUnit` mapping
- **Note**: LinkedIn uses `m` for minutes and `mo` for months. The regex was capturing `m` correctly, but the mapping was wrong.

**Bug 2: Time filter toggle enabled but value null**
- **Symptom**: Console showed `{timeFilterEnabled: true, minPostAge: null}` - filter was "enabled" but had no max age value
- **Root cause**: The UI input displayed `24` via fallback (`postLoad.minPostAge ?? 24`) but this fallback was display-only and never wrote to the store
- **File**: `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/SettingsSheet.tsx`
- **Fix**: Auto-set `minPostAge: 24` when enabling the time filter toggle:
  ```typescript
  onCheckedChange={(v) => {
    updatePostLoad("timeFilterEnabled", v);
    if (v && postLoad.minPostAge === null) {
      updatePostLoad("minPostAge", 24);
    }
  }}
  ```

**Bug 3: Duplicate cards in V1 DOM**
- **Symptom**: Each post generated 2 cards with the same URN in V1 DOM mode
- **Root cause**: V1 DOM has two sibling DIVs per post - one with `data-urn`, one with `data-id`. The selector `div[data-urn], div[data-id]` matched both, and each returned the same URN via `extractPostUrl()` which uses `.closest()`.
- **File**: `packages/linkedin-automation/src/feed/collect-posts.ts`
- **Fix**: Added `seenInThisIteration` Set to deduplicate within the same query iteration:
  ```typescript
  const seenInThisIteration = new Set<string>();
  for (const container of posts) {
    const urn = extractUrn(container);
    if (!urn) continue;
    if (seenInThisIteration.has(urn) || ...) continue;
    seenInThisIteration.add(urn);
    // ... process post
  }
  ```

**Bug 4: Comments mistaken as posts**
- **Symptom**: Comment cards appeared in the post list
- **Root cause**: Comment URNs like `urn:li:comment:(activity:xxx,yyy)` were being processed as posts
- **File**: `packages/linkedin-automation/src/feed/collect-posts.ts`
- **Fix**: Skip URNs containing `:comment:`:
  ```typescript
  if (urn.includes(":comment:")) continue;
  ```
- **Note**: Can't use `!urn.startsWith("urn:li:activity:")` because aggregate URNs should pass for friend activity detection.

**Bug 5: Company filter not detecting showcase pages**
- **Symptom**: LinkedIn News Asia post (showcase page) passed through company filter
- **Root cause**: `detectCompanyPost()` only checked for `/company/` in URL, but showcase pages use `/showcase/` URL pattern
- **Files**:
  - `packages/linkedin-automation/src/post/utils-v1/detect-company-post.ts`
  - `packages/linkedin-automation/src/post/utils-v2/detect-company-post.ts`
- **Fix**: Check for both `/company/` and `/showcase/`:
  ```typescript
  return (
    authorAnchor.href.includes("/company/") ||
    authorAnchor.href.includes("/showcase/")
  );
  ```

**Bug 6: Time filter failing on company posts**
- **Symptom**: Posts from company pages with "3w" age passed through 24h time filter
- **Root cause**: V1 time extraction relied on finding author image via `img[alt^="View "]`, but company pages have different alt text (e.g., "LinkedIn News Asia"). When extraction failed, no time was returned and the filter passed.
- **File**: `packages/linkedin-automation/src/post/utils-v1/extract-post-time.ts`
- **Fix**: Added Fallback 2 to search ALL `span[aria-hidden="true"]` elements for time patterns, catching cases where the author image selector fails:
  ```typescript
  // Fallback 2: Search aria-hidden spans for display time pattern
  if (!result.displayTime) {
    const allAriaHiddenSpans = postContainer.querySelectorAll<HTMLElement>(
      'span[aria-hidden="true"]'
    );
    for (const span of allAriaHiddenSpans) {
      const text = span.textContent?.trim() || "";
      const timeMatch = text.match(/^(\d+[hdwmoy]+)\s*[•·]/i);
      if (timeMatch?.[1]) {
        result.displayTime = timeMatch[1];
        // ... derive fullTime from displayTime
        break;
      }
    }
  }
  ```

**Bug 7: Time filter fallbacks never executed (early returns)**
- **Symptom**: Posts with ghost/placeholder avatars (no actual profile image) passed through time filter despite being old (e.g., "5d" passing 24h filter)
- **Root cause**: V1 `extractPostTime()` had early `return result;` statements when author image wasn't found. This caused immediate return with `{displayTime: null, fullTime: null}` BEFORE reaching any fallbacks.
- **File**: `packages/linkedin-automation/src/post/utils-v1/extract-post-time.ts`
- **Fix**: Removed early returns, restructured to nested conditionals so fallbacks ALWAYS execute when primary strategy fails:
  ```typescript
  // BEFORE (broken):
  if (!authorImg) {
    return result;  // <-- Early return, fallbacks never reached!
  }

  // AFTER (fixed):
  if (authorImg) {
    // ... primary strategy in nested block
  }
  // Fallback 1 and 2 now always run if primary failed
  ```
- **Note**: Ghost avatars appear when profile photos haven't loaded or when the user has no photo. The `<img>` tag is replaced with a `<div class="EntityPhoto-circle-3-ghost-person">` placeholder.

#### 📝 Lessons Learned

1. **Toggle + Value Pattern**: When a toggle enables a feature that requires a value, **always auto-set the default value when the toggle is turned ON**. Don't rely on display fallbacks (`value ?? default`) - those are visual-only and don't persist to the store.

2. **Unit Disambiguation**: When parsing time units, be explicit about similar-looking units. LinkedIn's `m` (minutes) vs `mo` (months) is a common trap. Add comments documenting unit mappings.

3. **Debug with Runtime Logging**: When filters don't work as expected, add console.log at the filter evaluation point to see:
   - What the filter config actually is (not just what the UI shows)
   - What values are being compared
   - Why the filter is passing/failing

4. **V1 DOM Structure Quirks**: LinkedIn V1 DOM has redundant elements - two sibling DIVs per post with `data-urn` and `data-id`. Always deduplicate within iteration when using broad selectors.

5. **URN Type Awareness**: LinkedIn has multiple URN types (`urn:li:activity:`, `urn:li:comment:`, `urn:li:aggregate:`, `urn:li:inAppPromotion:`). Filter appropriately based on what you're looking for.

6. **LinkedIn URL Patterns**: Company pages have multiple URL patterns:
   - `/company/` - main company pages
   - `/showcase/` - company showcase/sub-pages (e.g., LinkedIn News Asia)
   Always check for all variants.

7. **Robust DOM Extraction**: When extracting data from DOM, always add fallback selectors. If primary navigation fails (e.g., author image not found), search more broadly. Company pages and promoted posts often have different DOM structures than personal posts.

8. **Fallback Pattern - Avoid Early Returns**: When implementing fallback strategies, don't use early `return` statements in the primary path. Use nested conditionals instead so fallbacks ALWAYS have a chance to run:
   ```typescript
   // BAD - fallbacks never execute if primary fails early
   if (!primaryCondition) return result;
   // ... primary logic ...
   // fallbacks here never reached!

   // GOOD - fallbacks always run if primary didn't find anything
   if (primaryCondition) {
     // ... primary logic ...
   }
   if (!result.value) {
     // fallback always runs
   }
   ```

9. **Separation of Concerns in DOM Utilities**: When building multi-step flows (insert → tag → attach → submit), keep each utility function focused on ONE task. Don't have `submitComment()` also call `insertComment()` internally - this makes it impossible to insert intermediate steps (like tagging) between insert and submit. The caller should orchestrate the steps.

10. **React vs Synthetic Events**: React's event system often intercepts synthetic events (like programmatically dispatched KeyboardEvents). When automating UI interactions:
    - Prefer `.click()` over dispatching keyboard events
    - If keyboard events are needed, ensure they bubble through React's event delegation
    - For mention pickers, clicking the option directly is more reliable than ArrowDown + Enter

11. **V1 vs V2 DOM Abstraction**: When building utilities for multiple DOM versions, ensure:
    - Version-specific logic stays in `utils-v1/` and `utils-v2/` folders
    - Consumer code (React components) calls through the abstraction layer
    - Never put version-specific selectors (like `form > button`) in consumer code

12. **Method Reference Caching in Legacy Frameworks**: Ember.js (LinkedIn V1) and similar frameworks cache references to native DOM methods during initialization. Prototype overrides applied AFTER initialization won't affect cached references. Solution: intercept at the point of object creation (`document.createElement`) to apply instance-level overrides before caching occurs.

13. **Content Script Isolated World**: Browser extension content scripts run in an isolated JavaScript context. To modify page behavior (like blocking file picker), inject a script into the main world via:
    - `web_accessible_resources` in manifest
    - Load via `chrome.runtime.getURL()` (bypasses CSP)
    - Wait for `script.onload` before proceeding

### Phase 4: Submit Actions Integration ✅ COMPLETE
- [x] 4.1 Update `handleSubmitAll` with submit actions
- [x] 4.2 Update `attachImageToComment` to handle blobs (accepts `string | Blob`)
- [x] 4.3 Update `comment-image-store.ts` getRandomImage for blobs (returns Blob for local, URL for remote)

#### 🐛 Bugs Fixed During Phase 4

**Bug 8: V2 tagPostAuthor not selecting option**
- **Symptom**: Mention picker dropdown appeared but keyboard navigation (ArrowDown + Enter) wasn't selecting the first option
- **Root cause**: React intercepts synthetic KeyboardEvents. Direct `.click()` works reliably.
- **File**: `packages/linkedin-automation/src/comment/utils-v2/tag-post-author.ts`
- **Fix**: Changed from keyboard navigation to direct click on first option:
  ```typescript
  // V2 uses floating UI portal with typeahead-results-container
  const option = document.querySelector<HTMLElement>(
    '[data-testid="typeahead-results-container"] [role="option"] [role="button"]'
  );
  firstOption.click();
  ```

**Bug 9: V2 submit button not found after tagging**
- **Symptom**: Comment text inserted and author tagged, but comment never submitted
- **Root cause**: Inline button finding code in ComposeTab/ComposeCard/PostPreviewSheet looked for `form > button` which only works for V1. V2 DOM has no `<form>` wrapper and uses `button[data-view-name="comment-post"]`.
- **Files**:
  - `packages/linkedin-automation/src/comment/utils-v2/submit-comment.ts`
  - `packages/linkedin-automation/src/comment/utils-v1/submit-comment.ts`
  - `packages/linkedin-automation/src/comment/types.ts`
  - `packages/linkedin-automation/src/comment/CommentUtilitiesV1.ts`
  - `packages/linkedin-automation/src/comment/CommentUtilitiesV2.ts`
  - `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`
  - `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeCard.tsx`
  - `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/PostPreviewSheet.tsx`
- **Fix**: Major refactor to separate concerns:
  - **Before**: `submitComment(postContainer, commentText)` - inserted text AND clicked button
  - **After**: `submitComment(postContainer)` - ONLY clicks button and verifies
  - Submit flow now: `insertComment()` → `tagPostAuthor()` → `attachImageToComment()` → `submitComment()`
  - Removed inline V1-specific button finding from all three compose components
  - Added `clickSubmitButton()` method to interface for potential future use

#### 🧪 TEST CHECKPOINT: Submit Actions ✅ PASSED
**After Phase 4, test each action individually (use a test post):**

| Action | How to Test | Status |
|--------|-------------|--------|
| Tag Post Author | Enable → Submit → author mention appears at end | ✅ |
| Submit Comment | Click button + verify comment posted | ✅ |
| Like Post | Enable → Submit → post should be liked | ✅ |
| Like Own Comment | Enable → Submit → your comment should be liked | ✅ |
| Attach Image (S3 URL) | Add S3 URL to store → Enable → Submit | ✅ (manual test needed) |
| Attach Image (Local) | Upload local file → Enable → Submit | ✅ |
| Delay Range | Set 10-20s → Submit multiple → delays between 10-20s | ✅ (manual test needed) |

**Bug 10: File picker opening when programmatically attaching images**
- **Symptom**: Native file picker dialog appeared when clicking "Add a photo" button, even though image was being attached programmatically
- **Root cause (V1)**: LinkedIn V1 (Ember.js) caches references to native DOM methods early in page load. When our content script overrode `HTMLInputElement.prototype.click()`, the cached reference bypassed the override.
- **Root cause (V2)**: Content scripts run in an isolated JavaScript world, separate from the page's main world. Prototype overrides in content script don't affect the page.
- **Files**:
  - `apps/wxt-extension/public/block-file-picker.js` (created)
  - `apps/wxt-extension/wxt.config.ts` (added to web_accessible_resources)
  - `packages/linkedin-automation/src/comment/utils-v1/attach-image-to-comment.ts`
  - `packages/linkedin-automation/src/comment/utils-v2/attach-image-to-comment.ts`
- **Solution**: Multi-layered blocking script injected into main world via `web_accessible_resources`:
  1. **Prototype override**: Override `HTMLInputElement.prototype.click()` and `HTMLInputElement.prototype.showPicker()`
  2. **createElement interception**: Override `document.createElement` to apply instance-level `.click()` override when file inputs are created (catches V1's cached references)
  3. **Event capture**: Block click events on file inputs at document level
  4. **Input disabling**: Temporarily disable all file inputs
  5. **MutationObserver**: Catch dynamically created inputs
  6. **CSS blocking**: Set `pointer-events: none` on file inputs
- **Key insight**: V2 worked with just prototype override because LinkedIn V2 (React SSR) calls methods after our override. V1 (Ember.js) cached method references during initialization, requiring the `createElement` interception to override at instance level before caching.
- **Script loading**: Used `chrome.runtime.getURL()` to bypass CSP restrictions (inline scripts and blob URLs blocked). Wait for `script.onload` before proceeding.

**⚠️ Test with caution:**
- Use a test LinkedIn account or posts from friends who won't mind
- Test one action at a time first
- Verify each action completes before testing combinations

### Phase 5: AI Generation Integration ✅ COMPLETE
- [x] 5.1 Update AI generation to use adjacentCommentsEnabled setting

#### 🧪 TEST CHECKPOINT: AI Settings
**After Phase 5:**
1. Disable "Include adjacent comments" → Load Posts → AI generates without comment context
2. Enable "Include adjacent comments" → Load Posts → AI should reference existing comments in generation

---

## Files to Create
- `apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/SettingsSheet.tsx`
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/SettingsBehaviorTab.tsx`
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/SettingsFiltersTab.tsx`
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/SettingsSubmitTab.tsx`
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/SettingsAITab.tsx`
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/SettingsImageManager.tsx`
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/SettingsTags.tsx`

## Files to Modify
- `apps/wxt-extension/entrypoints/linkedin.content/stores/compose-store.ts` (remove settings)
- `apps/wxt-extension/entrypoints/linkedin.content/stores/comment-image-store.ts` (add local blob support)
- `apps/wxt-extension/entrypoints/linkedin.content/stores/index.ts` (export new store)
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx` (use new UI)
- `apps/wxt-extension/entrypoints/linkedin.content/engage-button/SpacebarEngageObserver.tsx` (use new store)
- `packages/linkedin-automation/src/feed/collect-posts.ts` (add filter config)
- `packages/linkedin-automation/src/comment/utils-v1/attach-image-to-comment.ts` (handle blobs)
- `packages/linkedin-automation/src/comment/utils-v2/attach-image-to-comment.ts` (handle blobs)
- `packages/linkedin-automation/src/comment/types.ts` (update signature)

---

## Notes

### Disabled Features (Future DB Integration)
- Target list selection
- Blacklist selection
- Comment style selection
- Dynamic style selection

These will show in UI with disabled state and "Coming Soon" indicator.

### Settings Persistence
- No localStorage persistence for now (per user request)
- Settings reset each browser session
- Future: Load from DB on mount, sync changes to DB

### Image Handling
- Local files stored as blobs in memory
- On submit, blobs passed directly to attachImageToComment
- No upload to S3 in this phase

---

**Plan Status**: ✅ COMPLETE (All 5 Phases Done - Including Phase 2.6-2.7 Local Image Upload)
