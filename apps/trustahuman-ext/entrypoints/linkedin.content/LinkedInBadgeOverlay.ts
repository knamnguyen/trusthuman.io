/**
 * LinkedIn Badge Overlay
 *
 * Detects when user views a LinkedIn profile and injects a TrustHuman badge
 * if that profile is verified.
 *
 * Profile URL patterns:
 * - linkedin.com/in/username
 * - linkedin.com/in/username/
 *
 * Badge injection point:
 * - Next to the profile name in the header section
 */

import { trpc } from "@/lib/trpc-client";
import { getCachedLookup, setCachedLookup } from "@/lib/badge-cache";

// Track which profiles we've already processed to avoid duplicate badges
const processedProfiles = new Set<string>();

// Track current URL for SPA navigation detection
let currentUrl = "";

// Badge element ID prefix
const BADGE_ID_PREFIX = "trusthuman-badge-";

/**
 * Extract LinkedIn profile URL from current page
 * Returns canonical form: linkedin.com/in/username
 */
function extractProfileUrl(): string | null {
  const path = window.location.pathname;

  // Match /in/username or /in/username/
  const match = path.match(/^\/in\/([^/?]+)/);
  if (!match) return null;

  const username = match[1];
  return `linkedin.com/in/${username}`;
}

/**
 * Check if we're on a LinkedIn profile page
 */
function isProfilePage(): boolean {
  return window.location.pathname.startsWith("/in/");
}

/**
 * Find the profile name element to inject badge next to
 * LinkedIn's DOM structure varies, so we try multiple selectors
 */
function findProfileNameElement(): HTMLElement | null {
  // Primary: The main profile name heading
  const selectors = [
    // Profile page main name (h1 in the intro card) - most common
    '.pv-top-card h1',
    'section.artdeco-card h1',
    // Alternative: profile name in the intro section
    '.pv-text-details__left-panel h1',
    // The profile intro section
    '.ph5.pb5 h1',
    // Another pattern
    '[data-generated-suggestion-target="urn:li:fsu_profileActionDelegate"] h1',
    // Generic fallback - first h1 in main content
    '.scaffold-layout__main h1',
    // Very generic - any h1 that contains the visible name
    'main h1',
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element && element.textContent?.trim()) {
      console.log("TrustHuman: Found profile name element with selector:", selector);
      return element;
    }
  }

  // Debug: log what h1 elements exist
  const allH1 = document.querySelectorAll('h1');
  console.log("TrustHuman: All h1 elements on page:", allH1.length);
  allH1.forEach((h1, i) => {
    console.log(`  h1[${i}]:`, h1.textContent?.slice(0, 50), h1.className);
  });

  return null;
}

/**
 * Create the badge HTML element
 */
function createBadgeElement(trustProfile: {
  humanNumber: number;
  username: string;
  totalVerifications: number;
  currentStreak: number;
}): HTMLElement {
  const badge = document.createElement("span");
  badge.id = `${BADGE_ID_PREFIX}${trustProfile.humanNumber}`;
  badge.className = "trusthuman-badge";

  // Inline styles to avoid CSS conflicts
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
    padding: 2px 8px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-size: 12px;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    vertical-align: middle;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  `;

  // Badge content: checkmark + Human # + stats
  badge.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>Human #${trustProfile.humanNumber}</span>
    <span style="opacity: 0.8; font-weight: 400;">• ${trustProfile.totalVerifications} verified</span>
  `;

  // Hover effect
  badge.addEventListener("mouseenter", () => {
    badge.style.transform = "scale(1.02)";
    badge.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
  });
  badge.addEventListener("mouseleave", () => {
    badge.style.transform = "scale(1)";
    badge.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
  });

  // Click to open TrustHuman profile
  badge.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Open in new tab - use production URL
    const baseUrl = import.meta.env.VITE_SYNC_HOST_URL || "https://trusthuman.io";
    window.open(`${baseUrl}/${trustProfile.username}`, "_blank");
  });

  // Tooltip
  badge.title = `Verified Human #${trustProfile.humanNumber}\n${trustProfile.totalVerifications} verifications\n${trustProfile.currentStreak} day streak\nClick to view profile`;

  return badge;
}

