/**
 * Instantly hides specific elements when the script loads
 * Targets:
 *  - #gh-navigation
 *  - any element with class containing "gh-footer"
 * 
 * Works even before full DOM render by using <style> injection + early mutation observer fallback
 */
(function() {
  // --- Step 1: Inject CSS instantly (faster than JS DOM removal)
  // This ensures the elements are hidden immediately on paint.
  const style = document.createElement('style');
  style.textContent = `
    #gh-navigation,
    [class*="gh-footer"] {
      display: none !important;
      visibility: hidden !important;
    }
  `;
  document.head.appendChild(style);

  // --- Step 2: Actively remove them from the DOM once available
  // This saves memory and prevents reflows caused by hidden elements.
  function removeTargets() {
    // Select all targets in one query
    document.querySelectorAll('#gh-navigation, [class*="gh-footer"]').forEach(el => {
      el.remove();
    });
  }

  // If DOM already loaded, execute immediately
  if (document.readyState !== 'loading') {
    removeTargets();
  } else {
    // Otherwise wait for DOM ready event
    document.addEventListener('DOMContentLoaded', removeTargets);
  }

  // --- Step 3: Observe future changes (in case SPA client renders later)
  const observer = new MutationObserver(() => {
    removeTargets();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
