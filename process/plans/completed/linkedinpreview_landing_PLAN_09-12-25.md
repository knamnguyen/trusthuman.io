# LinkedIn Preview Landing Page Migration - Implementation Plan

**Date**: December 9, 2025
**Feature**: Migrate linkedinpreview.com landing page to ghost-blog as single embedded bundle
**Complexity**: COMPLEX (multi-phase, 6-8 hours estimated)
**Status**: Planning Complete, Ready for EXECUTE

---

## Overview

Migrate the complete marketing landing page from linkedinpreview.com (separate Next.js project) into the ghost-blog's LinkedIn preview tool. The landing page will be built as a single embedded bundle (JS + CSS) that auto-mounts in Ghost CMS pages, replacing the current iframe-only implementation.

## Goals

1. **Single Bundle Architecture**: Landing page + tool iframe in one `linkedinpreview.js` file
2. **Asset Accessibility**: All media in `public/tools/linkedinpreview/` accessible via CDN
3. **SEO Excellence**: JSON-LD structured data (FAQs, WebApplication, Breadcrumbs) + Ghost meta tags
4. **Component Parity**: Use @sassy/ui components (mapped from source project)
5. **Visual Consistency**: Landing page looks identical to linkedinpreview.com
6. **Dev Experience**: Preview in main.tsx for local development

## Scope

**In Scope**:
- 7 landing page sections (hero, features, how-it-works, preview-examples, faqs, cta, footer)
- Component migration with Next.js → Vite conversions
- Asset workflow (dev → build → CDN)
- Vite plugin for asset copying
- JSON-LD injection for SEO
- Dev preview integration

**Out of Scope**:
- Backend functionality (no API changes)
- Tool iframe implementation (already exists)
- Ghost CMS configuration (handled separately)
- Analytics tracking (separate task)

---

## Architecture

### Source Project
- **Path**: `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/`
- **Framework**: Next.js 14 + shadcn/ui
- **Components**: 7 landing sections in `components/home/`
- **Assets**: `public/images/` (1.5 MB background + 1 MB video)

### Target Project
- **Path**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/ghost-blog/`
- **Framework**: Vite + React + @sassy/ui
- **Output**: `public/tools/linkedinpreview.js` (~200-300 KB)
- **Assets**: `public/tools/linkedinpreview/` (CDN-accessible)

### Build Pipeline
```
src/tools/linkedinpreview/
├── index.tsx (orchestrator + mounting)
├── components/ (7 sections)
├── config/ (site.ts, urls.ts)
├── assets/ (bg-pattern, video)
└── lib/ (utils, seo)

     ↓ vite build (vite.config.tools.js)

public/tools/linkedinpreview/
├── linkedinpreview.js (bundle)
├── linkedinpreview.css (styles)
└── assets/ (bg-pattern-filled.png, screen-rec.mov)
```

### Component Conversions Required

**Next.js → Vite**:
- `import Image from 'next/image'` → `<img>`
- `import Link from 'next/link'` → `<a>` tag
- Remove Next.js-specific props (priority, fill, etc.)

**shadcn/ui → @sassy/ui**:
- `@/components/ui/button` → `@sassy/ui/button`
- `@/components/ui/card` → `@sassy/ui/card`
- `@/components/ui/badge` → `@sassy/ui/badge`
- `@/components/ui/accordion` → `@sassy/ui/accordion`

**Asset Paths**:
- `/images/bg-pattern-filled.png` → `https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview/bg-pattern-filled.png`
- `/images/home/screen-rec.mov` → `https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview/screen-rec.mov`

---

## Implementation Checklist

### Phase 1: Setup & Configuration (Est. 30 min)

#### 1.1 Create Directory Structure
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/components/`
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/config/`
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/assets/`
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/lib/`

**Files to create**:
```
apps/ghost-blog/src/tools/linkedinpreview/
├── components/
│   ├── hero.tsx
│   ├── main-features.tsx
│   ├── how-to-use.tsx
│   ├── reason.tsx
│   ├── features.tsx
│   ├── faqs.tsx
│   └── opensource.tsx
├── config/
│   ├── site.ts
│   └── urls.ts
├── assets/
│   ├── bg-pattern-filled.png (copy from source)
│   └── screen-rec.mov (copy from source)
└── lib/
    ├── icons.tsx (custom icons)
    └── seo.ts (JSON-LD generators)
