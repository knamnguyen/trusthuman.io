# Trust a Human - MVP Plan (Streamlined)

**Date**: February 15, 2026 (Updated: February 22, 2026)
**Complexity**: SIMPLE (one session)
**Status**: IN PROGRESS

---

## Phase Completion Rules

**IMPORTANT: A phase is NOT complete until:**

1. **Integration Test** - Does it work with other pieces end-to-end?
2. **Manual Test** - Can user actually perform the action?
3. **Database Check** - Is data saved correctly? Query and verify.
4. **Error Handling** - What happens when it fails? Is it graceful?
5. **User Confirmation** - User visually confirms it works (screenshot/video)

**"Code exists" ≠ "Feature works"**

After each phase, document:
- What was tested manually
- What data was verified in DB
- Any errors encountered and how they were fixed
- User confirmation of working feature

---

## Progress Summary

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| 1 | Database Schema | ✅ DONE | Schema pushed, verified working |
| 2 | API - Core Verification | ✅ DONE | Rekognition + submitActivity working |
| 3 | Extension Scaffold | ✅ DONE | UI renders in Shadow DOM |
| 4 | Background + Offscreen | ✅ DONE | Camera capture working |
| 5 | LinkedIn Enhancements | ✅ DONE | Profile + post scraping working |
| 5.5 | Extension Authentication | ✅ DONE | Clerk auth + tRPC working |
| 5.9 | E2E Verification Flow Test | ✅ DONE | Full flow verified |
| 6 | Landing Page + Onboarding | ✅ DONE | Full landing page + profile + leaderboard |
| 7 | Profile Page | ✅ DONE | Merged into Phase 6 |
| 8 | Leaderboard | ✅ DONE | Merged into Phase 6 |
| 9A | TrustBadge Component | ✅ DONE | Shared UI component in packages/ui |
| **9B** | **Badge Injection** | **NEXT** | **Inject badge on LinkedIn/X profiles** |
| 10 | X/Twitter Support | PENDING | Same flow for X platform |
| 11 | Loops Email Integration | PENDING | Onboarding + reminder emails |
| 12 | Polish & Testing | PENDING | Final UX polish |

### Phase 5.9: E2E Verification Flow Test ✅ COMPLETED

**All tests passed (Feb 22, 2026):**
1. [x] Camera capture works (offscreen document → base64)
2. [x] AWS Rekognition analyzes photo correctly (90%+ confidence)
3. [x] ProfileDetector detects correct LinkedIn profile (via ProfileStore on page load)
4. [x] PostScraper captures comment text and post context (V2 DOM selectors)
5. [x] `submitActivity` API saves to database
6. [x] TrustProfile created with humanNumber
7. [x] PlatformLink created for LinkedIn
8. [x] VerifiedLinkedInComment saved with commentUrl + commentUrn
9. [x] Streak calculation works
10. [x] Triss toast shows correct feedback

**Key fixes during E2E testing:**
- Fixed foreign key constraint: User record must be created before TrustProfile
- Fixed ProfileDetector: Now uses ProfileStore pattern (fetch on page load, not on submit)
- Fixed PostScraper author name extraction: Excludes badge text like "Premium Profile"
- Added comment URL extraction: Captures before/after submission to find new comment URL
- Enhanced VerificationCard: Shows post preview or author headline as fallback
- Sidebar width: Matched wxt-extension (40vw, min 490px)

### Phase 6: Landing Page + Onboarding ✅ COMPLETED (Feb 22, 2026)

**Implemented EngageKit-style landing page with TrustHuman branding:**

