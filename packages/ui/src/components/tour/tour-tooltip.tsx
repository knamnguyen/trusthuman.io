"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "../../utils";
import { Button } from "../../ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../../ui/popover";
import { TourProgress } from "./tour-progress";
import type { TourStep } from "./types";

interface TourTooltipProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onGoToStep: (index: number) => void;
  onSwitchToModal?: () => void;
  portalContainer?: HTMLElement | null;
}

export function TourTooltip({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  onGoToStep,
  onSwitchToModal,
  portalContainer,
}: TourTooltipProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Get the primary selector (first one if array)
  const primarySelector = Array.isArray(step.selector)
    ? step.selector[0]
    : step.selector;

  useEffect(() => {
    if (!primarySelector) return;

    const updatePosition = () => {
      let element: Element | null = null;
      if (portalContainer) {
        element = portalContainer.querySelector(primarySelector);
      }
      element ??= document.querySelector(primarySelector);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [primarySelector, portalContainer]);

  if (!targetRect) return null;

  return (
    <Popover open>
      <PopoverAnchor
        style={{
          position: "fixed",
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + 8,
          width: 0,
          height: 0,
        }}
      />
      <PopoverContent
        className={cn(
          "z-[100000] w-[320px] rounded-xl bg-background p-4",
          "shadow-[0_10px_40px_rgba(0,0,0,0.15)]",
          "border-none",
        )}
        sideOffset={8}
        collisionPadding={16}
        container={portalContainer}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center",
            "rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600",
            "transition-colors",
          )}
        >
          <X size={14} />
        </button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="font-semibold text-neutral-900">{step.title}</h3>
          {step.subtitle && (
            <p className="mt-1 text-sm text-neutral-600">{step.subtitle}</p>
          )}
          {step.content && (
            <div className="mt-2 text-xs text-neutral-500">{step.content}</div>
          )}
        </div>

        {/* Footer - Navigation Row */}
        <div className="mt-4 flex items-center justify-between">
          {/* Left spacer for balance */}
          <div className="w-7" />

          {/* Center: Navigation */}
          <div className="flex items-center gap-2">
            {/* Back Button */}
            <Button
              size="sm"
              onClick={onPrev}
              className="h-7 w-7 p-0"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Progress Dots */}
            <TourProgress
              current={currentIndex}
              total={totalSteps}
              onDotClick={onGoToStep}
              size="sm"
            />

            {/* Next Button */}
            <Button size="sm" onClick={onNext} className="h-7 w-7 p-0">
              {currentIndex === totalSteps - 1 ? (
                <span className="text-[10px]">Done</span>
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Right: Expand Button */}
          {onSwitchToModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToModal}
              className="h-7 w-7 p-0"
              title="Switch to modal view"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {!onSwitchToModal && <div className="w-7" />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
