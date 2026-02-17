# TrustAHuman — Viral Growth Research Synthesis

> Research compiled from 5 parallel agents covering: viral SaaS case studies, verification badge systems, OpenClaw/bot trends, browser extension growth, and embeddable badge/card mechanics.

---

## The Market Thesis

Five converging trends create the window:

| Trend | Status | Window |
|-------|--------|--------|
| Open-source AI agents (OpenClaw etc.) making bot creation trivial | Accelerating | 12-18 months before saturation |
| LinkedIn/X bot frustration at all-time high | Peak | NOW |
| "AI slop" entering mainstream vocabulary | Rapidly growing | 6-12 months of momentum |
| Dead Internet Theory going mainstream | Cultural tipping point | NOW |
| Worldcoin validating "proof of humanity" market | Validated but controversial | 12 months to differentiate |

**Core positioning**: "Don't label the bots. Verify the humans."

**Key differentiators vs competitors**:
- No iris scanning (vs Worldcoin) — "You shouldn't need to scan your eyeball"
- Cross-platform via extension (vs Meta Verified, X Blue) — "One verification, everywhere"
- Consumer-first (vs Gitcoin Passport, BrightID) — "No crypto wallet needed"
- Activity-based proof (vs ID verification) — "Prove you're human through ongoing behavior, not a one-time document"

---

## Three Interlocking Viral Loops

### LOOP 1: "Powered By" (Linktree Model)
Every free TrustAHuman public profile includes a mandatory footer CTA: "Prove you're human too — trustahuman.com"

- Every profile view = free marketing impression
- Expected 2-5% conversion on footer CTA (based on Linktree data)
- Paid plans allow branding removal (natural monetization lever)
- Scales linearly with user count

**Case studies**: Linktree (50M+ users, zero paid marketing early), Typeform ("Create your own typeform" drove 10-30% of signups), Notion ("Built with Notion" on public pages)

### LOOP 2: "Social Proof" Share Events (Spotify Wrapped Model)
Milestone events trigger designed-to-share cards:

- Monthly "Trust Report" with stats, ranking, streaks
- Milestone prompts: 1st verification, 30-day streak, 100 verifications, Gold tier
- Cards pre-rendered for each platform (9:16 Stories, 16:9 Twitter, 1.91:1 LinkedIn)
- Data storytelling: "You're in the top 8% of verified humans this month"

**Case studies**: Spotify Wrapped (60M+ shares/year), Duolingo streaks (milestone sharing), Grammarly weekly stats email, Strava activity cards

### LOOP 3: "Status Signal" FOMO (Blue Checkmark Model)
The browser extension shows Trust Scores next to usernames across platforms:

- Users WITH scores appear more credible
- ABSENCE of score creates FOMO for non-users
- Professional utility: freelancers, journalists, influencers gain competitive edge
- Once critical mass hits, this loop becomes self-sustaining

**Case studies**: Twitter verification (pre-Musk) — scarcity + status = extreme desire. LinkedIn verification — free + utility = rapid adoption. Credly badges — 6x more profile views on LinkedIn.

---

## The Viral Flywheel

```
USER VERIFIES (webcam) ────► EARNS TRUST SCORE + BADGE
        ▲                              │
        │                              ▼
        │                    DISPLAYS BADGE/CARD
        │                    (profile, bio, website, extension overlay)
        │                              │
        │                              ▼
        │                    NON-USER SEES BADGE
        │                    + "Get verified" CTA
        │                              │
        │                              ▼
        │                    CLICKS → LANDS ON PROFILE
        │                    "What's YOUR Trust Score?"
        │                              │
        │                              ▼
        │                    INSTALLS EXTENSION
        │                    VERIFIES THEMSELVES
        │                              │
        └──────────────────────────────┘
```

---

## Product Features for Virality

### 1. Public Profile Page (`trustahuman.com/u/username`)

