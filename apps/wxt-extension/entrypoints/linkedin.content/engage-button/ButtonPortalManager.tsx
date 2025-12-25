import { memo } from "react";
import { createPortal } from "react-dom";

import { useButtonTargets } from "./useButtonInjection";
import { EngageButton } from "./EngageButton";

// Memoize individual buttons - won't re-render unless props change
const MemoizedEngageButton = memo(EngageButton);

/**
 * Manages all engage button portals.
 * Uses a single React tree with portals for performance.
 */
export function ButtonPortalManager() {
  const targets = useButtonTargets();

  return (
    <>
      {targets.map(({ id, container, anchorElement }) =>
        createPortal(
          <MemoizedEngageButton key={id} anchorElement={anchorElement} />,
          container
        )
      )}
    </>
  );
}
