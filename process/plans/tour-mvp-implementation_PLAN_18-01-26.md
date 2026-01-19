# Tour System MVP - Implementation Plan

## Goal

Create a **minimal viable tour system** in `@sassy/ui` package that enables:
1. Recording tutorial videos with visual context
2. Preparing content flows for existing features
3. Shipping user onboarding for launch

**NOT implementing** (deferred to later):
- Learn Mode / pulsing hotspots
- Inactive tooltips on hover
- Multi-element highlighting
- Observable system
- Cross-route navigation with pending steps

---

## What We're Building (MVP Scope)

### Core Features

1. **CenteredModal with Video Hero**
   - YouTube preview (5-10s loop, muted, no controls)
   - YouTube tutorial (full video with controls)
   - Toggle between preview ↔ tutorial
   - Title, subtitle, content area
   - Back/Next navigation
   - Progress dots
   - "Switch to tooltip view" link

2. **TourProvider + useTour Hook**
   - Start/stop tour flows (`startTour(flowId)` can be called from anywhere)
   - Navigate between steps
   - Track current step and view mode
   - **Switch between modal ↔ tooltip views** at any time
   - Simple callback for analytics

3. **TourOverlay (SVG Mask)**
   - Spotlight on **single or multiple elements** (array of selectors)
   - Multi-highlight: union of all element rects creates combined spotlight
   - Semi-transparent backdrop
   - Click-through on highlighted areas

4. **AnchoredTooltip** (simpler version)
   - Positioned near element using Radix Popover
   - Same content structure as modal
   - "Watch video tutorial" link → switches to CenteredModal

**Note on Auto-launch**: The tour system exposes `startTour(flowId)` which can be called programmatically. Auto-launch logic (checking sign-in status, LinkedIn account registration, settings loaded, etc.) lives in consuming app code, not in the tour components.

---

## Feature Flow (Single Simple Flow)

**One flow, 4 steps — one step per tab.** Each step gives a high-level overview of what that tab does.

### Extension Intro Flow
```
Step 1: Compose Tab → Modal explaining "Generate AI comments on posts"
Step 2: Connect Tab → Modal explaining "Save profiles & track engagement"
Step 3: Analytics Tab → Modal explaining "View your commenting stats"
Step 4: Accounts Tab → Modal explaining "Manage your LinkedIn accounts"
```

**Why this approach:**
- Users get the big picture quickly (< 90 seconds)
- No feature-level detail that might overwhelm
- Easy to record 4 short preview videos
- Can add detailed per-feature tours later if needed

---

## Data Structures (Simplified)

```typescript
// packages/ui/src/components/tour/types.ts

interface TourStep {
  id: string
  selector: string | string[]         // Single selector OR array for multi-highlight

  // Content
  title: string
  subtitle?: string
  content?: ReactNode                 // Additional content below subtitle

  // Video (optional - for modal view)
  previewVideo?: string               // YouTube URL for 5-10s loop
  tutorialVideo?: string              // YouTube URL for full tutorial

  // Display mode
  preferredView: 'tooltip' | 'modal'  // Which view to show first
}

// Multi-highlight example:
// selector: ['[data-tour="compose-tab"]', '.feed-shared-update-v2']
// This highlights both the extension tab AND LinkedIn post elements

interface TourFlow {
  id: string
  name: string                        // For debugging/analytics
  steps: TourStep[]
}

interface TourContextValue {
  // State
  isActive: boolean
  currentFlowId: string | null
  currentStepIndex: number
  viewMode: 'tooltip' | 'modal'

  // Actions
  startTour: (flowId: string) => void
  endTour: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number) => void
  switchView: (mode: 'tooltip' | 'modal') => void
}

interface TourProviderProps {
  flows: TourFlow[]
  onStepChange?: (flowId: string, stepIndex: number) => void
  onTourEnd?: (flowId: string, completed: boolean) => void
  children: ReactNode
}
```

---

## Component Architecture

