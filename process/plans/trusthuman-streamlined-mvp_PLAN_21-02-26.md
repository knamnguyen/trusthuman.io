# TrustHuman Streamlined MVP Plan

**Date**: February 21, 2026
**Complexity**: COMPLEX (Multi-phase with pre-research)
**Status**: PLANNED

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
1. **Personal Page** - `/u/[username]` with activity history cards + links to original posts
2. **Leaderboard** - Simple table: rank, username, verified count
3. **Basic Stats Display** - Verified badge + 3 metrics (total verified, streak, rank)
4. **Settings** - Change linked LinkedIn/X accounts

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

## Architecture

```
Extension (WXT Chrome MV3)
├── Content Scripts
│   ├── linkedin.content/ (already exists)
│   │   ├── Reply detection + comment capture
│   │   ├── Auto-detect logged-in profile
│   │   ├── Badge overlay injection on profiles
│   │   └── Sidebar UI (mini profile)
│   └── x.content/ (new)
│       ├── Reply detection + tweet capture
│       ├── Auto-detect logged-in profile
│       ├── Badge overlay on profiles + hover cards
│       └── Sidebar UI (mini profile)
├── Background Worker
│   └── Camera capture via offscreen document
└── Offscreen Document
    └── getUserMedia → canvas → base64

Web App (Next.js on Vercel)
├── Public Routes
│   ├── /u/[username] - Personal profile page
│   └── /leaderboard - Global rankings
├── Protected Routes
│   ├── /dashboard - Own stats
│   └── /settings - Account + platform links
└── API (tRPC)
    ├── verification.analyzePhoto
    ├── verification.submitActivity
    ├── profile.getByUsername
    ├── profile.getLeaderboard
    ├── platformLink.autoLink
    ├── platformLink.update
    └── platformLink.batchLookup (for badge overlay)
```

---

## Database Schema

### User (Synced from Clerk)

```prisma
model User {
  id            String    @id  // Clerk user ID
  email         String    @unique
  firstName     String?
  lastName      String?
  imageUrl      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  trustProfile  TrustProfile?
}
```

### TrustProfile (Core Identity)

```prisma
model TrustProfile {
  id                  String    @id @default(uuid())
  humanNumber         Int       @unique @default(autoincrement())  // Human #1, #2...
  userId              String    @unique
  username            String    @unique  // URL-safe for /u/username
  displayName         String?
  avatarUrl           String?

  // Stats
  totalVerifications  Int       @default(0)
  currentStreak       Int       @default(0)
  longestStreak       Int       @default(0)
  lastVerifiedAt      DateTime?
  lastStreakDate      DateTime?  // Last date streak was updated

  // Settings
  isPublic            Boolean   @default(true)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  platformLinks       PlatformLink[]
  linkedinComments    VerifiedLinkedInComment[]
  xReplies            VerifiedXReply[]
  verifications       HumanVerification[]

  @@index([username])
  @@index([humanNumber])
  @@index([totalVerifications])
}
```

### PlatformLink (Auto-detected + Overridable)

```prisma
model PlatformLink {
  id              String    @id @default(uuid())
  trustProfileId  String
  platform        String    // "linkedin" | "x"

  // Profile info (scraped from DOM)
  profileUrl      String    // Canonical URL (linkedin.com/in/xxx or x.com/xxx)
  profileHandle   String    // @username or /in/slug
  displayName     String?
  avatarUrl       String?

  // Metadata
  autoDetected    Boolean   @default(true)  // Was this auto-captured?
  linkedAt        DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  trustProfile    TrustProfile @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  @@unique([trustProfileId, platform])  // One link per platform per user
  @@unique([platform, profileUrl])      // Each profile globally unique
  @@index([platform, profileHandle])    // For badge lookup
}
```

### VerifiedLinkedInComment

```prisma
model VerifiedLinkedInComment {
  id                  String    @id @default(uuid())
  trustProfileId      String

  // User's comment
  commentText         String    @db.Text

  // Post being replied to (scraped)
  postUrl             String
  postAuthorName      String?
  postAuthorProfileUrl String?
  postAuthorAvatarUrl String?
  postAuthorHeadline  String?
  postTextSnippet     String?   @db.VarChar(500)

  // Verification link
  verificationId      String?   @unique

  createdAt           DateTime  @default(now())

  trustProfile        TrustProfile       @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)
  verification        HumanVerification? @relation(fields: [verificationId], references: [id])

  @@index([trustProfileId])
  @@index([createdAt])
}
```

### VerifiedXReply