/**
 * Remove any existing badges from the page
 */
function removeExistingBadges(): void {
  const badges = document.querySelectorAll(`[id^="${BADGE_ID_PREFIX}"]`);
  badges.forEach((badge) => badge.remove());
}

/**
 * Inject badge for a verified profile
 */
function injectBadge(trustProfile: {
  humanNumber: number;
  username: string;
  totalVerifications: number;
  currentStreak: number;
}): void {
  const nameElement = findProfileNameElement();
  if (!nameElement) {
    console.log("TrustHuman: Could not find profile name element for badge injection");
    return;
  }

  // Check if badge already exists
  const existingBadge = document.getElementById(`${BADGE_ID_PREFIX}${trustProfile.humanNumber}`);
  if (existingBadge) {
    console.log("TrustHuman: Badge already exists for this profile");
    return;
  }

  // Create and inject badge
  const badge = createBadgeElement(trustProfile);
  nameElement.appendChild(badge);

  console.log(`TrustHuman: Badge injected for Human #${trustProfile.humanNumber}`);
}

/**
 * Look up profile and inject badge if verified
 */
async function checkAndInjectBadge(): Promise<void> {
  if (!isProfilePage()) return;

  const profileUrl = extractProfileUrl();
  if (!profileUrl) {
    console.log("TrustHuman: Could not extract profile URL");
    return;
  }

  // Check if already processed
  if (processedProfiles.has(profileUrl)) {
    console.log("TrustHuman: Profile already processed:", profileUrl);
    return;
  }

  console.log("TrustHuman: Checking profile:", profileUrl);

  // Check cache first
  const cached = getCachedLookup("linkedin", profileUrl);
  if (cached) {
    console.log("TrustHuman: Using cached result for:", profileUrl);
    if (cached.found && cached.trustProfile) {
      injectBadge(cached.trustProfile);
    }
    processedProfiles.add(profileUrl);
    return;
  }

  // Lookup via API
  try {
    console.log("TrustHuman: Looking up profile via API:", profileUrl);
    const result = await trpc.platformLink.lookupByProfileUrl.query({
      platform: "linkedin",
      profileUrl,
    });

    console.log("TrustHuman: Lookup result:", result);

    // Cache the result
    if (result) {
      setCachedLookup("linkedin", profileUrl, {
        found: true,
        trustProfile: result.trustProfile,
      });
      injectBadge(result.trustProfile);
    } else {
      setCachedLookup("linkedin", profileUrl, { found: false });
      console.log("TrustHuman: No verified profile found for:", profileUrl);
    }

    processedProfiles.add(profileUrl);
  } catch (err) {
    console.error("TrustHuman: Failed to lookup profile:", err);
  }
}

/**
 * Handle URL changes (SPA navigation)
 */
function handleUrlChange(): void {
  const newUrl = window.location.href;
  if (newUrl === currentUrl) return;

  console.log("TrustHuman: URL changed to:", newUrl);
  currentUrl = newUrl;

  // Remove existing badges when navigating away
  removeExistingBadges();

  // Clear processed profiles for new page
  processedProfiles.clear();

  // Check new page after a short delay (DOM needs to update)
  setTimeout(() => {
    checkAndInjectBadge();
  }, 500);
}

/**
 * Initialize the badge overlay system
 */
export function initLinkedInBadgeOverlay(): void {
  console.log("TrustHuman: Initializing LinkedIn badge overlay");

  currentUrl = window.location.href;

  // Initial check
  setTimeout(() => {
    checkAndInjectBadge();
  }, 1000);

  // Watch for SPA navigation using multiple methods

  // 1. MutationObserver for DOM changes (LinkedIn rewrites the page)
  const observer = new MutationObserver(() => {
    handleUrlChange();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // 2. History API interception
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(handleUrlChange, 100);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(handleUrlChange, 100);
  };

  // 3. Popstate event (back/forward navigation)
  window.addEventListener("popstate", () => {
    setTimeout(handleUrlChange, 100);
  });

  console.log("TrustHuman: LinkedIn badge overlay initialized");
}
