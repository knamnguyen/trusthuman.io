/**
 * Check Human Store
 *
 * Prefetches profile data when on a profile page (LinkedIn, X, or Facebook).
 * Data is ready instantly when sidebar opens.
 */

import { create } from "zustand";
import { trpc } from "@/lib/trpc-client";

// Standardized activity type (same as profile page)
interface StandardizedActivity {
  id: string;
  type: "linkedin" | "x" | "facebook" | "threads" | "reddit" | "ph" | "github" | "hn";
  commentText: string;
  commentUrl: string | null;
  parentUrl: string | null;
  parentAuthorName: string;
  parentAuthorAvatarUrl: string;
  parentTextSnippet: string;
  verified: boolean;
  activityAt: Date | string;
  createdAt: Date | string;
}

interface TrustProfile {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  humanNumber: number;
  totalVerifications: number;
  currentStreak: number;
  longestStreak: number;
  rank?: number;
  recentActivities: StandardizedActivity[];
}

interface LookupResult {
  found: boolean;
  trustProfile?: TrustProfile;
}

type SupportedPlatform = "linkedin" | "x" | "facebook";

interface CheckHumanStore {
  // Current detected profile
  detectedProfile: { platform: SupportedPlatform; profileUrl: string } | null;
  // Lookup result (prefetched)
  result: LookupResult | null;
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
  // Actions
  setDetectedProfile: (profile: { platform: SupportedPlatform; profileUrl: string } | null) => void;
  fetchProfile: (profile: { platform: SupportedPlatform; profileUrl: string }) => Promise<void>;
  clearResult: () => void;
}

export const useCheckHumanStore = create<CheckHumanStore>((set, get) => ({
  detectedProfile: null,
  result: null,
  isLoading: false,
  error: null,

  setDetectedProfile: (profile) => set({ detectedProfile: profile }),

  fetchProfile: async (profile) => {
    set({ isLoading: true, error: null });

    try {
      const lookupResult = await trpc.platformLink.lookupFullProfile.query({
        platform: profile.platform,
        profileUrl: profile.profileUrl,
      });

      if (lookupResult.found) {
        // Type assertion - API returns standardized format
        const trustProfile = lookupResult.trustProfile as unknown as TrustProfile;
        set({
          result: {
            found: true,
            trustProfile,
          },
          isLoading: false,
        });
      } else {
        set({ result: { found: false }, isLoading: false });
      }
    } catch (err) {
      console.error("TrustHuman: Profile lookup failed", err);
      set({ error: "Failed to check profile", isLoading: false });
    }
  },

  clearResult: () => set({ result: null, error: null }),
}));

/**
 * Detect if we're on a profile page and extract the URL
 */
export function detectCurrentProfileUrl(): { platform: SupportedPlatform; profileUrl: string } | null {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // LinkedIn profile: linkedin.com/in/username
  if (hostname.includes("linkedin.com") && pathname.startsWith("/in/")) {
    const match = pathname.match(/^\/in\/([^/?]+)/);
    if (match) {
      return {
        platform: "linkedin",
        profileUrl: `linkedin.com/in/${match[1]}`,
      };
    }
  }

  // X/Twitter profile: x.com/username or twitter.com/username
  if (hostname.includes("x.com") || hostname.includes("twitter.com")) {
    // Exclude special pages
    const specialPaths = ["/home", "/explore", "/notifications", "/messages", "/settings", "/i/", "/search", "/compose"];
    if (!specialPaths.some((p) => pathname.startsWith(p)) && pathname.length > 1) {
      const match = pathname.match(/^\/([^/?]+)/);
      if (match?.[1] && !match[1].startsWith("@")) {
        return {
          platform: "x",
          profileUrl: `x.com/${match[1]}`,
        };
      }
    }
  }

  // Facebook profile: facebook.com/username (excluding special pages)
  if (hostname.includes("facebook.com")) {
    // Exclude special pages and paths
    const specialPaths = ["/home.php", "/login", "/logout", "/recover", "/help", "/pages", "/groups", "/events", "/marketplace", "/watch", "/gaming", "/settings", "/notifications", "/messages", "/bookmarks", "/saved", "/search"];
    if (!specialPaths.some((p) => pathname.startsWith(p)) && pathname.length > 1) {
      // Match profile paths like /john.doe or /profile.php?id=123
      const match = pathname.match(/^\/([a-zA-Z0-9.]+)/);
      if (match?.[1] && !match[1].includes(".php")) {
        // Facebook stores URLs with https://www.facebook.com/ prefix
        return {
          platform: "facebook",
          profileUrl: `https://www.facebook.com/${match[1]}`,
        };
      }
    }
  }

  return null;
}

// Track if already initialized to prevent duplicate listeners
let isInitialized = false;
let urlCheckInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Handle URL changes - check for profile page and prefetch
 */
function handleUrlChange() {
  const newDetected = detectCurrentProfileUrl();
  const currentDetected = useCheckHumanStore.getState().detectedProfile;

  // Check if profile changed (handle null cases properly)
  const profileChanged =
    newDetected?.profileUrl !== currentDetected?.profileUrl ||
    newDetected?.platform !== currentDetected?.platform;

  if (profileChanged) {
    console.log("TrustHuman: Profile changed:", { from: currentDetected, to: newDetected });
    useCheckHumanStore.getState().setDetectedProfile(newDetected);
    useCheckHumanStore.getState().clearResult();

    if (newDetected) {
      useCheckHumanStore.getState().fetchProfile(newDetected);
    }
  }
}

/**
 * Initialize Check Human store - call from content script.
 * Auto-detects profile and prefetches data.
 */
export function initCheckHumanStore() {
  // Prevent duplicate initialization
  if (isInitialized) {
    console.log("TrustHuman: Check Human store already initialized, skipping");
    return;
  }
  isInitialized = true;

  // Initial detection
  const detected = detectCurrentProfileUrl();
  const store = useCheckHumanStore.getState();

  if (detected) {
    console.log("TrustHuman: Profile page detected on init, prefetching:", detected);
    store.setDetectedProfile(detected);
    store.fetchProfile(detected);
  }

  // Listen for popstate (back/forward navigation)
  window.addEventListener("popstate", () => {
    console.log("TrustHuman: popstate event");
    setTimeout(handleUrlChange, 100);
  });

  // Inject script into page context to intercept pushState/replaceState
  // Content scripts run in isolated world, so we need to inject into main world
  const script = document.createElement("script");
  script.textContent = `
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
  `;
  document.documentElement.appendChild(script);
  script.remove();

  // Listen for our custom event from the injected script
  window.addEventListener("trusthuman:urlchange", () => {
    console.log("TrustHuman: urlchange event from page context");
    setTimeout(handleUrlChange, 100);
  });

  // Also poll for URL changes as ultimate fallback
  // Some SPAs might use other navigation methods
  let lastUrl = window.location.href;
  urlCheckInterval = setInterval(() => {
    if (window.location.href !== lastUrl) {
      console.log("TrustHuman: URL change via polling:", lastUrl, "->", window.location.href);
      lastUrl = window.location.href;
      handleUrlChange();
    }
  }, 500);

  console.log("TrustHuman: Check Human store initialized with page-context nav watcher");
}
