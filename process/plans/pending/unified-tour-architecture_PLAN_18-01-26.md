# Unified Product Tour & Feature Guide Architecture (v12 - Learn Mode Analysis Complete)

## Goal

Create an "Enlightened" onboarding experience that combines **Contextual Discovery** (tooltips near elements) with **Structured Learning** (guided tours with video content), allowing seamless switching between modes.

**Package Requirements**: Built as a shadcn-style UI component using React + Tailwind CSS.

---

## Core Concepts

### Learn Mode

A toggle that users can turn on/off:

- **OFF**: No tooltips, no pulses, no overlays. Product is "clean"
- **ON**: Pulsing hotspots appear on UI elements. Hover reveals inactive tooltip

Learn Mode state **persists to localStorage** — survives page refresh.

### Three View States

| State                   | Layout       | Position      | Overlay | Features                                                           |
| :---------------------- | :----------- | :------------ | :------ | :----------------------------------------------------------------- |
| **1. Inactive Tooltip** | **Anchored** | Near Element  | No      | Short info. Single button: "**Focus Guide**"                       |
| **2. Active Tooltip**   | **Anchored** | Near Element  | Yes     | Rounded highlight. Progress dots. Prev/Next. "**Switch to Video**" |
| **3. Modal View**       | **Centered** | Screen Center | Yes     | Same highlight. Progress dots. Prev/Next. "**Switch to Tooltip**"  |

**Key distinction**: Active Tooltip and Modal both have overlay, but differ in **positioning**:

- Active Tooltip: Guides interaction (anchored near element)
- Modal: Teaches concepts (centered on screen, typically with video)

### Flow Entry Points

Two ways to enter a tour flow:

1. **From hotspot** (Learn Mode ON) → Enters at that specific step (mid-flow entry)
2. **From `startFlow()` call** → Enters at step 1 (or specified step)

### Flow Completion

When user reaches the last step and clicks "Next" or completes the final interaction:

- **Auto-exit**: Overlay disappears, tour ends cleanly
- No "Tour Complete!" modal — keep it simple

---

## API Design

### Hook-Based Approach

All actions are functions from a single hook — no wrapper components needed:

```typescript
const {
  // State (read-only)
  isLearnModeOn,
  activeFlowId,
  currentStepIndex,
  viewMode,
  lifecycle, // 'init' | 'ready' | 'active' | 'error'

  // Actions
  toggleLearnMode,
  startFlow,
  goToStep,
  nextStep,
  prevStep,
  switchView,
  exitTour,
} = useTour()
```

### Usage Examples

```tsx
// Toggle Learn Mode with any element
<Switch checked={isLearnModeOn} onCheckedChange={toggleLearnMode} />

// Start tour with any trigger
<Button onClick={() => startFlow('onboarding')}>Start Tour</Button>

// Programmatic trigger (e.g., first-time user)
useEffect(() => {
  if (isFirstTimeUser) {
    toggleLearnMode()
    startFlow('onboarding')
  }
}, [])

// Jump to specific step (for progress dots)
<div onClick={() => goToStep(2)}>•</div>
```

---

## Data Structures

### TourStep Interface

```typescript
interface TourStep {
  id: string
  selector: string | string[] // Single selector or array for multi-highlight

  // Content — ALL REQUIRED
  inactiveContent: ReactNode // Shown on hover (Learn Mode)
  activeContent: ReactNode // Shown in active tooltip
  modalContent: ReactNode // Shown in modal (text, title, subtitle)

  // Video Content (for Modal view)
  previewVideo?: string // Short 5-10s loop (YouTube embed URL)
  tutorialVideo?: string // Full tutorial (YouTube embed URL)

  // Behavior
  defaultOpenView: 'tooltip' | 'modal' // Where "Focus Guide" takes you
  interactToNext?: boolean // Require user interaction to advance
  autoTriggerOnSkip?: () => void // Execute if user clicks "Next" on interaction step

  // Flow Coordination
  actionTrigger?: (elem: Element | null) => void // Run on step entry (e.g., navigate, click tab)
  actionAfter?: (elem: Element | null) => void // Run on step exit (cleanup)
  waitForElement?: string // Wait for selector before showing step
  waitForAction?: () => boolean // Poll until returns true

  // Observables (for dynamic content)
  resizeObservables?: string[] // Selectors to watch for resize
  mutationObservables?: string[] // Selectors to watch for DOM mutations
}
```

### TourFlow Interface

```typescript
interface TourFlow {
  id: string
  steps: TourStep[]
}
```

### TourContextValue Interface

```typescript
interface TourContextValue {
  // State
  isLearnModeOn: boolean
  activeFlowId: string | null
  currentStepIndex: number
  viewMode: 'inactive' | 'active-tooltip' | 'modal'
  lifecycle: 'init' | 'ready' | 'active' | 'error'

  // Pending Step (for cross-route navigation)
  pendingStepIndex: number | null

  // Actions
  toggleLearnMode: () => void
  startFlow: (flowId: string, startAtStep?: number) => void
  goToStep: (index: number) => void
  nextStep: () => void
  prevStep: () => void
  switchView: (mode: 'tooltip' | 'modal') => void
  exitTour: () => void

  // Cross-route helpers
  setPendingStep: (index: number) => void
  commitPendingStep: () => void
}
```

### Callback System

```typescript
// Event types (inspired by react-joyride)
type TourEventType =
  | 'tour:start'
  | 'step:before'
  | 'step:after'
  | 'tour:end'
  | 'error:target_not_found'

// Action types
type TourAction = 'next' | 'prev' | 'close' | 'skip' | 'go'

// Origin types
type TourOrigin = 'button' | 'keyboard' | 'overlay' | 'hotspot' | 'programmatic'

// Callback data
interface TourCallbackData {
  type: TourEventType
  action: TourAction
  step: TourStep
  index: number
  origin: TourOrigin
  flowId: string
}

// Provider props
interface TourProviderProps {
  flows: TourFlow[]
  onCallback?: (data: TourCallbackData) => void
  autoSkipMissing?: boolean // Auto-skip when target not found (default: true)
  children: ReactNode
}
```