```prisma
model VerifiedXReply {
  id                  String    @id @default(uuid())
  trustProfileId      String

  // User's reply
  replyText           String    @db.Text

  // Tweet being replied to (scraped)
  tweetUrl            String
  tweetAuthorName     String?
  tweetAuthorHandle   String?
  tweetAuthorProfileUrl String?
  tweetAuthorAvatarUrl String?
  tweetTextSnippet    String?   @db.VarChar(500)

  // Verification link
  verificationId      String?   @unique

  createdAt           DateTime  @default(now())

  trustProfile        TrustProfile       @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)
  verification        HumanVerification? @relation(fields: [verificationId], references: [id])

  @@index([trustProfileId])
  @@index([createdAt])
}
```

### HumanVerification

```prisma
model HumanVerification {
  id              String    @id @default(uuid())
  trustProfileId  String

  // Result
  verified        Boolean
  confidence      Float
  faceCount       Int
  rawResponse     Json?

  // Activity type
  activityType    String    // "linkedin_comment" | "x_reply"

  createdAt       DateTime  @default(now())

  trustProfile    TrustProfile @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  // Reverse relations (one of these will be set)
  linkedinComment VerifiedLinkedInComment?
  xReply          VerifiedXReply?

  @@index([trustProfileId])
  @@index([createdAt])
}
```

---

## User Flows

### Flow 1: First-Time User (LinkedIn)

```
1. User installs extension
   → Extension requests camera permission (auto-prompt or via sidebar button)

2. User navigates to LinkedIn, logs in

3. User writes a comment and clicks submit
   → Extension detects submit button click
   → Shows "submitted" toast (Triss)

4. Extension captures:
   a. User's logged-in profile (from DOM nav/header)
      - profileUrl: linkedin.com/in/johndoe
      - displayName: "John Doe"
      - avatarUrl: profile pic
   b. Comment text
   c. Post context (author, headline, URL, snippet)
   d. Webcam photo (silent, no preview)

5. Extension calls tRPC: verification.submitActivity
   Input: {
     photoBase64,
     platform: "linkedin",
     userProfile: { profileUrl, displayName, avatarUrl },
     comment: { text, postUrl, postAuthor... }
   }

6. Server:
   a. Runs face detection (AWS Rekognition)
   b. Creates User (if new, from Clerk session)
   c. Creates TrustProfile (humanNumber auto-assigned)
   d. Creates PlatformLink (autoDetected: true)
   e. Creates VerifiedLinkedInComment
   f. Creates HumanVerification (linked to comment)
   g. Updates TrustProfile stats (totalVerifications++, streak)
   h. Returns: { verified, humanNumber, isFirstVerification }

7. Extension shows toast:
   - If first: "Welcome Human #42! You're verified!"
   - If repeat: "Verified! Streak: 5 days"

8. Sidebar updates to show new activity card
```

### Flow 2: Returning User (Different LinkedIn Account)

```
1. User logs into different LinkedIn account

2. User writes a comment and clicks submit

3. Extension detects logged-in profile differs from stored PlatformLink
   → Shows prompt: "You're logged in as @newuser but linked to @olduser. Update?"

4a. User clicks "Update":
    → Extension calls platformLink.update
    → New profile linked, old one unlinked
    → Verification proceeds

4b. User clicks "Keep current":
    → Verification still proceeds (activity recorded)
    → PlatformLink not updated
    → Badge will show on old account (user's choice)
```

### Flow 3: Badge Overlay (Viewing Other Users)

```
1. Extension user navigates to linkedin.com/in/someone

2. Content script detects profile page load
   → Extracts profile URL: linkedin.com/in/someone

3. Extension calls: platformLink.batchLookup
   Input: { platform: "linkedin", profileUrls: ["linkedin.com/in/someone"] }
   Returns: [{ profileUrl, trustProfile: { humanNumber, totalVerifications, streak } }]

4. If match found:
   → Inject badge next to profile name
   → Badge shows: "✓ Human #42 | 147 verified | 12-day streak"

5. If no match:
   → No badge injected (user not verified)
```

### Flow 4: X Hover Card Badge

```
1. Extension user hovers over @username on X

2. X shows native hover card (profile preview)

3. Content script detects hover card appeared
   → MutationObserver watching for hover card DOM element
   → Extracts @handle from hover card

4. Extension calls: platformLink.batchLookup (cached from recent lookups)
   → Or uses local cache if recently fetched

5. If match found:
   → Inject mini badge into hover card
   → Shows: "✓ #42"

6. Hover card dismissed → badge removed with it
```

### Flow 5: View Personal Profile (Web)

