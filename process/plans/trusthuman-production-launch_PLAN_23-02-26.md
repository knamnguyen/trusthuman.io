# TrustHuman Production Launch Plan

**Date**: February 23, 2026
**Complexity**: COMPLEX (Multi-step production setup)
**Status**: IN PROGRESS

---

## Overview

This plan covers all steps needed to launch TrustHuman to production. The core MVP features (LinkedIn, X, Facebook verification) are complete. This plan focuses on production infrastructure setup and Chrome Web Store submission.

**Dependency Chain**:
```
Supabase Prod DB → Clerk Production → Extension ID → Chrome Web Store → Launch
                         ↓
                    Loops Integration
```

---

## Phase 25: Production Database Setup

**Status**: ✅ COMPLETE
**Priority**: 🔴 CRITICAL (Blocks everything)

### Tasks:
- [x] Create new Supabase project for production
- [x] Note the connection string (pooler URL)
- [ ] Run Prisma migrations against production DB
- [ ] Verify schema matches development

### Production Database:
```
DATABASE_URL="postgresql://postgres.vhnputfhxccrcsyhsibx:***@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.vhnputfhxccrcsyhsibx:***@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
```

### Remaining:
- [ ] Run `pnpm db:push` with production DATABASE_URL to deploy schema

### Deliverables:
- [x] Production Supabase project created
- [x] `DATABASE_URL` for production noted in `.env.prod`
- [ ] Schema deployed

---

## Phase 26: Clerk Production Setup

**Status**: ✅ COMPLETE
**Priority**: 🔴 CRITICAL (Blocks extension submission)
**Depends on**: Phase 25

### Tasks:

#### 26.1 Create Clerk Production Instance
- [x] Go to Clerk Dashboard → Create new application (Production mode)
- [x] Configure authentication methods (Email, Google, etc.)
- [x] Note production keys:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsudHJ1c3RodW1hbi5pbyQ`
  - `CLERK_SECRET_KEY=sk_live_***`

#### 26.2 Configure Clerk for Extension
- [ ] Go to Clerk Dashboard → Configure → Paths
- [ ] Set "Allowed Origins" to include:
  - `https://trusthuman.io`
  - `chrome-extension://[EXTENSION_ID]` (calculated below)

#### 26.3 Calculate Extension ID
The extension ID is derived from the public key in `wxt.config.ts`:
```
Key: MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtPy39Z0SqBkYIbXcjhI2NarZSWZ8L2XyKLaMWcOthZ0Y1s4IpvJVCg6GxOZvbm2+KVmMM4m7V/hb+jLba2BFypycq0ZoAjscbtG58f9aFKkOwUj+cePkU2GaYFbanH8oUice4nXsZGwnrRUgoHqGQHi1gR6RURKGubtiH0I208RhyeC6DSm6OmiBMmuhV7/SQund2eLSsxCBalvbbKuVuhIsOeHzjKmnQvLlmSjLV04anU6tdnHNJJdV9poBnNh3D+N5+TwOgFjSpnAoqXvE0+a2InhtwnidQR31tvevqYpRGQf0t999BSJY1NelLTRFt/6THyUuECYXxwSS7pSEpwIDAQAB
```

**TODO**: Calculate and note Extension ID: `__________________`

To calculate:
1. Build extension with production keys
2. Load unpacked in Chrome → Note the Extension ID from `chrome://extensions`
3. Add to Clerk "Allowed Origins"

#### 26.4 Configure Webhook
- [x] Go to Clerk Dashboard → Webhooks
- [x] Add endpoint: `https://trusthuman.io/api/webhooks/clerk`
- [x] Subscribe to events: `user.created`, `user.updated`, `user.deleted`
- [x] Note webhook signing secret: `CLERK_WEBHOOK_SECRET=whsec_***`