**Files created:**
- `apps/nextjs/src/app/_components/landing/landing-content.ts` - Centralized content
- `apps/nextjs/src/app/_components/landing/header.tsx` - Fixed header with nav
- `apps/nextjs/src/app/_components/landing/footer.tsx` - Footer with links
- `apps/nextjs/src/app/_components/landing/hero-section.tsx` - Hero with live human counter
- `apps/nextjs/src/app/_components/landing/video-demo-section.tsx` - YouTube embed
- `apps/nextjs/src/app/_components/landing/how-it-works-section.tsx` - 4-step flow
- `apps/nextjs/src/app/_components/landing/step-card.tsx` - Step cards with video preview
- `apps/nextjs/src/app/_components/landing/badge-showcase-section.tsx` - Badge previews
- `apps/nextjs/src/app/_components/landing/activity-feed-section.tsx` - Live activity
- `apps/nextjs/src/app/_components/landing/activity-card.tsx` - Activity card component
- `apps/nextjs/src/app/_components/landing/leaderboard-preview-section.tsx` - Top 10
- `apps/nextjs/src/app/_components/landing/final-cta-section.tsx` - Final CTA
- `apps/nextjs/src/app/_components/extension-install-toast.tsx` - Global install prompt
- `apps/nextjs/src/app/[username]/page.tsx` - Public profile page
- `apps/nextjs/src/app/leaderboard/page.tsx` - Full leaderboard
- `apps/trustahuman-ext/entrypoints/trusthuman.content/index.ts` - Extension marker

**API endpoints added:**
- `trustProfile.getStats` - Returns totalHumans, totalVerifications
- `trustProfile.getRecentActivity` - Latest verified comments across users

**Landing page sections:**
1. Hero with live counter + "Get Your Human #" CTA
2. Full video demo (YouTube embed)
3. How it works (4 steps with video previews)
4. Badge showcase (LinkedIn, X, TrustHuman profile previews)
5. Live activity feed (recent verified comments)
6. Leaderboard preview (top 10)
7. Final CTA

**Extension detection:**
- Content script injects `data-trusthuman-ext="installed"` on trusthuman.io
- Website shows install toast if extension not detected
- Toast dismissible for 24 hours
- **Tested and working** (Feb 22, 2026)

**Profile page features:**
- Human # badge
- Stats (rank, total verified, current streak, best streak)
- Platform links (LinkedIn, X)
- Recent verified activity
- Owner CTAs to open LinkedIn/X

---

## Overview

WXT Chrome extension in `apps/trustahuman-ext/` with:
- React sidebar UI in Shadow DOM
- Clerk authentication via background worker
- LinkedIn/X profile detection and comment scraping
- Webcam capture via offscreen document
- AWS Rekognition for face detection
- Full verification flow with streaks

---

## User Onboarding Flow (Web-First)

**Strategy**: Sign up on web first → Install extension later

### Why Web-First?
1. **Email capture early** - Get their email before they bounce
2. **Lower friction first step** - Signing up is easier than installing extension
3. **Reminder capability** - Can email "install the extension to start verifying!"
4. **Clerk session exists** - Extension auth "just works" via cookie sync
5. **Commitment escalation** - Small commitment (signup) → bigger commitment (install)

### Onboarding Flow

```
1. Land on trusthuman.io
   └── Hero: "Prove You're Human. Get Your Badge."
   └── CTA: "Get Your Human #" → Sign up (Clerk)

2. Sign up with Clerk (Google/Email)
   └── Account created
   └── TrustProfile created with username

3. Pick username
   └── "Choose your profile URL: trusthuman.io/[username]"
   └── Validates uniqueness

4. Install Extension Prompt
   └── "Install the Chrome extension to start verifying"
   └── Link to Chrome Web Store
   └── "I'll remind you later" → Triggers Loops email sequence

5. Extension Installed
   └── Detects existing Clerk session
   └── Ready to verify on LinkedIn/X

6. First Verification
   └── Human # assigned
   └── Profile page live at trusthuman.io/[username]
   └── Can share badge
```

