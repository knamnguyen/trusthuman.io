/**
 * Hook to inject save profile buttons into LinkedIn feed.
 * Uses ProfileUtilities from linkedin-automation package.
 * Renders vanilla JS buttons (no React portals).
 *
 * Integrates with:
 * - saved-profile-store: stores selected profile and comment stats
 * - sidebar-store: opens sidebar to Connect tab
 * - tRPC: prefetches list data for manage buttons
 * - linkedin-comments-fetcher: fetches recent comments for profile
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { AuthorProfileTarget } from "@sassy/linkedin-automation/profile/types";
import { createProfileUtilities } from "@sassy/linkedin-automation/profile/create-profile-utilities";

import { useTRPC } from "../../../lib/trpc/client";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import { fetchMemberComments } from "./linkedin-comments-fetcher";
import { fetchProfileUrn } from "./linkedin-profile-urn-fetcher";
import { useSavedProfileStore } from "./saved-profile-store";

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
 * On click:
 * 1. Extract profile info from DOM (immediate)
 * 2. Set profile in store and open sidebar (immediate)
 * 3. Prefetch tRPC list data (async)
 * 4. Fetch profileUrn from activity page (async)
 * 5. Update store with profileUrn
 * 6. Fetch recent comments for profile (async, needs URN)
 */
export function useSaveProfileButtons() {
  const {
    setSelectedProfile,
    processComments,
    setIsLoadingProfileUrn,
    setIsLoadingComments,
  } = useSavedProfileStore();
  const { openToTab } = useSidebarStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Store refs to avoid recreating handleClick on every render
  const storeRef = useRef({
    setSelectedProfile,
    processComments,
    setIsLoadingProfileUrn,
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
      setIsLoadingProfileUrn,
      setIsLoadingComments,
      openToTab,
      trpc,
      queryClient,
    };
  });

  useEffect(() => {
    const profileUtilities = createProfileUtilities();
    const buttonMap = new Map<string, HTMLButtonElement>();

    const handleClick = async (target: AuthorProfileTarget) => {
      const {
        setSelectedProfile,
        processComments,
        setIsLoadingProfileUrn,
        setIsLoadingComments,
        openToTab,
        trpc,
        queryClient,
      } = storeRef.current;

      // 1. Extract profile info from DOM (immediate)
      const profileInfo = profileUtilities.extractProfileInfoFromSaveButton(
        target.anchorElement,
        target.container,
      );

      console.log("SaveProfile: Extracted from DOM", {
        name: profileInfo.name,
        profileSlug: profileInfo.profileSlug,
        profileUrl: profileInfo.profileUrl,
        activityUrn: profileInfo.activityUrn,
        activityUrl: profileInfo.activityUrl,
      });

      // 2. Set profile in store and open sidebar (immediate)
      // Profile data from DOM is available right away
      setSelectedProfile(profileInfo);
      openToTab(SIDEBAR_TABS.CONNECT);

      // 3. Prefetch tRPC list data (async, fire and forget)
      // Include staleTime to match useManageLists query options
      if (profileInfo.profileUrl) {
        console.log(
          "SaveProfile: Prefetching lists for",
          profileInfo.profileUrl,
        );
        void queryClient.prefetchQuery(
          trpc.targetList.findListsWithProfileStatus.queryOptions(
            { linkedinUrl: profileInfo.profileUrl },
            { staleTime: 30 * 1000 },
          ),
        );
      }

      // 4. Fetch profileUrn from activity page (async)
      // This is needed for comments fetching
      if (profileInfo.activityUrl && profileInfo.profileSlug) {
        console.log(
          "SaveProfile: Fetching profileUrn for:",
          profileInfo.profileSlug,
        );

        setIsLoadingProfileUrn(true);
        try {
          const profileUrn = await fetchProfileUrn(
            profileInfo.activityUrl,
            profileInfo.profileSlug,
          );

          // 5. Update store with profileUrn (even if null, to indicate fetch completed)
          profileInfo.profileUrn = profileUrn;
          setSelectedProfile({ ...profileInfo });

          if (profileUrn) {
            console.log("SaveProfile: Got profileUrn:", profileUrn);

            // 6. Fetch recent comments for profile (needs URN)
            setIsLoadingComments(true);
            try {
              const comments = await fetchMemberComments(profileUrn);
              processComments(comments, profileInfo.name);
            } finally {
              setIsLoadingComments(false);
            }
          } else {
            console.warn("SaveProfile: Could not fetch profileUrn");
          }
        } finally {
          setIsLoadingProfileUrn(false);
        }
      }
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
