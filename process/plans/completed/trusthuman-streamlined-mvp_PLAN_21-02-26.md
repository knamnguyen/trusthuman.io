# TrustHuman Streamlined MVP Plan

**Date**: February 21, 2026
**Complexity**: COMPLEX (Multi-phase with pre-research)
**Status**: IN PROGRESS

---

## Overview

Streamlined MVP for TrustHuman - a human verification system for social media. Users install a Chrome extension that automatically verifies they're human when replying on LinkedIn/X. The system tracks verified activities, maintains streaks, and displays badges on verified users' profiles.

**Core Value Prop**: "Prove you're human when you engage online."

---

## What We're Building

### Extension
1. **Triss Toast Notifications** - Already working (typing → submitted → capturing → verifying → verified → photo_deleted)
2. **Reply Detection** - LinkedIn comments + X replies (no original posts)
3. **Auto Camera Grant** - Request on install, sidebar button as backup
4. **Sidebar = Mini Profile** - Mirror of web profile (activity cards, verified count, streak)
5. **No Webcam Preview** - Silent capture, toast feedback only
6. **Auto Platform Linking** - Detect logged-in profile on first verification
7. **Badge Overlay** - Inject badges on LinkedIn/X profiles + X hover cards

### Web App
1. **Personal Page** - `/[username]` (direct like linktree) with activity history cards + links to original posts
2. **Leaderboard** - `/leaderboard` simple table: rank, username, verified count
3. **Inline Edit Mode** - If viewing own profile while logged in, show edit controls for platform links (no separate settings page)

---

## Cut from V1

- ❌ Original post verification (replies only)
- ❌ Trust Score (0-100 with decay)
- ❌ Trust Tiers (Bronze/Silver/Gold/Diamond)
- ❌ Streak Freeze Tokens
- ❌ Sharing Rewards
- ❌ Referral System
- ❌ Monthly Trust Report
- ❌ Embeddable Badges (SVG/PNG for external)
- ❌ Card Image Generation (@vercel/og)
- ❌ Webcam preview in sidebar

---

## Keep for V1