#### 26.5 Production Environment Variables (in `.env.prod`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsudHJ1c3RodW1hbi5pbyQ
CLERK_SECRET_KEY=sk_live_***
CLERK_WEBHOOK_SECRET=whsec_***
NEXT_PUBLIC_CLERK_FRONTEND_API="clerk.trusthuman.io"
NEXT_PUBLIC_CLERK_DOMAIN="accounts.trusthuman.io"
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsudHJ1c3RodW1hbi5pbyQ
VITE_CLERK_FRONTEND_API="clerk.trusthuman.io"
```

### Deliverables:
- [x] Clerk production instance created
- [ ] Extension ID calculated and whitelisted in Clerk
- [x] Webhook configured
- [x] All Clerk env vars documented in `.env.prod`

---

## Phase 27: Loops Integration (Welcome Email)

**Status**: ✅ COMPLETE (via Clerk integration)
**Priority**: 🟡 IMPORTANT
**Depends on**: Phase 26

### Implementation:
Loops is connected directly to Clerk production instance as an audience sync.

### Tasks:
- [x] Create Loops account at loops.so
- [x] Connect Clerk production instance to Loops audience
- [ ] Design welcome email template in Loops (if not done)
- [ ] Set trigger: New contact added to audience

### Notes:
Using Clerk's native Loops integration instead of webhook approach. This automatically syncs new users to Loops audience when they sign up.

### Deliverables:
- [x] Loops account created
- [x] Clerk → Loops audience sync configured
- [ ] Welcome email template designed and triggered

---

## Phase 28: AWS Production Verification

**Status**: 📋 TODO
**Priority**: 🔴 CRITICAL
**Depends on**: None (can be parallel)

### Tasks:
- [ ] Verify AWS credentials work for Rekognition
- [ ] Ensure IAM user has `rekognition:DetectFaces` permission
- [ ] Test face detection in production environment

### Environment Variables:
```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
```

### Deliverables:
- [ ] AWS credentials verified working

---

## Phase 29: Vercel Production Deployment

**Status**: 📋 TODO
**Priority**: 🔴 CRITICAL
**Depends on**: Phases 25, 26, 28

### Tasks:

#### 29.1 Environment Variables in Vercel
Set all production env vars in Vercel dashboard:
- [ ] `DATABASE_URL` (from Phase 25)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from Phase 26)
- [ ] `CLERK_SECRET_KEY` (from Phase 26)
- [ ] `CLERK_WEBHOOK_SECRET` (from Phase 26)
- [ ] `AWS_ACCESS_KEY_ID` (from Phase 28)
- [ ] `AWS_SECRET_ACCESS_KEY` (from Phase 28)
- [ ] `AWS_REGION` (from Phase 28)
- [ ] `LOOPS_API_KEY` (from Phase 27, optional)

#### 29.2 Domain Configuration
- [ ] Verify `trusthuman.io` is connected to Vercel
- [ ] SSL certificate active

#### 29.3 Deploy and Test
- [ ] Deploy to production
- [ ] Test signup flow end-to-end
- [ ] Test webhook receives events
- [ ] Verify database writes working

### Deliverables:
- [ ] Production deployment live at trusthuman.io
- [ ] All features working

---

## Phase 30: Chrome Web Store Submission

**Status**: 📋 TODO
**Priority**: 🔴 CRITICAL
**Depends on**: Phase 26 (Clerk production + Extension ID)

### Tasks:

#### 30.1 Build Production Extension
```bash
cd apps/trustahuman-ext

# Create .env.production with production values
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_live_..." > .env.production
echo "VITE_SYNC_HOST_URL=https://trusthuman.io" >> .env.production

# Build for production
pnpm build
```

#### 30.2 Prepare Store Listing Assets
- [ ] Extension icon: 128x128 PNG (have: `icon128.png`)
- [ ] Screenshots: 1280x800 or 640x400 (need to create)
  - [ ] Screenshot 1: Extension popup
  - [ ] Screenshot 2: LinkedIn sidebar open
  - [ ] Screenshot 3: Verification toast flow
  - [ ] Screenshot 4: Profile page
- [ ] Promotional images (optional):
  - [ ] Small promo tile: 440x280
  - [ ] Large promo tile: 920x680
  - [ ] Marquee: 1400x560

#### 30.3 Write Store Description
**Short description** (132 chars max):
```
Verify you're human when commenting on LinkedIn, X, and Facebook. Quick selfie verification. Privacy-first.
```

**Detailed description**:
```
TrustHuman proves you're a real human when you engage on social media.

🛡️ HOW IT WORKS
1. Install the extension
2. Comment on LinkedIn, X, or Facebook
3. Quick selfie verification (photo deleted immediately)
4. Earn your Human # badge

✨ FEATURES
• Works on LinkedIn, X (Twitter), and Facebook
• Silent verification - no interruption to your workflow
• Privacy-first: photos deleted instantly after verification
• Track your verification streak
• Public profile at trusthuman.io/username
• Leaderboard for most active verified humans

🔒 PRIVACY
• Photos are NEVER stored - deleted immediately after face detection
• We only store: your verification count, streak, and comment metadata
• No tracking, no ads, no data selling

🤖 FIGHTING BOTS
In the age of AI-generated content and bot accounts, TrustHuman helps you prove you're real. Your verified badge shows others they can trust your engagement is authentic.

