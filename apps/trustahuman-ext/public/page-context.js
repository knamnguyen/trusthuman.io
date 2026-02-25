/**
 * Page context script for intercepting navigation events
 * This script is injected into the main world to monitor SPA navigation
 */
(function() {
  if (window.__trustHumanNavWatcher) return;
  window.__trustHumanNavWatcher = true;

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    window.dispatchEvent(new CustomEvent('trusthuman:urlchange'));
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    window.dispatchEvent(new CustomEvent('trusthuman:urlchange'));
  };
})();
