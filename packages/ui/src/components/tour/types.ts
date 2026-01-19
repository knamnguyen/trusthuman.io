import type { ReactNode } from "react";

/**
 * Modal position on the screen (9-position grid).
 * Used to set a default position for the entire flow.
 */
export type ModalPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center-center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface TourStep {
  id: string;
  selector: string | string[]; // Single selector OR array for multi-highlight

  // Content
  title: string;
  subtitle?: string;
  content?: ReactNode; // Additional content below subtitle

  // Video (optional - for modal view)
  previewVideo?: string; // YouTube URL for 5-10s loop
  tutorialVideo?: string; // YouTube URL for full tutorial

  // Display mode
  preferredView: "tooltip" | "modal"; // Which view to show first

  // Interaction
  /** Action to run before this step is shown (e.g., click an element, navigate) */
  onBeforeStep?: (context: {
    shadowRoot?: Element | DocumentFragment | null;
  }) => void | Promise<void>;
  /** Allow clicking through to highlighted elements (default: false) */
  allowInteraction?: boolean;

  // Simulated elements (optional)
  /**
   * Selectors for elements to clone and render interactively in the modal.
   * Clicking these clones will trigger the same action on the original elements.
   */
  simulateSelectors?: string[];
  /**
   * If true, show a ghost cursor animation from the simulated element to the
   * real element before triggering the interaction.
   */
  simulateSelectorsAnimated?: boolean;
}

export interface TourFlow {
  id: string;
  name: string; // For debugging/analytics
  steps: TourStep[];
  /** Default modal position for all steps in this flow (default: "center-center") */
  defaultModalPosition?: ModalPosition;
}

export interface TourContextValue {
  // State
  isActive: boolean;
  currentFlowId: string | null;
  currentStepIndex: number;
  viewMode: "tooltip" | "modal";
  currentStep: TourStep | undefined;
  totalSteps: number;

  // Actions
  startTour: (flowId: string) => void;
  endTour: (completed?: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  switchView: (mode: "tooltip" | "modal") => void;
}

export interface TourProviderProps {
  flows: TourFlow[];
  onStepChange?: (flowId: string, stepIndex: number) => void;
  onTourEnd?: (flowId: string, completed: boolean) => void;
  children: ReactNode;
  /** Container element for portals (required for shadow DOM contexts like browser extensions) */
  portalContainer?: HTMLElement | null;
}