```
packages/ui/src/components/tour/
├── index.ts                    # Exports
├── types.ts                    # TypeScript interfaces
├── tour-context.tsx            # TourProvider + useTour hook
├── tour-overlay.tsx            # SVG mask overlay
├── tour-modal.tsx              # CenteredModal with video hero
├── tour-tooltip.tsx            # AnchoredTooltip using Radix Popover
├── tour-progress.tsx           # Progress dots component
├── tour-layer.tsx              # Combines overlay + modal/tooltip
└── utils/
    └── youtube.ts              # YouTube embed URL helper
```

---

## Implementation Details

### 1. TourProvider + useTour

```tsx
// tour-context.tsx
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { TourFlow, TourStep, TourContextValue } from './types'

const TourContext = createContext<TourContextValue | null>(null)

export function TourProvider({
  flows,
  onStepChange,
  onTourEnd,
  children
}: TourProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'tooltip' | 'modal'>('modal')

  const currentFlow = flows.find(f => f.id === currentFlowId)
  const currentStep = currentFlow?.steps[currentStepIndex]

  const startTour = useCallback((flowId: string) => {
    const flow = flows.find(f => f.id === flowId)
    if (!flow || flow.steps.length === 0) return

    setCurrentFlowId(flowId)
    setCurrentStepIndex(0)
    setViewMode(flow.steps[0].preferredView)
    setIsActive(true)
    onStepChange?.(flowId, 0)
  }, [flows, onStepChange])

  const endTour = useCallback((completed = false) => {
    if (currentFlowId) {
      onTourEnd?.(currentFlowId, completed)
    }
    setIsActive(false)
    setCurrentFlowId(null)
    setCurrentStepIndex(0)
  }, [currentFlowId, onTourEnd])

  const nextStep = useCallback(() => {
    if (!currentFlow) return

    if (currentStepIndex < currentFlow.steps.length - 1) {
      const newIndex = currentStepIndex + 1
      setCurrentStepIndex(newIndex)
      setViewMode(currentFlow.steps[newIndex].preferredView)
      onStepChange?.(currentFlow.id, newIndex)
    } else {
      endTour(true)
    }
  }, [currentFlow, currentStepIndex, onStepChange, endTour])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1
      setCurrentStepIndex(newIndex)
      if (currentFlow) {
        setViewMode(currentFlow.steps[newIndex].preferredView)
        onStepChange?.(currentFlow.id, newIndex)
      }
    }
  }, [currentFlow, currentStepIndex, onStepChange])

  const goToStep = useCallback((index: number) => {
    if (!currentFlow || index < 0 || index >= currentFlow.steps.length) return
    setCurrentStepIndex(index)
    setViewMode(currentFlow.steps[index].preferredView)
    onStepChange?.(currentFlow.id, index)
  }, [currentFlow, onStepChange])

  const switchView = useCallback((mode: 'tooltip' | 'modal') => {
    setViewMode(mode)
  }, [])

  return (
    <TourContext.Provider value={{
      isActive,
      currentFlowId,
      currentStepIndex,
      viewMode,
      startTour,
      endTour,
      nextStep,
      prevStep,
      goToStep,
      switchView,
    }}>
      {children}
      {isActive && currentStep && (
        <TourLayer step={currentStep} totalSteps={currentFlow?.steps.length ?? 0} />
      )}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within TourProvider')
  }
  return context
}
```

### 2. TourOverlay (SVG Mask with Multi-Highlight)