---

## Behavior Specifications

### Hotspot Interaction

1. **Learn Mode OFF**: No hotspots visible
2. **Learn Mode ON**: Pulsing hotspot appears at **upper-right edge** of each element (subtle, not disruptive)
3. **Hover on hotspot**: Inactive tooltip appears
4. **Click on hotspot**: Same as hover (shows inactive tooltip first)
5. **Click "Focus Guide"**: Enters active mode based on `defaultOpenView`

### Multi-Highlight Behavior

When `selector` is an array of selectors:

- **Highlight**: Merged bounding box around all elements (union calculation)
- **Tooltip anchor**: Positioned relative to **first element** in array
- **Guideline**: Only use for visually adjacent elements, limit to 2-3 max

**Union Calculation Pattern** (from reactour):

```typescript
function getUnionRect(selectors: string[]): DOMRect {
  let union = { top: Infinity, left: Infinity, right: 0, bottom: 0 }

  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (!el) continue
    const rect = el.getBoundingClientRect()

    if (rect.top < union.top) union.top = rect.top
    if (rect.left < union.left) union.left = rect.left
    if (rect.right > union.right) union.right = rect.right
    if (rect.bottom > union.bottom) union.bottom = rect.bottom
  }

  return {
    ...union,
    width: union.right - union.left,
    height: union.bottom - union.top,
  } as DOMRect
}
```

### `interactToNext` Behavior

When `interactToNext: true`:

1. Prev/Next buttons remain **visible and functional**
2. If user clicks "Next":
   - **If `autoTriggerOnSkip` defined**: Execute it, advance to next step
   - **If not defined**: Show subtle message: "Complete this action to continue, or click Skip to exit"
3. If user performs the interaction: Auto-advance to next step

### View Switching

- In **Active Tooltip**: "Switch to Video" button → morphs to Modal
- In **Modal**: "Switch to Tooltip" button → morphs back to Anchored position
- **Highlight remains** during transition (same element stays highlighted)
- **Content cross-fades** during morph animation

### Progress Dots

- Located at **mid-bottom** of both tooltip and modal
- Shows current position in flow
- **Clickable** — jump to any step directly
- Visual: filled dot = current, empty dots = other steps

### Error Recovery

When target element is not found:

1. Fire `onCallback` with `type: 'error:target_not_found'`
2. If `autoSkipMissing: true` (default): Auto-advance to next step
3. If `autoSkipMissing: false`: Stay on current step, show error state

---

## Architecture

### Components (shadcn/Tailwind)

1. **`TourProvider`**: Context provider, wraps app
2. **`TourLayer`**: Renders overlay, highlights, and cards (via React Portal)
3. **`TourMask`**: SVG overlay with clipPath for click-through
4. **`AnchoredCard`**: Tooltip shell (positioned via `@floating-ui/react`)
5. **`CenteredModal`**: Modal shell (fixed center position)
6. **`HoverTrigger`**: Pulsing hotspot + inactive tooltip on hover
7. **`ProgressDots`**: Clickable step indicators

### SVG Mask Implementation (from reactour)

Best practice overlay technique using SVG mask + clipPath:

```tsx
<svg className="fixed inset-0 h-full w-full pointer-events-none">
  <defs>
    {/* Mask: white background with black cutout */}
    <mask id="tour-mask">
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <rect
        x={highlight.left}
        y={highlight.top}
        width={highlight.width}
        height={highlight.height}
        rx={borderRadius}
        fill="black"
      />
    </mask>

    {/* ClipPath: inverted polygon for click-through area */}
    <clipPath id="tour-clip">
      <polygon
        points={`
          0 0,
          0 ${viewportHeight},
          ${highlight.left} ${viewportHeight},
          ${highlight.left} ${highlight.top},
          ${highlight.left + highlight.width} ${highlight.top},
          ${highlight.left + highlight.width} ${highlight.top + highlight.height},
          ${highlight.left} ${highlight.top + highlight.height},
          ${highlight.left} ${viewportHeight},
          ${viewportWidth} ${viewportHeight},
          ${viewportWidth} 0
        `}
      />
    </clipPath>
  </defs>

  {/* Overlay with mask (darkened area) */}
  <rect
    width="100%"
    height="100%"
    mask="url(#tour-mask)"
    className="fill-black/50"
  />

  {/* Clickable overlay area (excludes highlighted region) */}
  <rect
    width="100%"
    height="100%"
    clipPath="url(#tour-clip)"
    className="fill-transparent cursor-pointer pointer-events-auto"
    onClick={handleOverlayClick}
  />

  {/* Highlighted area border */}
  <rect
    x={highlight.left}
    y={highlight.top}
    width={highlight.width}
    height={highlight.height}
    rx={borderRadius}
    className="fill-none stroke-primary stroke-2"
  />
</svg>
```

### Observable System (from reactour)

For dynamic content that may resize or mutate:

```typescript
function useElementObservers(
  step: TourStep,
  onUpdate: () => void
) {
  useEffect(() => {
    const { resizeObservables, mutationObservables } = step

    // Resize Observer
    const resizeObserver = new ResizeObserver(onUpdate)
    resizeObservables?.forEach((selector) => {
      const el = document.querySelector(selector)
      if (el) resizeObserver.observe(el)
    })

    // Mutation Observer
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const found = mutationObservables?.some((selector) =>
          (mutation.target as Element).matches?.(selector)
        )
        if (found) {
          onUpdate()
          break
        }
      }
    })

    if (mutationObservables?.length) {
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      })
    }

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [step, onUpdate])
}
```

