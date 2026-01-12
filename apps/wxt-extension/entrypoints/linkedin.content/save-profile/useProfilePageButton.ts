/**
 * Hook to inject save profile button on LinkedIn profile pages.
 * Uses shared utilities from linkedin-automation package.
 * Renders vanilla JS button (no React portal).
 */

import { useEffect } from "react";

import { extractProfilePageInfo } from "@sassy/linkedin-automation/profile/utils-shared/extract-profile-page-info";
import {
  watchForProfilePage,
  type ProfilePageTarget,
} from "@sassy/linkedin-automation/profile/utils-shared/watch-for-profile-page";

/**
 * Create a save button element for profile page.
 */
function createSaveButton(onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background-color: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.15s;
  `;

  // Person-add icon (SVG)
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5486c" stroke-width="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  `;

  // Hover effect
  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "#f3f6f8";
  });
  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "transparent";
  });

  // Click handler
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });

  return button;
}

/**
 * Hook to watch for profile page and inject save button.
 * Button logs profile info to console on click.
 */
export function useProfilePageButton() {
  useEffect(() => {
    let currentButton: HTMLButtonElement | null = null;

    const handleClick = () => {
      const profileInfo = extractProfilePageInfo();
      console.log("SaveProfile (ProfilePage): Clicked!", profileInfo);
    };

    const cleanup = watchForProfilePage((target: ProfilePageTarget | null) => {
      // Remove existing button if target changed
      if (currentButton) {
        currentButton.remove();
        currentButton = null;
      }

      // Add button for new target
      if (target) {
        currentButton = createSaveButton(handleClick);
        target.container.appendChild(currentButton);
      }
    });

    return () => {
      cleanup();
      if (currentButton) {
        currentButton.remove();
      }
    };
  }, []);
}