### Email Sequence (via Loops)
- **Day 0**: "Welcome to TrustHuman! Install the extension to get verified"
- **Day 1**: "You're 1 step away from your Human # badge"
- **Day 3**: "Don't let the bots win - verify your humanity today"
- **Day 7**: "Last chance: Your Human # is waiting"

---

## Architecture

```
Content Script (linkedin.com) — React sidebar in Shadow DOM
    | 1. MutationObserver detects submit button
    | 2. Click listener fires (capture phase)
    | 3. Scrape comment context + user profile
    v
Background Service Worker
    | 4. Clerk auth (getToken, getAuthStatus)
    | 5. Create offscreen document for camera
    v
Offscreen Document
    | 6. getUserMedia -> canvas -> base64 JPEG
    v
Content Script
    | 7. Call submitActivity tRPC (if authenticated)
    |    OR analyzePhoto (if not authenticated)
    v
Server (tRPC)
    | 8. Decode base64, call Rekognition DetectFaces
    | 9. Create/update TrustProfile + PlatformLink
    | 10. Store verification + activity records
    | 11. Calculate streak
    | 12. Return { verified, confidence, humanNumber, streak }
    v
Content Script
    | 13. Show Triss toast feedback
    | 14. Add result to verification-store
```

---

## Remaining Phases

### Phase 6: Landing Page + Onboarding

Create landing page and web-first signup flow.

**Files to create:**
1. `apps/nextjs/src/app/page.tsx` - Landing page with hero + CTA
2. `apps/nextjs/src/app/onboarding/page.tsx` - Username picker after signup
3. `apps/nextjs/src/app/onboarding/install/page.tsx` - Extension install prompt

**Features:**
- Hero section with value prop
- "Get Your Human #" CTA → Clerk sign up
- Post-signup username picker
- Extension install prompt with Chrome Web Store link
- "Remind me later" option (triggers Loops)

**Testing after Phase 6:**
```bash
# Visit landing page
open http://localhost:3000

# Expected:
# - See hero with "Get Your Human #" CTA
# - Click CTA → Clerk sign up modal
# - After signup → redirect to username picker
# - After username → redirect to install prompt
```

---

### Phase 7: Profile Page (Web App)

Create public profile page at `trusthuman.io/[username]`

**Files to create:**
1. `apps/nextjs/src/app/[username]/page.tsx` - Profile page
2. `apps/nextjs/src/app/[username]/layout.tsx` - Profile layout

**Features:**
- Display Human # badge
- Show verification stats (total, streak, longest streak)
- List connected platforms (LinkedIn, X)
- Recent verified activity
- If owner: inline editing for connected accounts
- Share button for social proof

**Testing after Phase 7:**
```bash
# Visit profile page
open http://localhost:3000/withkynam

# Expected:
# - See Human # badge
# - See verification stats
# - See connected platforms
# - If logged in as owner: see edit buttons
```

---

### Phase 8: Leaderboard

Create leaderboard at `trusthuman.io/leaderboard`

**Files to create:**
1. `apps/nextjs/src/app/leaderboard/page.tsx` - Leaderboard page

**Features:**
- Top 100 humans by totalVerifications
- Show rank, Human #, username, avatar
- Link to profile pages
- Pagination

**Testing after Phase 8:**
```bash
# Visit leaderboard
open http://localhost:3000/leaderboard

# Expected:
# - See ranked list of users
# - Click user to go to profile
```

---

### Phase 9: TrustBadge Component + Badge Overlay

**Split into two parts:**

#### Phase 9A: TrustBadge Component (Shared UI) ← CURRENT

Create reusable badge component in `packages/ui` for use in web app and extension.

**Design specs:**
- Colors: green `#469d3e`, background `#fbf6e5`, accent `#ffb74a`
- Shows: Triss logo, human number (ordinal: "14th"), total verified count
- Variants: `full` (with "real human on" text), `compact` (minimal)
- Clickable → links to `trusthuman.io/[username]`

