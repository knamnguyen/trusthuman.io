# Post Filter & Submit Utilities Plan

**Date**: 2026-01-14
**Type**: COMPLEX (multi-session, DOM inspection required)
**Goal**: Add utilities to linkedin-automation for PostLoadSetting filters and SubmitCommentSetting actions

---

## Overview

Add utilities to support:
1. **PostLoadSetting** - Filter posts during Load Posts collection
2. **SubmitCommentSetting** - Actions when submitting comments

**Schema Reference**: `packages/db/prisma/models/comment/post-load-setting.prisma`

Each utility needs V1 and V2 implementations. User will provide DOM samples at each step.

---

## Recommended Order

### Phase 1: Simple Helpers (No DOM inspection needed)

| # | Utility | Location | Notes |
|---|---------|----------|-------|
| 1.1 | `parseTimeToHours()` | `post/utils-shared/` | Convert "21h", "2d", "1w" → hours number |

### Phase 2: Post Filters - Fix Existing

| # | Utility | Location | Notes |
|---|---------|----------|-------|
| 2.1 | `detectPromotedPost()` | `post/utils-v1/`, `post/utils-v2/` | Improve reliability - needs DOM sample |
| 2.2 | `detectCompanyPost()` | `post/utils-v1/`, `post/utils-v2/` | Improve beyond `/company/` check - needs DOM sample |

### Phase 3: Post Filters - New Utilities

| # | Utility | Location | Schema Field | Notes |
|---|---------|----------|--------------|-------|
| 3.1 | `detectConnectionDegree()` | `post/utils-v1/`, `post/utils-v2/` | `skipFirstDegree`, `skipSecondDegree`, `skipThirdDegree`, `skipFollowing` | Extract 1st/2nd/3rd/Following |
| 3.2 | `extractAuthorProfileId()` | `post/utils-v1/`, `post/utils-v2/` | `blacklistId`, `targetListId` | Get LinkedIn profile ID from post |
| 3.3 | `detectFriendActivity()` | `post/utils-v1/`, `post/utils-v2/` | `skipFriendActivitiesEnabled` | Detect "X liked this" / "X commented" |

### Phase 4: Submit Actions

| # | Utility | Location | Schema Field | Notes |
|---|---------|----------|--------------|-------|
| 4.1 | `likePost()` | `comment/utils-v1/`, `comment/utils-v2/` | `likePostEnabled` | Click like button on post |
| 4.2 | `likeOwnComment()` | `comment/utils-v1/`, `comment/utils-v2/` | `likeCommentEnabled` | Like own comment after posting |
| 4.3 | `attachImageToComment()` | `comment/utils-v1/`, `comment/utils-v2/` | `attachPictureEnabled` | Migrate existing + add v2 support |
| 4.4 | `tagAuthorInComment()` | `comment/utils-shared/` | `tagPostAuthorEnabled` | Prepend @mention to comment text |

---

## Phase 1: Simple Helpers

### 1.1 parseTimeToHours()

**Purpose**: Convert LinkedIn time display to hours for age filtering

**Input**: `displayTime` from `extractPostTime()` (e.g., "21h", "2d", "1w", "3mo")
**Output**: Number of hours

```typescript
// post/utils-shared/parse-time-to-hours.ts
export function parseTimeToHours(displayTime: string | null): number | null {
  if (!displayTime) return null;

  const match = displayTime.match(/^(\d+)([hdwmoy]+)/i);
  if (!match) return null;

  const num = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const hoursPerUnit: Record<string, number> = {
    h: 1,
    d: 24,
    w: 168,      // 7 * 24
    m: 730,      // ~30.4 * 24
    mo: 730,
    y: 8760,     // 365 * 24
  };

  return num * (hoursPerUnit[unit] || 1);
}
```

**Status**: ✅ COMPLETED
**DOM Required**: No
**Location**: `packages/linkedin-automation/src/post/utils-shared/parse-time-to-hours.ts`

---

## Phase 2: Fix Existing Detection

### 2.1 detectPromotedPost() - Improved

**Purpose**: Detect promoted/sponsored posts

**V1 Implementation**:
- Strategy 1: Check `data-view-tracking-scope` for sponsored indicators
- Strategy 2: Search for `<span>` elements with exact text "Promoted"
- Strategy 3: Check for `leadGenForm` links (always sponsored)

**V2 Implementation**:
- Strategy 1: Check for `data-view-name` attributes containing "sponsored"
- Strategy 2: Check `data-view-tracking-scope` for `isSponsored:true` or `SponsoredUpdateServed`
- Strategy 3: Look for "Promoted" text in `<p>` elements near author section

