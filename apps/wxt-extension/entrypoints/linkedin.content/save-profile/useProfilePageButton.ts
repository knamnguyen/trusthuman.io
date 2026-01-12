/**
 * Hook to inject save profile button on LinkedIn profile pages.
 * Uses shared utilities from linkedin-automation package.
 * Renders vanilla JS button (no React portal).
 *
 * Integrates with:
 * - saved-profile-store: stores selected profile and comment stats
 * - sidebar-store: opens sidebar to Connect tab
 * - tRPC: prefetches list data for manage buttons
 * - linkedin-comments-fetcher: fetches recent comments for profile
 *
 * Note: On profile pages, URN is available immediately from DOM (no fetch needed).
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { SaveButtonProfileInfo } from "@sassy/linkedin-automation/profile/types";
import { extractProfilePageInfo } from "@sassy/linkedin-automation/profile/utils-shared/extract-profile-page-info";
import {
  watchForProfilePage,
  type ProfilePageTarget,
} from "@sassy/linkedin-automation/profile/utils-shared/watch-for-profile-page";

import { useTRPC } from "../../../lib/trpc/client";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import { fetchMemberComments } from "./linkedin-comments-fetcher";
import { useSavedProfileStore } from "./saved-profile-store";

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
 * On click:
 * 1. Extract profile info from DOM (immediate, URN available)
 * 2. Set profile in store and open sidebar (immediate)
 * 3. Prefetch tRPC list data (async)
 * 4. Fetch recent comments for profile (async, URN already available)
 */
export function useProfilePageButton() {
  const { setSelectedProfile, processComments, setIsLoadingComments } =
    useSavedProfileStore();
  const { openToTab } = useSidebarStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Store refs to avoid recreating handleClick on every render
  const storeRef = useRef({
    setSelectedProfile,
    processComments,
    setIsLoadingComments,
    openToTab,
    trpc,
    queryClient,
  });

  // Keep refs up to date
  useEffect(() => {
    storeRef.current = {
      setSelectedProfile,
      processComments,
      setIsLoadingComments,
      openToTab,
      trpc,
      queryClient,
    };
  });

  useEffect(() => {
    let currentButton: HTMLButtonElement | null = null;

    const handleClick = async () => {
      const {
        setSelectedProfile,
        processComments,
        setIsLoadingComments,
        openToTab,
        trpc,
        queryClient,
      } = storeRef.current;

      // 1. Extract profile info from DOM (URN available immediately on profile pages)
      const profilePageInfo = extractProfilePageInfo();

      console.log("SaveProfile (ProfilePage): Extracted from DOM", {
        name: profilePageInfo.name,
        profileSlug: profilePageInfo.profileSlug,
        profileUrl: profilePageInfo.profileUrl,
        profileUrn: profilePageInfo.profileUrn,
      });

      // Convert ProfilePageInfo to SaveButtonProfileInfo format
      // (profile page has no activity context, so activity fields are null)
      const profileInfo: SaveButtonProfileInfo = {
        name: profilePageInfo.name,
        profileSlug: profilePageInfo.profileSlug,
        profileUrl: profilePageInfo.profileUrl,
        photoUrl: profilePageInfo.photoUrl,
        headline: profilePageInfo.headline,
        profileUrn: profilePageInfo.profileUrn,
        activityUrn: null,
        activityUrl: null,
      };

      // 2. Set profile in store and open sidebar (immediate)
      setSelectedProfile(profileInfo);
      openToTab(SIDEBAR_TABS.CONNECT);

      // 3. Prefetch tRPC list data (async, fire and forget)
      if (profileInfo.profileUrl) {
        console.log(
          "SaveProfile (ProfilePage): Prefetching lists for",
          profileInfo.profileUrl,
        );
        void queryClient.prefetchQuery(
          trpc.targetList.findListsWithProfileStatus.queryOptions({
            linkedinUrl: profileInfo.profileUrl,
          }),
        );
      }

      // 4. Fetch recent comments for profile (URN already available)
      if (profileInfo.profileUrn) {
        console.log(
          "SaveProfile (ProfilePage): Fetching comments for URN:",
          profileInfo.profileUrn,
        );

        setIsLoadingComments(true);
        try {
          const comments = await fetchMemberComments(profileInfo.profileUrn);
          processComments(comments, profileInfo.name);
        } finally {
          setIsLoadingComments(false);
        }
      } else {
        console.warn(
          "SaveProfile (ProfilePage): No URN available, skipping comments fetch",
        );
      }
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
