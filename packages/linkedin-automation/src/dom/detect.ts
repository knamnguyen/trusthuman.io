/**
 * LinkedIn DOM Version Detection
 *
 * - dom-v1: Legacy DOM (forms, data-urn, old selectors)
 * - dom-v2: New React SSR + SDUI architecture (2024+)
 *
 * Detection uses framework-level markers:
 * - data-rehydrated: React SSR hydration
 * - data-strictmode: React StrictMode
 * - data-sdui-screen: Server-Driven UI
 */

export type DomVersion = "dom-v1" | "dom-v2";

let cachedVersion: DomVersion | null = null;
let lastUrl: string | null = null;

/**
 * Detect DOM version. Cached until URL changes.
 * @param debug - Log detection info to console
 */
export function detectDomVersion(debug = false): DomVersion {
  const currentUrl = window.location.href;

  // Return cached if URL hasn't changed
  if (cachedVersion && lastUrl === currentUrl) {
    if (debug) logDetection(cachedVersion, true);
    return cachedVersion;
  }

  // Check framework markers (this might not be there if dom is not rehydrated yet)
  const hasRehydrated = document.body?.hasAttribute("data-rehydrated");
  // So we fallback to check if there's a root div
  // :scope to limit to direct children of body, so we dont need to traverse entire DOM
  const hasStrictMode = !!document.body.querySelector(":scope > #root");

  const isV2 = hasRehydrated || hasStrictMode;
  cachedVersion = isV2 ? "dom-v2" : "dom-v1";
  lastUrl = currentUrl;

  if (debug) {
    logDetection(cachedVersion, false, {
      hasRehydrated,
      hasStrictMode,
    });
  }

  return cachedVersion;
}

function logDetection(
  version: DomVersion,
  fromCache: boolean,
  markers?: {
    hasRehydrated: boolean;
    hasStrictMode: boolean;
  },
) {
  console.log(
    `[linkedin-dom] ${version}${fromCache ? " (cached)" : ""}`,
    markers ?? "",
    window.location.pathname,
  );
}

/**
 * Force re-detection
 */
export function redetectDomVersion(debug = false): DomVersion {
  cachedVersion = null;
  lastUrl = null;
  return detectDomVersion(debug);
}

/**
 * Subscribe to DOM version changes on navigation.
 * @param callback - Called with version on change
 * @param debug - Log detection info
 * @returns Cleanup function
 */
export function onDomVersionChange(
  callback: (version: DomVersion) => void,
  debug = false,
): () => void {
  let lastDetectedVersion = detectDomVersion(debug);
  callback(lastDetectedVersion);

  const checkVersion = () => {
    const newVersion = redetectDomVersion(debug);
    if (newVersion !== lastDetectedVersion) {
      lastDetectedVersion = newVersion;
      callback(newVersion);
    }
  };

  // Listen to navigation
  window.addEventListener("popstate", checkVersion);

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(checkVersion, 100);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(checkVersion, 100);
  };

  return () => {
    window.removeEventListener("popstate", checkVersion);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
}
