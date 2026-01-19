"use client";

import { createPortal } from "react-dom";
import { TourOverlay } from "./tour-overlay";
import { TourModal } from "./tour-modal";
import { TourTooltip } from "./tour-tooltip";
import type { ModalPosition, TourStep } from "./types";

interface TourLayerProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  viewMode: "tooltip" | "modal";
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onGoToStep: (index: number) => void;
  onSwitchView: (mode: "tooltip" | "modal") => void;
  /** Shadow root for querying elements and rendering tooltips */
  portalContainer?: HTMLElement | null;
  /** Default modal position for the flow (default: "center-center") */
  modalPosition?: ModalPosition;
}

export function TourLayer({
  step,
  currentIndex,
  totalSteps,
  viewMode,
  onNext,
  onPrev,
  onClose,
  onGoToStep,
  onSwitchView,
  portalContainer,
  modalPosition,
}: TourLayerProps) {
  // Overlay renders to document.body to cover the entire page (including LinkedIn)
  // Modal/Tooltip renders to shadow root to have access to Tailwind styles
  const overlay = (
    <TourOverlay
      selector={step.selector}
      onOverlayClick={onClose}
      shadowRoot={portalContainer}
      allowInteraction={step.allowInteraction}
    />
  );

  // View switch handlers - update context state which persists across steps
  const handleSwitchToTooltip = () => onSwitchView("tooltip");
  const handleSwitchToModal = () => onSwitchView("modal");

  const modalOrTooltip =
    viewMode === "modal" ? (
      <TourModal
        step={step}
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        onNext={onNext}
        onPrev={onPrev}
        onClose={onClose}
        onGoToStep={onGoToStep}
        onSwitchToTooltip={handleSwitchToTooltip}
        portalContainer={portalContainer}
        position={modalPosition}
      />
    ) : (
      <TourTooltip
        key={step.id}
        step={step}
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        onNext={onNext}
        onPrev={onPrev}
        onClose={onClose}
        onGoToStep={onGoToStep}
        onSwitchToModal={handleSwitchToModal}
        portalContainer={portalContainer}
      />
    );

  return (
    <>
      {/* Overlay portals to document.body to cover entire viewport */}
      {typeof document !== "undefined" &&
        createPortal(overlay, document.body)}

      {/* Modal/Tooltip portals to shadow root (or stays inline) for Tailwind styles */}
      {portalContainer
        ? createPortal(modalOrTooltip, portalContainer)
        : modalOrTooltip}
    </>
  );
}