**Files to create:**
1. `packages/ui/src/components/trust-badge.tsx` - Badge component
2. `packages/ui/src/assets/triss-logo.tsx` - Triss SVG as React component

**Integration:**
- Use in `apps/nextjs/src/app/[username]/page.tsx` profile page
- Later: Use in extension for LinkedIn/X badge overlay

**Testing:**
```bash
# Visit http://localhost:3000/trusthuman
# Expected: See TrustBadge with Human #2, verified count
```

#### Phase 9B: LinkedIn/X Badge Injection (Later)

Inject TrustBadge into LinkedIn/X profiles when viewing other users.

**Files to create:**
1. `apps/trustahuman-ext/entrypoints/linkedin.content/BadgeOverlay.tsx` - Badge wrapper
2. `apps/trustahuman-ext/entrypoints/linkedin.content/ProfileBadgeInjector.ts` - DOM injection

**Features:**
- Batch lookup profiles on page via `batchLookup` API
- Database index on `PlatformLink.profileUrl` for fast lookup
- Client-side caching in extension for instant rendering
- Inject badge next to verified profiles
- Click badge to view profile on trusthuman.io

**Testing:**
```bash
# Load extension in Chrome
# Visit LinkedIn profile of someone who has verified
# Expected: See TrustBadge near their name
```

---

### Phase 10: X/Twitter Support

Add X platform support (same verification flow).

**Files to create:**
1. `apps/trustahuman-ext/entrypoints/x.content/index.tsx` - X content script
2. `apps/trustahuman-ext/entrypoints/x.content/ProfileDetector.ts` - X profile detection
3. `apps/trustahuman-ext/entrypoints/x.content/PostScraper.ts` - X post scraping

**Features:**
- Detect X profile from DOM
- Scrape tweet/reply context
- Same verification flow as LinkedIn
- Badge overlay on X profiles

**Testing after Phase 10:**
```bash
# Load extension in Chrome
# Visit x.com
# Post a reply
# Expected: Same Triss flow as LinkedIn
```

---

### Phase 11: Loops Email Integration

Set up transactional and marketing emails via Loops.

**Setup:**
1. Create Loops account at loops.so
2. Add API key to environment variables
3. Create email templates

**Email Triggers:**
| Event | Email | Timing |
|-------|-------|--------|
| User signs up | Welcome + install extension | Immediate |
| No extension after 1 day | Reminder #1 | Day 1 |
| No extension after 3 days | Reminder #2 | Day 3 |
| No extension after 7 days | Final reminder | Day 7 |
| First verification | Congrats + share prompt | Immediate |
| Streak milestone (7, 30, 100) | Streak celebration | Immediate |
| Streak broken | Re-engagement | Next day |

**Files to create:**
1. `packages/api/src/lib/loops.ts` - Loops client wrapper
2. `packages/api/src/router/email.ts` - Email trigger endpoints

**Environment Variables:**
```env
LOOPS_API_KEY=...
```

**Testing after Phase 11:**
```bash
# Sign up new user
# Check Loops dashboard for contact created
# Check email received
# Wait 1 day (or trigger manually) → Reminder email
```

---

### Phase 12: Polish & Testing

Final UX polish and comprehensive testing.

**Tasks:**
1. Test full auth flow (sign in, sign out, re-auth)
2. Test streak calculation across days
3. Test profile editing
4. Test badge overlay accuracy
5. Test X platform flow
6. Test email sequences
7. Performance optimization
8. Error handling improvements
9. Mobile responsiveness for web pages

**Testing after Phase 12:**
```bash
# Full E2E test checklist:
# [ ] Land on homepage → Sign up
# [ ] Pick username
# [ ] Install extension prompt
# [ ] Install extension
# [ ] Go to LinkedIn
# [ ] Verify on LinkedIn
# [ ] See Human # assigned
# [ ] Check profile page
# [ ] Check leaderboard
# [ ] See badge on verified profiles
# [ ] Sign out and verify still shows toast (public flow)
# [ ] Repeat on X
# [ ] Check emails received
```