```tsx
// tour-overlay.tsx
'use client'

import { useEffect, useState } from 'react'
import { cn } from '../../utils'

interface HighlightRect {
  left: number
  top: number
  width: number
  height: number
}

interface TourOverlayProps {
  selector: string | string[]  // Single selector or array for multi-highlight
  onOverlayClick?: () => void
  className?: string
}

export function TourOverlay({ selector, onOverlayClick, className }: TourOverlayProps) {
  const [highlights, setHighlights] = useState<HighlightRect[]>([])
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateHighlights = () => {
      // Normalize to array
      const selectors = Array.isArray(selector) ? selector : [selector]

      const rects: HighlightRect[] = []
      for (const sel of selectors) {
        const element = document.querySelector(sel)
        if (element) {
          const rect = element.getBoundingClientRect()
          rects.push({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          })
        }
      }

      setHighlights(rects)
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateHighlights()
    window.addEventListener('resize', updateHighlights)
    window.addEventListener('scroll', updateHighlights, true)

    return () => {
      window.removeEventListener('resize', updateHighlights)
      window.removeEventListener('scroll', updateHighlights, true)
    }
  }, [selector])

  if (highlights.length === 0) return null

  const padding = 8
  const borderRadius = 8

  // Generate unique mask ID to avoid conflicts
  const maskId = 'tour-spotlight-mask'

  return (
    <svg
      className={cn('fixed inset-0 z-[9998] pointer-events-none', className)}
      width={viewport.width}
      height={viewport.height}
    >
      <defs>
        <mask id={maskId}>
          {/* White = visible overlay, Black = transparent (spotlight) */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {/* Cut out each highlighted element */}
          {highlights.map((rect, index) => (
            <rect
              key={index}
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx={borderRadius}
              fill="black"
            />
          ))}
        </mask>
      </defs>

      {/* Darkened overlay with cutouts */}
      <rect
        width="100%"
        height="100%"
        mask={`url(#${maskId})`}
        className="fill-black/50"
      />

      {/* Clickable overlay area (outside spotlights) */}
      <rect
        width="100%"
        height="100%"
        className="fill-transparent pointer-events-auto cursor-pointer"
        onClick={onOverlayClick}
      />

      {/* Transparent clickable areas over each spotlight (allows interaction) */}
      {highlights.map((rect, index) => (
        <rect
          key={`click-${index}`}
          x={rect.left - padding}
          y={rect.top - padding}
          width={rect.width + padding * 2}
          height={rect.height + padding * 2}
          rx={borderRadius}
          className="fill-transparent pointer-events-auto"
        />
      ))}

      {/* Spotlight borders */}
      {highlights.map((rect, index) => (
        <rect
          key={`border-${index}`}
          x={rect.left - padding}
          y={rect.top - padding}
          width={rect.width + padding * 2}
          height={rect.height + padding * 2}
          rx={borderRadius}
          className="fill-none stroke-primary stroke-2"
        />
      ))}
    </svg>
  )
}
```

### 3. TourModal (Video Hero)

```tsx
// tour-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Play, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils'
import { Button } from '../../ui/button'
import { TourProgress } from './tour-progress'
import { getYouTubeEmbedUrl } from './utils/youtube'
import { TourStep } from './types'

interface TourModalProps {
  step: TourStep
  currentIndex: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
  onGoToStep: (index: number) => void
  onSwitchToTooltip?: () => void
}