**Status**: ✅ COMPLETED
**DOM Required**: No (uses stable data attributes + text matching)
**Location**:
- `packages/linkedin-automation/src/post/utils-v1/detect-promoted-post.ts`
- `packages/linkedin-automation/src/post/utils-v2/detect-promoted-post.ts`

---

### 2.2 detectCompanyPost() - Verified Working

**Purpose**: Detect posts from company/showcase pages (not personal profiles)

**V1 Implementation**: Checks author anchor href for `/company/` pattern
**V2 Implementation**: Checks `a[data-view-name="feed-actor-image"]` href for `/company/` pattern

**Note**: Also detects `/showcase/` pages as company posts would be a good enhancement.

**Status**: ✅ VERIFIED WORKING
**DOM Required**: No
**Location**:
- `packages/linkedin-automation/src/post/utils-v1/detect-company-post.ts`
- `packages/linkedin-automation/src/post/utils-v2/detect-company-post.ts`

---

## Phase 3: New Post Filters

### 3.1 detectConnectionDegree()

**Purpose**: Extract connection degree from post (1st, 2nd, 3rd, Following)

**Schema** (from `packages/db/prisma/models/comment/post-load-setting.prisma`):
```prisma
skipFirstDegree   Boolean @default(false)
skipSecondDegree  Boolean @default(false)
skipThirdDegree   Boolean @default(false)
skipFollowing     Boolean @default(false)
```

**Expected Return**:
```typescript
type ConnectionDegree = "1st" | "2nd" | "3rd" | "following" | null;
```

**Usage**: Check degree then compare against skip flags:
```typescript
const degree = postUtilities.detectConnectionDegree(post);
if (degree === "1st" && settings.skipFirstDegree) continue;
if (degree === "2nd" && settings.skipSecondDegree) continue;
// etc.
```

**V1 Implementation**:
- Strategy 1: Uses `img[alt^="View "]` to find author, then searches parent for "• 1st/2nd/3rd/Following" pattern
- Strategy 2 (fallback): Searches entire post for degree pattern (catches friend activity posts)

**V2 Implementation**: Uses `a[data-view-name="feed-actor-image"]` to find author, then searches parent container for degree pattern

**Status**: ✅ COMPLETED
**DOM Required**: No (uses stable data attributes + text pattern matching)
**Location**:
- `packages/linkedin-automation/src/post/utils-v1/detect-connection-degree.ts`
- `packages/linkedin-automation/src/post/utils-v2/detect-connection-degree.ts`

---

### 3.2 extractAuthorProfileUrl()

**Purpose**: Get LinkedIn profile URL for blacklist/target list matching

**Schema**: `blacklistId`, `targetListId` (TargetList contains profile URLs)

**Analysis**:
- `TargetProfile.linkedinUrl` stores full URL: `https://www.linkedin.com/in/username`
- Existing `extractPostAuthorInfo().profileUrl` returns same format: `https://www.linkedin.com/in/username`

**Usage**:
```typescript
const authorInfo = postUtilities.extractPostAuthorInfo(post);
const profileUrl = authorInfo.profileUrl;

// Check against target list
const isInTargetList = targetListProfiles.some(p => p.linkedinUrl === profileUrl);

// Check against blacklist
const isBlacklisted = blacklistedProfiles.some(p => p.linkedinUrl === profileUrl);
```

**Status**: ✅ ALREADY SOLVED - use existing `extractPostAuthorInfo().profileUrl`
**DOM Required**: No
**Location**: Already exists in `extract-post-author-info.ts` (V1 and V2)

---

### 3.3 detectFriendActivity()

**Purpose**: Detect "X liked this" or "X commented on this" aggregated posts

**Schema**: `skipFriendActivitiesEnabled`

**Expected Return**: `boolean`

**V1 Implementation**:
- Strategy 1: Check for `a[data-control-id]` with profile image inside (friend activity header)
- Strategy 2: Count profile images before author image - friend activity has an extra one

**V2 Implementation**:
- Check for `a[data-view-name="feed-header-actor-image"]` - present only on friend activity posts
- This is the friend who interacted, separate from `feed-actor-image` (post author)

**Status**: ✅ COMPLETED
**DOM Required**: No (uses stable data attributes)
**Location**:
- `packages/linkedin-automation/src/post/utils-v1/detect-friend-activity.ts`
- `packages/linkedin-automation/src/post/utils-v2/detect-friend-activity.ts`

