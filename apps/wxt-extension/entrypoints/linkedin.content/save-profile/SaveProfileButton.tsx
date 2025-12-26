import { useState } from "react";
import { IoPersonAdd } from "react-icons/io5";

import { useSavedProfileStore } from "../stores/saved-profile-store";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import { extractProfileInfo } from "./extract-profile-info";

interface SaveProfileButtonProps {
  anchorElement: Element;
}

/**
 * Save Profile button that injects into LinkedIn comments.
 * Used to save profile of commenter or post author.
 * Uses inline styles since it renders via portal outside shadow DOM.
 */
export function SaveProfileButton({ anchorElement }: SaveProfileButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { setSelectedProfile } = useSavedProfileStore();
  const { openToTab } = useSidebarStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Get the button container (parent of this button)
    const buttonContainer = (e.currentTarget as HTMLElement).parentElement;
    if (!buttonContainer) {
      console.warn("SaveProfile: button container not found");
      return;
    }

    // Extract profile info from DOM
    const profileInfo = extractProfileInfo(anchorElement, buttonContainer);

    console.log("SaveProfile: Profile Info from DOM", {
      name: profileInfo.name,
      linkedinUrl: profileInfo.linkedinUrl,
      photoUrl: profileInfo.photoUrl,
      headline: profileInfo.headline,
    });

    // Store profile and open sidebar to Share tab
    setSelectedProfile(profileInfo);
    openToTab(SIDEBAR_TABS.SHARE);
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