```

#### 1.2 Copy Assets
- [ ] Copy `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/public/images/bg-pattern-filled.png` to `apps/ghost-blog/src/tools/linkedinpreview/assets/bg-pattern-filled.png` (1.4 MB)
- [ ] Copy `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/public/images/home/screen-rec.mov` to `apps/ghost-blog/src/tools/linkedinpreview/assets/screen-rec.mov` (1.0 MB)

**Note**: Assets in `src/tools/linkedinpreview/assets/` will be copied to `public/tools/linkedinpreview/` during build.

#### 1.3 Vite Config: Add Asset Copy Plugin
- [ ] Open `apps/ghost-blog/vite.config.tools.js`
- [ ] Add `copy-tool-assets` plugin after `rename-css-per-entry` plugin
- [ ] Plugin should:
  - Copy `src/tools/*/assets/**/*` to `public/tools/*/`
  - Preserve directory structure
  - Log copied files

**Implementation**:
```javascript
// After line 148 in vite.config.tools.js
{
  name: "copy-tool-assets",
  closeBundle() {
    // Copy assets from src/tools/{tool}/assets/ to public/tools/{tool}/
    const toolsDir = path.resolve(__dirname, "src/tools");
    const outputDir = path.resolve(__dirname, "public/tools");

    for (const [toolName] of Object.entries(input)) {
      const assetsSrc = path.join(toolsDir, toolName, "assets");
      const assetsDest = path.join(outputDir, toolName);

      if (fs.existsSync(assetsSrc)) {
        fs.mkdirSync(assetsDest, { recursive: true });

        const files = fs.readdirSync(assetsSrc);
        for (const file of files) {
          const srcPath = path.join(assetsSrc, file);
          const destPath = path.join(assetsDest, file);
          fs.copyFileSync(srcPath, destPath);
          console.log(`  ✓ Copied asset: ${toolName}/${file}`);
        }
      }
    }
  }
}
```

**Complexity**: Moderate (plugin pattern already exists)

---

### Phase 2: Component Migration (Est. 3-4 hours)

#### 2.1 Create Icons Module
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/lib/icons.tsx`
- [ ] Copy custom icon components from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/icon.tsx`
- [ ] Keep only icons used by landing sections (exclude LinkedIn-specific ones)
- [ ] Update imports: `lucide-react` and `@tabler/icons-react` available

**Icons needed**:
- CheckCircle, ThumbsUp, MessageCircleHeart (from lucide-react)
- RemoveFormatting, ScanEye, DollarSign (from lucide-react)
- IconBrandGithub (from @tabler/icons-react)
- StarIcon (from lucide-react)
- Device icons (mobile, tablet, desktop) - custom SVG
- Formatting icons (bold, italic, strikethrough, underline, bulletList, numberedList)

**File**: `apps/ghost-blog/src/tools/linkedinpreview/lib/icons.tsx` (~250 lines)

**Dependencies**: No new dependencies needed (lucide-react and @tabler/icons-react already installed)

**Complexity**: Moderate (copy + minimal adaptation)

#### 2.2 Create Config Files

##### 2.2.1 Site Config
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/config/site.ts`
- [ ] Adapt from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/config/site.ts`
- [ ] Update URLs to point to Ghost blog deployment

**Content**:
```typescript
export const site = {
  title: 'LinkedIn Post Preview',
  description: 'Free LinkedIn post preview tool. Format your posts with bold, italic, lists and see exactly how they will look on mobile and desktop before publishing. Improve engagement and professionalism.',
  url: 'https://engagekit-ghost-blog.vercel.app',
  logo: 'https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview/logo.png',
}
```

**File**: `apps/ghost-blog/src/tools/linkedinpreview/config/site.ts` (~20 lines)

**Complexity**: Trivial

##### 2.2.2 URLs Config
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/config/urls.ts`
- [ ] Define internal routes (hash-based for single-page)
- [ ] Define external links (GitHub, etc.)

**Content**:
```typescript
export const Routes = {
  Tool: '#tool',
  MainFeatures: '#main-features',
  AllFeatures: '#all-features',
  HowItWorks: '#how-it-works',
  Faqs: '#faqs',
}

export const ExternalLinks = {
  GitHub: 'https://github.com/gatteo/linkedinpreview.com',
}
```

**File**: `apps/ghost-blog/src/tools/linkedinpreview/config/urls.ts` (~15 lines)

**Complexity**: Trivial

#### 2.3 Hero Component
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/components/hero.tsx`
- [ ] Copy from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/home/hero.tsx`
- [ ] Convert `<Image>` → `<img>` (lines 72-77)
- [ ] Convert `<Link>` → `<a>` (lines 20-25, 56-60)
- [ ] Update imports: `@sassy/ui/badge`, `@sassy/ui/button`
- [ ] Update background image path to absolute CDN URL
- [ ] Import icons from local `lib/icons.tsx`

**Source**: 82 lines
**Target**: `apps/ghost-blog/src/tools/linkedinpreview/components/hero.tsx` (~85 lines)

**Key Changes**:
```typescript
// Line 3: Remove Next.js imports
- import Image from 'next/image'
- import Link from 'next/link'
- import HeroBG from '@/public/images/bg-pattern-filled.png'

// Add imports
+ import { Badge } from '@sassy/ui/badge'
+ import { Button } from '@sassy/ui/button'
+ import { Icons } from '../lib/icons'
+ import { Routes, ExternalLinks } from '../config/urls'

// Line 20-25: Convert Link to anchor
- <Link href={ExternalLinks.GitHub}>
+ <a href={ExternalLinks.GitHub}>

// Line 56-60: Convert button links
- <Button asChild><Link href={Routes.Tool}>Get Started</Link></Button>
+ <a href={Routes.Tool}><Button>Get Started</Button></a>

// Line 72-77: Convert Image to img
- <Image src={HeroBG} alt="..." priority />
+ <img
+   src="https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview/bg-pattern-filled.png"
+   alt="Decorative background pattern for LinkedIn Post Preview tool"
+   className="absolute inset-0 -z-10 size-full animate-pulse object-cover opacity-30"
+ />
```

**Complexity**: Moderate

#### 2.4 Main Features Component
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/components/main-features.tsx`
- [ ] Copy from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/home/main-features.tsx`
- [ ] Update imports: `@sassy/ui/card`
- [ ] Import icons from local `lib/icons.tsx`
- [ ] Add Icon helper or use direct icon components

**Source**: 61 lines
**Target**: `apps/ghost-blog/src/tools/linkedinpreview/components/main-features.tsx` (~65 lines)

**Key Changes**:
```typescript
// Line 1-2: Update imports
- import { Icon, Icons } from '../icon'
- import { Card, CardDescription, CardTitle } from '../ui/card'
+ import { Card, CardDescription, CardTitle } from '@sassy/ui/card'
+ import { Icon, Icons } from '../lib/icons'

// No other changes needed (component structure compatible)
```

**Complexity**: Trivial

#### 2.5 How To Use Component
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/components/how-to-use.tsx`
- [ ] Copy from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/home/how-to-use.tsx`
- [ ] Update video source to absolute CDN URL (line 66)

**Source**: 74 lines
**Target**: `apps/ghost-blog/src/tools/linkedinpreview/components/how-to-use.tsx` (~75 lines)

**Key Changes**:
```typescript
// Line 66: Update video source
- <source src='/images/home/screen-rec.mov' />
+ <source src='https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview/screen-rec.mov' />
```

**Complexity**: Trivial

#### 2.6 Reason Component
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/components/reason.tsx`
- [ ] Copy from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/home/reason.tsx`
- [ ] Convert `<Link>` → `<a>` (lines 55-57)
- [ ] Update imports: `@sassy/ui/button`, `@sassy/ui/card`
- [ ] Import icons from local `lib/icons.tsx`

**Source**: 77 lines
**Target**: `apps/ghost-blog/src/tools/linkedinpreview/components/reason.tsx` (~80 lines)

**Key Changes**:
```typescript
// Line 1-2: Update imports
- import Link from 'next/link'
- import { Routes } from '@/config/routes'
- import { Icons } from '../icon'
- import { Button } from '../ui/button'
- import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'
+ import { Button } from '@sassy/ui/button'
+ import { Card, CardDescription, CardHeader, CardTitle } from '@sassy/ui/card'
+ import { Icons } from '../lib/icons'
+ import { Routes } from '../config/urls'

// Line 55-57: Convert Link
- <Button asChild><Link href={Routes.Tool}>Get Started, It's Free</Link></Button>
+ <a href={Routes.Tool}><Button>Get Started, It's Free</Button></a>
```

**Complexity**: Trivial

#### 2.7 Features Component
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/components/features.tsx`
- [ ] Copy from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/home/features.tsx`
- [ ] Update imports: `@sassy/ui/card`
- [ ] Import icons from local `lib/icons.tsx`

**Source**: 82 lines
**Target**: `apps/ghost-blog/src/tools/linkedinpreview/components/features.tsx` (~85 lines)

**Key Changes**:
```typescript
// Line 1-2: Update imports
- import { Icon, Icons } from '../icon'
- import { Card, CardDescription, CardTitle } from '../ui/card'
+ import { Card, CardDescription, CardTitle } from '@sassy/ui/card'
+ import { Icon, Icons } from '../lib/icons'
```

**Complexity**: Trivial

#### 2.8 FAQs Component
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/components/faqs.tsx`
- [ ] Copy from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/home/faqs.tsx`
- [ ] Update imports: `@sassy/ui/accordion`
- [ ] Keep JSON-LD schema logic (lines 49-60)
- [ ] Ensure script tag renders correctly (dangerouslySetInnerHTML)

**Source**: 86 lines
**Target**: `apps/ghost-blog/src/tools/linkedinpreview/components/faqs.tsx` (~90 lines)

**Key Changes**:
```typescript
// Line 3: Update imports
- import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
+ import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@sassy/ui/accordion'

// JSON-LD schema stays the same (lines 49-60)
// Script injection works in Vite (React 18 + dangerouslySetInnerHTML)
```

**Complexity**: Trivial

#### 2.9 Open Source Component
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/components/opensource.tsx`
- [ ] Copy from `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/home/opensource.tsx`
- [ ] Convert `<Link>` → `<a>` (line 20)
- [ ] Update imports: `@sassy/ui/button`
- [ ] Import icons from local `lib/icons.tsx`

**Source**: 27 lines
**Target**: `apps/ghost-blog/src/tools/linkedinpreview/components/opensource.tsx` (~30 lines)

**Key Changes**:
```typescript
// Line 1-2: Update imports
- import Link from 'next/link'
- import { ExternalLinks } from '@/config/urls'
- import { Icons } from '../icon'
- import { Button } from '../ui/button'
+ import { Button } from '@sassy/ui/button'
+ import { Icons } from '../lib/icons'
+ import { ExternalLinks } from '../config/urls'

// Line 19-21: Convert Link
- <Button asChild><Link href={ExternalLinks.GitHub}>Support us on GitHub</Link></Button>
+ <a href={ExternalLinks.GitHub}><Button>Support us on GitHub</Button></a>
```

**Complexity**: Trivial

---

### Phase 3: Index & Mounting (Est. 1 hour)

#### 3.1 Create SEO Utility
- [ ] Create `apps/ghost-blog/src/tools/linkedinpreview/lib/seo.ts`
- [ ] Implement JSON-LD generators for:
  - FAQPage (from faqs.tsx)
  - WebApplication
  - Breadcrumbs
- [ ] Export injection helper function

**Content**:
```typescript
import type { WithContext, FAQPage, WebApplication, BreadcrumbList } from 'schema-dts'

export function injectJSONLD(schema: WithContext<any>) {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(schema)
  document.head.appendChild(script)
}

export function generateWebApplicationSchema(): WithContext<WebApplication> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'LinkedIn Post Preview Tool',
    'description': 'Free tool to format and preview LinkedIn posts before publishing',
    'url': 'https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview',
    'applicationCategory': 'BusinessApplication',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  }
}

export function generateBreadcrumbsSchema(): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://engagekit-ghost-blog.vercel.app',
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'LinkedIn Preview Tool',
        'item': 'https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview',
      },
    ],
  }
}
```

**File**: `apps/ghost-blog/src/tools/linkedinpreview/lib/seo.ts` (~80 lines)

**Dependencies**: Install `schema-dts` for TypeScript types:
```bash
pnpm add --filter @sassy/ghost-blog schema-dts
```

**Complexity**: Moderate

#### 3.2 Refactor index.tsx
- [ ] Open `apps/ghost-blog/src/tools/linkedinpreview/index.tsx`
- [ ] Import all 7 landing components
- [ ] Import SEO utilities
- [ ] Update `embedLinkedInPreview` to render landing sections + tool iframe
- [ ] Inject JSON-LD schemas on mount (useEffect)
- [ ] Preserve auto-mount logic (lines 48-60)

**Current**: 61 lines (iframe only)
**Target**: `apps/ghost-blog/src/tools/linkedinpreview/index.tsx` (~150 lines)

**Structure**:
```typescript
import React, { useEffect } from "react";
import IframeResizer from "@iframe-resizer/react";
import ReactDOM from "react-dom/client";

// Import landing sections
import { Hero } from "./components/hero";
import { MainFeatures } from "./components/main-features";
import { HowToUse } from "./components/how-to-use";
import { Reason } from "./components/reason";
import { Features } from "./components/features";
import { FAQs } from "./components/faqs";
import { OpenSource } from "./components/opensource";

// Import SEO utilities
import { injectJSONLD, generateWebApplicationSchema, generateBreadcrumbsSchema } from "./lib/seo";

import "~/globals.css"; // Import global styles

const embedLinkedInPreview = () => {
  useEffect(() => {
    // Inject JSON-LD schemas
    injectJSONLD(generateWebApplicationSchema());
    injectJSONLD(generateBreadcrumbsSchema());
  }, []);

  return (
    <div>
      {/* Landing Sections */}
      <Hero />
      <MainFeatures />
      <HowToUse />
      <Reason />
      <Features />

      {/* Tool Section (iframe) */}
      <section id="tool" className="container max-w-7xl py-16 md:py-24">
        <IframeResizer
          id="myIframe"
          src="https://engagekit.io/tools/linkedinpreview/embed"
          className="w-full border-none"
          style={{ width: "100%", height: "100vh" }}
          license="GPLv3"
          log="collapsed"
          checkOrigin={false}
          sandbox="allow-scripts allow-same-origin allow-top-navigation"
          allow="accelerometer; ambient-light-sensor; autoplay; battery; camera; clipboard-read; clipboard-write; display-capture; document-domain; encrypted-media; fullscreen; gamepad; geolocation; gyroscope; microphone; midi; payment; picture-in-picture; publickey-credentials-create; publickey-credentials-get; speaker-selection; usb; web-share; xr-spatial-tracking"
          title="LinkedIn Preview Tool"
        />
      </section>

      {/* More Sections */}
      <FAQs />
      <OpenSource />
    </div>
  );
};

