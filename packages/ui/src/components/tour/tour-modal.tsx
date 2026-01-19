"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Play,
  X,
} from "lucide-react";

import type { ModalPosition, TourStep } from "./types";
import { Button } from "../../ui/button";
import { cn } from "../../utils";
import { SimulatedElement } from "./simulated-element";
import { TourProgress } from "./tour-progress";
import { getPositionTransform } from "./utils/modal-position";
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from "./utils/youtube";

interface TourModalProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onGoToStep: (index: number) => void;
  onSwitchToTooltip?: () => void;
  /** Shadow root for simulated elements context */
  portalContainer?: HTMLElement | null;
  /** Modal position (default: "center-center") */
  position?: ModalPosition;
}

export function TourModal({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  onGoToStep,
  onSwitchToTooltip,
  portalContainer,
  position = "center-center",
}: TourModalProps) {
  const [isWatchingTutorial, setIsWatchingTutorial] = useState(false);
  const [showPreviewVideo, setShowPreviewVideo] = useState(false);

  // Reset video state when step changes
  useEffect(() => {
    setIsWatchingTutorial(false);
    setShowPreviewVideo(false);

    // Delay showing preview iframe to let it load behind the thumbnail
    // This hides the black loading screen that appears before video plays
    const timer = setTimeout(() => {
      setShowPreviewVideo(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [step.id]);

  const hasPreviewVideo = !!step.previewVideo;
  const hasTutorialVideo = !!step.tutorialVideo;
  const hasAnyVideo = hasPreviewVideo || hasTutorialVideo;

  // Get position transform for the modal
  const positionStyles = getPositionTransform(position);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100000]">
      <div
        className={cn(
          "pointer-events-auto absolute w-[680px] max-w-[92vw] overflow-hidden rounded-[22px] bg-background",
          "shadow-[0_22px_60px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]",
        )}
        style={{
          left: positionStyles.left,
          top: positionStyles.top,
          transform: positionStyles.transform,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-3 left-3 z-[70] inline-flex h-8 w-8 items-center justify-center",
            "rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
            "transition-colors",
          )}
        >
          <X size={18} />
        </button>

        {/* Video Hero Section */}
        {hasAnyVideo && (
          <div
            className="relative h-[360px] w-full overflow-hidden bg-neutral-100 bg-cover bg-center"
            style={{
              // Show thumbnail while iframe loads to avoid black flash
              backgroundImage: hasPreviewVideo
                ? `url(${getYouTubeThumbnailUrl(step.previewVideo!)})`
                : undefined,
            }}
          >
            {!isWatchingTutorial && hasPreviewVideo ? (
              <>
                {/* Scale 1.5x to crop YouTube UI (title bar, progress indicator) */}
                {/* Fade in after delay to hide black loading screen */}
                <iframe
                  src={getYouTubeEmbedUrl(step.previewVideo!, {
                    autoplay: true,
                    loop: true,
                    muted: true,
                    controls: false,
                    minimal: true,
                  })}
                  className={cn(
                    "absolute inset-0 h-full w-full scale-150 transition-opacity duration-500",
                    showPreviewVideo ? "opacity-100" : "opacity-0",
                  )}
                  style={{ pointerEvents: "none" }}
                  allow="autoplay; encrypted-media"
                  title={`${step.title} preview`}
                />
                {hasTutorialVideo && (
                  <button
                    onClick={() => setIsWatchingTutorial(true)}
                    className={cn(
                      "absolute bottom-20 left-1/2 z-20 -translate-x-1/2",
                      "flex items-center gap-2 rounded-full px-4 py-2",
                      "bg-black/70 text-white backdrop-blur-sm",
                      "transition-colors hover:bg-black/80",
                    )}
                  >
                    <Play className="h-4 w-4" />
                    Watch Tutorial
                  </button>
                )}
              </>
            ) : hasTutorialVideo ? (
              <>
                <iframe
                  src={getYouTubeEmbedUrl(step.tutorialVideo!, {
                    autoplay: true,
                    controls: true,
                  })}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  title={`${step.title} tutorial`}
                />
                {hasPreviewVideo && (
                  <button
                    onClick={() => setIsWatchingTutorial(false)}
                    className={cn(
                      "absolute top-4 right-4 z-20",
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
                      "bg-black/70 text-white backdrop-blur-sm",
                      "transition-colors hover:bg-black/80",
                    )}
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Preview
                  </button>
                )}
              </>
            ) : null}

            {/* Gradient scrim to blend video into content - only show for preview, not tutorial */}
            {!isWatchingTutorial && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[120px]"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
                }}
              />
            )}
          </div>
        )}

        {/* Content Section */}
        <div
          className={cn("px-6 pt-4 pb-2 text-center", !hasAnyVideo && "pt-12")}
        >
          <h2 className="text-2xl font-bold text-neutral-900">{step.title}</h2>
          {step.subtitle && (
            <p className="mt-2 text-base text-neutral-600">{step.subtitle}</p>
          )}
          {step.content && (
            <div className="mt-4 text-sm text-neutral-500">{step.content}</div>
          )}

          {/* Simulated Elements */}
          {step.simulateSelectors && step.simulateSelectors.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {step.simulateSelectors.map((selector) => (
                <SimulatedElement
                  key={selector}
                  selector={selector}
                  shadowRoot={portalContainer}
                  animated={step.simulateSelectorsAnimated}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-6 pt-4 pb-6">
          {/* Navigation Row */}
          <div className="flex items-center justify-between">
            {/* Left spacer for balance */}
            <div className="w-8" />

            {/* Center: Navigation */}
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <Button
                size="sm"
                onClick={onPrev}
                className="h-8 w-8 p-0"
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Progress Dots */}
              <TourProgress
                current={currentIndex}
                total={totalSteps}
                onDotClick={onGoToStep}
              />

              {/* Next Button */}
              <Button size="sm" onClick={onNext} className="h-8 w-8 p-0">
                {currentIndex === totalSteps - 1 ? (
                  <span className="text-xs">Done</span>
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Right: Minimize Button */}
            {onSwitchToTooltip && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToTooltip}
                className="h-8 w-8 p-0"
                title="Switch to tooltip view"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            {!onSwitchToTooltip && <div className="w-8" />}
          </div>
        </div>
      </div>
    </div>
  );
}