export function TourModal({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  onGoToStep,
  onSwitchToTooltip,
}: TourModalProps) {
  const [isWatchingTutorial, setIsWatchingTutorial] = useState(false)

  // Reset video state when step changes
  useEffect(() => {
    setIsWatchingTutorial(false)
  }, [step.id])

  const hasPreviewVideo = !!step.previewVideo
  const hasTutorialVideo = !!step.tutorialVideo
  const hasAnyVideo = hasPreviewVideo || hasTutorialVideo

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className={cn(
          'w-[680px] max-w-[92vw] overflow-hidden rounded-[22px] bg-white',
          'shadow-[0_22px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]'
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            'absolute left-3 top-3 z-[70] inline-flex h-8 w-8 items-center justify-center',
            'rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700',
            'transition-colors'
          )}
        >
          <X size={18} />
        </button>

        {/* Video Hero Section */}
        {hasAnyVideo && (
          <div className="relative h-[360px] w-full overflow-hidden bg-neutral-100">
            {!isWatchingTutorial && hasPreviewVideo ? (
              <>
                <iframe
                  src={getYouTubeEmbedUrl(step.previewVideo!, { autoplay: true, loop: true, muted: true, controls: false })}
                  className="absolute inset-0 h-full w-full scale-[1.2]"
                  style={{ pointerEvents: 'none' }}
                  allow="autoplay; encrypted-media"
                  frameBorder="0"
                />
                {hasTutorialVideo && (
                  <button
                    onClick={() => setIsWatchingTutorial(true)}
                    className={cn(
                      'absolute bottom-20 left-1/2 z-20 -translate-x-1/2',
                      'flex items-center gap-2 rounded-full px-4 py-2',
                      'bg-black/70 text-white backdrop-blur-sm',
                      'hover:bg-black/80 transition-colors'
                    )}
                  >
                    <Play className="h-4 w-4" />
                    Watch Tutorial
                  </button>
                )}
              </>
            ) : hasTutorialVideo ? (
              <>
                <iframe
                  src={getYouTubeEmbedUrl(step.tutorialVideo!, { autoplay: true, controls: true })}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  frameBorder="0"
                />
                {hasPreviewVideo && (
                  <button
                    onClick={() => setIsWatchingTutorial(false)}
                    className={cn(
                      'absolute right-4 top-4 z-20',
                      'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm',
                      'bg-black/70 text-white backdrop-blur-sm',
                      'hover:bg-black/80 transition-colors'
                    )}
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Preview
                  </button>
                )}
              </>
            ) : null}

            {/* White gradient scrim */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] z-10"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, white 100%)',
              }}
            />
          </div>
        )}

        {/* Content Section */}
        <div className={cn('px-6 pt-4 pb-2 text-center', !hasAnyVideo && 'pt-12')}>
          <h2 className="text-2xl font-bold text-neutral-900">{step.title}</h2>
          {step.subtitle && (
            <p className="mt-2 text-base text-neutral-600">{step.subtitle}</p>
          )}
          {step.content && (
            <div className="mt-4 text-sm text-neutral-500">{step.content}</div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-6 pb-6 pt-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <div className="w-24">
              {currentIndex > 0 && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>

            {/* Progress Dots */}
            <TourProgress
              current={currentIndex}
              total={totalSteps}
              onDotClick={onGoToStep}
            />

            {/* Next Button */}
            <div className="w-24 flex justify-end">
              <Button size="sm" onClick={onNext}>
                {currentIndex === totalSteps - 1 ? 'Done' : 'Next'}
                {currentIndex < totalSteps - 1 && (
                  <ChevronRight className="ml-1 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Switch to Tooltip Link */}
          {onSwitchToTooltip && (
            <button
              onClick={onSwitchToTooltip}
              className="mt-3 w-full text-center text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Switch to tooltip view
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 4. TourTooltip (Radix Popover)

```tsx
// tour-tooltip.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { X, ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { cn } from '../../utils'
import { Button } from '../../ui/button'
import { TourProgress } from './tour-progress'
import { TourStep } from './types'

interface TourTooltipProps {
  step: TourStep
  currentIndex: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
  onGoToStep: (index: number) => void
  onSwitchToModal?: () => void
}

export function TourTooltip({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  onGoToStep,
  onSwitchToModal,
}: TourTooltipProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updatePosition = () => {
      const element = document.querySelector(step.selector)
      if (element) {
        setTargetRect(element.getBoundingClientRect())
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [step.selector])

  if (!targetRect) return null

  const hasVideo = step.previewVideo || step.tutorialVideo

  return (
    <Popover.Root open>
      <Popover.Anchor
        ref={anchorRef}
        style={{
          position: 'fixed',
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + 8,
          width: 0,
          height: 0,
        }}
      />
      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-[9999] w-[320px] rounded-xl bg-white p-4',
            'shadow-[0_10px_40px_rgba(0,0,0,0.15)]',
            'animate-in fade-in-0 zoom-in-95'
          )}
          sideOffset={8}
          collisionPadding={16}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={cn(
              'absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center',
              'rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600',
              'transition-colors'
            )}
          >
            <X size={14} />
          </button>

          {/* Content */}
          <div className="pr-6">
            <h3 className="font-semibold text-neutral-900">{step.title}</h3>
            {step.subtitle && (
              <p className="mt-1 text-sm text-neutral-600">{step.subtitle}</p>
            )}
            {step.content && (
              <div className="mt-2 text-xs text-neutral-500">{step.content}</div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            {/* Back Button */}
            <div className="w-16">
              {currentIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={onPrev} className="h-7 px-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress Dots */}
            <TourProgress
              current={currentIndex}
              total={totalSteps}
              onDotClick={onGoToStep}
              size="sm"
            />

            {/* Next Button */}
            <div className="w-16 flex justify-end">
              <Button size="sm" onClick={onNext} className="h-7 px-3">
                {currentIndex === totalSteps - 1 ? 'Done' : 'Next'}
              </Button>
            </div>
          </div>

          {/* Switch to Modal Link */}
          {hasVideo && onSwitchToModal && (
            <button
              onClick={onSwitchToModal}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-1.5',
                'text-xs text-primary hover:text-primary/80 transition-colors'
              )}
            >
              <Video className="h-3 w-3" />
              Watch video tutorial
            </button>
          )}

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
```

### 5. YouTube Helper

```typescript
// utils/youtube.ts

interface YouTubeEmbedOptions {
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

export function getYouTubeEmbedUrl(
  url: string,
  options: YouTubeEmbedOptions = {}
): string {
  const videoId = extractYouTubeId(url)
  if (!videoId) return ''

  const { autoplay = false, loop = false, muted = false, controls = true } = options

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    loop: loop ? '1' : '0',
    controls: controls ? '1' : '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
  })

  // Loop requires playlist parameter
  if (loop) {
    params.set('playlist', videoId)
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}
```

### 6. Progress Dots

```tsx
// tour-progress.tsx
'use client'

import { cn } from '../../utils'

interface TourProgressProps {
  current: number
  total: number
  onDotClick?: (index: number) => void
  size?: 'sm' | 'md'
}

export function TourProgress({
  current,
  total,
  onDotClick,
  size = 'md',
}: TourProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick?.(index)}
          disabled={!onDotClick}
          className={cn(
            'rounded-full transition-all',
            size === 'sm' ? 'h-1.5' : 'h-2',
            index === current
              ? cn('bg-neutral-900', size === 'sm' ? 'w-5' : 'w-6')
              : cn(
                  'bg-neutral-300 hover:bg-neutral-400',
                  size === 'sm' ? 'w-1.5' : 'w-2'
                ),
            onDotClick && 'cursor-pointer'
          )}
        />
      ))}
    </div>
  )
}
```

---

## Usage Example

```tsx
// In WXT extension content script

import { TourProvider, useTour } from '@sassy/ui/components/tour'

const extensionIntroFlow: TourFlow = {
  id: 'extension-intro',
  name: 'Extension Introduction',
  steps: [
    {
      id: 'compose-tab',
      // Multi-highlight: extension tab + LinkedIn feed posts
      selector: ['[data-tour="compose-tab"]', '.feed-shared-update-v2:first-of-type'],
      title: 'Generate AI Comments',
      subtitle: 'Load posts from your feed and let AI craft engaging comments for you.',
      previewVideo: 'https://youtube.com/watch?v=COMPOSE_PREVIEW',
      tutorialVideo: 'https://youtube.com/watch?v=COMPOSE_TUTORIAL',
      preferredView: 'modal',
    },
    {
      id: 'connect-tab',
      // Multi-highlight: extension tab + LinkedIn profile card (if on profile page)
      selector: ['[data-tour="connect-tab"]', '.pv-top-card'],
      title: 'Save & Track Profiles',
      subtitle: 'Build your network by saving profiles and tracking your engagement history.',
      previewVideo: 'https://youtube.com/watch?v=CONNECT_PREVIEW',
      tutorialVideo: 'https://youtube.com/watch?v=CONNECT_TUTORIAL',
      preferredView: 'modal',
    },
    {
      id: 'analytics-tab',
      // Single highlight: just the extension tab
      selector: '[data-tour="analytics-tab"]',
      title: 'View Your Stats',
      subtitle: 'See how many comments you\'ve made, your engagement rate, and more.',
      previewVideo: 'https://youtube.com/watch?v=ANALYTICS_PREVIEW',
      tutorialVideo: 'https://youtube.com/watch?v=ANALYTICS_TUTORIAL',
      preferredView: 'modal',
    },
    {
      id: 'accounts-tab',
      // Single highlight: just the extension tab
      selector: '[data-tour="accounts-tab"]',
      title: 'Manage Your Accounts',
      subtitle: 'Add, switch, or remove LinkedIn accounts connected to the extension.',
      previewVideo: 'https://youtube.com/watch?v=ACCOUNTS_PREVIEW',
      tutorialVideo: 'https://youtube.com/watch?v=ACCOUNTS_TUTORIAL',
      preferredView: 'modal',
    },
  ],
}

function ExtensionApp() {
  return (
    <TourProvider
      flows={[extensionIntroFlow]}
      onTourEnd={(flowId, completed) => {
        console.log(`Tour ${flowId} ended, completed: ${completed}`)
      }}
    >
      <ExtensionContent />
    </TourProvider>
  )
}

// Trigger tour from a "Start Tour" button or help menu
function StartTourButton() {
  const { startTour } = useTour()

  return (
    <button onClick={() => startTour('extension-intro')}>
      Take a Tour
    </button>
  )
}
```

---

## Implementation Checklist

### Phase 1: Core Components (Do First)

- [ ] Create `packages/ui/src/components/tour/` directory structure
- [ ] Implement `types.ts` - TypeScript interfaces
- [ ] Implement `utils/youtube.ts` - YouTube embed helper
- [ ] Implement `tour-progress.tsx` - Progress dots
- [ ] Implement `tour-overlay.tsx` - SVG mask spotlight
- [ ] Implement `tour-modal.tsx` - Video hero modal
- [ ] Implement `tour-tooltip.tsx` - Radix Popover tooltip
- [ ] Implement `tour-context.tsx` - Provider + hook
- [ ] Implement `tour-layer.tsx` - Combines everything
- [ ] Create `index.ts` exports

### Phase 2: Integration (WXT Extension Only)

- [ ] Add `data-tour="compose-tab"` attribute to compose tab element
- [ ] Add `data-tour="connect-tab"` attribute to connect tab element
- [ ] Add `data-tour="analytics-tab"` attribute to analytics tab element
- [ ] Add `data-tour="accounts-tab"` attribute to accounts tab element
- [ ] Create `extension-intro` flow definition (4 steps, one per tab)
- [ ] Test in extension content script environment

### Phase 3: Content Creation

- [ ] Record compose tab preview video (5-10s)
- [ ] Record connect tab preview video (5-10s)
- [ ] Record analytics tab preview video (5-10s)
- [ ] Record accounts tab preview video (5-10s)
- [ ] Record full tutorial videos (optional, can defer)
- [ ] Upload to YouTube
- [ ] Update flow definition with video URLs

---

## Files to Create

```
packages/ui/src/components/tour/
├── index.ts
├── types.ts
├── tour-context.tsx
├── tour-overlay.tsx
├── tour-modal.tsx
├── tour-tooltip.tsx
├── tour-progress.tsx
├── tour-layer.tsx
└── utils/
    └── youtube.ts
```

## Exports to Add

```typescript
// packages/ui/package.json - add to exports
"./components/tour": "./src/components/tour/index.ts"
```

---

## What's Deferred (Full Plan Features)

These features from the v11 plan are NOT in MVP:

1. Learn Mode toggle + localStorage persistence
2. Pulsing hotspots (HoverTrigger)
3. Inactive tooltips on hover
4. Observable system (resize/mutation observers)
5. Cross-route navigation (pending step pattern)
6. Lifecycle states (init/ready/active/error)
7. Full callback system with event types
8. actionTrigger / actionAfter hooks
9. waitForElement / waitForAction
10. interactToNext behavior
11. autoSkipMissing error recovery

These can be added incrementally after MVP is working and content is created.

**Included in MVP (moved from deferred):**
- Multi-element highlighting (array of selectors) ✓