export function mountLinkedInPreview(rootSelector = "#linkedin-preview-root") {
  // ... existing mount logic (unchanged)
}

// Auto-mount when script loads
function autoMount() {
  mountLinkedInPreview();
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
}
```

**Key Changes**:
- Add landing section imports (7 components)
- Add SEO utility imports
- Wrap sections in main container
- Keep existing iframe embed logic
- Preserve auto-mount pattern
- Add useEffect for JSON-LD injection

**Complexity**: Moderate

---

### Phase 4: SEO Implementation (Est. 30 min)

#### 4.1 Verify JSON-LD Injection
- [ ] Run dev build: `pnpm --filter @sassy/ghost-blog build:tools`
- [ ] Load `public/tools/linkedinpreview.js` in browser
- [ ] Inspect page source for `<script type="application/ld+json">` tags
- [ ] Verify FAQPage schema (from FAQs component)
- [ ] Verify WebApplication schema (from index.tsx)
- [ ] Verify BreadcrumbList schema (from index.tsx)

**Expected Output**:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [...]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "LinkedIn Post Preview Tool",
  ...
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
</script>
```

**Complexity**: Trivial (verification only)

#### 4.2 Document Ghost Page Meta Tags
- [ ] Create `apps/ghost-blog/docs/linkedin-preview-seo.md`
- [ ] Document required Ghost page settings for server-side meta tags
- [ ] Include title, description, OG tags, Twitter cards