- ✅ Human Number (#1, #2, etc.)
- ✅ Simple Streak (consecutive days, no freeze)
- ✅ Leaderboard (ranked by verified count)
- ✅ Badge Overlay (LinkedIn + X profiles + X hover cards)
- ✅ Auto Platform Linking (with manual override)

---

## Database Schema - Standardized Activity Model

### Phase 16.5: Schema Standardization ✅ COMPLETE

All platform activities now use a **standardized schema** for easy extension:

```prisma
// Example: VerifiedLinkedInActivity (all 8 platforms follow same structure)
model VerifiedLinkedInActivity {
  id             String @id @default(uuid())
  trustProfileId String

  // User's comment (standardized)
  commentText String  @db.Text
  commentUrl  String? // Direct link to user's comment (optional)

  // Parent context (standardized)
  parentUrl             String? // Link to parent post (fallback if no commentUrl)
  parentAuthorName      String  // REQUIRED
  parentAuthorAvatarUrl String  // REQUIRED
  parentTextSnippet     String  @db.Text  // REQUIRED

  // Verification link
  verificationId String @unique

  // Timestamps
  activityAt DateTime // When the comment was posted
  createdAt  DateTime @default(now())

  // Relations
  trustProfile TrustProfile      @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)
  verification HumanVerification @relation(fields: [verificationId], references: [id])

  @@index([trustProfileId])
  @@index([createdAt])
  @@index([activityAt])
}
```

**Platforms with standardized models**:
- ✅ `VerifiedLinkedInActivity`
- ✅ `VerifiedXActivity`
- ✅ `VerifiedFacebookActivity`
- ✅ `VerifiedThreadsActivity`
- ✅ `VerifiedRedditActivity`
- ✅ `VerifiedPHActivity` (Product Hunt)
- ✅ `VerifiedGitHubActivity`
- ✅ `VerifiedHNActivity` (Hacker News)

**Key Design Decisions**:
1. **Per-platform tables** - Easier to query, filter, and extend
2. **Standardized field names** - `commentText`, `parentAuthorName`, `parentTextSnippet`
3. **Parent context always captures main post** - Even for nested replies, we capture the original post/tweet/comment being replied to, not intermediate replies
4. **Required fields** - `parentAuthorName`, `parentAuthorAvatarUrl`, `parentTextSnippet` are required (with fallbacks to empty string if unavailable)
5. **Optional URLs** - `commentUrl` (direct link to comment) and `parentUrl` (link to parent post) are optional

---

## Implementation Phases

### Phase 1-15: Core MVP ✅ COMPLETE
See previous sections for details on:
- Database schema setup
- API verification flow
- LinkedIn content script
- X content script
- Web app profile/leaderboard pages
- Sidebar mini profile
- Check Human tab
- Post-signup onboarding

### Phase 16: Schema Standardization ✅ COMPLETE
**Status**: Done
**Work completed**:
1. Created 8 standardized Prisma activity models
2. Updated `verification.ts` API with standardized input schema
3. Updated `trust-profile.ts` API to query/merge all platforms
4. Updated `platform-link.ts` API with new field names
5. Updated LinkedIn content script to use standardized fields
6. Updated X content script to use standardized fields
7. Updated verification-store.ts with standardized Activity type
8. Updated CheckHumanTab and VerificationSidebar components

---

### Phase 17: Verify LinkedIn & X Still Work ✅ COMPLETE

**Goal**: Before adding new platforms, verify the standardized schema works correctly with existing LinkedIn and X content scripts.

**Testing Results**:

#### LinkedIn Testing: ✅ PASSED
- [x] Comment on main post (feed) - V2 DOM works
- [x] Comment on single post page (`/posts/...`) - V1 DOM works
- [x] Reply to another comment (nested reply) - works
- [x] Comment URL extraction - works for both V1 and V2 DOM

#### X/Twitter Testing: ✅ PASSED
- [x] Reply to tweet (single tweet page)
- [x] Reply from home feed
- [x] Success toast URL extraction
- [x] Toast shows activity count

**Fixes Applied During Testing**:
1. Added V1 DOM selectors for LinkedIn single post pages (`/posts/...`)
2. Fixed author name parsing (removed "Verified Profile 3rd+" junk text)
3. Added `comment-reply-post` button selector for reply-to-comment
4. Fixed V1 comment URL extraction (search `.comments-comments-list` container)
5. Changed toast message from "Streak: X days" to "X activities"

---

### Phase 18: Account Verification System 📋 TODO

**Goal**: Implement proper account verification to ensure platform links are legitimate.

**Current Problem**:
- Auto-detection scrapes logged-in profile from DOM
- User could potentially fake this by manipulating DOM
- Need to verify the user actually owns the claimed social account

**Options**:
1. **OAuth verification** (Best, but complex):
   - LinkedIn/X OAuth to verify account ownership
   - Most secure, but requires app approval process

2. **Code verification** (Simpler):
   - User posts a unique code on their profile/bio
   - Extension verifies code matches
   - Temporary, can be removed after verification

3. **Activity pattern verification** (Current implicit):
   - First verification on a platform auto-links
   - Subsequent verifications must match
   - Less secure but simple

**Implementation Plan**: TBD based on user testing feedback

---

### Phase 19: Facebook Content Script ✅ COMPLETE

**Pre-requisite**: Phase 17 (LinkedIn/X verification) complete ✅

**Work Completed**:
1. **DOM Selectors** (February 23, 2026):
   - Comment input box: `[data-lexical-editor="true"][aria-label^="Comment as"]`, `[data-lexical-editor="true"][aria-label^="Reply to"]`
   - Comment submit button: `div[role="button"][aria-label="Comment"]:not([aria-disabled="true"])`
   - Post author name: `h3 a[role="link"] span`, `strong span`
   - Post author avatar: SVG `image[preserveAspectRatio="xMidYMid slice"]` with `xlink:href`
   - Post text: `span[dir="auto"]` content

2. **Profile Detection**: ✅ Complete
   - Parse `<script data-sjs>` tags with `"snippet": "You"`
   - Extracts: `name`, `profileUrl`, `avatarUrl`

3. **Content Script Updates**: ✅ Complete
   - PostScraper.ts selectors filled in
   - extractCommentText handles Lexical editor `<p>` elements
   - extractPostAuthorAvatar handles SVG `xlink:href` attributes
   - Toast message updated to show activities count
   - Local verification store tracking added

4. **Testing**: ✅ PASSED (February 23, 2026)
   - [x] Comment on Facebook news feed post (inline)
   - [x] Reply on focused modal post
   - [x] Profile detection works
   - [x] Toast flow works correctly
   - [x] Post URL extraction fixed (handles photo albums, group photos)

5. **Web App Updates**: ✅ Complete
   - [x] Added Facebook tab to profile page platform filters
   - [x] Fixed activity cards to use standardized schema fields
   - [x] Added Facebook icon and badge styling (#1877f2 blue)
   - [x] Fixed filter logic for all platform types

**Notes**:
- Facebook keyboard submit is Enter (not Ctrl+Enter like LinkedIn/X)
- Facebook comments don't have direct URLs, use post URL with photo `set=pcb.{postId}` extraction
- Facebook uses Lexical editor (not TipTap/Quill like LinkedIn)

---

### Phase 20: Threads Content Script ⏸️ DEFERRED

**Pre-requisite**: Phase 19 (Facebook) complete ✅

**Status**: Code written but deferred for later. Focus is on LinkedIn, X, and Facebook for now.

**Work Completed** (February 23, 2026):
1. [x] Created `threads.content/` folder structure
2. [x] `ThreadsProfileDetector.ts` - extracts user from `BarcelonaSharedData.viewer` JSON
3. [x] `ThreadsReplyScraper.ts` - scrapes reply context with modal/inline support
4. [x] `stores/profile-store.ts` - Zustand store for Threads profile
5. [x] `index.tsx` - Main content script with verification flow
6. [x] Submit button detection (modal "Post" button vs inline rotated arrow)
7. [x] Toast URL extraction (`a[href*="/post/"]` inside "Posted" toast)
8. [x] Ctrl+Enter keyboard shortcut support

**Not in manifest** - Threads URLs not added to `wxt.config.ts` to keep extension focused on core platforms.

---

### Phase 21: Reddit Content Script ⏸️ DEFERRED

**Pre-requisite**: Phase 19 (Facebook) complete ✅

**Status**: Deferred. Focus is on LinkedIn, X, and Facebook for MVP.

**Work**:
1. Create `reddit.content/` folder structure
2. Handle multiple Reddit UIs (old, new, sh)
3. DOM inspection for selectors
4. Profile detection

---

### Phase 22: Product Hunt Content Script 📋 TODO

**Pre-requisite**: Phase 21 complete

---

### Phase 23: GitHub Content Script 📋 TODO

**Pre-requisite**: Phase 22 complete

**Special considerations**:
- Multiple comment contexts: Issues, PRs, Discussions, PR Reviews
- May want to capture repo/issue context

---

### Phase 24: Hacker News Content Script 📋 TODO

**Pre-requisite**: Phase 23 complete

**Notes**:
- Simple HTML structure (easiest platform)
- Stable selectors unlikely to change

---

## Platform Roadmap Summary

| Phase | Platform | Status | Priority |
|-------|----------|--------|----------|
| 5-10 | LinkedIn | ✅ Complete | Core |
| 7 | X/Twitter | ✅ Complete | Core |
| 16 | Schema Standardization | ✅ Complete | Core |
| 17 | LinkedIn/X Verification Testing | ✅ Complete | Core |
| 18 | Account Verification System | 📋 TODO | Core |
| 19 | Facebook | ✅ Complete | Core |
| 20 | Threads | ⏸️ Deferred | Tier 2 |
| 21 | Reddit | ⏸️ Deferred | Tier 2 |
| 22 | Product Hunt | ⏸️ Deferred | Tier 2 |
| 23 | GitHub | ⏸️ Deferred | Tier 2 |
| 24 | Hacker News | ⏸️ Deferred | Tier 2 |

---

## Success Criteria

### MVP Launch Ready When:
- [x] First-time user can verify on LinkedIn → gets Human #
- [x] First-time user can verify on X → gets Human #
- [x] Streak tracks correctly
- [x] Personal profile page shows activity history
- [x] Leaderboard shows top verified users
- [x] Platform links auto-detected and can be updated
- [x] Sidebar shows mini profile with stats
- [x] Post-signup onboarding flow
- [x] Mobile responsive layouts
- [x] LinkedIn/X verification still works after schema changes (Phase 17)

### V1.1 - Platform Expansion:
- [ ] Account verification system (Phase 18)
- [x] Facebook verification works (Phase 19)
- [ ] Threads verification works (Phase 20) - DEFERRED

### V1.2 - Full Platform Support:
- [ ] Reddit verification works (Phase 21) - DEFERRED
- [ ] Product Hunt verification works (Phase 22) - DEFERRED
- [ ] GitHub verification works (Phase 23) - DEFERRED
- [ ] Hacker News verification works (Phase 24) - DEFERRED

---

## Next Steps

**Current**: Phase 18 - Account Verification System

Phases 17 (LinkedIn/X testing) and 19 (Facebook) are complete. Core MVP platforms are done:
- ✅ LinkedIn
- ✅ X/Twitter
- ✅ Facebook

**Next Priority Items**:

1. **Phase 18: Account Verification System** - Ensure platform links are legitimate
   - Options: OAuth, code verification, or activity pattern verification
   - Prevents users from claiming accounts they don't own

2. **Landing Page Updates**:
   - Replace placeholder avatars with real verified user photos
   - Replace video placeholder with actual demo video
   - Add Chrome Web Store install button once published

3. **Polish & Launch Prep**:
   - [ ] End-to-end testing on all 3 platforms
   - [ ] Extension store listing preparation
   - [ ] Production deployment verification

**Deferred to V1.1+**:
- Threads, Reddit, Product Hunt, GitHub, Hacker News content scripts

---

## Landing Page Updates (Feb 23, 2026)

### Completed:
- [x] Hero section redesigned with 2-column layout
  - Left: Headline, username claim input, trust badges
  - Right: 3D tilting video card with hover interaction
- [x] Created `AvatarBubbleGrid` component with physics-like bubble hover effect
  - Hovered avatar scales up and stays in place
  - Adjacent avatars smoothly push away to make room
  - Smooth spring animation with cubic-bezier easing
- [x] Moved avatar grid to video demo section (section 2)
- [x] Added stats counter below avatars ("X verified humans and counting...")
- [x] Reduced hero section top padding for tighter layout
- [x] Fixed fonts to use theme's Fira Sans consistently
- [x] Removed shadows from non-button elements (input, avatars)

### TODO - Landing Page:
- [ ] Replace placeholder avatars with real verified user photos from database
- [ ] Replace video placeholder with actual demo video
- [ ] Add Chrome Web Store install button/link once extension is published

---

**Plan Status**: ✅ COMPLETE - Core MVP features done (LinkedIn, X, Facebook)

---

## Plan Completion Summary (February 23, 2026)

### What Was Built:
- ✅ LinkedIn comment detection (V1 + V2 DOM, nested replies)
- ✅ X/Twitter reply detection (feed + single tweet)
- ✅ Facebook comment detection (feed + modal, Lexical editor)
- ✅ Triss toast notification system (all states)
- ✅ Silent webcam capture via offscreen document
- ✅ AWS Rekognition face detection
- ✅ Auto platform linking from DOM
- ✅ Streak tracking (current + longest)
- ✅ Profile page with heatmap, stats, activity feed
- ✅ Leaderboard with pagination
- ✅ Profile settings sidebar (display name, bio, layout, badge style)
- ✅ Check Human tab with auto-detect + manual lookup
- ✅ SPA navigation detection (History API interception)
- ✅ Extension popup with auth check + platform buttons
- ✅ Clerk auth integration (web + extension sync)
- ✅ Clerk webhook (user + profile creation)
- ✅ Welcome/onboarding flows (web + extension)
- ✅ Landing page (hero, video demo, how it works, activity feed, leaderboard preview)
- ✅ Badge overlay for LinkedIn profiles
- ✅ Camera permission on install + camera_needed toast
- ✅ WXT config with consistent extension ID

### Deferred to V1.1+:
- Account verification system (Phase 18)
- Threads, Reddit, Product Hunt, GitHub, Hacker News content scripts

### Next Steps:
See **trusthuman-production-launch_PLAN_23-02-26.md** for production deployment tasks:
- Production Supabase database
- Clerk production setup
- Loops welcome email integration
- Chrome Web Store submission
- Demo video
