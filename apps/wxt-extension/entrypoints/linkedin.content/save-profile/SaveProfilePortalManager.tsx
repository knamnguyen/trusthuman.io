import { memo } from "react";
import { createPortal } from "react-dom";

import { SaveProfileButton } from "./SaveProfileButton";
import { useSaveProfileTargets } from "./useSaveProfileInjection";

// Memoize individual buttons - won't re-render unless props change
const MemoizedSaveProfileButton = memo(SaveProfileButton);

/**
 * Manages all save profile button portals.
 * Uses a single React tree with portals for performance.
 */
export function SaveProfilePortalManager() {
  const targets = useSaveProfileTargets();

  return (
    <>
      {targets.map(({ id, container, anchorElement }) =>
        createPortal(
          <MemoizedSaveProfileButton key={id} anchorElement={anchorElement} />,
          container
        )
      )}
    </>
  );
}