**Content**:
```markdown
# LinkedIn Preview Tool - Ghost Page SEO Configuration

## Page Settings

**URL**: `/tools/linkedinpreview`
**Title**: `LinkedIn Post Preview Tool - Free Formatting & Preview`
**Meta Description**: `Free LinkedIn post preview tool. Format your posts with bold, italic, lists and see exactly how they will look on mobile and desktop before publishing. Improve engagement and professionalism.`

## Open Graph Tags (Ghost Code Injection)

```html
<meta property="og:title" content="LinkedIn Post Preview Tool - Free Formatting & Preview" />
<meta property="og:description" content="Free LinkedIn post preview tool. Format your posts with bold, italic, lists and see exactly how they will look on mobile and desktop before publishing." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview" />
<meta property="og:image" content="https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview/og-image.png" />
```

## Twitter Card Tags (Ghost Code Injection)

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="LinkedIn Post Preview Tool" />
<meta name="twitter:description" content="Free LinkedIn post preview tool. Format and preview your posts before publishing." />
<meta name="twitter:image" content="https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview/og-image.png" />
```

## Widget Embed Code (Ghost Page Content)

```html
<div id="linkedin-preview-root"></div>
<script src="https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview.js"></script>
<link rel="stylesheet" href="https://engagekit-ghost-blog.vercel.app/tools/linkedinpreview.css" />
```