The core viral unit. Contains:
- **Trust Score** (0-100): Single number, universally understood, aspirational (like credit score)
- **Verification Heatmap**: GitHub contribution graph style — 52-week calendar showing daily verification activity
- **Tier Badge**: Bronze → Silver → Gold → Diamond based on consistency
- **Stats**: Total verifications, current streak, platforms verified on
- **Footer CTA**: "Prove you're human too" (mandatory on free tier, minimal on paid)

OG meta tags ensure the link preview is compelling when shared anywhere:
> "[Username] has been verified as human 147 times. What's your Trust Score?"

### 2. Embeddable Badges (Multiple Formats)

| Format | Size | Use Case |
|--------|------|----------|
| Small shield | ~150x30px | Email signatures, website footers, forum profiles |
| Medium card | ~300x100px | Blog sidebars, about pages, portfolio sites |
| Full widget | ~300x400px | Dedicated trust section on personal websites |
| Markdown badge | inline | GitHub READMEs: `![Trust Score](trustahuman.com/badge/user.svg)` |
| LinkedIn banner | 1584x396 | Custom LinkedIn header incorporating Trust Score |

All badges are **verifiable** — clicking them proves the data is real (not just a downloaded image).

### 3. Share Cards (Platform-Optimized)

Pre-rendered, one-tap-share cards for milestone events:

- **Monthly Trust Report**: "47 verifications, top 8%, 23-day streak"
- **Streak Milestones**: 7, 30, 100, 365 days
- **Tier Promotions**: "Just reached Gold Verified!"
- **First Verification**: "I just proved I'm human. Are you?"

Designed for each platform's optimal dimensions and aesthetic.

### 4. Browser Extension Overlay

The **killer feature** for the status signal loop:
- Shows Trust Scores next to usernames on LinkedIn, X, Reddit, YouTube
- Only visible to other TrustAHuman users initially (creates in-group effect)
- Non-verified users appear "naked" in comparison — drives FOMO
- Like how Twitter's blue check created desire for unverified users

### 5. Gamification / Streak System

| Element | Mechanic | Viral Effect |
|---------|----------|-------------|
| Trust Score (0-100) | Increases with consistent verification | "What's your score?" conversations |
| Streaks | Consecutive days with verification | Loss aversion keeps users active |
| Tiers (Bronze/Silver/Gold/Diamond) | Time-based + consistency | Aspiration to level up |
| Referral badges | Ambassador badges at 5/10/25/50 referrals | Incentivizes sharing |
| "Founding Verified Human" | First 1,000 users only | Scarcity + urgency at launch |
| Year badges | "Verified Since 2026" | Earlier = more prestige |

### 6. Referral Mechanics

Every public profile has embedded referral tracking:
- Profile URL includes user's referral code
- Share cards include short link/QR code back to referral URL
- No explicit "referral code" needed — it's baked into every share

Referral incentives:
- 5 referrals → "Ambassador" badge
- 10 referrals → Trust Score bonus (+5 pts)
- 25 referrals → Free premium month
- 50 referrals → "Founding Ambassador" lifetime badge

---

## Launch Strategy

### Phase 1: Exclusivity Launch (First 1,000)
**Model**: Clubhouse/Superhuman invite-only

- "The First 1,000 Verified Humans" — invite-only launch
- Early adopters get permanent "Pioneer" badge (never earnable again)
- Each pioneer gets 5 invite codes
- Creates urgency: "Only 247 spots remaining"
- Target: tech-savvy professionals, journalists, influencers on LinkedIn

### Phase 2: Community Seeding
**Model**: Honey YouTube influencer strategy

- Target communities with highest bot frustration: LinkedIn power users, Twitter/X creators, Reddit moderators
- Seed with influencers who care about authenticity
- Simple pitch: "Free extension that proves you're a real human online"
- "AI or Human?" viral quiz game to educate about the problem

### Phase 3: Network Effects Kick In
**Model**: Loom's self-demonstrating product