Get your Human # today!
```

#### 30.4 Submit to Chrome Web Store
- [ ] Go to Chrome Web Store Developer Dashboard
- [ ] Create new item
- [ ] Upload `dist/` folder as ZIP
- [ ] Fill in all listing details
- [ ] Submit for review

**Review timeline**: Usually 1-3 business days

#### 30.5 Post-Approval Updates
- [ ] Note the Chrome Web Store URL
- [ ] Update `ASSETS.chromeWebStoreUrl` in `landing-content.ts`

### Deliverables:
- [ ] Extension submitted to Chrome Web Store
- [ ] Store listing URL obtained (after approval)
- [ ] Landing page updated with install link

---

## Phase 31: Demo Video

**Status**: 📋 TODO
**Priority**: 🟡 IMPORTANT
**Depends on**: Phase 30 (need published extension for realistic demo)

### Tasks:

#### 31.1 Plan Video Content (~2-3 min)
1. **Intro** (15s): "In the age of AI, how do you prove you're human?"
2. **Install** (20s): Show Chrome Web Store install
3. **First verification** (45s): Comment on LinkedIn, show toast flow
4. **Profile** (30s): Show trusthuman.io/username page
5. **Check Human** (20s): Show sidebar checking another profile
6. **CTA** (10s): "Get your Human # at trusthuman.io"

#### 31.2 Record Video
- [ ] Screen recording with voiceover
- [ ] Or use Loom/similar tool

#### 31.3 Upload and Update
- [ ] Upload to YouTube (unlisted or public)
- [ ] Get embed URL
- [ ] Update `MESSAGING.videoDemo.youtubeUrl` in `landing-content.ts`

### Deliverables:
- [ ] Demo video recorded and uploaded
- [ ] Landing page video updated

---

## Phase 32: Step Videos (Optional)

**Status**: 📋 TODO
**Priority**: 🟢 NICE TO HAVE
**Depends on**: Phase 31

### Tasks:
- [ ] Record 4 short clips for "How It Works" section
- [ ] Or use animated GIFs
- [ ] Or use static images (simplest)

For MVP launch, can skip these and use placeholder images.

---

## Phase 33: Mobile Signup + Empty Profile State

**Status**: ✅ COMPLETE
**Priority**: 🟡 IMPORTANT
**Depends on**: None (can be parallel)

### Problem:
1. **Mobile users can sign up** via web, but extension only works on desktop Chrome
2. After signup (but before any verification), `trusthuman.io/username` looks bare:
   - Stats: 0 Verified Actions, 0 Streak, empty heatmap
   - Activity: Just "No verified activity yet." text
   - Not inspiring or actionable

### Solution: Empty State with Mock Data Preview + CTAs

#### 33.1 Design Empty State
When `totalVerifications === 0`, show:

1. **Hero section with animated mock data** (faded/ghost style):
   - Show what their profile WILL look like with activity
   - 3 mock activity cards (LinkedIn, X, Facebook examples)
   - Ghost heatmap with some example activity

2. **Prominent CTA based on context**:
   - If extension NOT installed: "Install Chrome Extension" button
   - If extension installed but on mobile: "Open on Desktop" message
   - If extension installed on desktop: "Go to LinkedIn/X/Facebook" buttons

3. **Quick Start Steps** (mini "How it works"):
   - Step 1: Install extension (if not installed)
   - Step 2: Comment on LinkedIn, X, or Facebook
   - Step 3: Verify with a quick selfie
   - Step 4: Watch your profile come alive!

4. **Mobile-specific messaging**:
   - Detect mobile via user-agent
   - Show: "TrustHuman works on desktop Chrome. We'll send you an email reminder!"
   - CTA: "Send me a reminder" or auto-send via Loops

#### 33.2 Implementation Tasks
- [x] Create `EmptyProfileState` component
- [x] Add mock activity card data (3 examples)
- [x] Add extension install detection (existing: `data-trusthuman-ext`)
- [x] Add mobile detection
- [x] Create "ghost" styling for mock data (opacity, border-dashed)
- [x] Add conditional CTAs based on install state + device
- [x] Update `[username]/page.tsx` to use `EmptyProfileState` when `totalVerifications === 0`

#### 33.3 Mock Activity Examples
```typescript
const MOCK_ACTIVITIES = [
  {
    id: "mock-1",
    type: "linkedin",
    verified: true,
    parentAuthorName: "Satya Nadella",
    parentAuthorAvatarUrl: "/pictures/placeholder-avatar-1.png",
    parentTextSnippet: "AI is transforming how we work and collaborate...",
    commentText: "Great insights! The future of work is definitely being reshaped by AI tools that augment human capabilities.",
    createdAt: new Date(),
  },
  {
    id: "mock-2",
    type: "x",
    verified: true,
    parentAuthorName: "Elon Musk",
    parentAuthorAvatarUrl: "/pictures/placeholder-avatar-2.png",
    parentTextSnippet: "The most important thing is to try to make something people love...",
    commentText: "Building products people love requires deep empathy and relentless iteration. Completely agree!",
    createdAt: new Date(),
  },
  {
    id: "mock-3",
    type: "facebook",
    verified: true,
    parentAuthorName: "Mark Zuckerberg",
    parentAuthorAvatarUrl: "/pictures/placeholder-avatar-3.png",
    parentTextSnippet: "Excited to share what we've been working on...",
    commentText: "This is amazing! Can't wait to see how this evolves.",
    createdAt: new Date(),
  },
];
```

#### 33.4 Empty State Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [Avatar] Display Name  🛡️ Human                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🎉 Welcome to TrustHuman!                                  ││
│  │                                                              ││
│  │  Your profile is set up. Now let's verify your humanity!    ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐  ││
│  │  │ [Primary CTA: Install Extension / Go to LinkedIn]    │  ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  📊 What your profile will look like:                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Rank #X │ │ 5 ✅    │ │ 3 🔥   │ │ 5 ⭐   │  (ghost style) │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│  [Mock Heatmap - ghost style]                                   │
│                                                                  │
│  💬 Your verified actions will appear here:                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
│  │ Mock LinkedIn    │ │ Mock X           │ │ Mock Facebook    ││
│  │ activity card    │ │ activity card    │ │ activity card    ││
│  │ (ghost style)    │ │ (ghost style)    │ │ (ghost style)    ││
│  └──────────────────┘ └──────────────────┘ └──────────────────┘│
│                                                                  │
│  📱 On mobile? TrustHuman works on desktop Chrome.              │
│  [Send me a reminder email]                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Deliverables:
- [x] Empty profile state looks beautiful with mock data preview
- [x] Clear CTAs guide users to next action
- [x] Mobile users get appropriate messaging

### Files Created/Modified:
- `apps/nextjs/src/app/[username]/_components/EmptyProfileState.tsx` (new)
- `apps/nextjs/src/app/[username]/page.tsx` (modified - conditional rendering)

---

## Launch Checklist

### Pre-Launch (Before Chrome Store Approval)
- [x] Phase 25: Production Supabase DB ✅ (created, need to push schema)
- [x] Phase 26: Clerk Production ✅ (need to whitelist extension ID)
- [x] Phase 27: Loops Integration ✅ (connected via Clerk)
- [ ] Phase 28: AWS Credentials Verified
- [ ] Phase 29: Vercel Production Deployed
- [ ] Phase 30: Extension Submitted to Chrome Web Store
- [x] Phase 33: Empty Profile State ✅

### Remaining Before Chrome Store Submission:
1. Push Prisma schema to production DB
2. Build extension with production keys → Get Extension ID
3. Whitelist Extension ID in Clerk "Allowed Origins"
4. Verify AWS credentials work
5. Deploy to Vercel with production env vars
6. Test full flow on production
7. Submit extension to Chrome Web Store

### Post-Chrome-Store-Approval
- [ ] Update `chromeWebStoreUrl` in landing page
- [ ] Phase 31: Record and upload demo video
- [ ] Test full flow: signup → install → verify → profile
- [ ] Test mobile signup → email → desktop install → verify
- [ ] Announce launch! 🎉

---

## Environment Variables Summary

### Web App (Vercel)
```env
# Database
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2