```
1. Anyone navigates to trusthuman.io/u/johndoe

2. Server fetches TrustProfile by username
   → Includes: humanNumber, stats, recent activities

3. Page renders:
   ┌────────────────────────────────────────┐
   │  [Avatar]  John Doe                    │
   │  Human #42                             │
   │  ✓ 147 verified | 🔥 12-day streak     │
   │  Rank #23 on leaderboard               │
   ├────────────────────────────────────────┤
   │  Recent Verified Activity              │
   │  ┌──────────────────────────────────┐  │
   │  │ Replied to Jane Smith's post     │  │
   │  │ "Great insights on AI trends..." │  │
   │  │ [View on LinkedIn →]             │  │
   │  │ Verified Feb 21, 2026            │  │
   │  └──────────────────────────────────┘  │
   │  ┌──────────────────────────────────┐  │
   │  │ Replied to @elonmusk             │  │
   │  │ "Totally agree with this..."     │  │
   │  │ [View on X →]                    │  │
   │  │ Verified Feb 20, 2026            │  │
   │  └──────────────────────────────────┘  │
   └────────────────────────────────────────┘
```

### Flow 6: Leaderboard

```
1. Anyone navigates to trusthuman.io/leaderboard

2. Server fetches top 100 by totalVerifications

3. Page renders:
   ┌─────┬──────────────┬──────────┬────────┐
   │ #   │ Human        │ Verified │ Streak │
   ├─────┼──────────────┼──────────┼────────┤
   │ 1   │ Human #7     │ 1,247    │ 45     │
   │ 2   │ Human #12    │ 982      │ 30     │
   │ 3   │ Human #42    │ 847      │ 12     │
   │ ... │ ...          │ ...      │ ...    │
   └─────┴──────────────┴──────────┴────────┘
```

---

## API Surface (tRPC)

### verification router

```typescript
verification.submitActivity
  Input: {
    photoBase64: string
    platform: "linkedin" | "x"
    userProfile: {
      profileUrl: string
      profileHandle: string
      displayName?: string
      avatarUrl?: string
    }
    activity: {
      // For linkedin_comment
      commentText?: string
      postUrl?: string
      postAuthorName?: string
      postAuthorProfileUrl?: string
      postAuthorAvatarUrl?: string
      postAuthorHeadline?: string
      postTextSnippet?: string
      // For x_reply
      replyText?: string
      tweetUrl?: string
      tweetAuthorName?: string
      tweetAuthorHandle?: string
      tweetAuthorProfileUrl?: string
      tweetAuthorAvatarUrl?: string
      tweetTextSnippet?: string
    }
  }
  Output: {
    verified: boolean
    confidence: number
    humanNumber: number
    isFirstVerification: boolean
    totalVerifications: number
    currentStreak: number
  }
  Auth: protectedProcedure (Clerk session required)
```

### profile router

```typescript
profile.getByUsername
  Input: { username: string }
  Output: {
    humanNumber: number
    displayName?: string
    avatarUrl?: string
    totalVerifications: number
    currentStreak: number
    longestStreak: number
    rank: number
    recentActivities: Activity[]  // Last 20
  }
  Auth: publicProcedure

profile.getLeaderboard
  Input: { limit?: number, offset?: number }
  Output: {
    users: {
      rank: number
      humanNumber: number
      username: string
      displayName?: string
      avatarUrl?: string
      totalVerifications: number
      currentStreak: number
    }[]
    total: number
  }
  Auth: publicProcedure

profile.getMyStats
  Input: {}
  Output: {
    humanNumber: number
    totalVerifications: number
    currentStreak: number
    longestStreak: number
    rank: number
    linkedPlatforms: { platform: string, handle: string }[]
  }
  Auth: protectedProcedure
```

### platformLink router

```typescript
platformLink.autoLink
  Input: {
    platform: "linkedin" | "x"
    profileUrl: string
    profileHandle: string
    displayName?: string
    avatarUrl?: string
  }
  Output: { success: boolean, isUpdate: boolean }
  Auth: protectedProcedure
  Notes: Called on first verification or when user confirms update

platformLink.update
  Input: {
    platform: "linkedin" | "x"
    profileUrl: string
    profileHandle: string
    displayName?: string
    avatarUrl?: string
  }
  Output: { success: boolean }
  Auth: protectedProcedure

platformLink.batchLookup
  Input: {
    platform: "linkedin" | "x"
    profileUrls: string[]  // Max 50
  }
  Output: {
    results: {
      profileUrl: string
      found: boolean
      trustProfile?: {
        humanNumber: number
        username: string
        totalVerifications: number
        currentStreak: number
      }
    }[]
  }
  Auth: publicProcedure (rate limited)
  Notes: For badge overlay - batch to reduce API calls
```

---

## Implementation Phases

