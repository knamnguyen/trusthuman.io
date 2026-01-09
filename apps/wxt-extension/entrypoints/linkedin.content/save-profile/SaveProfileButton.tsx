import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IoPersonAdd } from "react-icons/io5";

import type { ProfileInfo } from "./extract-profile-info";
import { useTRPC } from "../../../lib/trpc/client";
import { useSavedProfileStore } from "../stores/saved-profile-store";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import { fetchMemberComments } from "../utils/data-fetch-mimic/linkedin-comments-fetcher";
import { extractProfileInfo } from "./extract-profile-info";

interface SaveProfileButtonProps {
  anchorElement?: Element;
  extractProfile?: () => ProfileInfo;
}

/**
 * Save Profile button that injects into LinkedIn comments.
 * Used to save profile of commenter or post author.
 * Uses inline styles since it renders via portal outside shadow DOM.
 */
export function SaveProfileButton({
  anchorElement,
  extractProfile,
}: SaveProfileButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { setSelectedProfile, processComments, setIsLoadingComments } =
    useSavedProfileStore();
  const { openToTab } = useSidebarStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let profileInfo: ProfileInfo;

    if (extractProfile) {
      // Use provided extractor (for profile pages)
      profileInfo = extractProfile();
    } else if (anchorElement) {
      // Use default extractor (for feed/post)
      const buttonContainer = (e.currentTarget as HTMLElement).parentElement;
      if (!buttonContainer) {
        console.warn("SaveProfile: button container not found");
        return;
      }
      profileInfo = extractProfileInfo(anchorElement, buttonContainer);
    } else {
      console.warn("SaveProfile: no extractor or anchor element provided");
      return;
    }

    console.log("SaveProfile: Profile Info from DOM", {
      name: profileInfo.name,
      linkedinUrl: profileInfo.linkedinUrl,
      photoUrl: profileInfo.photoUrl,
      headline: profileInfo.headline,
      profileUrn: profileInfo.urn || "no urn available",
    });

    // Store profile and open sidebar to Connect tab
    setSelectedProfile(profileInfo);
    openToTab(SIDEBAR_TABS.CONNECT);

    // Prefetch lists data for instant popover open
    if (profileInfo.linkedinUrl) {
      console.log("🚀 PREFETCH: Starting for", profileInfo.linkedinUrl);

      void queryClient.prefetchQuery(
        trpc.targetList.findListsWithProfileStatus.queryOptions({
          linkedinUrl: profileInfo.linkedinUrl,
        }),
      );
    }

    // Fetch recent comments if URN is available
    if (profileInfo.urn) {
      setIsLoadingComments(true);
      fetchMemberComments(profileInfo.urn)
        .then((comments) => processComments(comments, profileInfo.name))
        .finally(() => setIsLoadingComments(false));
    }
  };

  const iconSize = 16;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
        backgroundColor: isHovered ? "#f3f6f8" : "transparent",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        transition: "background-color 0.15s",
      }}
    >
      <IoPersonAdd size={iconSize} color="#e5486c" />
    </button>
  );
}