---

## Completed Phase Details

### Phase 1: Database Schema (COMPLETED)

**Changes made:**
- `trust-profile.prisma`: Simplified (removed V2 features like bio, streakFreeze, referrals)
- `platform-link.prisma`: Added autoDetected, renamed connectedAt→linkedAt
- `human-verification.prisma`: Removed userId, reversed FK direction
- `verified-linkedin-comment.prisma`: Added verificationId FK

**Testing completed:**
```bash
pnpm db:generate  # Generated Prisma client
pnpm db:push      # Pushed to Supabase
```

---

### Phase 2: API - Core Verification (COMPLETED)

**Endpoints created:**
- `verification.analyzePhoto` - Public, no auth required
- `verification.submitActivity` - Protected, full flow with profile creation
- `trustProfile.getByUsername` - Public, with isOwner flag
- `trustProfile.getLeaderboard` - Public, paginated
- `platformLink.batchLookup` - Public, up to 50 profiles

**Testing completed:**
```bash
# Test analyzePhoto (public)
curl -X POST http://localhost:3000/api/trpc/verification.analyzePhoto \
  -H "Content-Type: application/json" \
  -d '{"json":{"photoBase64":"..."}}'

# Test getLeaderboard
curl http://localhost:3000/api/trpc/trustProfile.getLeaderboard
```

---

### Phase 5: LinkedIn Enhancements (COMPLETED)

**Files created:**
- `ProfileDetector.ts` - Detects logged-in LinkedIn profile
- `PostScraper.ts` - Scrapes post/comment context

**Features:**
- Auto-detect user profile URL and handle
- Capture comment text and post context
- Pass to submitActivity API

---

### Phase 5.5: Extension Authentication (COMPLETED)

**Files created:**
- `lib/get-sync-host-url.ts` - Clerk sync host + API URL for dev/prod
- `lib/auth-service.ts` - Content script auth interface
- `lib/auth-store.ts` - Zustand auth state
- `entrypoints/linkedin.content/SignInOverlay.tsx` - Auth overlay for sidebar
- `entrypoints/popup/index.html` - Popup HTML
- `entrypoints/popup/main.tsx` - Popup entry
- `entrypoints/popup/App.tsx` - Popup UI (LinkedIn/X detection + sidebar toggle)

**Files updated:**
- `entrypoints/background/index.ts` - Full Clerk integration
- `lib/trpc-client.ts` - Uses authService.getToken() + getApiUrl()
- `entrypoints/linkedin.content/index.tsx` - Init auth store + sidebar listener
- `entrypoints/linkedin.content/VerificationSidebar.tsx` - Shows SignInOverlay when not authenticated
- `entrypoints/linkedin.content/stores/sidebar-store.ts` - OPEN_SIDEBAR message listener
- `wxt.config.ts` - Added alarms, cookies permissions
- `apps/nextjs/src/app/extension-auth/page.tsx` - TrustHuman branding