---

## Phase 4: Submit Actions

### 4.1 likePost()

**Purpose**: Click the like button on a post after commenting

**Schema**: `likePostEnabled`

**V1 Implementation**:
- Find `button[aria-label="React Like"]`
- Check `aria-pressed="false"` (not yet liked)
- Click to like, verify `aria-pressed` changes to `"true"`

**V2 Implementation**:
- Find `button[data-view-name="reaction-button"]`
- Check `aria-label` contains "no reaction" (not yet liked)
- Click to like, verify `aria-label` no longer contains "no reaction"

**Expected Return**: `Promise<boolean>` (success/failure)

**Status**: ✅ COMPLETED
**DOM Required**: No (uses stable data attributes)
**Location**:
- `packages/linkedin-automation/src/comment/utils-v1/like-post.ts`
- `packages/linkedin-automation/src/comment/utils-v2/like-post.ts`

---

### 4.2 likeOwnComment()

**Purpose**: Like the comment we just posted

**Schema**: `likeCommentEnabled`

**V1 Implementation**:
- Find `article.comments-comment-entity` elements
- Identify own comment by looking for "• You" in `.comments-comment-meta__data` span
- Find `button.react-button__trigger` within the comment
- Check `aria-pressed="false"` (not yet liked)
- Click to like

**V2 Implementation**:
- Find elements with `data-view-name="comment-container"`
- Identify own comment by looking for "• You" text in content
- Find `[data-view-name="comment-reaction-button"]` within the comment
- Check if "no reaction" text present (not yet liked)
- Click to like

**Expected Return**: `Promise<boolean>`

**Status**: ✅ COMPLETED
**DOM Required**: No (uses stable patterns)
**Location**:
- `packages/linkedin-automation/src/comment/utils-v1/like-own-comment.ts`
- `packages/linkedin-automation/src/comment/utils-v2/like-own-comment.ts`

---

### 4.3 attachImageToComment()

**Purpose**: Attach an image to comment before submitting

**Schema**: `attachPictureEnabled`, `defaultPictureAttachUrl`

**Flow**:
1. Find "Add a photo" button and click it (blocking file picker)
2. Fetch image from URL and convert to File object
3. Find the file input LinkedIn creates
4. Set file on the input using DataTransfer API
5. Dispatch change event to trigger LinkedIn's handler

**V1 Implementation**:
- Find `[aria-label="Add a photo"]` button
- Temporarily override `HTMLInputElement.prototype.click` to block file picker
- Click button to make LinkedIn create file input
- Fetch image URL → blob → File object
- Find `input[type="file"][name="file"]` (created globally by LinkedIn)
- Use DataTransfer API to set file, dispatch change event

**V2 Implementation**:
- Find `[data-view-name="comment-add-image"]` button (fallback: `[aria-label="Share photo"]`)
- Same flow as V1: block file picker, click button, fetch image, set via DataTransfer

**Key Difference V1 vs V2**:
- V1 button: `[aria-label="Add a photo"]`
- V2 button: `[data-view-name="comment-add-image"]` or `[aria-label="Share photo"]`
- V1 file input: `input[type="file"][name="file"]`
- V2 file input: `input[type="file"][accept="image/*"]` (no name attribute)

**Status**: ✅ COMPLETED (V1 and V2)
**DOM Required**: No
**Location**:
- `packages/linkedin-automation/src/comment/utils-v1/attach-image-to-comment.ts`
- `packages/linkedin-automation/src/comment/utils-v2/attach-image-to-comment.ts`

---

### 4.4 tagPostAuthor()

**Purpose**: Tag post author at END of comment using LinkedIn's mention picker

**Schema**: `tagPostAuthorEnabled`

**Flow**:
1. Move cursor to END of comment content
2. Ensure space before @ (mention picker requires it)
3. Type "@" to trigger mention picker
4. Wait for dropdown to appear (polling with timeout)
5. Use keyboard navigation (ArrowDown + Enter) to select first option

**V1 Implementation**:
- Find `.ql-editor[contenteditable="true"]` (Quill editor)
- Move cursor to end using `Selection.collapse(false)`
- Ensure space, then type "@" using `document.execCommand("insertText")`
- Wait for `[role="listbox"].basic-typeahead__triggered-content` dropdown
- Use `sendKey("ArrowDown")` + `sendKey("Enter")` to select first option