# Loops (optional)
LOOPS_API_KEY=...
```

### Extension (.env.production)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SYNC_HOST_URL=https://trusthuman.io
```

---

## Risk Mitigation

### Chrome Web Store Rejection
- **Risk**: Extension rejected for policy violations
- **Mitigation**: Review Chrome Web Store policies, especially around:
  - Camera access (need clear justification)
  - Data handling (privacy policy required)
  - Permissions (only request what's needed)

### Clerk Extension ID Mismatch
- **Risk**: Extension can't authenticate because ID not in allowed origins
- **Mitigation**:
  1. Build extension first
  2. Note exact ID
  3. Add to Clerk before submitting to store

### AWS Rekognition Costs
- **Risk**: Unexpected costs from face detection API
- **Mitigation**:
  - Monitor AWS billing
  - Set up billing alerts
  - Consider rate limiting if needed

---

## Success Criteria

### Launch Ready When:
- [ ] Extension installable from Chrome Web Store
- [ ] Full signup → verify → profile flow works (desktop)
- [ ] Mobile signup works + Loops email sent
- [ ] Empty profile state looks beautiful + has clear CTAs
- [ ] Demo video on landing page
- [ ] Welcome email sent on signup
- [ ] No critical bugs in production

---

**Plan Status**: IN PROGRESS - Starting with Phase 25 (Production DB)
