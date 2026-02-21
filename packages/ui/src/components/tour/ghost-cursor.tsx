"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface GhostCursorProps {
  /** Starting position (center of clicked element) */
  from: { x: number; y: number };
  /** Ending position (center of target element) */
  to: { x: number; y: number };
  /** Called when animation completes */
  onComplete: () => void;
  /** Animation duration in ms */
  duration?: number;
}

/**
 * Animated ghost cursor that moves from one point to another.
 * Used to show the connection between simulated elements and their real counterparts.
 */
export function GhostCursor({
  from,
  to,
  onComplete,
  duration = 1000,
}: GhostCursorProps) {
  const [position, setPosition] = useState(from);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Start animation after a brief delay for the cursor to appear
    const startDelay = setTimeout(() => {
      setPosition(to);
    }, 50);

    // Fade out near the end
    const fadeTimeout = setTimeout(() => {
      setOpacity(0);
    }, duration - 150);

    // Complete callback after animation
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(fadeTimeout);
      clearTimeout(completeTimeout);
    };
  }, [from, to, duration, onComplete]);

  // All styles are inline because this portals to document.body (outside shadow DOM/Tailwind)
  const cursor = (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        transition: `left ${duration - 100}ms cubic-bezier(0.4, 0, 0.2, 1), top ${duration - 100}ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease-out`,
        opacity,
        pointerEvents: "none",
        zIndex: 100001,
      }}
    >
      {/* Outer pulse ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "rgba(76, 159, 65, 0.2)", // primary color with opacity
          animation: "ghost-cursor-pulse 0.8s ease-out infinite",
        }}
      />
      {/* Inner cursor dot */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: "#4c9f41", // primary color
          boxShadow: "0 0 12px 4px rgba(76, 159, 65, 0.4)",
        }}
      />
      {/* Cursor pointer shape */}
      <svg
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-25%, -25%)",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        }}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 4L10.5 20L13 13L20 10.5L4 4Z"
          fill="white"
          stroke="#4c9f41"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  // Portal to document.body to ensure it's above everything
  if (typeof document === "undefined") return null;
  return createPortal(cursor, document.body);
}

/**
 * CSS keyframes for the pulse animation.
 * This should be added to the global styles or injected once.
 */
export function injectGhostCursorStyles() {
  if (typeof document === "undefined") return;

  const styleId = "ghost-cursor-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes ghost-cursor-pulse {
      0% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0.6;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0.3;
      }
      100% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0.6;
      }
    }
  `;
  document.head.appendChild(style);
}