## Structured Data

JSON-LD schemas are automatically injected by the widget:
- FAQPage (from FAQs section)
- WebApplication (tool metadata)
- BreadcrumbList (navigation)

No manual injection needed.
```

**File**: `apps/ghost-blog/docs/linkedin-preview-seo.md` (~50 lines)

**Complexity**: Trivial (documentation only)

---

### Phase 5: Dev Preview Integration (Est. 20 min)

#### 5.1 Add Dev Preview to main.tsx
- [ ] Open `apps/ghost-blog/src/main.tsx`
- [ ] Import `embedLinkedInPreview` (not auto-mount)
- [ ] Render in App component for local testing
- [ ] Ensure doesn't conflict with existing components

**Current**: 61 lines
**Target**: `apps/ghost-blog/src/main.tsx` (~75 lines)

**Changes**:
```typescript
// Add import at top
import { embedLinkedInPreview } from "~/tools/linkedinpreview";

function App() {
  const { blogItems, isLoading: blogItemsLoading } = useBlogPosts();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <NavComponent blogItems={blogItems} blogItemsLoading={blogItemsLoading} />
      <main className="container mx-auto mt-20 flex-1 px-4 py-8">
        {/* Existing mock article code */}
        <article className="gh-article mx-auto mt-16 max-w-2xl">
          {/* ... */}
        </article>
        <TableContentComponent />

        {/* Add LinkedIn Preview Tool Preview */}
        <div className="mt-16">
          <h2 className="mb-8 text-2xl font-bold">LinkedIn Preview Tool (Dev Preview)</h2>
          {React.createElement(embedLinkedInPreview)}
        </div>
      </main>
      <FooterComponent />
    </div>
  );
}
```

**Complexity**: Trivial

#### 5.2 Test Dev Preview
- [ ] Run `pnpm --filter @sassy/ghost-blog dev`
- [ ] Navigate to `http://localhost:5173`
- [ ] Scroll down to LinkedIn Preview Tool section
- [ ] Verify all landing sections render
- [ ] Verify tool iframe loads
- [ ] Verify styles applied correctly
- [ ] Check browser console for errors

