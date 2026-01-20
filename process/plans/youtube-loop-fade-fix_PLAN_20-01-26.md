# YouTube Loop Fade Fix - Plan

**Date:** 20-01-26
**Complexity:** Simple
**Status:** ⏳ PLANNED

## Overview

Fix the visual glitch that occurs when YouTube preview videos loop back to the beginning in the tour modal. When a video reaches the end and restarts, there's a brief dark/black frame that creates a jarring user experience. The solution uses the YouTube IFrame API to detect when the video is near the end, then fades out the iframe to reveal the existing thumbnail background before the black frame appears, creating a seamless loop.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Assumptions and Constraints](#assumptions-and-constraints)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Risks and Mitigations](#risks-and-mitigations)
- [Integration Notes](#integration-notes)

## Goals and Success Metrics

**Goals:**
- Eliminate the black frame glitch when YouTube videos loop
- Create a seamless looping experience using fade transitions
- Maintain YouTube embeds (no self-hosted video) to minimize Chrome extension bundle size
- Preserve existing thumbnail background and fade-in behavior

**Success Metrics:**
- No visible black frames during video loop transitions
- Smooth opacity transitions (fade out 1s before end, fade back in after restart)
- Existing delayed initial fade-in (1000ms) still works correctly
- Works across all tour steps with different videos
- No bundle size increase (external YouTube IFrame API script)
- No console errors or memory leaks

---

## Execution Brief

### Phase 1: YouTube IFrame API Integration
**What happens:** Dynamically load YouTube IFrame API script, set up global callback handler, track API ready state.

**Test:** Console log confirms API loaded, `window.YT` object exists, `onYouTubeIframeAPIReady` callback fires.

### Phase 2: Convert iframe to YT.Player
**What happens:** Replace static `<iframe>` with container div, initialize YT.Player with same embed parameters, preserve existing autoplay/loop/mute settings.

**Test:** Video plays automatically with loop and mute as before, existing 1s initial fade-in works.

### Phase 3: Video Time Tracking
**What happens:** Use YT.Player API to track current time and duration, detect when video is ~1 second from end, trigger fade-out transition.

**Test:** Console logs show time tracking, fade-out triggers 1s before end (opacity goes to 0).

### Phase 4: Loop Restart Detection
**What happens:** Detect when video loops back to beginning (time near 0), trigger fade-in transition to restore opacity.

**Test:** Video fades back in smoothly after restart, loop continues indefinitely with no black frames visible.

### Phase 5: Lifecycle Management
**What happens:** Clean up player on step change, handle multiple tour steps with different videos, prevent memory leaks.

**Test:** Switching tour steps works correctly, no console errors, API listeners properly destroyed, multiple videos work sequentially.

### Expected Outcome
- Seamless video loops with no visible black frames
- Smooth fade transitions at loop point
- Existing initial fade-in behavior preserved
- Clean lifecycle management across step changes
- No bundle size impact (external script)

---

## Scope

**In-Scope:**
- Loading YouTube IFrame API dynamically (external script)
- Converting static iframe to YT.Player API-controlled player
- Tracking video playback time with polling or events
- Triggering fade-out ~1s before video ends
- Triggering fade-in when video restarts (time near 0)
- Cleaning up player instance and listeners on component unmount
- Handling step changes (different videos per tour step)
- Preserving existing 1000ms initial fade-in delay
- Preserving 500ms opacity transition duration
- Maintaining autoplay, loop, mute, minimal UI settings

**Out-of-Scope:**
- Self-hosted video solution (intentionally using YouTube to minimize bundle size)
- Fallback for browsers without JavaScript
- Handling non-looping tutorial videos (only preview videos need this fix)
- Error handling for network failures (API load failures)
- Progress bar or manual video controls
- Mobile-specific optimizations beyond existing responsive design
- Alternative video players or libraries

## Assumptions and Constraints

**Assumptions:**
- YouTube IFrame API is reliable and available via CDN
- Browser supports YouTube embeds (Chrome extension context)
- Videos are short enough that 1-second fade window is sufficient
- Existing thumbnail background is correctly positioned and scaled
- `window.YT` global is acceptable pattern for external API
- Component lifecycle (mount/unmount) works as expected in React
- Polling interval (250ms) is acceptable for time tracking performance

**Constraints:**
- Must not increase Chrome extension bundle size (external script only)
- Must preserve existing autoplay, loop, mute, minimal UI behavior
- Must maintain 1000ms initial fade-in delay
- Must use 500ms fade transition duration
- Must work with existing `scale-150` CSS transform on iframe
- Must handle rapid step changes without errors
- Cannot modify YouTube embed URL structure significantly (minimal parameter changes)
- Must use TypeScript for type safety

## Functional Requirements

### 1. YouTube IFrame API Loading
- Dynamically inject `<script>` tag for YouTube IFrame API
- URL: `https://www.youtube.com/iframe_api`
- Set up global `window.onYouTubeIframeAPIReady` callback
- Track API ready state with React state or ref
- Only load script once per page (singleton pattern)
- Handle script already loaded case (check `window.YT`)

### 2. YT.Player Initialization
- Replace static `<iframe>` with `<div>` container
- Initialize `YT.Player` with videoId extracted from URL
- Pass all existing embed parameters as `playerVars`:
  - `autoplay: 1`
  - `loop: 1`
  - `mute: 1`
  - `controls: 0`
  - `modestbranding: 1`
  - `rel: 0`
  - `playsinline: 1`
  - `iv_load_policy: 3`
  - `playlist: [videoId]` (required for looping)
  - All other minimal mode parameters from `getYouTubeEmbedUrl`
- Store player instance in React ref
- Apply same CSS classes: `absolute inset-0 h-full w-full scale-150 transition-opacity duration-500`
- Preserve initial opacity state (0, then 1 after 1000ms delay)

### 3. Video Time Tracking
- Use `setInterval` to poll `player.getCurrentTime()` and `player.getDuration()` every 250ms
- Alternative: Use `onStateChange` event to detect playing state, then start polling
- Calculate time remaining: `duration - currentTime`
- When time remaining <= 1.0 second, trigger fade-out
- Set opacity to 0 via React state update
- CSS transition handles smooth fade (existing 500ms duration)

### 4. Loop Restart Detection
- Continue polling after fade-out
- When `currentTime < 1.0` (video has looped back to start), trigger fade-in
- Set opacity to 1 via React state update
- CSS transition handles smooth fade back in
- Reset state to allow next loop cycle

### 5. Lifecycle Management
- Clear interval/polling on component unmount
- Destroy `player.destroy()` on unmount
- Clear interval/polling on step change (new video)
- Destroy old player before creating new one
- Reset opacity state on step change
- Preserve existing 1000ms initial fade-in delay on step change
- Remove global callback if needed (optional cleanup)

### 6. State Management
- Track API ready state: `apiReady` (boolean or ref)
- Track player instance: `playerRef` (React ref)
- Track video opacity: `showPreviewVideo` (existing state, reuse)
- Track fade state: `isVideoFadedOut` (new state, optional for debugging)
- Track polling interval: `intervalRef` (React ref for cleanup)

## Non-Functional Requirements

- **Performance:** Polling every 250ms should not impact UI responsiveness
- **Bundle Size:** Zero bundle impact (external script only)
- **Memory Management:** No memory leaks from event listeners or intervals
- **Browser Compatibility:** Works in Chrome (primary target for extension)
- **Code Quality:** Clean, maintainable, well-commented TypeScript
- **Type Safety:** Proper TypeScript types for YouTube IFrame API
- **Error Handling:** Graceful degradation if API fails to load (show static iframe)
- **User Experience:** Transitions feel natural and seamless

## Acceptance Criteria

1. ✅ YouTube IFrame API loads dynamically without bundle size increase
2. ✅ YT.Player initializes correctly with all existing embed settings
3. ✅ Existing 1000ms initial fade-in delay still works on first load
4. ✅ Video plays automatically with loop and mute
5. ✅ Fade-out triggers ~1 second before video ends (opacity goes to 0)
6. ✅ Fade-in triggers when video restarts (opacity goes to 1)
7. ✅ No visible black frames during loop transition
8. ✅ Transition is smooth (500ms duration) and feels natural
9. ✅ Thumbnail background remains visible during fade-out
10. ✅ Switching tour steps works correctly (old player destroyed, new player created)
11. ✅ Multiple tour steps with different videos all work correctly
12. ✅ No console errors or warnings
13. ✅ No memory leaks (intervals cleared, players destroyed)
14. ✅ TypeScript compiles without errors
15. ✅ Existing tutorial video behavior unchanged (only preview videos affected)

## Implementation Checklist

### 1. Add YouTube IFrame API Type Definitions
**File:** `packages/ui/src/components/tour/types.ts` (or create new `youtube-player.d.ts`)
- Add TypeScript definitions for `window.YT` object
- Define `YT.Player` class interface with constructor signature
- Define `playerVars` interface with all embed parameters
- Define `player.getCurrentTime()`, `player.getDuration()`, `player.destroy()` methods
- Define `onReady`, `onStateChange` event interfaces
- Export types for use in tour-modal.tsx

**Example structure:**
```typescript
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YT {
  Player: new (
    elementId: string | HTMLElement,
    config: YT.PlayerOptions
  ) => YT.Player;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

namespace YT {
  interface Player {
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
    playVideo(): void;
    pauseVideo(): void;
    getPlayerState(): number;
  }

  interface PlayerOptions {
    videoId: string;
    playerVars?: PlayerVars;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: PlayerEvent) => void;
    };
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    loop?: 0 | 1;
    mute?: 0 | 1;
    controls?: 0 | 1;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
    playsinline?: 0 | 1;
    iv_load_policy?: 1 | 3;
    playlist?: string;
    [key: string]: any;
  }

  interface PlayerEvent {
    target: Player;
    data: number;
  }
}
```

### 2. Update youtube.ts Utility Functions
**File:** `packages/ui/src/components/tour/utils/youtube.ts`
- Add function to build `playerVars` object from existing `YouTubeEmbedOptions`
- Function signature: `getYouTubePlayerVars(options: YouTubeEmbedOptions): YT.PlayerVars`
- Convert boolean options to 0/1 for YouTube API
- Include playlist parameter for looping: `playlist: videoId`
- Return object ready for YT.Player constructor
- Keep existing `getYouTubeEmbedUrl` for fallback or tutorial videos

**Example implementation:**
```typescript
export function getYouTubePlayerVars(
  videoId: string,
  options: YouTubeEmbedOptions = {}
): YT.PlayerVars {
  const {
    autoplay = false,
    loop = false,
    muted = false,
    controls = true,
    minimal = false,
  } = options;

  const playerVars: YT.PlayerVars = {
    autoplay: autoplay ? 1 : 0,
    mute: muted ? 1 : 0,
    loop: loop ? 1 : 0,
    controls: controls ? 1 : 0,
    modestbranding: 1,
    rel: 0,
    playsinline: 1,
    iv_load_policy: 3,
    playlist: loop ? videoId : undefined, // Required for looping
  };

  if (minimal) {
    playerVars.showinfo = 0;
    playerVars.fs = 0;
    playerVars.disablekb = 1;
    playerVars.cc_load_policy = 0;
    playerVars.color = "white";
  }

  return playerVars;
}
```

### 3. Create useYouTubePlayer Custom Hook
**File:** `packages/ui/src/components/tour/hooks/use-youtube-player.ts` (create new file)
- Create custom React hook to manage YouTube IFrame API lifecycle
- Hook signature: `useYouTubePlayer(videoId: string | null, containerRef: RefObject<HTMLDivElement>, options: YouTubeEmbedOptions)`
- Return: `{ isReady: boolean, player: YT.Player | null }`
- Load YouTube IFrame API script on mount (singleton pattern)
- Set up `window.onYouTubeIframeAPIReady` callback
- Track API ready state with React state
- Initialize YT.Player when API ready and containerRef populated
- Store player instance in ref
- Clean up player on unmount or videoId change
- Handle script already loaded case (`window.YT` exists)

**Key logic:**
- Check `window.YT` on mount
- If not loaded, inject script and set up callback
- When API ready, create player with `containerRef.current` as target
- Use `videoId` and `playerVars` from utility function
- Clear player on cleanup

### 4. Create useVideoLoopFade Custom Hook
**File:** `packages/ui/src/components/tour/hooks/use-video-loop-fade.ts` (create new file)
- Create custom React hook to manage fade-in/fade-out logic
- Hook signature: `useVideoLoopFade(player: YT.Player | null, enabled: boolean)`
- Return: `{ videoOpacity: number }` (0 to 1)
- Set up interval to poll `player.getCurrentTime()` and `player.getDuration()` every 250ms
- Track internal state: `isFadedOut` (boolean) and `opacity` (number)
- When `duration - currentTime <= 1.0` and not already faded, fade out (set opacity to 0)
- When `currentTime < 1.0` and currently faded, fade in (set opacity to 1)
- Clear interval on unmount or when player changes
- Only run when `enabled` is true (so tutorial videos are unaffected)

**Key logic:**
```typescript
const FADE_TRIGGER_THRESHOLD = 1.0; // seconds before end
const RESTART_THRESHOLD = 1.0; // seconds from start
const POLLING_INTERVAL = 250; // ms

useEffect(() => {
  if (!player || !enabled) return;

  const interval = setInterval(() => {
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();

    if (duration > 0) {
      const timeRemaining = duration - currentTime;

      // Fade out near end
      if (timeRemaining <= FADE_TRIGGER_THRESHOLD && !isFadedOut) {
        setOpacity(0);
        setIsFadedOut(true);
      }

      // Fade in after restart
      if (currentTime < RESTART_THRESHOLD && isFadedOut) {
        setOpacity(1);
        setIsFadedOut(false);
      }
    }
  }, POLLING_INTERVAL);

  return () => clearInterval(interval);
}, [player, enabled, isFadedOut]);
```

### 5. Update TourModal Component - Add Refs and State
**File:** `packages/ui/src/components/tour/tour-modal.tsx`
- Import new custom hooks: `useYouTubePlayer`, `useVideoLoopFade`
- Import type definitions for YT.Player
- Create ref for player container: `const playerContainerRef = useRef<HTMLDivElement>(null)`
- Add state for player opacity (separate from initial fade): `const [playerOpacity, setPlayerOpacity] = useState(1)`
- Keep existing `showPreviewVideo` state for initial fade-in delay
- Combine both opacities in inline style: `opacity: showPreviewVideo ? playerOpacity : 0`

### 6. Update TourModal Component - Integrate useYouTubePlayer Hook
**File:** `packages/ui/src/components/tour/tour-modal.tsx`
- Extract videoId from `step.previewVideo` using `extractYouTubeId()`
- Call `useYouTubePlayer` hook with videoId, containerRef, and options
- Pass options: `{ autoplay: true, loop: true, muted: true, controls: false, minimal: true }`
- Store returned `player` and `isReady` from hook

**Example:**
```typescript
const previewVideoId = step.previewVideo ? extractYouTubeId(step.previewVideo) : null;
const { player, isReady } = useYouTubePlayer(
  previewVideoId,
  playerContainerRef,
  {
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
    minimal: true,
  }
);
```

### 7. Update TourModal Component - Integrate useVideoLoopFade Hook
**File:** `packages/ui/src/components/tour/tour-modal.tsx`
- Call `useVideoLoopFade` hook with player instance
- Only enable for preview videos (not tutorial): `enabled: !isWatchingTutorial && hasPreviewVideo`
- Store returned `videoOpacity` value
- Use `videoOpacity` in component render logic

**Example:**
```typescript
const { videoOpacity } = useVideoLoopFade(player, !isWatchingTutorial && hasPreviewVideo);
```

### 8. Update TourModal Component - Replace iframe with Player Container
**File:** `packages/ui/src/components/tour/tour-modal.tsx`
- Find current preview video `<iframe>` (lines 113-128)
- Replace with `<div>` container for YT.Player
- Add `ref={playerContainerRef}` to container div
- Keep same CSS classes: `absolute inset-0 h-full w-full scale-150 transition-opacity duration-500`
- Combine opacities in inline style: `style={{ opacity: showPreviewVideo ? videoOpacity : 0, pointerEvents: "none" }}`
- Remove `src` attribute (YT.Player manages this)
- Keep `allow` attributes on parent container for compatibility

**Before:**
```tsx
<iframe
  src={getYouTubeEmbedUrl(step.previewVideo!, { ... })}
  className={cn(
    "absolute inset-0 h-full w-full scale-150 transition-opacity duration-500",
    showPreviewVideo ? "opacity-100" : "opacity-0",
  )}
  style={{ pointerEvents: "none" }}
  allow="autoplay; encrypted-media"
  title={`${step.title} preview`}
/>
```

**After:**
```tsx
<div
  ref={playerContainerRef}
  className="absolute inset-0 h-full w-full scale-150 transition-opacity duration-500"
  style={{
    opacity: showPreviewVideo ? videoOpacity : 0,
    pointerEvents: "none"
  }}
  title={`${step.title} preview`}
/>
```

### 9. Update TourModal Component - Preserve Initial Fade-In Delay
**File:** `packages/ui/src/components/tour/tour-modal.tsx`
- Keep existing `useEffect` that sets `showPreviewVideo` to true after 1000ms (lines 52-63)
- This controls the initial opacity from 0 to 1 on step load
- `videoOpacity` from hook only controls loop fade transitions
- Combined opacity calculation: `showPreviewVideo ? videoOpacity : 0` ensures initial delay works

**Existing code (keep as-is):**
```typescript
useEffect(() => {
  setIsWatchingTutorial(false);
  setShowPreviewVideo(false);

  const timer = setTimeout(() => {
    setShowPreviewVideo(true);
  }, 1000);

  return () => clearTimeout(timer);
}, [step.id]);
```

### 10. Test Single Video Loop Transitions
**Manual Test:**
- Run dev server: `pnpm dev`
- Open tour modal with a short preview video (< 30 seconds for faster testing)
- Observe initial fade-in after 1000ms (existing behavior)
- Wait for video to approach end (~1s remaining)
- Verify fade-out occurs smoothly (opacity 0)
- Verify thumbnail background remains visible during fade-out
- Verify fade-in occurs after video restarts (opacity 1)
- Check console for any errors
- Verify no black frames visible at any point

### 11. Test Multiple Tour Steps with Different Videos
**Manual Test:**
- Navigate through multiple tour steps (Next button)
- Verify each new video initializes correctly
- Verify old player is destroyed (no memory leaks)
- Verify fade logic works for each video
- Check console for errors during step transitions
- Verify no lingering intervals or event listeners

### 12. Test Tutorial Video Behavior (Unchanged)
**Manual Test:**
- Click "Watch Tutorial" button on a step with tutorial video
- Verify tutorial video plays normally (no fade logic applied)
- Verify controls are visible and functional
- Switch back to preview video
- Verify preview video resumes with fade logic active
- Confirm tutorial videos are unaffected by changes

### 13. Add Error Handling and Fallback
**File:** `packages/ui/src/components/tour/hooks/use-youtube-player.ts`
- Add error handling for API load failure
- Add timeout for API load (e.g., 10 seconds)
- If API fails to load, log error and return null player
- Component should gracefully show static iframe as fallback
- Update TourModal to show static iframe if player is null after timeout

**Fallback logic in TourModal:**
```typescript
// If player fails to initialize after timeout, show static iframe
const showStaticFallback = !isReady && hasPreviewVideo;

{showStaticFallback && (
  <iframe
    src={getYouTubeEmbedUrl(step.previewVideo!, { ... })}
    className="absolute inset-0 h-full w-full scale-150"
    style={{ pointerEvents: "none" }}
    allow="autoplay; encrypted-media"
    title={`${step.title} preview`}
  />
)}
```

### 14. TypeScript Compilation and Type Safety Check
**Command:** `pnpm typecheck` (or `pnpm build`)
- Verify no TypeScript errors in tour-modal.tsx
- Verify no TypeScript errors in custom hooks
- Verify YouTube API types are correctly defined
- Fix any type errors related to YT.Player or refs
- Ensure strict null checks pass

### 15. Code Review and Cleanup
- Review all changes for code quality
- Add comments explaining fade logic and timing thresholds
- Ensure consistent naming conventions
- Remove any debug console.logs
- Verify all imports are used and necessary
- Check for unused state or refs
- Ensure no duplicate logic exists

### 16. Final Cross-Browser Testing
**Test in Chrome:**
- Full workflow from step 1 to completion
- Verify all videos loop seamlessly
- Check for console errors or warnings
- Verify no memory leaks (Chrome DevTools Memory profiler)
- Test rapid step changes (Next, Back, Next)
- Verify thumbnail backgrounds load correctly

### 17. Documentation and Commit
- Add inline comments explaining fade timing logic
- Document the fade threshold constants (1.0s before end, 1.0s after start)
- Document polling interval (250ms)
- Update any relevant component documentation
- Prepare commit message describing the fix and approach

## Risks and Mitigations

**Risk 1:** YouTube IFrame API fails to load (network issue, CDN down)
- **Mitigation:** Implement timeout and fallback to static iframe with native loop (accept black frame glitch as fallback)

**Risk 2:** Polling interval (250ms) impacts performance
- **Mitigation:** Test performance with Chrome DevTools, adjust interval if needed (can increase to 500ms if 250ms is too aggressive)

**Risk 3:** Fade timing is off (too early or too late)
- **Mitigation:** Make fade threshold configurable (currently 1.0s), test with different video lengths, adjust based on testing

**Risk 4:** Memory leaks from player instances or intervals
- **Mitigation:** Strict cleanup in useEffect return functions, test with React DevTools Profiler, verify player.destroy() is called

**Risk 5:** Race conditions during rapid step changes
- **Mitigation:** Ensure old player is destroyed before new one is created, use proper dependency arrays in useEffect, test rapid navigation

**Risk 6:** TypeScript types for YouTube API are incomplete or incorrect
- **Mitigation:** Reference official YouTube IFrame API documentation, test types at runtime, use `any` as escape hatch if needed (with comment)

**Risk 7:** Fade transitions feel unnatural or jarring
- **Mitigation:** Test with different transition durations (currently 500ms), consider easing functions, gather user feedback

## Integration Notes

### YouTube IFrame API
- Loaded via external script: `https://www.youtube.com/iframe_api`
- Script adds `window.YT` global object
- Must define `window.onYouTubeIframeAPIReady` callback before script loads
- Use singleton pattern to avoid loading script multiple times
- API is asynchronous, requires callback-based initialization

### YT.Player Constructor
- First argument: string (element ID) or HTMLElement (direct DOM reference)
- Second argument: config object with `videoId`, `playerVars`, and `events`
- Player methods: `getCurrentTime()`, `getDuration()`, `destroy()`, `playVideo()`, `pauseVideo()`
- Player state: Use `getPlayerState()` to check if playing, paused, ended, etc.

### React Integration
- Use refs for player instance (mutable, doesn't trigger re-renders)
- Use state for opacity (triggers re-render for CSS transition)
- Use `useEffect` with proper cleanup for intervals and player lifecycle
- Avoid storing player in state (unnecessary re-renders)

### CSS Transitions
- Existing `transition-opacity duration-500` handles smooth fade
- Opacity changes trigger CSS transition automatically
- No need for additional animation libraries
- `scale-150` transform is independent of opacity transitions

### Thumbnail Background
- Already exists in current implementation (lines 101-108)
- Scaled 1.5x to match video scale
- Remains visible when video opacity is 0
- No changes needed to thumbnail logic

### Tutorial Videos
- Should remain unchanged (no fade logic)
- Use static iframe with full controls
- Only preview videos use YT.Player with fade logic
- Conditional logic based on `isWatchingTutorial` state

## Additional Notes

### Why This Approach?
1. **No Bundle Size Impact:** External script means zero bytes added to Chrome extension
2. **Seamless Loops:** Fade transitions hide the black frame completely
3. **Preserves Existing UX:** Initial fade-in delay and thumbnail background unchanged
4. **Clean Architecture:** Custom hooks separate concerns (API management, fade logic)
5. **Type Safe:** TypeScript types ensure correct API usage
6. **Maintainable:** Well-documented, modular code that's easy to debug

### Alternative Approaches Considered
1. **Self-hosted video:** Rejected due to bundle size concerns for Chrome extension
2. **Video preloading:** Doesn't solve black frame issue at loop point
3. **Multiple overlapping videos:** Complex, performance issues, sync problems
4. **CSS-only solution:** No access to video timing information without API
5. **Third-party player library:** Adds bundle size, unnecessary abstraction

### Performance Considerations
- Polling every 250ms is ~4 checks per second (very lightweight)
- `getCurrentTime()` and `getDuration()` are synchronous, non-blocking
- YT.Player is optimized by YouTube for performance
- Only one interval runs per active preview video
- Interval cleared immediately on step change or unmount

### Future Enhancements (Out of Scope)
- Configurable fade timing per video
- Fade duration based on video length
- Smooth seeking instead of hard loop restart
- Analytics tracking for video engagement
- Accessible video controls option
- Video quality selection

---

**Next Step:** Review this plan carefully. When ready, say "ENTER EXECUTE MODE" to begin implementation.