**V2 Implementation**:
- Find `.tiptap.ProseMirror` (TipTap editor)
- Move cursor to end using `Selection.collapse(false)`
- Ensure space, then type "@" using `document.execCommand("insertText")`
- Wait for `[data-testid="typeahead-results-container"]` dropdown
- Use `sendKey("ArrowDown")` + `sendKey("Enter")` to select first option

**Key Learnings**:
- Mention picker only appears when @ is NOT attached to preceding text (need space)
- Clicking dropdown options doesn't work (portal/React issues)
- Keyboard navigation (ArrowDown + Enter) is more reliable
- Single ArrowDown selects first option (multiple presses skip to wrong person)

**Status**: ✅ COMPLETED
**DOM Required**: No (uses stable patterns)
**Location**:
- `packages/linkedin-automation/src/comment/utils-v1/tag-post-author.ts`
- `packages/linkedin-automation/src/comment/utils-v2/tag-post-author.ts`

---

## Interface Updates

### PostUtilities (add to types.ts)

```typescript
export interface PostUtilities {
  // ... existing methods ...

  // New filter methods
  detectConnectionDegree(postContainer: HTMLElement): ConnectionDegree;
  extractAuthorProfileId(postContainer: HTMLElement): AuthorIdentifier;
  detectFriendActivity(postContainer: HTMLElement): boolean;
}

export type ConnectionDegree = "1st" | "2nd" | "3rd" | "following" | null;

export interface AuthorIdentifier {
  profileUrl: string | null;
  profileId: string | null;
}
```

### CommentUtilities (add to types.ts)

```typescript
export interface CommentUtilities {
  // ... existing methods ...

  // New submit actions
  likePost(postContainer: HTMLElement): Promise<boolean>;
  likeOwnComment(postContainer: HTMLElement): Promise<boolean>;
  attachImageToComment(postContainer: HTMLElement, imageUrl: string): Promise<boolean>;
}
```

### Shared Helpers (new file)

```typescript
// post/utils-shared/parse-time-to-hours.ts
export function parseTimeToHours(displayTime: string | null): number | null;

// comment/utils-shared/tag-author-in-comment.ts
export function tagAuthorInComment(comment: string, authorName: string): string;
```

---

## Implementation Process

For each utility:
1. User provides V2 DOM sample
2. Analyze DOM structure, identify selectors
3. Implement V2 version
4. Verify V1 version still works (or update if needed)
5. Add to interface and factory
6. Test both versions

---

## Progress Tracker

| Phase | Utility | V1 | V2 | Added to Interface |
|-------|---------|----|----|-------------------|
| 1.1 | parseTimeToHours | N/A | N/A | ✅ |
| 2.1 | detectPromotedPost (fix) | ✅ | ✅ | ✅ exists |
| 2.2 | detectCompanyPost (fix) | ✅ | ✅ | ✅ exists |
| 3.1 | detectConnectionDegree | ✅ | ✅ | ✅ |
| 3.2 | extractAuthorProfileId | ✅ (existing) | ✅ (existing) | ✅ (existing) |
| 3.3 | detectFriendActivity | ✅ | ✅ | ✅ |
| 4.1 | likePost | ✅ | ✅ | ✅ |
| 4.2 | likeOwnComment | ✅ | ✅ | ✅ |
| 4.3 | attachImageToComment | ✅ | ✅ | ✅ |
| 4.4 | tagPostAuthor | ✅ | ✅ | ✅ |

---

## Next Steps

1. ~~**Phase 1.1** - `parseTimeToHours()` (no DOM needed)~~ ✅ DONE
2. ~~**Phase 3.1** - `detectConnectionDegree()`~~ ✅ DONE
3. ~~**Phase 3.2** - `extractAuthorProfileUrl()`~~ ✅ ALREADY SOLVED (use existing `extractPostAuthorInfo().profileUrl`)
4. ~~**Phase 3.3** - `detectFriendActivity()`~~ ✅ DONE
5. ~~**Phase 2.1** - `detectPromotedPost()` improvements~~ ✅ DONE
6. ~~**Phase 2.2** - `detectCompanyPost()` verified~~ ✅ VERIFIED WORKING
7. ~~**Phase 4.1** - `likePost()`~~ ✅ DONE
8. ~~**Phase 4.2** - `likeOwnComment()`~~ ✅ DONE
9. ~~**Phase 4.4** - `tagPostAuthor()`~~ ✅ DONE
10. ~~**Phase 4.3** - `attachImageToComment()` V1~~ ✅ DONE
11. ~~**Phase 4.3** - `attachImageToComment()` V2~~ ✅ DONE

---

**Plan Status**: ✅ COMPLETE - All utilities implemented for V1 and V2