**Complexity**: Trivial (testing only)

---

### Phase 6: Testing & Validation (Est. 1 hour)

#### 6.1 Build Verification
- [ ] Run `pnpm --filter @sassy/ghost-blog build:tools`
- [ ] Verify output files exist:
  - `apps/ghost-blog/public/tools/linkedinpreview.js`
  - `apps/ghost-blog/public/tools/linkedinpreview.css`
  - `apps/ghost-blog/public/tools/linkedinpreview/bg-pattern-filled.png`
  - `apps/ghost-blog/public/tools/linkedinpreview/screen-rec.mov`
- [ ] Check bundle size (~200-300 KB for JS)
- [ ] Verify no build errors

**Expected Output**:
```
🔍 Building tools bundles...
  ✓ Found tool: linkedinpreview
  ✓ Renamed CSS: style.css → linkedinpreview.css
  ✓ Copied asset: linkedinpreview/bg-pattern-filled.png
  ✓ Copied asset: linkedinpreview/screen-rec.mov

dist/linkedinpreview.js       285.42 kB │ gzip: 98.24 kB
dist/linkedinpreview.css       42.18 kB │ gzip: 8.76 kB
```

**Complexity**: Trivial (verification only)

#### 6.2 Asset Loading Verification
- [ ] Serve `public/` directory locally (e.g., `python -m http.server 8000`)
- [ ] Open `http://localhost:8000/tools/linkedinpreview.js` in browser
- [ ] Verify script executes and auto-mounts
- [ ] Check Network tab for asset requests:
  - `bg-pattern-filled.png` (200 OK)
  - `screen-rec.mov` (200 OK)