- Every verified badge seen by a non-user is a marketing touchpoint
- The extension overlay makes verified users visible across platforms
- Monthly Trust Reports create periodic sharing waves
- "If it's not on TrustAHuman, was it really a human?"

### Phase 4: Extension → Platform
**Model**: Grammarly/Loom extension-to-SaaS transition

1. Browser extension proves PMF with narrow use case
2. API for websites to check verification status
3. Enterprise product ("Verify your team/community")
4. Identity platform (standard for human verification)
5. Potential acquisition target (Okta, Auth0, social platforms)

---

## Audience-Specific Messaging

| Audience | Pain Point | Message |
|----------|-----------|---------|
| LinkedIn professionals | Fake profiles, bot engagement | "Your professional reputation deserves proof" |
| X/Twitter creators | Reply bot spam, engagement farming | "See through the bots. Connect with humans." |
| Content creators | Fake followers, meaningless metrics | "Know your real audience" |
| Freelancers | Standing out in crowded marketplace | "Verified humans get hired first" |
| Journalists | Source credibility, impersonation | "The new standard for source verification" |
| General users | AI content anxiety | "The internet isn't dead. We're still here. Prove it." |

---

## Competitive Landscape

| Competitor | Approach | TrustAHuman Advantage |
|-----------|----------|----------------------|
| Worldcoin/World | Iris scanning via Orb hardware | No special hardware, less invasive, no crypto needed |
| Gitcoin Passport | Web3 stamp aggregation | Consumer-friendly, works outside Web3 |
| Twitter/X Blue | Paid checkmark ($8/mo) | Earned through behavior, not purchased (preserves status value) |
| Meta Verified | ID-based, platform-locked ($12-15/mo) | Cross-platform, activity-based (not just ID) |
| LinkedIn Verified | ID verification, platform-locked | Cross-platform, ongoing proof (not one-time) |
| GPTZero/Originality.ai | Detect AI content | Verifies the PERSON, not the content (fundamentally different) |

---

## Critical Anti-Patterns to Avoid

1. **Don't make it purchasable** (Twitter Blue lesson): The moment trust score is buyable, it's worthless. Must be EARNED through consistent webcam verification.

2. **Don't sell user data** (Web of Trust lesson): A trust product that betrays trust is dead. Privacy must be absolute.

3. **Don't make it complex** (Keybase lesson): Cryptographic proofs are cool but socially illegible. Keep it dead simple: install extension, verify face, get score.

4. **Don't make it feel arbitrary** (Klout Score lesson): The score must clearly map to objective verification events, not opaque algorithms.

5. **Don't rely on financial incentives only** (Worldcoin lesson): Token rewards attract mercenaries who verify and leave. The product must provide genuine utility.

---

## Key Metrics to Track

| Metric | Target | Model |
|--------|--------|-------|
| Viral coefficient | 0.8-1.2 | Each badge view converts ~1-3% to signups |
| Time to critical mass | 18-24 months | Based on Linktree/Loom timelines |
| Share rate | 15-25% of users share monthly | Based on Spotify Wrapped engagement |
| Profile-to-signup conversion | 2-5% | Based on Linktree footer CTA data |
| Streak retention (30-day) | 40%+ | Based on Duolingo streak mechanics |
| Extension→platform transition | 12-18 months | Based on Grammarly/Loom trajectories |

---

## The Unique Advantage

TrustAHuman has something no historical product had: **webcam verification of real human presence, tied to specific online activity, producing ongoing behavioral proof.**

This is BeReal's authenticity + Twitter's status badge + Strava's proof-of-effort + Linktree's distribution mechanic — all applied to the most urgent trust problem of the AI era.

The timing window is NOW. The cultural narrative (Dead Internet Theory), consumer frustration (bot fatigue), and competitive validation (Worldcoin's billions in funding) are all converging. The risk isn't moving too early — it's moving too late.