### Phase 1: Database Schema
**Pre-research**: Review existing schema, check Prisma patterns
**Work**:
- Delete old EngageKit models (if any remaining)
- Create fresh models: User, TrustProfile, PlatformLink, VerifiedLinkedInComment, VerifiedXReply, HumanVerification
- Run migrations
**Test**: Schema applies, relations work, humanNumber auto-increments

### Phase 2: API - Core Verification
**Pre-research**: Review existing verification.analyzePhoto, understand Rekognition flow
**Work**:
- Refactor verification router to handle full activity submission
- Add streak calculation logic
- Add TrustProfile creation on first verification
- Add PlatformLink auto-creation
**Test**: Submit activity → creates all records → returns correct stats

### Phase 3: API - Profile & Leaderboard
**Pre-research**: Review Next.js SSR patterns for public pages
**Work**:
- Create profile router (getByUsername, getLeaderboard, getMyStats)
- Add rank calculation (simple: ORDER BY totalVerifications DESC)
**Test**: Fetch profile by username, fetch leaderboard, ranks are correct

### Phase 4: API - Platform Link & Badge Lookup
**Pre-research**: Design efficient batch lookup query
**Work**:
- Create platformLink router (autoLink, update, batchLookup)
- Add rate limiting to batchLookup
- Add caching layer (optional, can add later)
**Test**: Batch lookup returns correct matches, handles missing profiles

### Phase 5: Extension - LinkedIn Enhancements
**Pre-research**: Review current content script, identify DOM selectors for profile detection
**Work**:
- Add logged-in profile detection (scrape from nav/header)
- Add post context scraping (author, headline, snippet)
- Update submitActivity call with full payload
- Add account mismatch detection + prompt
**Test**: First verification creates PlatformLink, subsequent ones work, mismatch prompts

### Phase 6: Extension - LinkedIn Badge Overlay
**Pre-research**: Identify DOM injection points for LinkedIn profiles
**Work**:
- Add MutationObserver for profile page detection
- Call batchLookup on profile view
- Inject badge HTML/CSS next to profile name
- Handle profile page navigation (SPA)
**Test**: Visit verified user's profile → badge appears, visit non-verified → no badge

### Phase 7: Extension - X Content Script
**Pre-research**: Study X DOM structure for replies, profiles, hover cards
**Work**:
- Create x.content/ entrypoint (similar to linkedin.content/)
- Reply detection + submit button instrumentation
- Logged-in profile detection
- Tweet context scraping
**Test**: Reply on X → verification flow works, activity saved

### Phase 8: Extension - X Badge Overlay
**Pre-research**: Identify X profile page + hover card DOM structure
**Work**:
- Profile page badge injection
- Hover card badge injection (MutationObserver for hover card appearance)
- Batch lookup with caching (hover cards appear/disappear rapidly)
**Test**: Visit X profile → badge, hover over verified user → mini badge in hover card

### Phase 9: Extension - Sidebar Mini Profile
**Pre-research**: Review current sidebar, design activity card component
**Work**:
- Replace current sidebar content with mini profile view
- Activity cards showing recent verifications
- Stats display (verified count, streak, rank)
- Link to full web profile
- Camera permission button (backup)
**Test**: Sidebar shows own stats + recent activities, updates after verification

### Phase 10: Web App - Public Profile Page
**Pre-research**: Review Next.js App Router patterns, SSR for OG tags
**Work**:
- Create /u/[username]/page.tsx (server component)
- Fetch TrustProfile + recent activities
- Render profile card + activity list
- Add OG meta tags for link previews
**Test**: Visit /u/username → renders profile, link preview works on LinkedIn/X

### Phase 11: Web App - Leaderboard Page
**Pre-research**: Review pagination patterns
**Work**:
- Create /leaderboard/page.tsx
- Fetch top users with pagination
- Render table with rank, human#, stats
**Test**: Leaderboard loads, pagination works, ranks are accurate

### Phase 12: Web App - Dashboard & Settings
**Pre-research**: Review Clerk integration for protected routes
**Work**:
- Create /dashboard/page.tsx (own stats)
- Create /settings/page.tsx (manage platform links)
- Add manual platform link update UI
**Test**: Dashboard shows own stats, can update platform links

### Phase 13: Streak Cron Job
**Pre-research**: Review Vercel Cron setup
**Work**:
- Create daily cron job (midnight UTC)
- For each active profile: check if verified today
- If no verification: break streak (currentStreak = 0)
- Update lastStreakDate
**Test**: Miss a day → streak resets, verify daily → streak increments

