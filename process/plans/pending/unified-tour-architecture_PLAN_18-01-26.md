# Unified Product Tour & Feature Guide Architecture (v11 - Research Complete)

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