### State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                        Learn Mode OFF                           │
│                     (no UI rendered)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    toggleLearnMode()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Learn Mode ON                            │
│                  (hotspots visible)                             │
│                                                                 │
│   ┌─────────────┐                                               │
│   │   INACTIVE  │◄──── hover on hotspot                         │
│   │  (tooltip)  │                                               │
│   └──────┬──────┘                                               │
│          │                                                      │
│    "Focus Guide"                                                │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────────────────────────────────┐                   │
│   │              ACTIVE MODE                │                   │
│   │                                         │                   │
│   │  ┌─────────────┐    ┌─────────────┐     │                   │
│   │  │   TOOLTIP   │◄──►│    MODAL    │     │                   │
│   │  │ (anchored)  │    │ (centered)  │     │                   │
│   │  └─────────────┘    └─────────────┘     │                   │
│   │        switchView() toggles between     │                   │
│   └─────────────────────────────────────────┘                   │
│          │                                                      │
│    exitTour() or complete flow                                  │
│          │                                                      │
│          ▼                                                      │
│   Back to hotspots only (Learn Mode still ON)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Lifecycle States

```
INIT ──► READY ──► ACTIVE
  │         │         │
  └─────────┴─────────┴──► ERROR (target not found)
```

- **INIT**: Step is initializing, waiting for element
- **READY**: Element found, popper positioned
- **ACTIVE**: Step is visible and interactive
- **ERROR**: Target element not found

### Overlay Styling (Tailwind)

- **Semi-transparent dark**: `bg-black/50` — users can see beneath but dimmed
- **Rounded highlight**: `rx` attribute on SVG rect + `rounded-lg` for cards
- **Morph animation**: `transition-all duration-300 ease-in-out`

### CenteredModal Video Hero Pattern

The modal features a dual-video system with YouTube embeds:

```
┌─────────────────────────────────────────────────────────────┐
│  [X] Close                                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │         VIDEO AREA (h-[460px], edge-to-edge)        │   │
│  │                                                     │   │
│  │    Preview: auto-loop, no controls, muted           │   │
│  │    Tutorial: with controls, user-initiated          │   │
│  │                                                     │   │
│  │              [ ▶ Watch Tutorial ]                   │   │
│  │          ░░░░ White gradient scrim ░░░░             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                    Title Text                               │
│                   Subtitle Text                             │
│                                                             │
│     [Back]           • • ● • •           [Next →]          │
└─────────────────────────────────────────────────────────────┘
```

**Dual Video Implementation:**

```tsx
// Inside CenteredModal - local state only, resets on step change
const [isWatchingTutorial, setIsWatchingTutorial] = useState(false)

// Reset when step changes
useEffect(() => {
  setIsWatchingTutorial(false)
}, [currentStepIndex])

// Helper to convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string, autoplay = false, loop = false): string {
  const videoId = extractYouTubeId(url)
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: autoplay ? '1' : '0', // Must mute for autoplay
    loop: loop ? '1' : '0',
    playlist: loop ? videoId : '', // Required for loop
    controls: autoplay ? '0' : '1',
    modestbranding: '1',
    rel: '0',
  })
  return `https://www.youtube.com/embed/${videoId}?${params}`
}

// Video hero section
<div className="relative h-[460px] w-full overflow-hidden">
  {!isWatchingTutorial ? (
    // PREVIEW MODE: Short loop, no controls
    <>
      <iframe
        src={getYouTubeEmbedUrl(step.previewVideo, true, true)}
        className="absolute inset-0 h-full w-full"
        style={{
          transform: 'scale(1.2)', // Crop YouTube UI
          pointerEvents: 'none'
        }}
        allow="autoplay; encrypted-media"
        frameBorder="0"
      />
      {step.tutorialVideo && (
        <button
          onClick={() => setIsWatchingTutorial(true)}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20
                     flex items-center gap-2
                     bg-black/70 hover:bg-black/80 text-white
                     px-4 py-2 rounded-full backdrop-blur-sm
                     transition-colors"
        >
          <PlayIcon className="w-4 h-4" />
          Watch Tutorial
        </button>
      )}
    </>
  ) : (
    // TUTORIAL MODE: Full video with controls
    <>
      <iframe
        src={getYouTubeEmbedUrl(step.tutorialVideo, true, false)}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; encrypted-media; fullscreen"
        frameBorder="0"
      />
      <button
        onClick={() => setIsWatchingTutorial(false)}
        className="absolute top-4 right-4 z-20
                   flex items-center gap-1.5
                   bg-black/70 hover:bg-black/80 text-white
                   px-3 py-1.5 rounded-full text-sm backdrop-blur-sm
                   transition-colors"
      >
        <ArrowLeftIcon className="w-3 h-3" />
        Back to Preview
      </button>
    </>
  )}

  {/* White gradient scrim - fades video into content */}
  <div
    className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] z-10"
    style={{
      background: 'linear-gradient(to bottom, transparent 0%, white 100%)'
    }}
  />
</div>

{/* Content and navigation - UNCHANGED regardless of video state */}
<div className="px-6 pb-4 pt-4 text-center">
  <h2 className="text-2xl font-bold">{step.title}</h2>
  <p className="mt-2 text-muted-foreground">{step.subtitle}</p>
</div>

<div className="px-6 pb-6 flex items-center justify-between">
  <Button variant="outline" onClick={prevStep}>Back</Button>
  <ProgressDots current={currentStepIndex} total={steps.length} onDotClick={goToStep} />
  <Button onClick={nextStep}>Next</Button>
