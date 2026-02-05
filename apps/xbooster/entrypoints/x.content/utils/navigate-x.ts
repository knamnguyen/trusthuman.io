/**
 * Navigate within X.com without reloading the page (SPA navigation).
 * Uses history.pushState + popstate to trigger X's internal router.
 */
export function navigateX(path: string): void {
  let targetPath = path;

  if (path.startsWith("http")) {
    try {
      const url = new URL(path);
      if (!url.hostname.includes("x.com")) {
        window.location.href = path;
        return;
      }
      targetPath = url.pathname + url.search + url.hash;
    } catch {
      console.error("[navigateX] Invalid URL:", path);
      return;
    }
  }

  if (!targetPath.startsWith("/")) {
    targetPath = "/" + targetPath;
  }

  window.history.pushState({}, "", targetPath);
  window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
}
