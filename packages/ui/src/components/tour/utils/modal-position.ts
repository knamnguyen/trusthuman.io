import type { ModalPosition } from "../types";
import { queryElement } from "./query-element";

// Modal dimensions (should match tour-modal.tsx)
const MODAL_WIDTH = 680;
const MODAL_MAX_WIDTH_PERCENT = 0.92;
// Approximate modal height (varies by content)
const MODAL_HEIGHT_WITH_VIDEO = 550;
const MODAL_HEIGHT_WITHOUT_VIDEO = 280;

// Padding from viewport edges
const VIEWPORT_PADDING = 16;

/**
 * All possible modal positions in priority order (center first)
 */
export const ALL_POSITIONS: ModalPosition[] = [
  "center-center",
  "center-left",
  "center-right",
  "top-center",
  "bottom-center",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

interface ModalRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Get the modal's bounding rect for a given position
 */
export function getModalRectForPosition(
  position: ModalPosition,
  hasVideo: boolean = false
): ModalRect {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const modalWidth = Math.min(MODAL_WIDTH, viewportWidth * MODAL_MAX_WIDTH_PERCENT);
  const modalHeight = hasVideo ? MODAL_HEIGHT_WITH_VIDEO : MODAL_HEIGHT_WITHOUT_VIDEO;

  // Parse position
  const [vertical, horizontal] = position.split("-") as [
    "top" | "center" | "bottom",
    "left" | "center" | "right"
  ];

  // Calculate horizontal position
  let left: number;
  switch (horizontal) {
    case "left":
      left = VIEWPORT_PADDING;
      break;
    case "right":
      left = viewportWidth - modalWidth - VIEWPORT_PADDING;
      break;
    case "center":
    default:
      left = (viewportWidth - modalWidth) / 2;
      break;
  }

  // Calculate vertical position
  let top: number;
  switch (vertical) {
    case "top":
      top = VIEWPORT_PADDING;
      break;
    case "bottom":
      top = viewportHeight - modalHeight - VIEWPORT_PADDING;
      break;
    case "center":
    default:
      top = (viewportHeight - modalHeight) / 2;
      break;
  }

  return { left, top, width: modalWidth, height: modalHeight };
}

/**
 * Calculate what percentage of elementRect is covered by modalRect
 */
export function calculateOverlapPercent(
  elementRect: DOMRect,
  modalRect: ModalRect
): number {
  const overlapLeft = Math.max(elementRect.left, modalRect.left);
  const overlapRight = Math.min(elementRect.right, modalRect.left + modalRect.width);
  const overlapTop = Math.max(elementRect.top, modalRect.top);
  const overlapBottom = Math.min(elementRect.bottom, modalRect.top + modalRect.height);

  const overlapWidth = Math.max(0, overlapRight - overlapLeft);
  const overlapHeight = Math.max(0, overlapBottom - overlapTop);
  const overlapArea = overlapWidth * overlapHeight;

  const elementArea = elementRect.width * elementRect.height;
  if (elementArea === 0) return 0;

  return (overlapArea / elementArea) * 100;
}

/**
 * Calculate total overlap percentage across all highlighted elements
 */
function calculateTotalOverlap(
  elementRects: DOMRect[],
  modalRect: ModalRect
): number {
  if (elementRects.length === 0) return 0;

  let totalOverlap = 0;
  for (const rect of elementRects) {
    totalOverlap += calculateOverlapPercent(rect, modalRect);
  }
  // Return average overlap
  return totalOverlap / elementRects.length;
}

/**
 * Calculate distance from center position (for tie-breaking)
 */
function distanceFromCenter(position: ModalPosition): number {
  const distances: Record<ModalPosition, number> = {
    "center-center": 0,
    "center-left": 1,
    "center-right": 1,
    "top-center": 1,
    "bottom-center": 1,
    "top-left": 2,
    "top-right": 2,
    "bottom-left": 2,
    "bottom-right": 2,
  };
  return distances[position];
}

/**
 * Get bounding rects for all highlighted elements
 */
export function getHighlightedElementRects(
  selectors: string | string[],
  shadowRoot?: Element | DocumentFragment | null
): DOMRect[] {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  const rects: DOMRect[] = [];

  for (const selector of selectorArray) {
    const element = queryElement(selector, shadowRoot);
    if (element) {
      rects.push(element.getBoundingClientRect());
    }
  }

  return rects;
}

/**
 * Calculate the optimal modal position to minimize overlap with highlighted elements.
 *
 * Algorithm:
 * 1. Get bounding rects of all highlighted elements
 * 2. For each of the 9 positions, calculate total overlap %
 * 3. Pick position with lowest overlap
 * 4. Tie-breaker: prefer positions closer to center
 *
 * @param selectors - Highlighted element selectors
 * @param shadowRoot - Shadow root for element queries
 * @param hasVideo - Whether the modal has video (affects height)
 * @returns The optimal ModalPosition
 */
export function calculateOptimalPosition(
  selectors: string | string[],
  shadowRoot?: Element | DocumentFragment | null,
  hasVideo: boolean = false
): ModalPosition {
  const elementRects = getHighlightedElementRects(selectors, shadowRoot);

  // If no elements found, default to center
  if (elementRects.length === 0) {
    return "center-center";
  }

  let bestPosition: ModalPosition = "center-center";
  let bestScore = Infinity;

  for (const position of ALL_POSITIONS) {
    const modalRect = getModalRectForPosition(position, hasVideo);
    const overlapPercent = calculateTotalOverlap(elementRects, modalRect);
    const centerDistance = distanceFromCenter(position);

    // Score = overlap + small penalty for distance from center
    // This ensures we prefer center when overlaps are equal
    const score = overlapPercent + centerDistance * 0.1;

    if (score < bestScore) {
      bestScore = score;
      bestPosition = position;
    }
  }

  return bestPosition;
}

/**
 * Convert ModalPosition to CSS transform values for smooth animation.
 * Uses translate percentages which CSS can smoothly interpolate.
 *
 * The modal is positioned with left: 50%, top: 50% and then
 * transformed with translate to achieve the final position.
 */
export function getPositionTransform(position: ModalPosition): {
  left: string;
  top: string;
  transform: string;
} {
  const [vertical, horizontal] = position.split("-") as [
    "top" | "center" | "bottom",
    "left" | "center" | "right"
  ];

  // Horizontal: left edge, center, or right edge
  let left: string;
  let translateX: string;
  switch (horizontal) {
    case "left":
      left = `${VIEWPORT_PADDING}px`;
      translateX = "0%";
      break;
    case "right":
      left = `calc(100% - ${VIEWPORT_PADDING}px)`;
      translateX = "-100%";
      break;
    case "center":
    default:
      left = "50%";
      translateX = "-50%";
      break;
  }

  // Vertical: top edge, center, or bottom edge
  let top: string;
  let translateY: string;
  switch (vertical) {
    case "top":
      top = `${VIEWPORT_PADDING}px`;
      translateY = "0%";
      break;
    case "bottom":
      top = `calc(100% - ${VIEWPORT_PADDING}px)`;
      translateY = "-100%";
      break;
    case "center":
    default:
      top = "50%";
      translateY = "-50%";
      break;
  }

  return {
    left,
    top,
    transform: `translate(${translateX}, ${translateY})`,
  };
}