</div>
```

**Key Design Decisions:**

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Video source | YouTube embeds | Can't self-host in WXT extension |
| Preview behavior | Auto-loop, muted, no controls | Quick visual context without interaction |
| Tutorial trigger | Overlay button | Clear call-to-action, doesn't interrupt flow |
| Tutorial controls | YouTube native | Familiar UI, supports fullscreen |
| State scope | Component-local | Resets on step change, no need to persist |
| Navigation | Always enabled | User can Prev/Next even while watching tutorial |

**YouTube Embed Considerations:**

- Use `scale(1.2)` transform to crop out YouTube branding on preview
- Set `pointerEvents: 'none'` on preview iframe to prevent interaction
- Include `modestbranding=1` and `rel=0` to minimize YouTube UI
- For loop: must include `playlist={videoId}` parameter

### Cross-Environment Support

Must work in:

1. **Next.js webapp**: Standard React rendering
2. **WXT extension content script**: Shadow DOM isolation

**WXT-specific considerations**:

- Overlay covers **entire viewport** (including LinkedIn DOM)
- SVG mask creates hole for target element (even if outside shadow DOM)
- Tooltip/modal renders in shadow DOM at highest z-index
- Element positions calculated relative to viewport, not shadow container

---

## Cross-Route Navigation

### Pending Step Pattern (from onboarding-activation-kit)

For flows that span multiple routes:

```typescript
// Step 1: Set pending step and navigate
const handleNext = () => {
  const nextStep = steps[currentStepIndex + 1]
  if (nextStep.actionTrigger) {
    setPendingStep(currentStepIndex + 1)
    nextStep.actionTrigger(null) // Triggers navigation
  } else {
    goToStep(currentStepIndex + 1)
  }
}

