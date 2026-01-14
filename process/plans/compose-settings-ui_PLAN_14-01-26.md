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

### Phase 1: Settings Store (Foundation)
- [ ] 1.1 Create `settings-store.ts` with all settings interfaces
- [ ] 1.2 Migrate behavior settings from compose-store
- [ ] 1.3 Update all consumers to use new store

### Phase 2: Settings UI
- [ ] 2.1 Create `SettingsSheet.tsx` with tabs
- [ ] 2.2 Create `SettingsBehaviorTab.tsx`
- [ ] 2.3 Create `SettingsFiltersTab.tsx`
- [ ] 2.4 Create `SettingsSubmitTab.tsx`
- [ ] 2.5 Create `SettingsAITab.tsx`
- [ ] 2.6 Create `SettingsImageManager.tsx`
- [ ] 2.7 Update `comment-image-store.ts` for local file upload
- [ ] 2.8 Create `SettingsTags.tsx` component
- [ ] 2.9 Update `ComposeTab.tsx` to use settings icon + tags

#### 🧪 TEST CHECKPOINT: UI & Settings Store
**After Phase 2, test the following:**
1. Click settings icon → sheet opens with slide animation
2. All 4 tabs render correctly with toggles
3. Toggle any setting → verify store updates (check with React DevTools or console)
4. Close sheet → settings tags show active (non-default) settings
5. Behavior settings work: 100% human mode, auto-engage, space engage, post navigator
6. Image upload: add local image → appears in list, remove works
7. Disabled features show "Coming Soon" state (lists, styles)
8. Settings reset on page refresh (no persistence)

### Phase 3: Filter Integration
- [ ] 3.1 Update `collectPostsBatch` signature with filter config
- [ ] 3.2 Implement filter logic in collection loop
- [ ] 3.3 Update `ComposeTab.tsx` to pass filter config

#### 🧪 TEST CHECKPOINT: Post Filters
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

### Phase 4: Submit Actions Integration
- [ ] 4.1 Update `handleSubmitAll` with submit actions
- [ ] 4.2 Update `attachImageToComment` to handle blobs
- [ ] 4.3 Update `comment-image-store.ts` getRandomImage for blobs

#### 🧪 TEST CHECKPOINT: Submit Actions
**After Phase 4, test each action individually (use a test post):**

| Action | How to Test |
|--------|-------------|
| Like Post | Enable → Submit comment → post should be liked |
| Like Own Comment | Enable → Submit comment → your comment should be liked |
| Tag Post Author | Enable → Submit comment → author tag appears at end of comment |
| Attach Image | Enable + add image → Submit → image attached to comment |
| Delay Range | Set 10-20s → Submit multiple → delays between 10-20s |

**⚠️ Test with caution:**
- Use a test LinkedIn account or posts from friends who won't mind
- Test one action at a time first
- Verify each action completes before testing combinations

### Phase 5: AI Generation Integration
- [ ] 5.1 Update AI generation to use adjacentCommentsEnabled setting

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

**Plan Status**: 📝 READY FOR REVIEW
