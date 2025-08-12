/**
 * Profile List Module - Manual Profile Extraction
 *
 * This module adds an "Extract" button next to the profile overflow action button
 * on LinkedIn profile pages for manual profile data extraction.
 */

import { initializeProfileExtractButton } from "./profile-extract-button";

/**
 * Initialize the profile list functionality
 * This should be called when the content script loads on LinkedIn pages
 * Sets up URL monitoring to detect navigation to profile pages
 */
export function initializeProfileList(): void {
  console.log("[Profile List] 🚀 Initializing profile list functionality...");

  // Initialize profile extract button with URL monitoring for SPA navigation
  // This will work on any LinkedIn page and detect when user navigates to profile pages
  initializeProfileExtractButton();

  console.log(
    "[Profile List] ✅ Profile list functionality initialized with URL monitoring",
  );
}

// Re-export for external use
export { initializeProfileExtractButton };

// Auto-initialize when module is imported (like other modules)
console.log("[Profile List] 🔄 Module loaded, starting initialization...");
initializeProfileList();
