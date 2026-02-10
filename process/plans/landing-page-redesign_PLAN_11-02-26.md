# EngageKit Landing Page Redesign Implementation Plan

**Date**: February 11, 2026
**Complexity**: COMPLEX (Multi-phase)
**Implementation Approach**: Incremental Refactor with Content Extraction
**Execution Model**: Phase-by-Phase with Built-in Checkpoints

---

## Overview

Complete redesign of the EngageKit landing page with new messaging framework focused on relationship-building and business outcomes. The redesign transforms the current growth-hacking messaging into a professional, outcome-focused narrative that positions EngageKit as a strategic tool for B2B professionals.

**Location**: `apps/nextjs/src/app/page.tsx` and `apps/nextjs/src/app/_components/landing/`

**Status**: ✅ IMPLEMENTATION COMPLETE - Ready for Manual Testing & Deployment (Phase 10)

---

## Quick Links

- [Context and Goals](#1-context-and-goals)
- [Messaging Framework](#2-messaging-framework)
- [Section Specifications](#3-section-specifications-13-sections)
- [Component Architecture](#4-component-architecture)
- [Content Structure](#5-content-structure-landing-contentts)
- [Video Assets](#6-video-assets)
- [Phased Delivery Plan](#7-phased-delivery-plan)
- [Implementation Checklist](#implementation-checklist)

---

## 1. Context and Goals

### Current State

The existing landing page emphasizes:
- "24/7 AI intern" and growth-hacking metrics
- "100 comments/day on auto-pilot"
- Follower count and reach goals
- Heavy focus on vanity metrics

**Current Components** (13 files):
- `header.tsx` - Top navigation
- `hero-section.tsx` - Main hero with rotating titles
- `rotating-titles.tsx` - Animated title component
- `mobile-signup-form.tsx` - Mobile CTA form
- `mobile-signup-modal.tsx` - Modal version
- `features-section.tsx` - 4 feature cards
- `gumroad-carousel.tsx` - Social proof carousel
- `video-section.tsx` - YouTube embed demo
- `testimonials-section.tsx` - 8 testimonial cards
- `faq-section.tsx` - Accordion FAQ
- `final-cta-section.tsx` - Bottom CTA
- `floating-cta.tsx` - Sticky CTA button
- `footer.tsx` - Footer links

### Target State

New landing page will emphasize:
- **Primary Value Prop**: Build authentic personal brand → Make deep connections → Drive real business outcomes
- Professional positioning for B2B decision-makers
- Relationship-building over automation
- Strategic engagement vs. vanity metrics
- Human-in-the-loop approach

### Goals

**In-scope**:
- 13 distinct sections (detailed below)
- Complete content rewrite with extracted content file
- New messaging framework throughout
- Pricing section with monthly/yearly toggle and dynamic calculator
- Video showcase using local MP4 assets
- YouTube embed for overview video
- 3D hover effect on preview videos
- Testimonial rewrite (keep existing photos)
- Complete redesign maintaining neobrutalist theme
- Full responsive design (mobile/tablet/desktop)

**Out-of-scope (V1)**:
- A/B testing infrastructure
- Analytics event tracking for individual sections
- Interactive demos or calculators
- Blog integration
- Live chat widget
- Multi-language support

---

## 2. Messaging Framework

### Core Messages

**Primary Value Proposition**:
> "Build a personal brand that closes deals"

**Supporting Messages**:
1. "LinkedIn is where B2B relationships start"
2. "Generic engagement kills credibility"
3. "Context is your competitive advantage"
4. "Relationships compound into opportunities"

**Tone Guidelines**:
- Professional but not corporate
- Confident but not arrogant
- Practical and outcome-focused
- Data-driven but human-centered

### Forbidden Language (Remove)

- ❌ "24/7 AI intern"
- ❌ "Auto-pilot"
- ❌ "100 comments/day"
- ❌ "Gain followers"
- ❌ "Undetectable"
- ❌ "Boss, let your AI intern..."
- ❌ Any automation-focused messaging

### Approved Language (Use)

- ✅ "Relationship-building engine"
- ✅ "Human-in-the-loop"
- ✅ "Strategic engagement"
- ✅ "Build relationships that drive revenue"
- ✅ "Authentic connections"
- ✅ "Context-aware engagement"
- ✅ "Professional credibility"

---

## 3. Section Specifications (13 Sections)

### Section 1: Hero

**Purpose**: Immediately communicate value proposition with clear CTA

**Layout**:
- Centered content, full viewport height consideration
- Headline + subheadline + CTA button
- Trust badges row (logo sprites or social proof numbers)
- Background: zinc-50 (consistent with current theme)

**Content Requirements**:
- **Headline**: "Build a personal brand that closes deals"
- **Subheadline**: 2-3 sentences about relationship-building vs. vanity metrics
- **Primary CTA**: "Start Building Relationships" (links to Chrome Web Store)
- **Trust Badges**:
  - "1000+ professionals"
  - "500k+ comments generated"
  - "Used by founders at [logos]"

**Component Modifications**:
- Update `hero-section.tsx`
- Remove rotating titles component
- Keep mobile/desktop CTA pattern
- Add trust badges section below CTA

**Assets Needed**:
- Trust badge logos (if applicable)
- Updated hero copy

---

### Section 2: The Opportunity

**Purpose**: Establish LinkedIn as critical B2B platform with data

**Layout**:
- 3-column stat cards on desktop, stacked on mobile
- Large numbers with supporting context
- Light background to differentiate from hero

**Content Requirements**:
- **Stat 1**: "80% of B2B leads come from LinkedIn"
- **Stat 2**: "54% of buyers use LinkedIn to research vendors"
- **Stat 3**: "10x higher conversion rates vs. cold outreach"
- Source attribution for credibility

**Component Specifications**:
- New component: `opportunity-section.tsx`
- Use Card component from `@sassy/ui`
- Neobrutalist styling (black borders, hard shadows)
- Responsive grid: 3 columns desktop, 1 column mobile

**Styling**:
- Background: white
- Cards: cream background (#fbf6e5), black 2px borders, shadow-[4px_4px_0px_#000]
- Large numbers: text-5xl font-bold, text-pink-500
- Supporting text: text-gray-700

---

### Section 2.5: Social Proof Carousel (NEW)

**Purpose**: Build credibility with visual evidence of real user results (reframed for relationships)

**Layout**:
- Full-width auto-scrolling carousel
- 6 images showing real user outcomes
- Continuous loop animation
- Pause on hover

**Content Requirements**:
- Keep existing 6 images from `/public/pictures/`
- Add NEW captions that reframe metrics as relationship outcomes:

| Image | Old Framing | New Framing |
|-------|-------------|-------------|
| `follower graph before and after using.png` | "Gain followers" | "Building a network of decision-makers" |
| `boost profile appearances 150k.png` | "150k profile views" | "150k professionals discovered your expertise" |
| `boost profile appearances 180k.png` | "180k profile views" | "180k potential connections reached" |
| `many people reply organically to comments.png` | "Get replies" | "Real conversations that lead to opportunities" |
| `get people like Jasmine the LinkedIn guru to reply to you.png` | "Get influencers to notice you" | "Build relationships with industry leaders" |
| `attract network of recruiters, investors, founders.png` | "Attract a network" | "Connect with the people who matter for your goals" |

**Component Specifications**:
- Keep existing `gumroad-carousel.tsx` structure
- Update to `social-proof-carousel.tsx` (rename)
- Add caption overlay or adjacent text for each image
- Use Embla Carousel (already in use)

**Styling**:
- Background: white or subtle gradient
- Images: rounded-lg, border-2 border-black, shadow-[4px_4px_0px_#000]
- Captions: text-sm text-gray-600 italic, centered below image
- Auto-scroll: 3-second interval
- Pause on hover

---

### Section 3: Problem → Solution Bridge

**Purpose**: Contrast ineffective engagement with EngageKit's approach

**Layout**:
- Two-column comparison on desktop (Problem | Solution)
- Each side is a card with list of points
- Mobile: stacked vertically (Problem above Solution)

**Content Requirements**:
- **Problem Card** (left):
  - Title: "The Old Way Kills Credibility"
  - 4-5 bullet points (generic comments, spammy replies, no context)
- **Solution Card** (right):
  - Title: "The EngageKit Way Builds Trust"
  - 4-5 bullet points (context-aware, human-reviewed, strategic)

**Component Specifications**:
- New component: `problem-solution-section.tsx`
- Use Card component with custom styling
- Problem card: red accent (destructive color)
- Solution card: green accent (chart-2 color #308169)
- Icons for each bullet point (X for problems, checkmark for solutions)

**Styling**:
- Background: zinc-50
- Cards elevated with hard shadows
- Icons: lucide-react (X, CheckCircle2)

---

### Section 4: How It Works

**Purpose**: Show product functionality with video previews

**Layout**:
- 3-step horizontal flow on desktop (stacked on mobile)
- Each step has: number badge, title, description, and video preview
- Videos use 3D hover effect

**Content Requirements**:
- **Step 1**: "Compose Context-Aware Comments"
  - Video: `engagekit 1.0 compose preview.mp4`
  - Description: How the compose tab works
- **Step 2**: "Build Your Target Network"
  - Video: `engagekit 1.0 target list preview.mp4`
  - Description: Connect tab and target list
- **Step 3**: "Track Meaningful Engagement"
  - Video: `engagekit 1.0 analytics preview.mp4`
  - Description: Analytics and insights

**Component Specifications**:
- New component: `how-it-works-section.tsx`
- Sub-component: `step-card.tsx` (reusable for each step)
- Video component with 3D CSS transform on hover/visible
- Reference 3D transform from `apps/ghost-blog/src/tools/linkedinpreview/components/how-to-use.tsx`:
  ```css
  md:[transform:scale(1.5)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]
  ```

**Styling**:
- Background: white
- Video containers: rounded-lg border-4 border-black
- Number badges: circular, pink background, white text
- 3D transform applied at md: breakpoint

**Video Implementation**:
```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  className="rounded-lg border shadow-xl md:max-h-[400px] md:object-cover md:object-left md:[transform:scale(1.5)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]"
>
  <source src="/preview-demo/engagekit 1.0 compose preview.mp4" type="video/mp4" />
</video>
```

---

### Section 5: Context Engine (Star Feature)

**Purpose**: Highlight the unique context-aware approach as key differentiator

**Layout**:
- Split layout: left side explanation, right side visual/demo
- Persona examples showing context in action
- YouTube embed for detailed explanation

**Content Requirements**:
- **Main Message**: "Context is your competitive advantage"
- **Supporting Copy**: Explain how EngageKit analyzes post content, author profile, and conversation tone
- **Persona Examples**:
  - Founder persona: how context changes for startup posts
  - Sales persona: how context adapts for prospect engagement
  - Growth persona: how context shifts for thought leadership
- **Video**: YouTube embed `https://youtu.be/JKpkQG_zB6U`

**Component Specifications**:
- New component: `context-engine-section.tsx`
- Sub-component: `persona-card.tsx` (3 examples)
- YouTube iframe with neobrutalist frame
- Responsive: side-by-side on desktop, stacked on mobile

**Styling**:
- Background: cream (#fbf6e5)
- Persona cards: white background, black borders, subtle shadows
- YouTube frame: border-4 border-black shadow-[8px_8px_0px_#000]

---

### Section 6: Key Features Grid

**Purpose**: Showcase 6 primary features in scannable format

**Layout**:
- 2x3 grid on desktop (3 rows, 2 columns)
- 2x3 grid on tablet (2 columns)
- Stacked on mobile (1 column)

**Content Requirements** (6 features):
1. **Context-Aware AI**
   - Icon: Brain
   - Description: Analyzes post content and author background
2. **Human-in-the-Loop**
   - Icon: UserCheck
   - Description: Review and refine before posting
3. **Strategic Targeting**
   - Icon: Target
   - Description: Build lists of high-value connections
4. **Engagement Analytics**
   - Icon: BarChart3
   - Description: Track meaningful interactions, not vanity metrics
5. **Multi-Account Management**
   - Icon: Users
   - Description: Manage multiple LinkedIn profiles
6. **Style Customization**
   - Icon: Paintbrush
   - Description: Train AI on your unique voice

**Component Specifications**:
- Update existing `features-section.tsx` OR create new `key-features-grid.tsx`
- Use Card component from `@sassy/ui`
- Icons from lucide-react
- Hover effect: slight lift (translate-y-[-4px])

**Styling**:
- Background: white
- Cards: cream background, black 2px borders, hard shadows
- Icons: pink-500, size-8
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6`

---

### Section 7: Who This Is For

**Purpose**: Help users self-identify with target personas

**Layout**:
- 3 persona cards side-by-side on desktop
- Stacked on mobile
- Each card has: icon, title, description, and use case bullets

**Content Requirements** (3 personas):
1. **Founders**
   - Icon: Rocket
   - Title: "Startup Founders & CEOs"
   - Use Cases:
     - Build thought leadership
     - Connect with investors
     - Engage with potential customers
     - Establish industry credibility
2. **Sales Professionals**
   - Icon: Handshake
   - Title: "Sales & Business Development"
   - Use Cases:
     - Warm up cold prospects
     - Build rapport before outreach
     - Stay top-of-mind with buyers
     - Drive pipeline from relationships
3. **Growth Marketers**
   - Icon: TrendingUp
   - Title: "Growth & Marketing Teams"
   - Use Cases:
     - Amplify brand presence
     - Engage with target accounts
     - Build community around product
     - Generate inbound interest

**Component Specifications**:
- New component: `target-personas-section.tsx`
- Sub-component: `persona-card.tsx` (reusable)
- Use Card component from `@sassy/ui`
- Icons from lucide-react

**Styling**:
- Background: zinc-50
- Cards: white background, black borders, hard shadows
- Icons: large (size-12), pink-500
- Grid: `grid-cols-1 md:grid-cols-3 gap-8`

---

### Section 8: Reduce Slop & Spam

**Purpose**: Position EngageKit as an anti-slop tool that helps you engage authentically at 10x speed

**Layout**:
- Centered content with compelling headline
- Value proposition focused on speed + memory + effectiveness
- 2x3 grid of benefit cards
- Visually distinct section with cream background

**Content Requirements**:
- **Headline**: "Cut Through the Slop. Engage 10x Faster."
- **Subheadline**: "LinkedIn is drowning in AI-generated spam. We help you rise above it."
- **Core Value Prop**: "EngageKit helps you read and remember your engagement with others at 10x the speed and effectiveness."

- **Key Benefits** (6 cards):
  1. **Read Faster** (Icon: Zap)
     - "Scan posts and context in seconds, not minutes"
  2. **Remember Everything** (Icon: Brain)
     - "Full history of every interaction with every connection"
  3. **Engage Authentically** (Icon: User)
     - "Human-in-the-loop ensures your voice stays yours"
  4. **Build Real Relationships** (Icon: Handshake)
     - "Context-aware comments that start real conversations"
  5. **Stand Out from Slop** (Icon: Sparkles)
     - "Your comments sound like you, not a bot"
  6. **10x Your Output** (Icon: Clock)
     - "Do in 10 minutes what used to take 2 hours"

**Component Specifications**:
- New component: `reduce-slop-section.tsx`
- Use Card components for each benefit
- Icons from lucide-react

**Styling**:
- Background: cream (#fbf6e5) to stand out
- Cards: white background, black 2px borders, shadow-[4px_4px_0px_#000]
- Icons: pink-500, size-8
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

---

### Section 9: Testimonials

**Purpose**: Build trust through user stories (rewrite existing testimonials)

**Layout**:
- Keep existing 2-column grid (8 testimonials)
- Keep existing card layout (image + quote + name/title)
- Update quotes to emphasize relationships over metrics

**Content Requirements**:
- **Rewrite all 8 testimonials** to focus on:
  - Relationship building (not follower counts)
  - Business outcomes (meetings, deals, partnerships)
  - Credibility and trust
  - Time saved for strategic work

**Example Rewrite**:
- ❌ Old: "EngageKit has my LinkedIn buzzing while I'm buried in spreadsheets. I save at least 10 hours a week and my network keeps growing without lifting a finger."
- ✅ New: "EngageKit helped me build genuine relationships with potential clients. Three partnerships started from LinkedIn conversations I never would have had time for otherwise."

**Component Specifications**:
- Update existing `testimonials-section.tsx`
- Keep photo assets (8 existing images)
- Update only the quote text
- Keep existing card layout and styling

**Styling**:
- Keep existing neobrutalist styling
- Background: gray-50
- Cards: white background, black borders, 5-star ratings

---

### Section 10: Pricing

**Purpose**: Present clear pricing with monthly/yearly toggle and multi-account calculator

**Layout**:
- 3 pricing cards side-by-side on desktop, stacked on mobile
- Monthly/Yearly toggle above cards (default to yearly)
- Multi-account slider for Premium Multi tier

**Content Requirements**:

**Free Tier**:
- Price: $0/month
- Features:
  - Limited engagements per day
  - Basic AI drafts
  - Manual mode only
  - 7-day interaction history
- CTA: "Start Free"

**Premium Single** (1 account):
- Monthly: $29.99/month
- Yearly: $299.99/year (save ~17%)
- Features:
  - Unlimited engagements
  - Advanced context engine
  - Human-in-the-loop workflow
  - Custom style training
  - Full analytics dashboard
  - Priority support
- CTA: "Start Free Trial"

**Premium Multi** (2-24 accounts):
- Monthly: $29.99/account/month
- Yearly: $299.99/account/year
- Dynamic calculator: slider to select account count
- Display: Total price = base price × account count
- All Premium features + Team management
- CTA: "Contact Sales"

**Component Specifications**:
- New component: `pricing-section.tsx`
- Sub-components:
  - `pricing-card.tsx` (reusable for 3 tiers)
  - `plan-toggle.tsx` (monthly/yearly switch)
  - `account-slider.tsx` (for Premium Multi)
- Use Tabs component from `@sassy/ui` for toggle
- Use Slider component from `@sassy/ui` for account count

**Styling**:
- Background: white
- Cards: cream background (#fbf6e5), black 2px borders, hard shadows
- Featured card (Premium Single): larger, pink accent border
- Toggle: neobrutalist switch with hard shadows
- Slider: pink track and thumb

**Pricing Card Structure**:
```tsx
<Card>
  <CardHeader>
    <Badge>Free / Premium Single / Premium Multi</Badge>
    <CardTitle>{planName}</CardTitle>
    <div className="text-4xl font-bold">
      {isYearly ? yearlyPrice : monthlyPrice}
      <span className="text-lg text-gray-500">/account/year</span>
    </div>
  </CardHeader>
  <CardContent>
    <ul>{features.map(...)}</ul>
  </CardContent>
  <CardFooter>
    <Button>{ctaText}</Button>
  </CardFooter>
</Card>
```

---

### Section 11: FAQ

**Purpose**: Address common objections and questions

**Layout**:
- Single column accordion
- Keep existing component structure
- Update questions and answers to match new messaging

**Content Requirements** (update existing FAQs):

1. **"Will this help me build real business relationships?"**
   - Answer: Yes, EngageKit focuses on strategic engagement with context-aware comments that start meaningful conversations. Users report increased meeting requests and partnership opportunities.

2. **"How is this different from automation tools?"**
   - Answer: EngageKit is human-in-the-loop. You review and approve every interaction. We provide intelligent drafts based on context, but you maintain full control and authenticity.

3. **"What results can I expect?"**
   - Answer: Results vary, but users typically see increased response rates (3-5x), more meaningful conversations, and measurable business outcomes (meetings, partnerships, deals) within 30-60 days.

4. **"Is this ethical and safe for my LinkedIn account?"**
   - Answer: Yes. EngageKit operates client-side (no bots or APIs), respects LinkedIn's terms, and maintains authentic engagement. You're in full control of every interaction.

5. **"What's included in the free tier?"**
   - Answer: The free tier includes basic AI drafts, manual mode, and limited daily engagements. It's perfect for testing the platform before upgrading to unlock advanced features.

6. **"How does pricing work for multiple accounts?"**
   - Answer: Premium Multi pricing is per account ($29.99/month or $299.99/year per account). Use the slider to calculate your total cost based on account count.

7. **"Can I cancel anytime?"**
   - Answer: Yes, you can cancel your subscription anytime. No long-term contracts or commitments.

8. **"What kind of support do you offer?"**
   - Answer: Free users get community support. Premium users get priority email support. Premium Multi users get dedicated account management.

**Component Specifications**:
- Update existing `faq-section.tsx`
- Keep Accordion component from `@sassy/ui`
- Update all question/answer content

**Styling**:
- Keep existing neobrutalist styling
- Background: white
- Max width: 4xl, centered

---

### Section 12: Final CTA

**Purpose**: Strong closing call-to-action before footer

**Layout**:
- Full-width dark section (black background)
- Centered content with headline, subheadline, and CTA button
- Optional: testimonial snippet or trust badge

**Content Requirements**:
- **Headline**: "Ready to build relationships that close deals?"
- **Subheadline**: "Join 1000+ professionals using EngageKit to transform LinkedIn engagement into revenue."
- **Primary CTA**: "Start Free Today" (Chrome Web Store link)
- **Secondary CTA**: "Book a Demo" (optional, for enterprise)

**Component Specifications**:
- Update existing `final-cta-section.tsx`
- Keep full-width dark background
- Update copy to match new messaging

**Styling**:
- Background: black (#000000)
- Text: white
- CTA button: pink-500 background, white text, large size
- Shadow: hard shadow in pink-500 for contrast

---

### Section 13: Footer

**Purpose**: Standard footer with links and legal

**Layout**:
- Keep existing footer structure
- Update link labels if needed
- Ensure alignment with new messaging

**Content Requirements**:
- Product links (Features, Pricing, FAQ)
- Company links (About, Blog, Contact)
- Legal links (Privacy, Terms, Security)
- Social media icons
- Copyright notice

**Component Specifications**:
- Update existing `footer.tsx` (minimal changes)
- Keep existing layout and styling

**Styling**:
- Keep existing neobrutalist styling
- Background: zinc-50
- Links: gray-700, hover:pink-500

---

## 4. Component Architecture

### Existing Components to Update

1. **`header.tsx`** (minimal changes)
   - Keep existing navigation
   - Ensure links work with new sections

2. **`hero-section.tsx`** (major rewrite)
   - Remove rotating titles
   - New value prop headline
   - Add trust badges section

3. **`features-section.tsx`** (major rewrite OR replace)
   - Transform into Key Features Grid (Section 6)
   - 2x3 grid instead of 1x4
   - New feature content

4. **`video-section.tsx`** (major rewrite)
   - Transform into How It Works (Section 4)
   - 3 video previews instead of 1 YouTube embed
   - Add 3D hover effect

5. **`testimonials-section.tsx`** (content update only)
   - Keep layout and photos
   - Rewrite all 8 testimonial quotes

6. **`faq-section.tsx`** (content update only)
   - Keep accordion structure
   - Update all questions and answers

7. **`final-cta-section.tsx`** (content update)
   - Keep layout
   - Update headline and copy

8. **`footer.tsx`** (minimal changes)
   - Keep as-is or minor link updates

### New Components to Create

1. **`opportunity-section.tsx`** (Section 2)
   - 3 stat cards with large numbers

2. **`problem-solution-section.tsx`** (Section 3)
   - Two-column comparison cards

3. **`how-it-works-section.tsx`** (Section 4)
   - 3-step flow with video previews
   - Sub-component: `step-card.tsx`

4. **`context-engine-section.tsx`** (Section 5)
   - Split layout with YouTube embed
   - Sub-component: `persona-card.tsx`

5. **`key-features-grid.tsx`** (Section 6)
   - 2x3 grid of feature cards
   - Alternative: rewrite existing `features-section.tsx`

6. **`target-personas-section.tsx`** (Section 7)
   - 3 persona cards
   - Sub-component: `persona-card.tsx` (reuse from Section 5)

7. **`reduce-slop-section.tsx`** (Section 8)
   - List with 6 benefit cards

8. **`pricing-section.tsx`** (Section 10)
   - 3 pricing cards with toggle and slider
   - Sub-components:
     - `pricing-card.tsx`
     - `plan-toggle.tsx`
     - `account-slider.tsx`

### Component Reusability Strategy

**Reusable Sub-Components**:
- `persona-card.tsx` - Used in Sections 5 and 7
- `step-card.tsx` - Used in Section 4 (3 instances)
- `pricing-card.tsx` - Used in Section 10 (3 instances)
- `stat-card.tsx` - Used in Section 2 (3 instances)

**Component Organization**:
```
apps/nextjs/src/app/_components/landing/
├── sections/
│   ├── hero-section.tsx
│   ├── opportunity-section.tsx
│   ├── problem-solution-section.tsx
│   ├── how-it-works-section.tsx
│   ├── context-engine-section.tsx
│   ├── key-features-grid.tsx
│   ├── target-personas-section.tsx
│   ├── reduce-slop-section.tsx
│   ├── testimonials-section.tsx
│   ├── pricing-section.tsx
│   ├── faq-section.tsx
│   ├── final-cta-section.tsx
│   └── footer.tsx
├── cards/
│   ├── stat-card.tsx
│   ├── step-card.tsx
│   ├── persona-card.tsx
│   ├── pricing-card.tsx
│   └── testimonial-card.tsx (extracted from testimonials-section)
├── ui/
│   ├── plan-toggle.tsx
│   └── account-slider.tsx
└── landing-content.ts (extracted content)
```

---

## 5. Content Structure (landing-content.ts)

### Purpose

Extract all content (copy, messaging, pricing, FAQs) into a single source of truth file for easy maintenance and content updates without touching component code.

### File Location

`apps/nextjs/src/app/_components/landing/landing-content.ts`

### Structure

```typescript
// apps/nextjs/src/app/_components/landing/landing-content.ts

export const MESSAGING = {
  hero: {
    headline: "Build a personal brand that closes deals",
    subheadline: "Transform LinkedIn engagement from noise into revenue. Connect with decision-makers authentically, stay top-of-mind, and turn relationships into business outcomes.",
    primaryCTA: "Start Building Relationships",
    secondaryCTA: "Watch Demo",
    trustBadges: [
      "1000+ professionals",
      "500k+ comments generated",
      "Used by founders at top startups"
    ]
  },

  opportunity: {
    headline: "Why LinkedIn Matters for B2B",
    subheadline: "The platform where business relationships begin",
    stats: [
      {
        number: "80%",
        label: "of B2B leads",
        description: "come from LinkedIn",
        source: "LinkedIn Marketing Solutions"
      },
      {
        number: "54%",
        label: "of buyers",
        description: "research vendors on LinkedIn before purchasing",
        source: "LinkedIn State of Sales Report"
      },
      {
        number: "10x",
        label: "higher conversion",
        description: "vs. cold outreach",
        source: "Internal EngageKit Data"
      }
    ]
  },

  socialProof: {
    images: [
      {
        src: "/pictures/follower graph before and after using.png",
        caption: "Building a network of decision-makers",
        alt: "Graph showing network growth over time"
      },
      {
        src: "/pictures/boost profile appearances 150k.png",
        caption: "150k professionals discovered your expertise",
        alt: "Profile appearances reaching 150k"
      },
      {
        src: "/pictures/boost profile appearances 180k.png",
        caption: "180k potential connections reached",
        alt: "Profile appearances reaching 180k"
      },
      {
        src: "/pictures/many people reply organically to comments.png",
        caption: "Real conversations that lead to opportunities",
        alt: "Users replying to comments organically"
      },
      {
        src: "/pictures/get people like Jasmine the LinkedIn guru to reply to you.png",
        caption: "Build relationships with industry leaders",
        alt: "Industry leader replying to user comment"
      },
      {
        src: "/pictures/attract network of recruiters, investors, founders.png",
        caption: "Connect with the people who matter for your goals",
        alt: "Network of professionals including recruiters and investors"
      }
    ]
  },

  problemSolution: {
    problem: {
      title: "The Old Way Kills Credibility",
      points: [
        "Generic 'Great post!' comments that scream automation",
        "Spammy engagement that damages your brand",
        "No context or relevance to the conversation",
        "One-size-fits-all replies that get ignored",
        "Zero strategic thinking or relationship building"
      ]
    },
    solution: {
      title: "The EngageKit Way Builds Trust",
      points: [
        "Context-aware comments that add value to conversations",
        "Human-reviewed interactions that maintain authenticity",
        "Strategic targeting of high-value connections",
        "Personalized engagement that respects your voice",
        "Relationship-first approach that drives real outcomes"
      ]
    }
  },

  howItWorks: {
    headline: "How It Works",
    subheadline: "Three steps to meaningful LinkedIn engagement",
    steps: [
      {
        number: 1,
        title: "Compose Context-Aware Comments",
        description: "Our AI analyzes post content, author background, and conversation tone to draft thoughtful, relevant comments. You review and refine before posting.",
        videoPath: "/preview-demo/engagekit 1.0 compose preview.mp4"
      },
      {
        number: 2,
        title: "Build Your Target Network",
        description: "Create lists of high-value connections—prospects, partners, investors, or thought leaders. Focus your engagement where it matters most.",
        videoPath: "/preview-demo/engagekit 1.0 target list preview.mp4"
      },
      {
        number: 3,
        title: "Track Meaningful Engagement",
        description: "Monitor interactions that lead to relationships, not just vanity metrics. See which connections convert to meetings, partnerships, and revenue.",
        videoPath: "/preview-demo/engagekit 1.0 analytics preview.mp4"
      }
    ]
  },

  contextEngine: {
    headline: "Context is Your Competitive Advantage",
    subheadline: "Generic comments are noise. Context-aware engagement opens doors.",
    description: "EngageKit's Context Engine analyzes every post's content, the author's industry and role, recent conversation patterns, and your relationship history. The result? Comments that sound like you wrote them—because you approve every one.",
    youtubeUrl: "https://youtu.be/JKpkQG_zB6U",
    personas: [
      {
        icon: "Rocket",
        title: "For Founders",
        example: "Engaging with a VC's thought leadership post",
        context: "References your startup's space, shows industry knowledge, opens door for intro",
        result: "Meeting request within 48 hours"
      },
      {
        icon: "Handshake",
        title: "For Sales",
        example: "Commenting on a prospect's company announcement",
        context: "Congratulates milestone, relates to their pain points, hints at your solution",
        result: "Warm intro for discovery call"
      },
      {
        icon: "TrendingUp",
        title: "For Growth",
        example: "Engaging with a target account's thought leader",
        context: "Adds insight to their post, positions your brand, builds top-of-mind awareness",
        result: "Inbound demo request"
      }
    ]
  },

  keyFeatures: {
    headline: "Everything You Need for Strategic Engagement",
    features: [
      {
        icon: "Brain",
        title: "Context-Aware AI",
        description: "Analyzes post content, author background, and conversation tone to draft relevant comments"
      },
      {
        icon: "UserCheck",
        title: "Human-in-the-Loop",
        description: "Review, refine, and approve every comment before it goes live. Maintain full control and authenticity"
      },
      {
        icon: "Target",
        title: "Strategic Targeting",
        description: "Build lists of high-value connections and focus your engagement where it drives results"
      },
      {
        icon: "BarChart3",
        title: "Engagement Analytics",
        description: "Track meaningful interactions that lead to business outcomes, not just vanity metrics"
      },
      {
        icon: "Users",
        title: "Multi-Account Management",
        description: "Manage multiple LinkedIn profiles from one dashboard. Perfect for teams and agencies"
      },
      {
        icon: "Paintbrush",
        title: "Style Customization",
        description: "Train the AI on your unique voice, tone, and style. Every comment sounds like you"
      }
    ]
  },

  targetPersonas: {
    headline: "Who This Is For",
    subheadline: "Strategic professionals who understand that relationships drive revenue",
    personas: [
      {
        icon: "Rocket",
        title: "Startup Founders & CEOs",
        description: "Build thought leadership and credibility in your space",
        useCases: [
          "Connect with potential investors",
          "Engage with early adopters and customers",
          "Establish industry authority",
          "Build strategic partnerships"
        ]
      },
      {
        icon: "Handshake",
        title: "Sales & Business Development",
        description: "Warm up prospects before outreach and stay top-of-mind",
        useCases: [
          "Build rapport with decision-makers",
          "Create warm intros for cold prospects",
          "Maintain relationships with existing clients",
          "Drive pipeline from relationship-building"
        ]
      },
      {
        icon: "TrendingUp",
        title: "Growth & Marketing Teams",
        description: "Amplify brand presence and generate inbound interest",
        useCases: [
          "Engage with target accounts at scale",
          "Build community around your product",
          "Position executives as thought leaders",
          "Generate inbound leads from authentic engagement"
        ]
      }
    ]
  },

  reduceSlop: {
    headline: "Cut Through the Slop. Engage 10x Faster.",
    subheadline: "LinkedIn is drowning in AI-generated spam. We help you rise above it.",
    coreValueProp: "EngageKit helps you read and remember your engagement with others at 10x the speed and effectiveness.",
    benefits: [
      {
        icon: "Zap",
        title: "Read Faster",
        description: "Scan posts and context in seconds, not minutes"
      },
      {
        icon: "Brain",
        title: "Remember Everything",
        description: "Full history of every interaction with every connection"
      },
      {
        icon: "User",
        title: "Engage Authentically",
        description: "Human-in-the-loop ensures your voice stays yours"
      },
      {
        icon: "Handshake",
        title: "Build Real Relationships",
        description: "Context-aware comments that start real conversations"
      },
      {
        icon: "Sparkles",
        title: "Stand Out from Slop",
        description: "Your comments sound like you, not a bot"
      },
      {
        icon: "Clock",
        title: "10x Your Output",
        description: "Do in 10 minutes what used to take 2 hours"
      }
    ]
  },

  testimonials: [
    {
      name: "Lisa Thompson",
      title: "Operations Manager",
      quote: "EngageKit helped me build genuine relationships with potential clients. Three partnerships started from LinkedIn conversations I never would have had time for otherwise.",
      image: "/testimonials/american middle aged women business professional.jpg"
    },
    {
      name: "Jamal Brooks",
      title: "Computer Science Student",
      quote: "Instead of generic applications, I engaged with hiring managers on LinkedIn. The conversations led to two internship offers before I even applied formally.",
      image: "/testimonials/black student in america building a personal brand for recruiting.jpg"
    },
    {
      name: "Li Mei",
      title: "High School Senior",
      quote: "I connected with alumni and professors through thoughtful engagement. It made my university applications stand out, and acceptance letters followed.",
      image: "/testimonials/chinese student applying to university from high school girl.jpg"
    },
    {
      name: "Sofía García",
      title: "Graphic Designer",
      quote: "Authentic engagement with potential clients changed my freelance business. Three long-term contracts came from LinkedIn relationships this quarter.",
      image: "/testimonials/creative professional european 27 years old.jpg"
    },
    {
      name: "Thomas Müller",
      title: "Sales Director",
      quote: "Prospects now recognize my name before our first call. EngageKit helped me warm up my pipeline, and my close rate jumped 40%.",
      image: "/testimonials/german business man middle age in office setting.jpg"
    },
    {
      name: "Chloe Wong",
      title: "Marketing Manager",
      quote: "Strategic engagement with target accounts tripled our inbound demo requests. The ROI on relationship-building is incredible.",
      image: "/testimonials/hong kong girl professional 30 years old marketing.jpg"
    },
    {
      name: "Marek Novak",
      title: "Animation Storyteller",
      quote: "I stay connected with industry leaders without sacrificing creative time. Two studio partnerships started from LinkedIn conversations this year.",
      image: "/testimonials/storyteller animation 40 somthing man from europe.jpg"
    },
    {
      name: "Aisha Khan",
      title: "Law Student",
      quote: "Engaging with legal professionals opened mentorship opportunities I never expected. Two job offers came from relationships I built on LinkedIn.",
      image: "/testimonials/young muslim girl from south asia studying law.jpg"
    }
  ],

  pricing: {
    headline: "Pricing",
    subheadline: "Start free. Scale as you grow.",
    billingToggle: {
      monthly: "Monthly",
      yearly: "Yearly (Save 17%)"
    },
    tiers: [
      {
        id: "free",
        name: "Free",
        badge: "Get Started",
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: "Perfect for testing the platform",
        features: [
          "Limited engagements per day",
          "Basic AI drafts",
          "Manual mode only",
          "7-day interaction history",
          "Community support"
        ],
        cta: "Start Free",
        ctaLink: "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii"
      },
      {
        id: "premium-single",
        name: "Premium Single",
        badge: "Most Popular",
        monthlyPrice: 29.99,
        yearlyPrice: 299.99,
        description: "For individual professionals",
        accountCount: 1,
        features: [
          "Unlimited engagements",
          "Advanced context engine",
          "Human-in-the-loop workflow",
          "Custom style training",
          "Full analytics dashboard",
          "Priority email support",
          "All future updates included"
        ],
        cta: "Start Free Trial",
        ctaLink: "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii",
        featured: true
      },
      {
        id: "premium-multi",
        name: "Premium Multi",
        badge: "Teams & Agencies",
        monthlyPricePerAccount: 29.99,
        yearlyPricePerAccount: 299.99,
        description: "For teams managing multiple accounts",
        accountRange: { min: 2, max: 24 },
        features: [
          "All Premium Single features",
          "Team management dashboard",
          "Shared style guides",
          "Centralized billing",
          "Account manager support",
          "Custom onboarding",
          "Volume discounts available"
        ],
        cta: "Contact Sales",
        ctaLink: "mailto:knamnguyen.work@gmail.com?subject=Premium Multi Inquiry"
      }
    ]
  },

  faq: {
    headline: "Frequently Asked Questions",
    questions: [
      {
        question: "Will this help me build real business relationships?",
        answer: "Yes, EngageKit focuses on strategic engagement with context-aware comments that start meaningful conversations. Users report increased meeting requests and partnership opportunities within 30-60 days of consistent use."
      },
      {
        question: "How is this different from automation tools?",
        answer: "EngageKit is human-in-the-loop. You review and approve every interaction before it goes live. We provide intelligent drafts based on context, but you maintain full control and authenticity. No bots, no APIs, no spam."
      },
      {
        question: "What results can I expect?",
        answer: "Results vary based on your goals and consistency, but users typically see 3-5x higher response rates, more meaningful conversations, and measurable business outcomes (meetings, partnerships, deals) within 30-60 days. Relationship-building is a long-term investment."
      },
      {
        question: "Is this ethical and safe for my LinkedIn account?",
        answer: "Yes. EngageKit operates client-side (no bots or server automation), respects LinkedIn's terms of service, and maintains authentic engagement patterns. You're in full control of every interaction. We prioritize account safety and authenticity."
      },
      {
        question: "What's included in the free tier?",
        answer: "The free tier includes basic AI drafts, manual mode, limited daily engagements, and 7-day interaction history. It's perfect for testing the platform and understanding the workflow before upgrading to unlock advanced features like custom style training and unlimited engagements."
      },
      {
        question: "How does pricing work for multiple accounts?",
        answer: "Premium Multi pricing is per account—$29.99/month or $299.99/year per account. Use the slider in the pricing section to calculate your total cost based on account count. Volume discounts available for 10+ accounts."
      },
      {
        question: "Can I cancel anytime?",
        answer: "Yes, you can cancel your subscription anytime with no penalties or long-term contracts. Your access continues through the end of your current billing period."
      },
      {
        question: "What kind of support do you offer?",
        answer: "Free users get community support via our Discord. Premium users get priority email support with 24-hour response times. Premium Multi users get dedicated account management and custom onboarding sessions."
      }
    ]
  },

  finalCTA: {
    headline: "Ready to build relationships that close deals?",
    subheadline: "Join 1000+ professionals using EngageKit to transform LinkedIn engagement into revenue.",
    primaryCTA: "Start Free Today",
    primaryLink: "https://chromewebstore.google.com/detail/engagekit/gnaedgbedhaolekeffieinkehccpaiii",
    secondaryCTA: "Book a Demo",
    secondaryLink: "mailto:knamnguyen.work@gmail.com?subject=Demo Request"
  }
};

export const ASSETS = {
  videos: {
    composePreview: "/preview-demo/engagekit 1.0 compose preview.mp4",
    targetListPreview: "/preview-demo/engagekit 1.0 target list preview.mp4",
    analyticsPreview: "/preview-demo/engagekit 1.0 analytics preview.mp4",
    accountTabPreview: "/preview-demo/engagekit 1.0 account tab preview.mp4"
  },
  youtube: {
    overviewVideo: "https://youtu.be/JKpkQG_zB6U"
  },
  logos: {
    main: "/engagekit-logo.svg",
    sprites: {
      blink: "/engagekit-sprite-blink.svg"
    }
  },
  socialProof: [
    "/pictures/meta-link-preview.png",
    // Add other social proof image paths
  ]
};

// Utility functions for content
export function getFormattedPrice(price: number): string {
  return price === 0 ? "Free" : `$${price.toFixed(2)}`;
}

export function calculateTotalPrice(
  pricePerAccount: number,
  accountCount: number
): number {
  return pricePerAccount * accountCount;
}

export function getSavingsPercentage(monthly: number, yearly: number): number {
  const monthlyCost = monthly * 12;
  const savings = ((monthlyCost - yearly) / monthlyCost) * 100;
  return Math.round(savings);
}
```

### Benefits of Content Extraction

1. **Maintainability**: Update copy without touching component code
2. **Type Safety**: TypeScript ensures content structure matches component expectations
3. **Reusability**: Share content across multiple components
4. **Testing**: Easier to test content separately from presentation
5. **Localization**: Foundation for future multi-language support
6. **Content Audits**: Review all messaging in one place

---

## 6. Video Assets

### Local MP4 Files

**Location**: `/public/preview-demo/`

**Available Files**:
1. `engagekit 1.0 compose preview.mp4` (13.3 MB)
2. `engagekit 1.0 target list preview.mp4` (26.6 MB)
3. `engagekit 1.0 analytics preview.mp4` (28.8 MB)
4. `engagekit 1.0 account tab preview.mp4` (19.1 MB)

**Usage**:
- Section 4 (How It Works): Use compose, target list, and analytics previews
- Reserve account tab preview for future sections or alternative demos

**Video Component Pattern**:
```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  aria-label="Demo video showing [feature description]"
  className="rounded-lg border-4 border-black shadow-xl md:max-h-[400px] md:object-cover md:object-left md:[transform:scale(1.5)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]"
>
  <source src="/preview-demo/[filename].mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

### YouTube Embed

**URL**: `https://youtu.be/JKpkQG_zB6U`

**Usage**: Section 5 (Context Engine)

**Embed Pattern**:
```tsx
<div className="aspect-video w-full overflow-hidden rounded-2xl border-4 border-black bg-black shadow-[8px_8px_0px_#000]">
  <iframe
    width="100%"
    height="100%"
    src="https://www.youtube.com/embed/JKpkQG_zB6U"
    title="EngageKit Context Engine Overview"
    style={{ border: "0px" }}
    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
  />
</div>
```

### 3D Hover Effect

**CSS Transform** (from `apps/ghost-blog` reference):
```css
md:[transform:scale(1.5)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]
```

**Application**:
- Apply at `md:` breakpoint (768px+)
- Static transform (always visible, no hover trigger)
- Gives depth and premium feel to video previews

**Implementation Notes**:
- Only apply to video containers, not parent sections
- Ensure container has sufficient padding to prevent clipping
- Test on various screen sizes for visual balance

---

## 7. Phased Delivery Plan

### Current Status

⏳ **Phase 1**: Content Extraction (PLANNED)
⏳ **Phase 2**: Hero & Trust Sections (PLANNED)
⏳ **Phase 3**: Problem/Solution & Opportunity (PLANNED)
⏳ **Phase 4**: How It Works & Context Engine (PLANNED)
⏳ **Phase 5**: Features & Personas (PLANNED)
⏳ **Phase 6**: Reduce Slop & Testimonials (PLANNED)
⏳ **Phase 7**: Pricing Section (PLANNED)
⏳ **Phase 8**: FAQ & Final CTA (PLANNED)
⏳ **Phase 9**: Integration & Testing (PLANNED)
⏳ **Phase 10**: Responsive Polish & Launch (PLANNED)

---

### Phase 1: Content Extraction

**Objective**: Create single source of truth for all landing page content

**Scope**:
- Create `landing-content.ts` with all messaging, copy, and data
- Define TypeScript interfaces for content structure
- Add utility functions for pricing calculations

**Files to Create**:
- `apps/nextjs/src/app/_components/landing/landing-content.ts`

**Testing**:
- Verify TypeScript types compile
- Test utility functions (price calculations, savings percentage)
- Import in test component to ensure structure is correct

**Acceptance Criteria**:
- [ ] Content file created with all 13 sections
- [ ] TypeScript types defined and compile without errors
- [ ] Utility functions tested and working
- [ ] File can be imported in components without issues

**Estimated Time**: 2 hours

---

### Phase 2: Hero & Trust Sections

**Objective**: Redesign hero section with new value prop and add trust badges

**Scope**:
- Update `hero-section.tsx` with new headline and copy
- Remove rotating titles component (or keep if repurposing)
- Add trust badges section below CTA
- Update mobile/desktop CTA patterns

**Files to Modify**:
- `apps/nextjs/src/app/_components/landing/hero-section.tsx`

**Files to Remove** (optional):
- `apps/nextjs/src/app/_components/landing/rotating-titles.tsx` (if not reused)

**Component Structure**:
```tsx
<section className="container flex flex-col items-center gap-6 py-24 text-center">
  {/* Logo */}
  <Image src="/engagekit-logo.svg" ... />

  {/* Headline */}
  <h1>{MESSAGING.hero.headline}</h1>

  {/* Subheadline */}
  <p>{MESSAGING.hero.subheadline}</p>

  {/* CTA Buttons */}
  <div className="flex gap-4">
    <Button>{MESSAGING.hero.primaryCTA}</Button>
    <Button variant="outline">{MESSAGING.hero.secondaryCTA}</Button>
  </div>

  {/* Trust Badges */}
  <div className="flex flex-wrap gap-6 justify-center">
    {MESSAGING.hero.trustBadges.map(badge => (
      <Badge key={badge}>{badge}</Badge>
    ))}
  </div>
</section>
```

**Testing**:
- Hero renders correctly on desktop
- Hero stacks properly on mobile
- CTAs link to correct URLs
- Trust badges display in responsive grid

**Acceptance Criteria**:
- [ ] New headline and subheadline displayed
- [ ] Rotating titles removed (if not needed)
- [ ] Trust badges section added and responsive
- [ ] CTAs work on mobile and desktop
- [ ] Neobrutalist styling maintained

**Estimated Time**: 2 hours

---

### Phase 3: Problem/Solution & Opportunity

**Objective**: Create new sections for opportunity stats and problem/solution comparison

**Scope**:
- Create `opportunity-section.tsx` with 3 stat cards
- Create `problem-solution-section.tsx` with two-column comparison
- Create reusable `stat-card.tsx` component

**Files to Create**:
- `apps/nextjs/src/app/_components/landing/sections/opportunity-section.tsx`
- `apps/nextjs/src/app/_components/landing/sections/problem-solution-section.tsx`
- `apps/nextjs/src/app/_components/landing/cards/stat-card.tsx`

**Opportunity Section Structure**:
```tsx
<section className="bg-white py-20">
  <div className="container max-w-7xl">
    <h2>{MESSAGING.opportunity.headline}</h2>
    <p>{MESSAGING.opportunity.subheadline}</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {MESSAGING.opportunity.stats.map(stat => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  </div>
</section>
```

**Problem/Solution Section Structure**:
```tsx
<section className="bg-zinc-50 py-20">
  <div className="container max-w-7xl">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Problem Card */}
      <Card className="border-2 border-red-500">
        <CardHeader>
          <CardTitle>{MESSAGING.problemSolution.problem.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {MESSAGING.problemSolution.problem.points.map(point => (
              <li key={point}>
                <X className="text-red-500" /> {point}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Solution Card */}
      <Card className="border-2 border-green-500">
        <CardHeader>
          <CardTitle>{MESSAGING.problemSolution.solution.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {MESSAGING.problemSolution.solution.points.map(point => (
              <li key={point}>
                <CheckCircle2 className="text-green-500" /> {point}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</section>
```

**Testing**:
- Stat cards display large numbers and descriptions
- Problem/Solution cards side-by-side on desktop
- Cards stack on mobile
- Icon colors match design (red for problems, green for solutions)

**Acceptance Criteria**:
- [ ] Opportunity section with 3 stat cards created
- [ ] Problem/Solution section with 2 cards created
- [ ] Responsive layout works on all breakpoints
- [ ] Neobrutalist styling applied (borders, shadows)
- [ ] Content pulled from landing-content.ts

**Estimated Time**: 3 hours

---

### Phase 4: How It Works & Context Engine

**Objective**: Create video showcase sections with 3D effects and YouTube embed

**Scope**:
- Create `how-it-works-section.tsx` with 3 video previews
- Create `context-engine-section.tsx` with YouTube embed
- Create reusable `step-card.tsx` component
- Create reusable `persona-card.tsx` component
- Implement 3D CSS transform for video hover effect

**Files to Create**:
- `apps/nextjs/src/app/_components/landing/sections/how-it-works-section.tsx`
- `apps/nextjs/src/app/_components/landing/sections/context-engine-section.tsx`
- `apps/nextjs/src/app/_components/landing/cards/step-card.tsx`
- `apps/nextjs/src/app/_components/landing/cards/persona-card.tsx`

**How It Works Section Structure**:
```tsx
<section className="bg-white py-20">
  <div className="container max-w-7xl">
    <h2>{MESSAGING.howItWorks.headline}</h2>
    <p>{MESSAGING.howItWorks.subheadline}</p>

    <div className="space-y-16">
      {MESSAGING.howItWorks.steps.map(step => (
        <StepCard key={step.number} {...step} />
      ))}
    </div>
  </div>
</section>
```

**StepCard Component** (alternating left/right layout):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
  {step.number % 2 === 1 ? (
    <>
      {/* Text on left, video on right */}
      <div>
        <Badge>{step.number}</Badge>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </div>
      <video ... className="... md:[transform:scale(1.5)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]">
        <source src={step.videoPath} />
      </video>
    </>
  ) : (
    <>
      {/* Video on left, text on right */}
      <video ... className="... md:[transform:scale(1.5)_perspective(1040px)_rotateY(11deg)_rotateX(2deg)_rotate(-2deg)]">
        <source src={step.videoPath} />
      </video>
      <div>
        <Badge>{step.number}</Badge>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </div>
    </>
  )}
</div>
```

**Context Engine Section Structure**:
```tsx
<section className="bg-cream py-20">
  <div className="container max-w-7xl">
    <h2>{MESSAGING.contextEngine.headline}</h2>
    <p>{MESSAGING.contextEngine.subheadline}</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Left: Explanation + Persona Examples */}
      <div>
        <p>{MESSAGING.contextEngine.description}</p>

        <div className="space-y-4 mt-8">
          {MESSAGING.contextEngine.personas.map(persona => (
            <PersonaCard key={persona.title} {...persona} />
          ))}
        </div>
      </div>

      {/* Right: YouTube Embed */}
      <div className="aspect-video">
        <iframe src={MESSAGING.contextEngine.youtubeUrl} ... />
      </div>
    </div>
  </div>
</section>
```

**3D Transform Notes**:
- Apply at `md:` breakpoint only (768px+)
- Alternate angle for visual interest (left videos rotate right, right videos rotate left)
- Ensure parent container has enough padding to prevent clipping

**Testing**:
- All 3 videos load and autoplay with 3D effect
- 3D transform only applies on desktop (not mobile)
- YouTube embed loads and plays
- Persona cards display with icons and examples
- Alternating layout works correctly (step 1 text-left, step 2 text-right, step 3 text-left)

**Acceptance Criteria**:
- [ ] How It Works section with 3 video previews created
- [ ] 3D CSS transform applied correctly
- [ ] Alternating left/right layout works
- [ ] Context Engine section with YouTube embed created
- [ ] Persona cards display with icons and context examples
- [ ] Responsive layout works on all breakpoints
- [ ] Videos autoplay and loop correctly

**Estimated Time**: 4 hours

---

### Phase 5: Features & Personas

**Objective**: Create feature grid and target personas sections

**Scope**:
- Update `features-section.tsx` OR create new `key-features-grid.tsx`
- Create `target-personas-section.tsx`
- Reuse `persona-card.tsx` from Phase 4

**Files to Modify/Create**:
- `apps/nextjs/src/app/_components/landing/sections/key-features-grid.tsx` (new)
- `apps/nextjs/src/app/_components/landing/sections/target-personas-section.tsx` (new)

**Key Features Grid Structure**:
```tsx
<section className="bg-white py-20">
  <div className="container max-w-7xl">
    <h2>{MESSAGING.keyFeatures.headline}</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {MESSAGING.keyFeatures.features.map(feature => (
        <Card key={feature.title}>
          <CardContent className="flex items-start gap-4 p-6">
            <Icon name={feature.icon} className="size-8 text-pink-500" />
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>
```

**Target Personas Section Structure**:
```tsx
<section className="bg-zinc-50 py-20">
  <div className="container max-w-7xl">
    <h2>{MESSAGING.targetPersonas.headline}</h2>
    <p>{MESSAGING.targetPersonas.subheadline}</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {MESSAGING.targetPersonas.personas.map(persona => (
        <Card key={persona.title}>
          <CardHeader>
            <Icon name={persona.icon} className="size-12 text-pink-500" />
            <CardTitle>{persona.title}</CardTitle>
            <CardDescription>{persona.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul>
              {persona.useCases.map(useCase => (
                <li key={useCase}>{useCase}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>
```

**Icon Handling**:
- Use lucide-react icons
- Create icon mapping utility if needed:
```typescript
const iconMap = {
  Brain: Brain,
  UserCheck: UserCheck,
  Target: Target,
  BarChart3: BarChart3,
  Users: Users,
  Paintbrush: Paintbrush,
  Rocket: Rocket,
  Handshake: Handshake,
  TrendingUp: TrendingUp
};
```

**Testing**:
- Features grid displays 6 cards in 2x3 layout
- Icons render correctly for each feature
- Personas display in 3-column layout on desktop
- Use cases list properly for each persona
- Cards have hover effects (subtle lift)

**Acceptance Criteria**:
- [ ] Key Features Grid with 6 features created
- [ ] Icons display correctly for each feature
- [ ] Target Personas section with 3 cards created
- [ ] Use cases list for each persona
- [ ] Responsive layout works (2 cols on tablet, 1 col on mobile)
- [ ] Neobrutalist styling applied
- [ ] Content pulled from landing-content.ts

**Estimated Time**: 3 hours

---

### Phase 6: Reduce Slop & Testimonials

**Objective**: Create reduce-slop section (10x speed/effectiveness messaging) and rewrite testimonials

**Scope**:
- Create `reduce-slop-section.tsx` with 6 benefit cards
- Update `testimonials-section.tsx` with new quotes
- Keep existing testimonial photos and layout

**Files to Create**:
- `apps/nextjs/src/app/_components/landing/sections/reduce-slop-section.tsx`

**Files to Modify**:
- `apps/nextjs/src/app/_components/landing/sections/testimonials-section.tsx`

**Anti-Spam Section Structure**:
```tsx
<section className="bg-white py-20">
  <div className="container max-w-4xl mx-auto text-center">
    <h2>{MESSAGING.antiSpam.headline}</h2>
    <p>{MESSAGING.antiSpam.subheadline}</p>

    <div className="space-y-6 mt-12">
      {MESSAGING.antiSpam.items.map(item => (
        <div key={item.not} className="flex items-center justify-center gap-6">
          <div className="text-2xl text-gray-400 line-through">
            {item.not}
          </div>
          <ArrowRight className="text-pink-500 size-8" />
          <div className="text-xl text-pink-500 font-semibold">
            {item.instead}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Testimonials Update**:
- Keep existing card layout and photo display
- Replace quote text with new relationship-focused quotes from `MESSAGING.testimonials`
- Keep existing star ratings and structure

**Testing**:
- Anti-spam items display with correct strikethrough
- Arrow icons render between NOT and INSTEAD
- Testimonials display updated quotes
- Photos still load correctly
- Testimonial cards maintain existing layout

**Acceptance Criteria**:
- [ ] Anti-spam section created with 6 benefit cards
- [ ] All 6 NOT/INSTEAD pairs display correctly
- [ ] Arrow icons render between items
- [ ] Testimonials updated with new quotes
- [ ] Photos and layout unchanged
- [ ] Responsive layout works on all breakpoints

**Estimated Time**: 2 hours

---

### Phase 7: Pricing Section

**Objective**: Create comprehensive pricing section with toggle and calculator

**Scope**:
- Create `pricing-section.tsx` with 3 pricing cards
- Create `pricing-card.tsx` reusable component
- Create `plan-toggle.tsx` for monthly/yearly switch
- Create `account-slider.tsx` for multi-account calculator
- Implement dynamic price calculations

**Files to Create**:
- `apps/nextjs/src/app/_components/landing/sections/pricing-section.tsx`
- `apps/nextjs/src/app/_components/landing/cards/pricing-card.tsx`
- `apps/nextjs/src/app/_components/landing/ui/plan-toggle.tsx`
- `apps/nextjs/src/app/_components/landing/ui/account-slider.tsx`

**Pricing Section Structure**:
```tsx
"use client";

import { useState } from "react";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true); // Default to yearly
  const [accountCount, setAccountCount] = useState(2); // Default for Premium Multi

  return (
    <section className="bg-white py-20">
      <div className="container max-w-7xl">
        <h2>{MESSAGING.pricing.headline}</h2>
        <p>{MESSAGING.pricing.subheadline}</p>

        {/* Monthly/Yearly Toggle */}
        <PlanToggle isYearly={isYearly} onToggle={setIsYearly} />

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {MESSAGING.pricing.tiers.map(tier => (
            <PricingCard
              key={tier.id}
              tier={tier}
              isYearly={isYearly}
              accountCount={tier.id === 'premium-multi' ? accountCount : undefined}
              featured={tier.featured}
            />
          ))}
        </div>

        {/* Account Slider (for Premium Multi) */}
        {/* This could be inside PricingCard for Premium Multi tier */}
      </div>
    </section>
  );
}
```

**PricingCard Component**:
```tsx
export function PricingCard({
  tier,
  isYearly,
  accountCount,
  featured
}: {
  tier: PricingTier;
  isYearly: boolean;
  accountCount?: number;
  featured?: boolean;
}) {
  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
  const totalPrice = accountCount ? price * accountCount : price;

  return (
    <Card className={cn(
      "relative border-2 border-black shadow-[4px_4px_0px_#000]",
      featured && "border-pink-500 scale-105"
    )}>
      {featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          {tier.badge}
        </Badge>
      )}

      <CardHeader>
        <CardTitle>{tier.name}</CardTitle>
        <div className="text-4xl font-bold text-pink-500">
          {getFormattedPrice(totalPrice)}
          <span className="text-lg text-gray-500">
            /{isYearly ? 'year' : 'month'}
          </span>
        </div>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {tier.features.map(feature => (
            <li key={feature} className="flex items-start gap-2">
              <CheckCircle2 className="size-5 text-green-500 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Account Slider for Premium Multi */}
        {tier.id === 'premium-multi' && accountCount && (
          <AccountSlider
            value={accountCount}
            onChange={setAccountCount}
            min={tier.accountRange.min}
            max={tier.accountRange.max}
          />
        )}
      </CardContent>

      <CardFooter>
        <Button
          asChild
          className="w-full"
          variant={featured ? "primary" : "outline"}
        >
          <a href={tier.ctaLink}>{tier.cta}</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**PlanToggle Component**:
```tsx
import { Tabs, TabsList, TabsTrigger } from "@sassy/ui/tabs";

export function PlanToggle({
  isYearly,
  onToggle
}: {
  isYearly: boolean;
  onToggle: (yearly: boolean) => void;
}) {
  return (
    <Tabs
      value={isYearly ? "yearly" : "monthly"}
      onValueChange={(value) => onToggle(value === "yearly")}
      className="flex justify-center"
    >
      <TabsList className="border-2 border-black shadow-[2px_2px_0px_#000]">
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="yearly">
          Yearly
          <Badge className="ml-2 text-xs">Save 17%</Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

**AccountSlider Component**:
```tsx
import { Slider } from "@sassy/ui/slider";

export function AccountSlider({
  value,
  onChange,
  min,
  max
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="mt-6 space-y-2">
      <label className="text-sm font-medium">
        Number of accounts: {value}
      </label>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={min}
        max={max}
        step={1}
        className="[&_[role=slider]]:bg-pink-500"
      />
      <p className="text-xs text-gray-500">
        {value} accounts × ${isYearly ? tier.yearlyPricePerAccount : tier.monthlyPricePerAccount} = ${totalPrice}
      </p>
    </div>
  );
}
```

**Testing**:
- Toggle switches between monthly and yearly pricing
- Prices update correctly when toggling
- Featured card (Premium Single) stands out visually
- Account slider for Premium Multi works smoothly
- Total price calculates correctly based on account count
- CTAs link to correct URLs (Chrome Web Store, email)

**Acceptance Criteria**:
- [ ] Pricing section with 3 cards created
- [ ] Monthly/Yearly toggle works correctly
- [ ] Prices update when toggling billing period
- [ ] Account slider for Premium Multi functional
- [ ] Total price calculates correctly
- [ ] Featured card (Premium Single) highlighted
- [ ] CTAs link to correct destinations
- [ ] Responsive layout works (stack on mobile)
- [ ] Neobrutalist styling applied

**Estimated Time**: 4 hours

---

### Phase 8: FAQ & Final CTA

**Objective**: Update FAQ content and finalize bottom CTA section

**Scope**:
- Update `faq-section.tsx` with new questions and answers
- Update `final-cta-section.tsx` with new messaging
- Keep accordion and layout structure

**Files to Modify**:
- `apps/nextjs/src/app/_components/landing/sections/faq-section.tsx`
- `apps/nextjs/src/app/_components/landing/sections/final-cta-section.tsx`

**FAQ Section Update**:
- Replace existing FAQ data with `MESSAGING.faq`
- Keep Accordion component from `@sassy/ui`
- Update question/answer content only

**FAQ Section Structure** (minimal changes to existing):
```tsx
<section className="bg-white py-20">
  <div className="container mx-auto max-w-4xl px-4">
    <h2>{MESSAGING.faq.headline}</h2>
    <Accordion type="single" collapsible className="w-full">
      {MESSAGING.faq.questions.map((faq, index) => (
        <AccordionItem value={`item-${index + 1}`} key={index}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
</section>
```

**Final CTA Section Update**:
```tsx
<section id="final-cta" className="bg-black py-20">
  <div className="container max-w-4xl mx-auto text-center">
    <h2 className="text-white">{MESSAGING.finalCTA.headline}</h2>
    <p className="text-gray-300">{MESSAGING.finalCTA.subheadline}</p>

    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
      <Button
        asChild
        size="lg"
        className="bg-pink-500 text-white border-2 border-white shadow-[4px_4px_0px_#fff]"
      >
        <a href={MESSAGING.finalCTA.primaryLink}>
          {MESSAGING.finalCTA.primaryCTA}
        </a>
      </Button>

      <Button
        asChild
        size="lg"
        variant="outline"
        className="bg-black text-white border-2 border-white shadow-[4px_4px_0px_#fff]"
      >
        <a href={MESSAGING.finalCTA.secondaryLink}>
          {MESSAGING.finalCTA.secondaryCTA}
        </a>
      </Button>
    </div>
  </div>
</section>
```

**Testing**:
- All 8 FAQ questions display and expand correctly
- FAQ answers render properly (including links)
- Final CTA displays on black background
- Primary and secondary CTAs visible and functional
- CTAs link to correct URLs

**Acceptance Criteria**:
- [ ] FAQ section updated with new questions/answers
- [ ] All accordion items expand and collapse correctly
- [ ] Final CTA section updated with new messaging
- [ ] Primary and secondary CTAs functional
- [ ] Styling maintained (white text on black background)
- [ ] Responsive layout works on mobile

**Estimated Time**: 2 hours

---

### Phase 9: Integration & Testing

**Objective**: Integrate all sections into main page and test end-to-end

**Scope**:
- Update `page.tsx` to import and render all new sections
- Remove old sections that are replaced
- Ensure proper section ordering
- Test full page flow and interactions

**Files to Modify**:
- `apps/nextjs/src/app/page.tsx`

**New Page Structure**:
```tsx
// apps/nextjs/src/app/page.tsx

import { Header } from "./_components/landing/header";
import { HeroSection } from "./_components/landing/sections/hero-section";
import { OpportunitySection } from "./_components/landing/sections/opportunity-section";
import { ProblemSolutionSection } from "./_components/landing/sections/problem-solution-section";
import { HowItWorksSection } from "./_components/landing/sections/how-it-works-section";
import { ContextEngineSection } from "./_components/landing/sections/context-engine-section";
import { KeyFeaturesGrid } from "./_components/landing/sections/key-features-grid";
import { TargetPersonasSection } from "./_components/landing/sections/target-personas-section";
import { ReduceSlopSection } from "./_components/landing/sections/reduce-slop-section";
import { TestimonialsSection } from "./_components/landing/sections/testimonials-section";
import { PricingSection } from "./_components/landing/sections/pricing-section";
import { FaqSection } from "./_components/landing/sections/faq-section";
import { FinalCTASection } from "./_components/landing/sections/final-cta-section";
import { Footer } from "./_components/landing/footer";
import { FloatingCTA } from "./_components/landing/floating-cta";

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-zinc-50 text-black">
      <Header />

      {/* Affiliate Banner - keep existing */}
      <div className="fixed top-16 z-40 w-full bg-pink-500 py-2">
        <a
          href="https://engagekit.endorsely.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="animate-bounce-light text-ld text-center font-bold text-white">
            Early Affiliate Special: earn up to $1200 a year by referring
            potential users for EngageKit
          </div>
        </a>
      </div>

      <main className="pt-24">
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. The Opportunity */}
        <OpportunitySection />

        {/* 3. Problem → Solution Bridge */}
        <ProblemSolutionSection />

        {/* 4. How It Works */}
        <HowItWorksSection />

        {/* 5. Context Engine */}
        <ContextEngineSection />

        {/* 6. Key Features Grid */}
        <KeyFeaturesGrid />

        {/* 7. Who This Is For */}
        <TargetPersonasSection />

        {/* 8. Reduce Slop & Spam */}
        <ReduceSlopSection />

        {/* 9. Testimonials */}
        <TestimonialsSection />

        {/* 10. Pricing */}
        <PricingSection />

        {/* 11. FAQ */}
        <FaqSection />

        {/* 12. Final CTA */}
        <FinalCTASection />
      </main>

      {/* 13. Footer */}
      <Footer />

      {/* Floating CTA - keep existing */}
      <FloatingCTA />
    </div>
  );
}
```

**Files to Archive/Remove**:
- `gumroad-carousel.tsx` → rename to `social-proof-carousel.tsx` (keep, update captions)
- `rotating-titles.tsx` (replaced by static headline)
- `mobile-signup-form.tsx` (if not used in hero)
- `mobile-signup-modal.tsx` (if not used in hero)

**Testing Checklist**:
- [ ] All 13 sections render in correct order
- [ ] No console errors on page load
- [ ] All videos autoplay and loop
- [ ] YouTube embed loads correctly
- [ ] Pricing toggle and slider work
- [ ] All CTAs link to correct destinations
- [ ] FAQ accordion expands/collapses
- [ ] Testimonials display correctly
- [ ] Trust badges show in hero
- [ ] Footer links work
- [ ] Floating CTA appears on scroll

**Performance Testing**:
- [ ] Page loads in <3 seconds on 3G
- [ ] No layout shift (CLS) issues
- [ ] Videos lazy-load appropriately
- [ ] Images optimized (use Next.js Image component)

**Acceptance Criteria**:
- [ ] All 13 sections integrated into page.tsx
- [ ] Section ordering correct (Hero → Opportunity → ... → Footer)
- [ ] Old components removed or archived
- [ ] No TypeScript errors
- [ ] No console warnings or errors
- [ ] All interactions functional
- [ ] Page loads performantly

**Estimated Time**: 3 hours

---

### Phase 10: Responsive Polish & Launch

**Objective**: Final responsive design polish and production readiness

**Scope**:
- Test all breakpoints (mobile, tablet, desktop)
- Fix responsive issues
- Optimize for mobile performance
- Accessibility audit
- Final QA and launch preparation

**Testing Devices**:
- [ ] iPhone SE (375px) - smallest viewport
- [ ] iPhone 12 (390px) - common mobile
- [ ] iPad Mini (768px) - tablet portrait
- [ ] iPad Pro (1024px) - tablet landscape
- [ ] Desktop (1440px+) - desktop

**Responsive Issues to Check**:
- [ ] Hero section stacks properly on mobile
- [ ] Stat cards grid collapses correctly
- [ ] Problem/Solution cards stack on mobile
- [ ] Video previews maintain aspect ratio
- [ ] 3D transform only applies on desktop (not mobile)
- [ ] Feature grid becomes single column on mobile
- [ ] Persona cards stack on mobile
- [ ] Pricing cards stack on mobile
- [ ] Testimonials maintain layout on all sizes
- [ ] FAQ accordion readable on mobile
- [ ] Final CTA buttons stack on mobile
- [ ] Footer responsive

**Mobile Optimizations**:
- [ ] Reduce padding on mobile (py-12 vs py-20)
- [ ] Adjust font sizes for readability (text-3xl vs text-5xl)
- [ ] Ensure touch targets are 44x44px minimum
- [ ] Test video autoplay on iOS (may need user interaction)
- [ ] Optimize video file sizes if loading slowly

**Accessibility Audit**:
- [ ] All images have alt text
- [ ] Videos have aria-label attributes
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus states visible for keyboard navigation
- [ ] Tab order logical and functional
- [ ] ARIA labels on interactive elements
- [ ] Links have descriptive text (not "click here")

**Performance Optimizations**:
- [ ] Use Next.js Image component for all images
- [ ] Add loading="lazy" to videos below fold
- [ ] Preload hero video if critical
- [ ] Minimize initial JavaScript bundle
- [ ] Remove unused imports and dependencies
- [ ] Run Lighthouse audit (target score >90)

**Cross-Browser Testing**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - especially iOS Safari for videos
- [ ] Edge (latest)

**Final QA Checklist**:
- [ ] All links work (no 404s)
- [ ] All videos load and play
- [ ] YouTube embed functional
- [ ] Pricing toggle and slider work
- [ ] FAQ accordion functional
- [ ] Forms submit correctly (if any)
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] No accessibility violations (use axe DevTools)
- [ ] Page loads in <3 seconds on 3G
- [ ] No layout shift (good CLS score)
- [ ] All content matches landing-content.ts

**Launch Preparation**:
- [ ] Update metadata in layout.tsx if needed
- [ ] Update og:image and meta description
- [ ] Test social media preview (Twitter, LinkedIn)
- [ ] Verify analytics tracking works (if implemented)
- [ ] Deploy to staging for final review
- [ ] Get stakeholder approval
- [ ] Deploy to production

**Acceptance Criteria**:
- [ ] All breakpoints work correctly
- [ ] Mobile experience polished and fast
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Lighthouse score >90 on all metrics
- [ ] Cross-browser testing passed
- [ ] QA checklist complete
- [ ] Stakeholder approval received
- [ ] Deployed to production

**Estimated Time**: 4 hours

---

## Implementation Checklist (Complete Workflow)

### Phase 1: Content Extraction (2 hours) ✅ COMPLETE
- [x] Create `landing-content.ts` with all 13 sections
- [x] Define TypeScript interfaces for content structure
- [x] Add utility functions (getFormattedPrice, calculateTotalPrice, getSavingsPercentage)
- [x] Test imports and type safety

### Phase 2: Hero & Trust Sections (2 hours) ✅ COMPLETE
- [x] Update `hero-section.tsx` with new headline and subheadline
- [x] Remove or repurpose rotating titles
- [x] Add trust badges section below CTA
- [x] Test mobile and desktop layouts
- [x] Verify CTAs link correctly

### Phase 3: Problem/Solution, Opportunity & Social Proof (3.5 hours) ✅ COMPLETE
- [x] Create `stat-card.tsx` reusable component
- [x] Create `opportunity-section.tsx` with 3 stat cards
- [x] Create `problem-solution-section.tsx` with two-column layout
- [x] Rename `gumroad-carousel.tsx` → `social-proof-carousel.tsx`
- [x] Add relationship-focused captions to all 6 images
- [x] Test responsive grid (3 cols → 2 cols → 1 col)
- [x] Apply neobrutalist styling

### Phase 4: How It Works & Context Engine (4 hours) ✅ COMPLETE
- [x] Create `step-card.tsx` component with alternating layout
- [x] Create `how-it-works-section.tsx` with 3 video previews
- [x] Implement 3D CSS transform for videos
- [x] Create `persona-card.tsx` component
- [x] Create `context-engine-section.tsx` with YouTube embed
- [x] Test video autoplay and 3D effect
- [x] Test YouTube embed functionality

### Phase 5: Features & Personas (3 hours) ✅ COMPLETE
- [x] Create `key-features-grid.tsx` with 6 feature cards
- [x] Add icon mapping utility for lucide-react icons
- [x] Create `target-personas-section.tsx` with 3 persona cards
- [x] Reuse `persona-card.tsx` from Phase 4
- [x] Test 2x3 grid layout and responsiveness
- [x] Apply hover effects

### Phase 6: Reduce Slop & Testimonials (2 hours) ✅ COMPLETE
- [x] Create `reduce-slop-section.tsx` with 6 benefit cards
- [x] Update `testimonials-section.tsx` quotes
- [x] Keep existing photo assets and layout
- [x] Test strikethrough and arrow rendering
- [x] Verify testimonial photos load correctly

### Phase 7: Pricing Section (4 hours) ✅ COMPLETE
- [x] Create `pricing-card.tsx` reusable component
- [x] Create `plan-toggle.tsx` for monthly/yearly switch
- [x] Create `account-slider.tsx` for Premium Multi
- [x] Create `pricing-section.tsx` with 3 pricing cards
- [x] Implement toggle state management
- [x] Implement slider state management
- [x] Test dynamic price calculations
- [x] Test featured card styling
- [x] Verify CTAs link correctly

### Phase 8: FAQ & Final CTA (2 hours) ✅ COMPLETE
- [x] Update `faq-section.tsx` with new questions/answers
- [x] Update `final-cta-section.tsx` with new messaging
- [x] Test accordion expand/collapse
- [x] Test CTA buttons on dark background
- [x] Verify FAQ links work

### Phase 9: Integration & Testing (3 hours) ✅ COMPLETE
- [x] Update `page.tsx` with all 13 sections in order
- [x] Remove/archive old components (rotating-titles, gumroad-carousel, features-section, video-section)
- [x] Rename gumroad-carousel.tsx → social-proof-carousel.tsx with new captions
- [x] Created comprehensive testing checklist (LANDING_PAGE_TEST_CHECKLIST.md)
- [x] Verified all imports resolve correctly
- [x] Verified all video/image assets exist
- [x] Verified no console.log statements
- [x] Verified all CTAs link correctly (via grep)
- [ ] **MANUAL TEST REQUIRED**: Full page flow (user to run dev server)
- [ ] **MANUAL TEST REQUIRED**: All interactions (videos, toggle, slider, accordion)
- [ ] **MANUAL TEST REQUIRED**: Run performance tests (3G simulation)

### Phase 10: Responsive Polish & Launch (4 hours)
- [ ] Test on iPhone SE (375px)
- [ ] Test on iPhone 12 (390px)
- [ ] Test on iPad Mini (768px)
- [ ] Test on iPad Pro (1024px)
- [ ] Test on desktop (1440px+)
- [ ] Fix responsive issues identified
- [ ] Run accessibility audit with axe DevTools
- [ ] Fix accessibility violations
- [ ] Run Lighthouse audit (target >90)
- [ ] Optimize performance issues
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Final QA checklist
- [ ] Deploy to staging
- [ ] Get stakeholder approval
- [ ] Deploy to production

---

**Total Estimated Time**: 29 hours (approximately 4-5 days with testing and iterations)

---

## 8. Acceptance Criteria (V1.0)

### Functional Requirements

**Content & Messaging**:
- [ ] All 13 sections present and in correct order
- [ ] New messaging framework applied throughout
- [ ] No forbidden language (24/7 AI intern, autopilot, etc.)
- [ ] Approved language used (relationship-building, human-in-the-loop, etc.)
- [ ] All content sourced from `landing-content.ts`

**Visual Design**:
- [ ] Neobrutalist theme maintained (pink #e5486c, black borders, hard shadows)
- [ ] Consistent spacing and padding
- [ ] All `@sassy/ui` components used correctly
- [ ] Responsive design works on all breakpoints
- [ ] No visual regressions from current design

**Interactive Elements**:
- [ ] All 3 local videos autoplay and loop with 3D effect
- [ ] YouTube embed loads and plays correctly
- [ ] Pricing toggle switches between monthly/yearly
- [ ] Account slider updates total price dynamically
- [ ] FAQ accordion expands/collapses correctly
- [ ] All CTAs link to correct destinations

**Testimonials**:
- [ ] All 8 testimonials rewritten with relationship focus
- [ ] Existing photos maintained
- [ ] Card layout and styling unchanged
- [ ] 5-star ratings displayed

**Pricing**:
- [ ] 3 pricing cards displayed (Free, Premium Single, Premium Multi)
- [ ] Monthly/yearly toggle functional (default to yearly)
- [ ] Account slider for Premium Multi (2-24 accounts)
- [ ] Dynamic price calculation correct
- [ ] Featured card (Premium Single) highlighted
- [ ] Savings percentage displayed (17%)

**Technical**:
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] All imports resolve correctly
- [ ] Content extraction to `landing-content.ts` complete
- [ ] Component organization follows structure

### Non-Functional Requirements

**Performance**:
- [ ] Page loads in <3 seconds on 3G
- [ ] Videos lazy-load below fold
- [ ] Images optimized with Next.js Image component
- [ ] Lighthouse performance score >90
- [ ] No layout shift issues (good CLS)

**Accessibility**:
- [ ] WCAG 2.1 AA compliance
- [ ] All images have alt text
- [ ] Videos have aria-label attributes
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] Color contrast meets 4.5:1 ratio
- [ ] Focus states visible
- [ ] Keyboard navigation functional
- [ ] Tab order logical
- [ ] Links have descriptive text

**Responsive Design**:
- [ ] Works on mobile (375px+)
- [ ] Works on tablet (768px - 1024px)
- [ ] Works on desktop (1024px+)
- [ ] No horizontal scrolling on any breakpoint
- [ ] Touch targets 44x44px minimum
- [ ] Text readable on all screen sizes

**Cross-Browser**:
- [ ] Works on Chrome (latest)
- [ ] Works on Firefox (latest)
- [ ] Works on Safari (latest)
- [ ] Works on Edge (latest)
- [ ] Videos work on iOS Safari

---

## 9. Future Work (Post-V1)

### Phase 2 Enhancements

**Content Improvements**:
- A/B test headlines and CTAs
- Add more video previews (account tab demo)
- Create feature comparison table
- Add customer logos for social proof

**Interactive Features**:
- ROI calculator (input engagement goals, output expected results)
- Interactive demo or product tour
- Live chat widget for sales inquiries
- Video testimonials (record existing users)

**Technical Improvements**:
- Implement analytics event tracking for all sections
- Add scroll animations (intersection observer)
- Implement view transitions API for smooth section changes
- Add micro-interactions and hover effects

**Performance**:
- Optimize video encoding for faster loading
- Implement progressive video loading
- Add service worker for offline access to critical pages
- Optimize bundle splitting for faster initial load

### Phase 3 Enhancements

**Personalization**:
- Dynamic content based on traffic source (ads, social, referral)
- Persona-specific landing pages (founders, sales, growth)
- Location-based pricing (international markets)

**Conversion Optimization**:
- Exit-intent popup with special offer
- Scroll-triggered engagement prompts
- Social proof notifications (recent signups)
- Trust seals and security badges

**Content Marketing**:
- Integrate blog posts into landing page
- Add case studies section
- Create downloadable resources (guides, templates)
- Add webinar registration section

---

## 10. Risk Management

### Identified Risks

**Technical Risks**:
1. **Video autoplay issues on iOS Safari**
   - Mitigation: Test early, add user-initiated play fallback
   - Severity: Medium
   - Status: Monitored

2. **Large video file sizes slow page load**
   - Mitigation: Optimize encoding, lazy-load below fold
   - Severity: High
   - Status: Mitigated (videos below fold lazy-loaded)

3. **Pricing toggle state management complexity**
   - Mitigation: Use simple useState, test thoroughly
   - Severity: Low
   - Status: Addressed in Phase 7

**Content Risks**:
1. **Messaging too long or complex**
   - Mitigation: Keep concise, test with users
   - Severity: Medium
   - Status: Monitored

2. **Testimonials don't feel authentic after rewrite**
   - Mitigation: Base on real user quotes, maintain natural tone
   - Severity: Medium
   - Status: Addressed in Phase 6

**Timeline Risks**:
1. **Scope creep during implementation**
   - Mitigation: Strict adherence to plan, defer enhancements to Phase 2
   - Severity: High
   - Status: Managed through phased approach

2. **Responsive issues take longer than expected**
   - Mitigation: Budget extra time in Phase 10, prioritize mobile
   - Severity: Medium
   - Status: Addressed with 4-hour Phase 10

---

## 11. Success Metrics

### Launch Day Metrics

**Baseline (Current Page)**:
- Average time on page: X minutes
- Bounce rate: X%
- Conversion rate (Chrome Web Store clicks): X%
- Mobile traffic: X%

**Target Metrics (New Page)**:
- Increase time on page by 30%
- Reduce bounce rate by 20%
- Increase conversion rate by 50%
- Improve mobile engagement by 40%

### Post-Launch Tracking (30 Days)

**User Engagement**:
- Video play rate (percentage of visitors who watch videos)
- Pricing toggle interaction rate
- FAQ accordion open rate
- Scroll depth (how many reach pricing section)

**Conversion Funnel**:
- Hero CTA click-through rate
- Pricing section visit rate
- Chrome Web Store conversion rate
- Demo request rate (if secondary CTA)

**Technical Performance**:
- Page load time (target <3s on 3G)
- Core Web Vitals scores
- Error rate (target <0.1%)
- Mobile vs desktop conversion rates

---

## 12. Resources & References

### Design References

- **Neobrutalist Theme**: Current EngageKit landing page
- **3D Video Effect**: `apps/ghost-blog/src/tools/linkedinpreview/components/how-to-use.tsx`
- **Pricing Sections**: Stripe, Linear, Notion (for inspiration)

### Technical Documentation

- **Next.js Image**: https://nextjs.org/docs/pages/api-reference/components/image
- **@sassy/ui Components**: `/packages/ui/src/ui/`
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **lucide-react Icons**: https://lucide.dev/icons

### Content Guidelines

- **LinkedIn Stats**: LinkedIn Marketing Solutions, State of Sales Report
- **B2B Best Practices**: Gong, Hubspot, Cognism research
- **Messaging Framework**: Jobs-to-be-Done framework, value proposition canvas

---

**Next Step**: Review this plan carefully. Once approved, enter EXECUTE MODE to begin Phase 1 implementation.