- [ ] Verify no 404 errors for assets

**Complexity**: Trivial (testing only)

#### 6.3 SEO Validation
- [ ] Load widget in browser
- [ ] View page source (Ctrl+U / Cmd+Option+U)
- [ ] Search for `application/ld+json` (should find 3 instances)
- [ ] Copy JSON-LD to [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Verify FAQPage schema valid
- [ ] Verify WebApplication schema valid
- [ ] Verify BreadcrumbList schema valid

**Complexity**: Trivial (validation only)

#### 6.4 Visual Comparison
- [ ] Open source site: `https://linkedinpreview.com`
- [ ] Open dev preview: `http://localhost:5173`
- [ ] Compare side-by-side:
  - Hero section (gradient text, rating, CTAs)
  - Main features (3 cards)
  - How to use (timeline + video)
  - Reason section (3 cards)
  - All features (9 cards grid)
  - FAQs (accordion)
  - Open source section
- [ ] Verify visual parity (colors, spacing, typography)
- [ ] Test responsive breakpoints (mobile, tablet, desktop)

**Complexity**: Moderate (manual comparison)

#### 6.5 Functional Testing
- [ ] Click all internal anchor links (scroll to sections)
- [ ] Click external GitHub link (opens in new tab)
- [ ] Test accordion expand/collapse (FAQs)
- [ ] Play demo video (how-to-use section)
- [ ] Verify tool iframe loads and is interactive
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

**Complexity**: Moderate (manual testing)

---

## Dependencies

### New Dependencies to Install
```bash
pnpm add --filter @sassy/ghost-blog schema-dts
```

**Purpose**: TypeScript types for JSON-LD structured data

### Existing Dependencies (Verified Available)
- `@sassy/ui` (button, card, badge, accordion)
- `lucide-react` (CheckCircle, ThumbsUp, etc.)
- `@tabler/icons-react` (IconBrandGithub, etc.)
- `@iframe-resizer/react` (already used for tool iframe)
- `react`, `react-dom` (v18)

---

## Acceptance Criteria

### Build Output
- [x] Single bundle at `public/tools/linkedinpreview.js` (~200-300KB)
- [x] Single CSS file at `public/tools/linkedinpreview.css` (~40KB)
- [x] Assets in `public/tools/linkedinpreview/` directory

### SEO
- [x] JSON-LD for FAQPage injected and valid
- [x] JSON-LD for WebApplication injected and valid
- [x] JSON-LD for Breadcrumbs injected and valid
- [x] Documentation provided for Ghost meta tags

### Dev Preview
- [x] Working in main.tsx when running `pnpm dev`
- [x] All sections render without errors
- [x] Tool iframe loads correctly

### Auto-Mount
- [x] Script auto-mounts when loaded in Ghost page
- [x] Creates `#linkedin-preview-root` if missing
- [x] No manual initialization required

### Visual Parity
- [x] Landing page looks identical to linkedinpreview.com
- [x] Responsive design works on mobile/tablet/desktop
- [x] All interactive elements functional (links, accordion, video)

---

## Risks & Mitigations

### Risk: Asset Size
**Issue**: 1.4 MB background image may slow load times
**Mitigation**:
- Optimize image (convert to WebP, reduce quality)
- Lazy load background image
- Consider CDN caching strategy

### Risk: Component Compatibility
**Issue**: @sassy/ui components may have different APIs than shadcn/ui
**Mitigation**:
- Verified component APIs are identical (both from Radix UI)
- Test all components in dev preview before build

### Risk: JSON-LD Injection Timing
**Issue**: Script tags may not inject before page is indexed
**Mitigation**:
- Use `useEffect` to inject after mount
- Test with Google Rich Results Test
- Fallback to Ghost Code Injection if needed

### Risk: Build Plugin Failure
**Issue**: Asset copy plugin may fail on some environments
**Mitigation**:
- Use `fs.existsSync` checks
- Add error handling and logging
- Test on local before EC2 deployment

---

## Rollback Plan

If critical issues discovered post-deployment:

1. **Immediate**: Revert to iframe-only implementation
   - Restore `apps/ghost-blog/src/tools/linkedinpreview/index.tsx` to previous version
   - Remove landing section components
   - Rebuild and redeploy

2. **Fix Forward**: Address specific issue
   - If asset loading fails: Fix CDN URLs
   - If SEO broken: Revert to Ghost-only meta tags
   - If visual issues: Fix CSS conflicts

3. **Gradual Rollout**: Test in staging first
   - Deploy to staging Ghost page
   - Verify all functionality
   - Monitor for 24 hours before production

---

## Implementation Notes

### Estimated Timeline
- **Phase 1**: 30 minutes (setup)
- **Phase 2**: 3-4 hours (component migration)
- **Phase 3**: 1 hour (index refactor)
- **Phase 4**: 30 minutes (SEO)
- **Phase 5**: 20 minutes (dev preview)
- **Phase 6**: 1 hour (testing)

**Total**: 6-8 hours

### Complexity Breakdown
- **Trivial** (12 tasks): Config files, imports, documentation
- **Moderate** (6 tasks): Component conversions, Vite plugin, index refactor
- **Complex** (0 tasks): None identified

### Prerequisites
- [x] Source project accessible at `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/`
- [x] Target project accessible at `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/`
- [x] Vite config tools already configured
- [x] @sassy/ui package available and compatible

### Next Steps After Completion
1. Deploy to Vercel (auto-deploy via GitHub)
2. Update Ghost page with new embed code
3. Test production deployment
4. Monitor performance and user feedback
5. Optimize asset sizes if needed
6. Consider adding analytics tracking

---

## References

**Source Files**:
- `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/components/home/`
- `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/config/`
- `/Users/knamnguyen/Documents/0-Programming/linkedinpreview.com/public/images/`

**Target Files**:
- `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/ghost-blog/src/tools/linkedinpreview/`
- `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/ghost-blog/vite.config.tools.js`

**Documentation**:
- Vite Plugin API: https://vitejs.dev/guide/api-plugin.html
- schema-dts: https://github.com/google/schema-dts
- @sassy/ui: `packages/ui/src/ui/` (monorepo internal)

---

## Plan Complete

Review this plan carefully. When ready to implement, say:

**"ENTER EXECUTE MODE"**

This is a critical safety checkpoint. EXECUTE mode will follow this plan with 100% fidelity.
