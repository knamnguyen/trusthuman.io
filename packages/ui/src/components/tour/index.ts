// Core exports
export { TourProvider, useTour } from "./tour-context";

// Component exports (for advanced usage)
export { TourOverlay } from "./tour-overlay";
export { TourModal } from "./tour-modal";
export { TourTooltip } from "./tour-tooltip";
export { TourProgress } from "./tour-progress";
export { TourLayer } from "./tour-layer";
export { SimulatedElement } from "./simulated-element";
export { GhostCursor, injectGhostCursorStyles } from "./ghost-cursor";

// Utility exports
export { getYouTubeEmbedUrl, extractYouTubeId } from "./utils/youtube";

// Type exports
export type {
  ModalPosition,
  TourStep,
  TourFlow,
  TourContextValue,
  TourProviderProps,
} from "./types";