### Phase 14: Polish & Testing
**Work**:
- End-to-end testing all flows
- Error handling improvements
- Loading states
- Mobile responsive (web app)
- Performance optimization (badge lookup caching)
**Test**: All flows work reliably, no crashes, reasonable performance

---

## DOM Selectors (Research Required)

### LinkedIn (Phase 5-6)
```
Logged-in profile detection:
- TBD: Nav bar profile link, or profile dropdown

Comment submit button:
- Already have: 'button[data-view-name="comment-post"]'

Post context:
- Author name: TBD
- Author profile URL: TBD
- Author avatar: TBD
- Author headline: TBD
- Post text: TBD

Profile page badge injection point:
- TBD: Next to profile name in header
```

### X/Twitter (Phase 7-8)
```
Logged-in profile detection:
- TBD: Sidebar profile link with @handle

Reply submit button:
- 'button[data-testid="tweetButtonInline"]'

Tweet context:
- Author name: TBD
- Author handle: TBD
- Author avatar: TBD
- Tweet text: TBD

Profile page badge injection point:
- TBD: Next to display name

Hover card badge injection:
- TBD: Hover card container, next to name
```

---

## Success Criteria

### MVP Launch Ready When:
- [ ] First-time user can verify on LinkedIn → gets Human #
- [ ] First-time user can verify on X → gets Human #
- [ ] Streak tracks correctly (increments daily, resets on miss)
- [ ] Badge appears on verified users' LinkedIn profiles
- [ ] Badge appears on verified users' X profiles + hover cards
- [ ] Personal profile page shows activity history
- [ ] Leaderboard shows top verified users
- [ ] Platform links auto-detected and can be updated
- [ ] Sidebar shows mini profile with stats

### Metrics to Track:
- Total verified users (Human # count)
- Daily active verifiers
- Average streak length
- Badge impressions (how often badges are seen)
- Profile page views
- Leaderboard views

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| LinkedIn/X DOM changes break selectors | Use multiple fallback selectors, monitor for breakage |
| Badge overlay feels spammy | Subtle design, only show on profile pages (not feeds) |
| batchLookup API abuse | Rate limiting, require extension auth token |
| Camera permission denied | Clear onboarding, sidebar backup button |
| Streak too punishing (no freeze) | Monitor user feedback, can add freeze tokens in V2 |
| Profile scraping fails | Graceful fallback to basic capture, retry logic |

---

## File Structure (Final)

```
apps/trustahuman-ext/
├── entrypoints/
│   ├── background/
│   │   └── index.ts
│   ├── offscreen.html
│   ├── offscreen.ts
│   ├── linkedin.content/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── ToggleButton.tsx
│   │   ├── Sidebar.tsx (mini profile)
│   │   ├── ActivityCard.tsx
│   │   ├── BadgeOverlay.tsx
│   │   ├── ProfileDetector.ts
│   │   ├── PostScraper.ts
│   │   └── stores/
│   │       ├── sidebar-store.ts
│   │       ├── profile-store.ts
│   │       └── shadow-root-store.ts
│   └── x.content/
│       ├── index.tsx
│       ├── App.tsx
│       ├── ToggleButton.tsx
│       ├── Sidebar.tsx
│       ├── ActivityCard.tsx
│       ├── BadgeOverlay.tsx
│       ├── HoverCardBadge.tsx
│       ├── ProfileDetector.ts
│       ├── TweetScraper.ts
│       └── stores/
│           └── (shared with linkedin via imports)
├── lib/
│   ├── trpc-client.ts
│   └── badge-cache.ts
└── assets/
    └── globals.css

apps/nextjs/
├── src/app/
│   ├── (public)/
│   │   ├── u/[username]/
│   │   │   └── page.tsx
│   │   └── leaderboard/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       ├── trpc/[trpc]/
│       │   └── route.ts
│       └── cron/
│           └── streak/
│               └── route.ts

packages/api/
├── src/
│   ├── router/
│   │   ├── root.ts
│   │   ├── verification.ts
│   │   ├── profile.ts
│   │   └── platformLink.ts
│   └── trpc.ts

packages/db/
├── prisma/
│   ├── schema.prisma
│   └── models/
│       ├── user.prisma
│       ├── trust-profile.prisma
│       ├── platform-link.prisma
│       ├── verified-linkedin-comment.prisma
│       ├── verified-x-reply.prisma
│       └── human-verification.prisma
```

---

## Next Steps

Say **"Begin Phase 1"** to start with database schema setup.

Each phase will follow:
1. Pre-research (read existing code, identify patterns)
2. Detailed plan (exact files, changes)
3. User approval
4. Implementation
5. Testing
6. Phase sign-off

---

**Plan Status**: READY FOR EXECUTION