// Step 2: In useEffect, detect route change and commit
useEffect(() => {
  if (pendingStepIndex !== null) {
    const step = steps[pendingStepIndex]
    const targetExists = document.querySelector(step.selector as string)

    if (targetExists) {
      commitPendingStep() // Actually move to the step
    }
  }
}, [pathname]) // React to route changes
```

### waitForElement with MutationObserver

```typescript
function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector)
    if (existing) {
      resolve(existing)
      return
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) {
        observer.disconnect()
        resolve(el)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    setTimeout(() => {
      observer.disconnect()
      resolve(null) // Timeout - element not found
    }, timeout)
  })
}
```

---

## State Persistence

**localStorage only** — no database required:

```typescript
interface PersistedTourState {
  isLearnModeOn: boolean
  // Note: activeFlowId and currentStepIndex are NOT persisted
  // If user refreshes mid-tour, they exit the tour but Learn Mode stays on
}
```

---

## Implementation Checklist

### Phase 1: Core Engine

- [ ] `TourContext` with state machine and lifecycle states
- [ ] `useTour` hook exposing all actions
- [ ] localStorage persistence for Learn Mode
- [ ] Flow/step data structure and registration
- [ ] Callback system (`onCallback` prop)

### Phase 2: Visual Components (shadcn/Tailwind)

- [ ] `TourMask` SVG overlay with clipPath (click-through support)
- [ ] `AnchoredCard` with floating-ui positioning
- [ ] `CenteredModal` fixed center layout with video hero
- [ ] `CenteredModal` dual-video system (preview ↔ tutorial swap)
- [ ] YouTube embed helper (`getYouTubeEmbedUrl`)
- [ ] `ProgressDots` clickable navigation
- [ ] Morph animation between anchored/centered

### Phase 3: Interaction Features

- [ ] `HoverTrigger` pulsing hotspot
- [ ] `interactToNext` with auto-trigger option
- [ ] `actionTrigger` / `actionAfter` lifecycle hooks
- [ ] `waitForElement` / `waitForAction` coordination
- [ ] Multi-highlight support (array of selectors with union calculation)
- [ ] Observable system (`resizeObservables`, `mutationObservables`)

### Phase 4: Cross-Route & Error Handling

- [ ] Pending step pattern for cross-route navigation
- [ ] Error recovery (auto-skip missing elements)
- [ ] Test in Next.js webapp
- [ ] Test in WXT extension (shadow DOM)

---

## Verification Tests

1. **Learn Mode Toggle**: Toggle on → hotspots appear. Toggle off → everything hidden
2. **Hover → Inactive**: Hover hotspot → inactive tooltip appears with "Focus Guide"
3. **Focus Guide → Active**: Click button → overlay + highlight + active view
4. **View Switching**: "Switch to Video" → modal. "Switch to Tooltip" → back to anchored
5. **Progress Dots**: Click any dot → jump to that step
6. **Scroll Persistence**: Active tooltip stays anchored during scroll
7. **Multi-Highlight**: Array selector → merged highlight, tooltip on first element
8. **InteractToNext**: Interaction required → auto-advance on action, or auto-trigger on skip
9. **Flow Completion**: Last step → next/complete → auto-exit
10. **Persistence**: Refresh page with Learn Mode ON → stays ON
11. **Callback Events**: All events fire correctly with proper data
12. **Missing Element**: Auto-skip + callback fires with `error:target_not_found`
13. **Cross-Route**: Navigate to new route → pending step commits correctly
14. **Observable**: Resize target element → highlight updates automatically
15. **Video Preview**: Modal shows auto-looping YouTube preview (muted, no controls)
16. **Video Tutorial**: Click "Watch Tutorial" → swaps to full video with controls
17. **Video Back**: Click "Back to Preview" → returns to looping preview
18. **Video Reset**: Navigate to next step → video state resets to preview mode
19. **Video Navigation**: Prev/Next buttons work while watching tutorial

---

## Design Guidelines

### Flow Length

- **3-5 steps maximum** per flow (research shows 80% skip tours with >5 steps)
- Create separate flows per feature area (tab, route, feature)
- Keep it focused: one concept per step

### Content Guidelines

- **Inactive tooltip**: 1-2 sentences max, "what is this?"
- **Active tooltip**: Action-oriented, "do this next"
- **Modal**: Extended explanation, video tutorial, detailed walkthrough

### Hotspot Placement

- **Position**: Upper-right edge of element
- **Size**: Small, subtle (not disruptive)
- **Animation**: Gentle pulse via Tailwind `animate-pulse` or custom keyframes

---

## References

### Research Sources (Analyzed)

- **react-joyride**: Callback system, controlled mode, error handling patterns
- **reactour**: SVG mask + clipPath, observable system, multi-element highlighting
- **onboarding-activation-kit**: Pending step pattern, cross-route navigation
- **tour (shadcn-style)**: Virtual anchor pattern, Radix integration
- **tutorial.tsx**: Minimal approach, direct style manipulation

### UX Research Sources

- [Appcues - Product Tour UI Patterns](https://www.appcues.com/blog/product-tours-ui-patterns)
- [Userpilot - Interactive Walkthroughs](https://userpilot.com/blog/interactive-walkthroughs-improve-onboarding/)
- [Chameleon - Highlighting Elements](https://www.chameleon.io/blog/new-design-patterns-highlighting-elements)
- [NN/g - Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [Command.ai - Tours Users Don't Skip](https://www.command.ai/blog/product-tour-best-practices/)

### Technical References

- [Floating UI Documentation](https://floating-ui.com/docs/tutorial)
- [react-joyride GitHub](https://github.com/gilbarbara/react-joyride)
- [reactour GitHub](https://github.com/elrumordelaluz/reactour)
- [Josh Comeau - Persisting React State](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/)

### Industry Benchmarks

- Tour completion rate: 61% average, 70-80% top performers
- Optimal tour length: 3-5 steps
- Users skip 80% of tours with >5 steps

---

# PART 2: Learn Mode Design Analysis (Added 2026-02-14)

This section documents comprehensive multi-agent analysis of Learn Mode architecture options, conducted to determine the best approach for contextual feature discovery.

## Current Implementation Status

### What Has Been Implemented

| Component | Status | Location |
|-----------|--------|----------|
| `TourContext` with state machine | ✅ Done | `packages/ui/src/components/tour/tour-context.tsx` |
| `useTour` hook with actions | ✅ Done | `startTour`, `endTour`, `nextStep`, `prevStep`, `goToStep`, `switchView` |
| Flow/step data structures | ✅ Done | `packages/ui/src/components/tour/types.ts` |
| `TourOverlay` SVG mask | ✅ Done | `packages/ui/src/components/tour/tour-overlay.tsx` |
| `TourModal` with video hero | ✅ Done | `packages/ui/src/components/tour/tour-modal.tsx` |
| `TourTooltip` with floating-ui | ✅ Done | `packages/ui/src/components/tour/tour-tooltip.tsx` |
| `TourProgress` clickable dots | ✅ Done | `packages/ui/src/components/tour/tour-progress.tsx` |
| YouTube embed helpers | ✅ Done | `packages/ui/src/components/tour/utils/youtube.ts` |
| Dual-video system | ✅ Done | Seamless loop via postMessage |
| View switching (modal ↔ tooltip) | ✅ Done | Minimize/Maximize buttons |
| Multi-highlight support | ✅ Done | Array of selectors |
| Modal 9-position grid | ✅ Done | `packages/ui/src/components/tour/utils/modal-position.ts` |
| Shadow DOM support | ✅ Done | `portalContainer` prop |
| `onBeforeTour` / `onBeforeStep` | ✅ Done | Async callbacks |
| `SimulatedElement` with cloning | ✅ Done | `packages/ui/src/components/tour/simulated-element.tsx` |
| `GhostCursor` animation | ✅ Done | `packages/ui/src/components/tour/ghost-cursor.tsx` |
| Extension intro tour | ✅ Done | `apps/wxt-extension/.../tour-flows.ts` (4 steps) |

### What Has NOT Been Implemented (From Original Plan)

| Feature | Plan Description | Status |
|---------|------------------|--------|
| **Learn Mode toggle** | Global ON/OFF with localStorage | ❌ Not built |
| **HoverTrigger hotspots** | Pulsing indicators on elements | ❌ Not built |
| **Inactive Tooltip** | Brief preview on hover | ❌ Not built |
| **Three View States** | Inactive → Active Tooltip → Modal | ❌ Only 2 views |
| **Lifecycle states** | `init` / `ready` / `active` / `error` | ❌ Simplified |
| **Callback system** | `onCallback` with event types | ⚠️ Simplified |
| **`interactToNext`** | Require user interaction | ❌ Not built |
| **Observable system** | Per-step resize/mutation observers | ❌ Not built |
| **Cross-route navigation** | Pending step pattern | ❌ Not needed |

---

## The Learn Mode Design Question

When implementing Learn Mode with hotspots, a critical question emerged:

**If multiple tour flows reference the same element, how should hotspots behave?**

Example scenario:
```
Flow A (Extension Intro):     Step 1 → #compose-tab
Flow B (Power User Tips):     Step 3 → #compose-tab
Flow C (What's New - Feb):    Step 1 → #compose-tab

Learn Mode ON → Multiple hotspots on same element?
```

This led to comprehensive multi-agent analysis of design options.

---

## Design Options Analyzed

### Option 1: Element-Centric Merge

One hotspot per unique DOM selector, regardless of how many flows reference it.

```
Hover #compose-tab →
┌────────────────────────────────┐
│ Compose Tab                    │
│ "Write comments 10x faster"    │
│                                │
│ Available Guides:              │
│ ┌────────────────────────────┐ │
│ │ 📘 Extension Basics        │ │
│ │ ⚡ Power User Tips         │ │
│ │ ✨ What's New (Feb)        │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### Option 2: Active Flow Context

Only ONE flow's hotspots show at a time. User selects which "guide context" they're in.

```
┌─────────────────────────────────────────┐
│ Learn Mode: [Extension Basics ▼]        │
└─────────────────────────────────────────┘

Only Extension Basics hotspots visible.
Switch dropdown → different hotspots appear.
```

### Option 3: Priority System

Each flow has a priority number. For overlapping selectors, highest priority wins.

### Option 4: Completion-Based Filtering

Completed flows don't show hotspots. Overlap naturally resolves as user progresses.

### Option 5: Feature Entity (Inverted Model)

Create Feature as first-class entity. Steps reference features by ID.

```typescript
interface Feature {
  id: string;
  selector: string;
  name: string;
  guides: Guide[];
}
```

### Option 6: Hybrid

Combine flow-centric with completion tracking and "more guides" badges.

---

## Multi-Agent Analysis: Arguments AGAINST Element-Centric

### From Devil's Advocate Agent

**Critical Flaws Identified:**

1. **Analysis Paralysis**: Multiple guides per element = "which one do I pick?" Users close tooltip without choosing.

2. **Lost Narrative Context**: A tour step like "Compose Overview" makes sense as Step 1 of 4-step intro. As standalone hotspot? Decontextualized and confusing.

3. **Prerequisite Chains Break**: User clicks hotspot on Step 4 → But Steps 1-3 weren't completed → `onBeforeStep` expects context → Experience breaks.

4. **Context Collapse Problem**: Steps lose meaning outside their flow. "Now click here" makes no sense without previous steps.

5. **Can't Teach Multi-Step Workflows**: "How to create a target list and load posts" requires sequence:
   - Navigate to target list page
   - Create list
   - Open extension
   - Select list
   - Click load

   Element-centric fragments this into isolated hotspots.

6. **No Clear Starting Point**: 30 hotspots pulsing = "where do I begin?" Visual overwhelm.

7. **Scale Death Spiral**:
   - 50 steps → ~30 unique elements
   - 30 hotspots on screen = visual clutter
   - Popular element referenced by 10 flows = dropdown scrolls
   - User overwhelmed, clicks nothing

8. **Cognitive Load**: Violates progressive disclosure. Shows ALL hotspots at once vs. revealing information gradually.

9. **Fundamental Flaw - "Element ≠ Feature"**: Users think in workflows, not buttons. "How do I accomplish X?" vs "What does this button do?"

10. **Array Selector Chaos**: Current design uses `selector: string | string[]`. How to merge `["#button"]` vs `["#button", "#other"]`? Which selector wins?

### From UX Research Agent

**Research-Based Concerns:**

1. **Choice Overload**: Appcues data shows users who see multiple tours have 28% completion vs 64% for single tour.

2. **Context-Switching Penalty**: Gloria Mark (UCI) research: 23 minutes to return to task after interruption.

3. **Self-Determination Theory** (Deci & Ryan): While autonomy is important, too many choices = decision fatigue, not autonomy.

4. **Tutorial Completion Data**:
   - 55-70% abandon onboarding tours (Appcues 2021)
   - Only 15% complete multi-step tours (ProdPad 2019)
   - But this is for FLOWS — element-centric doesn't solve this, just hides the metric.

5. **Passive Users Risk**: Users who never explore will never discover features. At least flows ensure exposure.

### From Technical Architecture Agent

**Implementation Concerns:**

1. **State Complexity**: Hotspot must track `Map<flowId, steps[]>` internally. Debugging nightmare.

2. **Re-render Explosion**: Every hotspot re-renders when ANY flow changes.

3. **`onBeforeStep` Execution Order**: 3 flows reference same element with different `onBeforeStep` actions. Which runs?

4. **`simulateSelectors` Conflict**: Flow A wants to simulate `["#button"]`, Flow B wants `["#button", "#settings"]`. Which shows?

### From Product Strategy Agent

**Business Concerns:**

1. **Activation Rate Estimates**:
   - Element-Centric: 30-40% activation
   - Flow-Centric: 60-70% activation
   - Hybrid: 70-80% activation

2. **Time to First Value**:
   - Element-Centric: 5-10 min (user explores randomly)
   - Flow-Centric: 2-4 min (focused on outcome)

3. **Checklist Achievability**: "Complete all 20 feature tours" feels overwhelming vs "Complete these 3 flows".

4. **No Successful Products Use Pure Element-Centric**: Duolingo, Notion, Slack, Headspace all use flow-first → element discovery LATER.

---

## Multi-Agent Analysis: Arguments FOR Element-Centric

### From Devil's Advocate Agent (Defending Element-Centric)

**Strong Arguments:**

1. **"Users Think in Tasks" is Wrong for THIS Product**: EngageKit users are LinkedIn power users coming back daily, not learning once. Day 2: "How do I view engagement rate?" → Wants direct access, not re-running flow.

2. **Tutorial Hell**: Flows force sequential steps. User at Step 4: "I already know this..." → Abandonment. Element-centric lets users learn just what they need.

3. **"I Already Know Most of This" Problem**: Flow has 4 steps, user needs help with 1 thing. Flow-centric forces them through 4 steps to learn 1 thing.

4. **Just-In-Time Learning**:
   - Just-in-time retention: 70-80%
   - Front-loaded tutorials: 20-30%
   - Element-centric = natural just-in-time moments

5. **Flow Complexity Explosion**: Product grows → 7+ flows. "Is account management in 'Extension Intro' or 'Account Setup'?" Flow discovery becomes its own UX problem.

6. **Visual Hierarchy Solves Starting Point**: Hotspots pulse at varying intensities. "Important" features pulse more. User naturally starts with most prominent.

7. **Expert User Retention**: After 30 days, power users hate forced tutorials. "How do I export analytics?" → Element-centric: hover, done. Flow-centric: find flow, skip 5 steps, finally get answer.

8. **Real Products Using Element-Centric**:
   - **Figma**: Hotspots on every tool, hover = tooltip
   - **Linear**: "?" help icon on every feature
   - **VSCode**: Hover any menu item = description
   - **Notion**: "Learn more" links contextually placed

9. **Analytics Granularity**:
   - Element-centric: "40% struggle with export-dropdown"
   - Flow-centric: "60% completed tour" (but WHICH step confused them?)

10. **Industry Trend**: 2015 = flow-centric tutorials. 2025 = contextual element-centric help. Element-centric is the future.

### From UX Research Agent (Supporting Element-Centric)

**Research-Based Support:**

1. **Expert User Learning** (Carroll & Rosson 1987): "Paradox of the Active User" — Users resist lengthy learning sequences. They learn by doing.

2. **Pull vs Push Learning** (Adult Learning Theory): Adults are self-directed learners. Push learning imposes cognitive load BEFORE users have context.

3. **Tutorial Skip Rate**: 55-70% abandon flows anyway. So flow "completion" is a vanity metric.

4. **Contextual Help Research** (Novick & Ward 2006): Contextual help increased task completion by 40% vs upfront documentation.

5. **Microsoft Research 2013**: Tooltips during task flow = 3x longer retention than upfront demos.

6. **Autonomy = Core Psychological Need** (Self-Determination Theory): When users feel controlled, intrinsic motivation decreases.

7. **Return Users**: Flow-centric requires "re-onboard" or separate help docs. Element-centric: tooltips are always there.

8. **LinkedIn Context**: Users are IN LinkedIn doing tasks. Element-centric = "help where I am" vs flows = "take me away from my task".

9. **Microlearning Research**: 3-5 minute learning bursts increase retention by 20% vs 30-minute sessions. Tooltips = 5-10 second microlearning.

### From Technical Architecture Agent (Supporting Element-Centric)

**Architectural Advantages:**

1. **DOM as Source of Truth**: Element exists → hotspot valid. Element removed → hotspot auto-invalid. Self-healing.

2. **Decoupling**: Elements, guides, collections are independent layers. Change one without cascading.

3. **Dynamic Content**: A/B tests, feature flags, personalization all natural with element-centric.

4. **Maintenance Velocity**:
   - Element-Centric: O(1) — add one hotspot
   - Flow-Centric: O(N) — update N flows

5. **Composability**: Guides are Lego bricks (combine any way). Flow steps are puzzle pieces (only fit designed order).

6. **Future Features**:
   - AI-powered suggestions: Detect user hesitation on element → show guide
   - Personalized paths: Filter guides by user.role, user.skillLevel
   - A/B testing: Add variant to element, measure per-variant

7. **Analytics**: Element-level insights ("which features need better UX") vs flow-level ("who finished").

### From Product Strategy Agent (Supporting Element-Centric)

**Product Arguments:**

1. **User Sophistication**: Marketers, salespeople, recruiters are professionals. They learn by exploring.

2. **LinkedIn Integration**: Users are IN LinkedIn. Element-centric = "help where I am".

3. **Partial Adoption is OK**: Recruiter who only uses "Save Profile" and ignores AI commenting is satisfied customer, not failed activation.

4. **Power User Path**: Best customers are power users. Element-centric serves them.

5. **Competitive Differentiation**: Most tools = boring flows. Element-centric feels "smart" and "modern".

6. **Gamification Reframe**: "Discover and master features" (exploration) vs "complete this flow" (homework).

7. **Re-engagement**: User returns after 2 months. Element-centric: hover, instant help. Flow-centric: restart tour?

8. **Support Burden**: Persistent tooltips = living documentation. Reduces "how do I?" tickets.

---

## Synthesis: The Goal-Centric Approach

Both sides argued past each other because they answered **different questions**:

| Question | Best Answer |
|----------|-------------|
| "What does this button do?" | Element-Centric |
| "How do I accomplish this task?" | Flow-Centric |
| "Help me when I need it" | Element-Centric |
| "Teach me the product" | Flow-Centric |
| "I'm an expert, get out of my way" | Element-Centric |
| "I'm new, guide me" | Flow-Centric |

**Your users are BOTH** — new to YOUR extension, but experts at LinkedIn.

### The Third Path: Goal-Centric Discovery

Neither pure element-centric nor pure flow-centric. Instead: **Goal-based filtering**.

```
┌─────────────────────────────────────────────────────────────┐
│                    GOAL-BASED DISCOVERY                      │
│                                                             │
│  "What do you want to accomplish?"                          │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ 💬 Comment      │  │ 👥 Build my     │  │ 📊 Track    │ │
│  │ faster on       │  │ target list     │  │ my results  │ │
│  │ posts           │  │                 │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  User picks goal → System highlights RELEVANT elements      │
│  (Not all elements, not forced sequence, but goal-filtered) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### How Goal-Centric Solves Both Sides' Concerns

| Concern | How Goal-Based Solves It |
|---------|--------------------------|
| Too many hotspots | Only show hotspots relevant to chosen goal |
| No starting point | Goal selection IS the starting point |
| Can't teach workflows | Goal = workflow, shows elements in that workflow |
| Choice paralysis | 3 goals, not 30 hotspots |
| Expert users | Can skip goal selection, explore freely |
| Prerequisites | Goal implies sequence; system can guide order |
| Element-level help | Still have tooltips per element |
| Return users | Can re-select goal or hover any element |

### Proposed Goal-Centric Architecture

```typescript
interface Goal {
  id: string;
  title: string;  // "Comment faster on posts"
  description: string;
  icon: string;

  // Which elements are relevant to this goal
  relevantSelectors: string[];

  // Optional: Suggested order (but not forced)
  suggestedOrder?: string[];

  // Completion criteria
  completionCriteria?: {
    type: 'action' | 'view';
    selector: string;
    count?: number;
  }[];
}

interface TourStep {
  id: string;
  selector: string;
  title: string;
  subtitle: string;

  // Which goals this step is relevant to
  goalIds: string[];

  // Existing fields...
  previewVideo?: string;
  tutorialVideo?: string;
}
```

### Goal-Centric User Experience

```
FIRST TIME:
┌─────────────────────────────────────────┐
│ What brings you to EngageKit today?     │
│                                         │
│ ○ Comment faster on posts               │
│ ○ Build my target list                  │
│ ○ Track my engagement results           │
│ ○ Just exploring (show all)             │
└─────────────────────────────────────────┘

User picks "Comment faster" →
Only Compose tab elements get hotspots.
Other tabs dimmed but accessible.

User completes goal (or switches) →
New goal = new relevant hotspots.

RETURN USER:
No modal. Hotspots for last-used goal.
Can hover any element for instant help.
Can re-select goal from settings.
```

### Comparison Matrix

| Dimension | Flow-Centric | Element-Centric | Goal-Centric |
|-----------|--------------|-----------------|--------------|
| Starting point | ✅ Clear | ❌ Unclear | ✅ Clear (3 goals) |
| User autonomy | ❌ Low | ✅ High | ✅ High (optional) |
| Cognitive load | ⚠️ Sequential | ❌ High (30 hotspots) | ✅ Low (filtered) |
| Teaches workflows | ✅ Yes | ❌ No | ✅ Yes (goal = workflow) |
| Expert-friendly | ❌ No | ✅ Yes | ✅ Yes ("just exploring") |
| Return users | ❌ Restart tour | ✅ Hover help | ✅ Both |
| Gamification | ⚠️ Flow completion | ⚠️ Feature discovery | ✅ Goal completion |
| Prerequisites | ✅ Enforced | ❌ Broken | ✅ Suggested order |
| Maintenance | ❌ O(N) flows | ✅ O(1) elements | ✅ O(1) + goals |

---

## Recommendation

### Primary Recommendation: Goal-Centric Discovery

1. **First-time experience**: Goal selection modal (3-4 goals)
2. **In-goal experience**: Only relevant hotspots visible
3. **Expert escape**: "Just exploring" shows all hotspots
4. **Return users**: Remember last goal, persistent tooltips
5. **Gamification**: Goal completion + feature mastery badges
6. **Checklist**: Goals become natural checklist items

### Implementation Priority

**Phase 1: MVP (Ship existing tours)**
- Current implementation is functional
- 4-step intro tour works via `startTour()`
- No Learn Mode yet, but tours work

**Phase 2: Goal-Centric Learn Mode**
- Add `Goal` interface
- Add goal selection UI
- Filter hotspots by selected goal
- Add `isLearnModeOn` + `activeGoalId` to context

**Phase 3: Advanced Features**
- Completion tracking per goal
- "More guides" badge for overlapping elements
- Gamification (points, badges)
- Smart suggestions (detect user hesitation)

---

## Future Considerations

### Checklist Integration

Goals naturally map to checklist items:

```
Today's Goal:
☐ Complete 1 core goal (required)

This Week:
☐ Complete all 3 core goals (stretch)
☐ Explore 2 advanced features (optional)
```

### Gamification Integration

```
🥉 Bronze: Complete 1 core goal
🥈 Silver: Complete all core goals
🥇 Gold: Complete goals + 5 optional guides
💎 Platinum: Master all features
```

### Analytics Strategy

Track both element-level and goal-level metrics:
- Which elements get most hovers (need better UX?)
- Which goals have highest completion (good design)
- Where do users switch goals mid-way (confusion?)
- Which "just exploring" users convert to goal-users

---

## Open Questions for Next Session

1. **Goal definition**: What are the 3-4 core goals for EngageKit?
2. **UI placement**: Where does goal selector appear? Modal? Sidebar header?
3. **Persistence**: localStorage? Chrome storage? Per-account?
4. **Expert detection**: Can we auto-detect power users and skip goal selection?
5. **Goal switching**: How do users change goals mid-session?
6. **Completion criteria**: What constitutes "goal completed"?

---

## Agent IDs for Resumption

If continuing this analysis, these agent sessions can be resumed:

- **Critique Agent (against element-centric)**: `af789cc`
- **UX Research (against element-centric)**: `ae285e1`
- **Technical Architecture**: `ab6a21f`
- **Product Strategy (against element-centric)**: `a490d33`
- **Devil's Advocate (for element-centric)**: `aa3c802`
- **UX Research (for element-centric)**: `ac5d559`
- **Technical Architecture (for element-centric)**: `a529429`
- **Product Strategy (for element-centric)**: `a5cf78b`

---

## Summary

This plan has evolved from a simple "Learn Mode with hotspots" concept to a comprehensive analysis of discovery architecture. The key insight is that neither pure element-centric nor pure flow-centric is optimal for EngageKit.

**Goal-Centric Discovery** bridges both approaches:
- Structure without force (goals, not flows)
- Element-level granularity (hotspots, not steps)
- User autonomy (choose goal, explore within it)
- Progressive disclosure (complete goal → see more goals)
- Gamification hooks (goal completion, feature discovery)

**Next step when resuming**: Define the 3-4 core goals for EngageKit users and design the goal selection UI.
