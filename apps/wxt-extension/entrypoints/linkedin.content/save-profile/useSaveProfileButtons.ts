/**
 * Hook to inject save profile buttons into LinkedIn feed.
 * Uses ProfileUtilities from linkedin-automation package.
 * Renders vanilla JS buttons (no React portals).
 */

import { useEffect } from "react";

import type { AuthorProfileTarget } from "@sassy/linkedin-automation/profile/types";
import { createProfileUtilities } from "@sassy/linkedin-automation/profile/create-profile-utilities";

import { fetchProfileUrn } from "./linkedin-profile-urn-fetcher";

/**
 * Create a save button element for a target.
 */
function createSaveButton(
  target: AuthorProfileTarget,
  onClick: (target: AuthorProfileTarget) => void,
): HTMLButtonElement {
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
    onClick(target);
  });

  return button;
}

/**
 * Hook to watch for author profiles and inject save buttons.
 * Buttons log profile info to console on click.
 */
export function useSaveProfileButtons() {
  useEffect(() => {
    const profileUtilities = createProfileUtilities();
    const buttonMap = new Map<string, HTMLButtonElement>();

    const handleClick = async (target: AuthorProfileTarget) => {
      const profileInfo = profileUtilities.extractProfileInfoFromSaveButton(
        target.anchorElement,
        target.container,
      );

      // If we have activityUrl and profileSlug, fetch the profileUrn
      if (profileInfo.activityUrl && profileInfo.profileSlug) {
        console.log(
          "SaveProfile: Fetching profileUrn for:",
          profileInfo.profileSlug,
        );
        const profileUrn = await fetchProfileUrn(
          profileInfo.activityUrl,
          profileInfo.profileSlug,
        );
        profileInfo.profileUrn = profileUrn;
      }

      console.log("SaveProfile: Complete!", profileInfo);
    };

    const cleanup = profileUtilities.watchForAuthorProfiles((targets) => {
      // Add buttons for new targets
      targets.forEach((target) => {
        if (!buttonMap.has(target.id)) {
          const button = createSaveButton(target, handleClick);
          target.container.appendChild(button);
          buttonMap.set(target.id, button);
        }
      });

      // Remove buttons for removed targets
      const currentIds = new Set(targets.map((t) => t.id));
      buttonMap.forEach((button, id) => {
        if (!currentIds.has(id)) {
          button.remove();
          buttonMap.delete(id);
        }
      });
    });

    return () => {
      cleanup();
      buttonMap.clear();
    };
  }, []);
}