**Key Features:**
- SignInOverlay covers sidebar when not authenticated
- Popup detects LinkedIn/X and shows appropriate actions
- "Go to LinkedIn" / "Go to X" buttons when on other sites
- "Open Sidebar" button sends message to content script
- tRPC uses `VITE_NGROK_URL` for content script CORS (can't use localhost)

**Auth Flow:**
```
Content Script → chrome.runtime.sendMessage("getToken")
    ↓
Background Worker → Clerk client → getToken()
    ↓
Content Script → tRPC headers: Authorization: Bearer <token>
    ↓
Server → Clerk middleware → ctx.user
```

**Testing:**
```bash
# Build extension
pnpm build  # In apps/trustahuman-ext

# Load in Chrome
1. Go to chrome://extensions
2. Enable Developer mode
3. Load unpacked from apps/trustahuman-ext/dist/chrome-mv3

# Test popup
1. Click extension icon on any page
2. If not on LinkedIn/X: See "Go to LinkedIn" / "Go to X" buttons
3. Click to navigate

# Test sidebar + auth overlay
1. Go to LinkedIn
2. Click extension icon → "Open Sidebar"
3. Should see SignInOverlay with "Sign In to TrustHuman" button
4. Click sign in → opens extension-auth page
5. Sign in with Clerk
6. Return to LinkedIn, click "Refresh" or reopen sidebar
7. Should see sidebar content without overlay

# Test verification
1. Post a comment on LinkedIn
2. Should call submitActivity (check console)
3. Should see Triss toast feedback
```

---

## Environment Variables Required

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Extension
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_NGROK_URL=https://dev.trusthuman.io  # Required for content script API calls

# AWS Rekognition
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Database
DATABASE_URL=postgresql://...

# Loops (Phase 11)
LOOPS_API_KEY=...
```

---

## Acceptance Criteria

### MVP Complete When:

- [x] Extension builds without errors
- [x] Extension loads in Chrome
- [x] Popup shows LinkedIn/X navigation
- [x] Toggle button visible on LinkedIn
- [x] Sidebar opens with Triss mascot
- [x] SignInOverlay shows when not authenticated
- [x] Comment submit triggers camera capture
- [x] Face detection works via Rekognition
- [x] Clerk auth works (sign in, get token)
- [x] submitActivity creates TrustProfile + PlatformLink
- [x] Streak calculation works
- [x] Landing page with signup CTA
- [x] Extension install prompt (global toast)
- [x] Profile page shows user stats
- [x] Leaderboard shows top users
- [x] Extension detection works (DOM marker)
- [ ] Badge overlay shows on verified profiles
- [ ] X platform support works
- [ ] Loops email integration

---

## Dependencies

- `@aws-sdk/client-rekognition` (server)
- `@clerk/chrome-extension` (extension)
- `@clerk/nextjs` (web app)
- `@sassy/ui` (shared components)
- Supabase (database)
- AWS credentials
- Loops (email)

---

## File Structure (Extension)

```
apps/trustahuman-ext/
├── assets/
│   └── globals.css
├── entrypoints/
│   ├── background/
│   │   └── index.ts              # Clerk + message router
│   ├── popup/
│   │   ├── index.html            # Popup HTML
│   │   ├── main.tsx              # Popup entry
│   │   └── App.tsx               # Popup UI
│   ├── linkedin.content/
│   │   ├── index.tsx             # Content script entry
│   │   ├── App.tsx               # Main React app
│   │   ├── VerificationSidebar.tsx
│   │   ├── SignInOverlay.tsx     # Auth overlay
│   │   ├── ProfileDetector.ts    # Detect logged-in user
│   │   ├── PostScraper.ts        # Scrape comment context
│   │   └── stores/
│   │       ├── verification-store.ts
│   │       ├── sidebar-store.ts  # + OPEN_SIDEBAR listener
│   │       └── shadow-root-store.ts
│   ├── offscreen.html
│   └── offscreen.ts              # Camera capture
├── lib/
│   ├── auth-service.ts           # Content script auth
│   ├── auth-store.ts             # Zustand auth state
│   ├── get-sync-host-url.ts      # Clerk sync host + API URL
│   └── trpc-client.ts            # tRPC with auth
├── wxt.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Next Steps

1. ~~**Phase 6**: Landing page + onboarding flow~~ ✅ DONE
2. ~~**Phase 7**: Profile page~~ ✅ DONE (merged into Phase 6)
3. ~~**Phase 8**: Leaderboard~~ ✅ DONE (merged into Phase 6)
4. **Phase 9**: Badge overlay for verified profiles ← **NEXT**
5. **Phase 10**: X/Twitter support
6. **Phase 11**: Loops email integration
7. **Phase 12**: Final polish and testing
