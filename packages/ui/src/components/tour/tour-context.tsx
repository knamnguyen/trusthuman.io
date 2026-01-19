"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { TourContextValue, TourProviderProps } from "./types";
import { TourLayer } from "./tour-layer";

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({
  flows,
  onStepChange,
  onTourEnd,
  children,
  portalContainer,
}: TourProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"tooltip" | "modal">("modal");

  const currentFlow = useMemo(
    () => flows.find((f) => f.id === currentFlowId),
    [flows, currentFlowId],
  );
  const currentStep = currentFlow?.steps[currentStepIndex];
  const totalSteps = currentFlow?.steps.length ?? 0;

  // Track which step's onBeforeStep has been executed
  const executedBeforeStepRef = useRef<string | null>(null);

  // Execute onBeforeStep when step changes
  useEffect(() => {
    if (!isActive || !currentFlow) return;

    const step = currentFlow.steps[currentStepIndex];
    if (!step) return;

    const stepKey = `${currentFlowId}-${currentStepIndex}`;
    if (executedBeforeStepRef.current === stepKey) return; // Already executed

    executedBeforeStepRef.current = stepKey;

    if (step.onBeforeStep) {
      // Run the before step action (supports async)
      step
        .onBeforeStep({ shadowRoot: portalContainer })
        ?.catch?.((err: unknown) => {
          console.error("Tour onBeforeStep error:", err);
        });
    }
  }, [isActive, currentFlowId, currentStepIndex, currentFlow, portalContainer]);

  const startTour = useCallback(
    async (flowId: string) => {
      const flow = flows.find((f) => f.id === flowId);
      if (!flow || flow.steps.length === 0) return;

      // Run flow's onBeforeTour callback (e.g., open sidebar, navigate)
      if (flow.onBeforeTour) {
        await flow.onBeforeTour({ shadowRoot: portalContainer });
      }

      setCurrentFlowId(flowId);
      setCurrentStepIndex(0);
      setViewMode(flow.steps[0]?.preferredView ?? "modal");
      setIsActive(true);
      onStepChange?.(flowId, 0);
    },
    [flows, portalContainer, onStepChange],
  );

  const endTour = useCallback(
    (completed = false) => {
      if (currentFlowId) {
        onTourEnd?.(currentFlowId, completed);
      }
      setIsActive(false);
      setCurrentFlowId(null);
      setCurrentStepIndex(0);
    },
    [currentFlowId, onTourEnd],
  );

  const nextStep = useCallback(() => {
    if (!currentFlow) return;

    if (currentStepIndex < currentFlow.steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      // Keep current view mode - user's preference persists across steps
      onStepChange?.(currentFlow.id, newIndex);
    } else {
      endTour(true);
    }
  }, [currentFlow, currentStepIndex, onStepChange, endTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      // Keep current view mode - user's preference persists across steps
      if (currentFlow) {
        onStepChange?.(currentFlow.id, newIndex);
      }
    }
  }, [currentFlow, currentStepIndex, onStepChange]);

  const goToStep = useCallback(
    (index: number) => {
      if (!currentFlow || index < 0 || index >= currentFlow.steps.length)
        return;
      setCurrentStepIndex(index);
      // Keep current view mode - user's preference persists across steps
      onStepChange?.(currentFlow.id, index);
    },
    [currentFlow, onStepChange],
  );

  const switchView = useCallback((mode: "tooltip" | "modal") => {
    setViewMode(mode);
  }, []);

  const contextValue = useMemo<TourContextValue>(
    () => ({
      isActive,
      currentFlowId,
      currentStepIndex,
      viewMode,
      currentStep,
      totalSteps,
      startTour,
      endTour,
      nextStep,
      prevStep,
      goToStep,
      switchView,
    }),
    [
      isActive,
      currentFlowId,
      currentStepIndex,
      viewMode,
      currentStep,
      totalSteps,
      startTour,
      endTour,
      nextStep,
      prevStep,
      goToStep,
      switchView,
    ],
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {isActive && currentStep && (
        <TourLayer
          step={currentStep}
          currentIndex={currentStepIndex}
          totalSteps={totalSteps}
          viewMode={viewMode}
          onNext={nextStep}
          onPrev={prevStep}
          onClose={() => endTour(false)}
          onGoToStep={goToStep}
          onSwitchView={switchView}
          portalContainer={portalContainer}
          modalPosition={currentFlow?.defaultModalPosition}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within TourProvider");
  }
  return context;
}
