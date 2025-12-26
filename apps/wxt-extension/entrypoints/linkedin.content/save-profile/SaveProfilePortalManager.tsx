import { memo } from "react";
import { createPortal } from "react-dom";

import { extractProfilePageInfo } from "./extract-profile-page-info";
import { SaveProfileButton } from "./SaveProfileButton";
import { useProfilePageTargets } from "./useProfilePageInjection";
import { useSaveProfileTargets } from "./useSaveProfileInjection";

// Memoize individual buttons - won't re-render unless props change
const MemoizedSaveProfileButton = memo(SaveProfileButton);

/**
 * Manages all save profile button portals.
 * Uses a single React tree with portals for performance.
 * Handles both feed/post targets and profile page targets.
 */
export function SaveProfilePortalManager() {
  const feedTargets = useSaveProfileTargets();
  const profilePageTargets = useProfilePageTargets();

  return (
    <>
      {/* Feed/Post save profile buttons */}
      {feedTargets.map(({ id, container, anchorElement }) =>
        createPortal(
          <MemoizedSaveProfileButton key={id} anchorElement={anchorElement} />,
          container
        )
      )}
      {/* Profile page save profile button */}
      {profilePageTargets.map(({ id, container }) =>
        createPortal(
          <MemoizedSaveProfileButton key={id} extractProfile={extractProfilePageInfo} />,
          container
        )
      )}
    </>
  );
}
