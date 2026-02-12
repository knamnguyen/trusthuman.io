/**
 * x-stealth-headers.ts -- Content-script bridge for stealth anti-detection headers.
 *
 * Responsibilities:
 *   - Inject `page-context.js` into the page's main world to access XPForwardedForSDK
 *   - Cache the SDK result with expiry-aware re-fetching
 *   - Provide `initStealthHeaders()` and `getStealthHeaders(method, path)` for use
 *     by `buildHeaders()` in x-api.ts
 *
 * This module runs in the content script's isolated world and communicates with
 * the page-world script via CustomEvent on `document`.
 */

import { XClientTransactionManager } from "@/lib/x-client-transaction";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StealthHeaders {
  "x-client-transaction-id": string;
  "x-xp-forwarded-for": string;
}

interface CachedXPForwardedFor {
  value: string;
  expiryTime: number; // absolute timestamp in ms
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Timeout (ms) waiting for the page-context script SDK response. */
const SDK_TIMEOUT_MS = 5_000;

/**
 * Hardcoded fallback when the SDK is unavailable.
 * Identical to the value used in EngageX.
 */
const HARDCODED_XP_FORWARDED_FOR =
  "024726349207e07aae2a2651928c94199ce5c2c3728427cd2c6059eb2a8dd2b9eb0063b96135f767e6b43ad8388909f83c8dcc1f4617cc7487ab48eb8ef6941fc51b4a8dec407e5a96f6257e297e403fa19085214c9c729c4e5ad6ed8d69ef17a9f9769340444e3edbc2e5c021dbce06cdcc3b6726f83b450e2819ea12172d137f75980a6a8ee3b51b79065cf45b279e4ef74f3f68816125f70c889cab74a85c30ec9d052eedfdd1edc6f34fa96b0b0f110c4e7057daeb2c14c3fa6c941b649eca5c9155e1d2c147b5d1aa92ed1d61cbf2629d89442de1cb14949d3be070a91a1861ecdf01da61ab97dac8162fecf8260cb38b13923abf6afc75f4";

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let cachedXPFF: CachedXPForwardedFor | null = null;
let xpffPromise: Promise<string> | null = null;

const transactionManager = new XClientTransactionManager();
let transactionManagerReady = false;

// ---------------------------------------------------------------------------
// Page-context script injection
// ---------------------------------------------------------------------------

/**
 * Inject `page-context.js` into the page's main world and listen for the
 * SDK result via CustomEvent.
 *
 * Returns the XP forwarded-for string (or the hardcoded fallback on error/timeout).
 */
function injectPageContextScript(): Promise<string> {
  return new Promise<string>((resolve) => {
    const eventName = `xbooster-xpff-${Math.random().toString(36).slice(2, 10)}`;

    // Timeout -- fall back to hardcoded value if SDK doesn't respond in time.
    const timer = setTimeout(() => {
      cleanup();
      console.warn(
        "xBooster: XPForwardedFor SDK timed out, using hardcoded fallback",
      );
      resolve(HARDCODED_XP_FORWARDED_FOR);
    }, SDK_TIMEOUT_MS);

    function onResult(event: Event) {
      cleanup();
      const detail = (event as CustomEvent).detail;

      if (detail?.success && detail.value) {
        // Cache with expiry
        cachedXPFF = {
          value: detail.value,
          expiryTime: detail.expiryTime
            ? Date.now() + detail.expiryTime
            : Date.now() + 30 * 60 * 1000, // default 30 min
        };
        resolve(detail.value);
      } else {
        console.warn(
          "xBooster: XPForwardedFor SDK returned error:",
          detail?.error,
        );
        resolve(HARDCODED_XP_FORWARDED_FOR);
      }
    }

    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener(eventName, onResult);
      // Remove the injected script element (clean up DOM)
      const scriptEl = document.querySelector(
        `script[data-event-name="${eventName}"]`,
      );
      if (scriptEl) {
        scriptEl.remove();
      }
    }

    // Listen for the response from page-context.js
    document.addEventListener(eventName, onResult, { once: true });

    // Create and inject the script element
    const script = document.createElement("script");
    script.src = browser.runtime.getURL("/page-context.js");
    script.setAttribute("data-event-name", eventName);
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// XP Forwarded For retrieval (with caching)
// ---------------------------------------------------------------------------

/**
 * Get the x-xp-forwarded-for value, using the cached SDK result when valid.
 * Re-fetches via script injection when the cached value has expired.
 */
async function getXPForwardedFor(): Promise<string> {
  // Return cached value if still valid
  if (cachedXPFF && Date.now() < cachedXPFF.expiryTime) {
    return cachedXPFF.value;
  }

  // If a fetch is already in progress, wait for it
  if (xpffPromise) {
    return xpffPromise;
  }

  // Start a new fetch
  xpffPromise = injectPageContextScript().finally(() => {
    xpffPromise = null;
  });

  return xpffPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize stealth header infrastructure. Should be called once when the
 * content script loads on x.com.
 *
 * Non-blocking -- both the transaction manager and the XP forwarded-for fetch
 * happen in the background. Fallback values are used until they're ready.
 */
export async function initStealthHeaders(): Promise<void> {
  // Initialize XClientTransactionManager (non-blocking)
  transactionManager
    .initialize()
    .then((success) => {
      transactionManagerReady = success;
      if (success) {
        console.log("xBooster: XClientTransactionManager initialized");
      } else {
        console.warn(
          "xBooster: XClientTransactionManager init failed, will use fallback IDs",
        );
      }
    })
    .catch((err) => {
      console.warn("xBooster: XClientTransactionManager init error:", err);
    });

  // Kick off XP forwarded-for fetch (non-blocking)
  getXPForwardedFor().catch((err) => {
    console.warn("xBooster: XPForwardedFor fetch error:", err);
  });
}

/**
 * Get the current stealth headers for a given HTTP method + API path.
 *
 * Both headers fall back gracefully if their respective systems aren't ready.
 */
export async function getStealthHeaders(
  method: string,
  path: string,
): Promise<StealthHeaders> {
  // Transaction ID -- generated per request
  const transactionId = transactionManager.generateTransactionId(method, path);

  // XP Forwarded For -- cached with expiry
  let xpForwardedFor: string;
  try {
    xpForwardedFor = await getXPForwardedFor();
  } catch {
    xpForwardedFor = HARDCODED_XP_FORWARDED_FOR;
  }

  return {
    "x-client-transaction-id": transactionId,
    "x-xp-forwarded-for": xpForwardedFor,
  };
}
