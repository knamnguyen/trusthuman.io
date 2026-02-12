/**
 * page-context.js -- Injected into x.com's page world (main world) to access
 * Twitter's XPForwardedForSDK, which is only available on the page's own
 * `window` object.
 *
 * Communication pattern:
 *   1. Content script creates a <script> tag with a unique `data-event-name`
 *   2. This script reads that attribute, calls the SDK
 *   3. Result is dispatched back via CustomEvent on `document`
 *   4. Content script listens for that event in its isolated world
 *
 * MUST remain plain JavaScript (no TypeScript, no imports).
 *
 * Ported from: engageX/api/page-context.js (SDK / data-event-name mode)
 */
!(async function () {
  "use strict";

  var eventName =
    document.currentScript && document.currentScript.getAttribute("data-event-name");

  if (!eventName) {
    // Script was loaded without an event name -- nothing to do.
    return;
  }

  try {
    if (typeof window.XPForwardedForSDK !== "undefined") {
      await window.XPForwardedForSDK.init("production");
      var result = await window.XPForwardedForSDK.getForwardedForStr();

      document.dispatchEvent(
        new CustomEvent(eventName, {
          detail: {
            success: true,
            value: result.str,
            expiryTime: result.expiryTimeMillis,
          },
        })
      );
    } else {
      document.dispatchEvent(
        new CustomEvent(eventName, {
          detail: {
            success: false,
            error: "SDK not found",
          },
        })
      );
    }
  } catch (error) {
    document.dispatchEvent(
      new CustomEvent(eventName, {
        detail: {
          success: false,
          error: error.message || "Unknown error",
        },
      })
    );
  }
})();
