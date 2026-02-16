/**
 * Feed observer for monitoring LinkedIn comment history feed changes
 */

import { updateMetrics } from "./calculate-metrics";

/**
 * Sets up a MutationObserver to watch for feed changes and update metrics
 */
export function observeFeed(
  countSpan: HTMLElement,
  impressionsSpan: HTMLElement,
  dateSpan: HTMLElement,
): MutationObserver | null {
  const scrollContent = document.querySelector(
    ".scaffold-finite-scroll__content",
  );
  if (!scrollContent) {
    console.log("[LinkedIn Metrics] Scaffold content not found.");
    return null;
  }

  const ul = scrollContent.querySelector("ul");
  if (!ul) {
    console.log("[LinkedIn Metrics] Feed ul not found.");
    return null;
  }

  let debounceTimer: number | null = null;

  function debouncedUpdate() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => {
      updateMetrics(countSpan, impressionsSpan, dateSpan);
    }, 200);
  }

  const observer = new MutationObserver(debouncedUpdate);
  observer.observe(ul, { childList: true, subtree: true });

  // Also watch for scroll events to catch posts loaded by normal scrolling
  let scrollDebounceTimer: number | null = null;

  function handleScroll() {
    if (scrollDebounceTimer) {
      clearTimeout(scrollDebounceTimer);
    }
    scrollDebounceTimer = window.setTimeout(() => {
      updateMetrics(countSpan, impressionsSpan, dateSpan);
    }, 500);
  }

  window.addEventListener("scroll", handleScroll);

  // Store references globally for cleanup if needed
  (window as any).linkedin_metrics_observer = observer;
  (window as any).linkedin_metrics_scroll_handler = handleScroll;

  return observer;
}

/**
 * Disconnects the existing observer if it exists
 */
export function disconnectObserver(): void {
  const observer = (window as any).linkedin_metrics_observer;
  if (observer && observer.disconnect) {
    observer.disconnect();
    delete (window as any).linkedin_metrics_observer;
  }

  const scrollHandler = (window as any).linkedin_metrics_scroll_handler;
  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler);
    delete (window as any).linkedin_metrics_scroll_handler;
  }
}
