"use client";

import { toast } from "sonner";

export type TrissState =
  | "idle"
  | "typing"
  | "submitted"
  | "capturing"
  | "verifying"
  | "verified"
  | "not_verified"
  | "photo_deleted"
  | "streak"
  | "camera_needed";

interface TrissToastConfig {
  message: string;
  emoji: string;
  duration: number; // ms, 0 = persistent (Infinity)
}

export const TRISS_TOAST_CONFIG: Record<TrissState, TrissToastConfig> = {
  idle: {
    message: "Waiting for your next post!",
    emoji: "😊",
    duration: 0,
  },
  typing: {
    message: "Ooh, you're writing something!",
    emoji: "⌨️",
    duration: 0,
  },
  submitted: {
    message: "Nice! You posted!",
    emoji: "🚀",
    duration: 3000,
  },
  capturing: {
    message: "Quick pic to verify you're there!",
    emoji: "📸",
    duration: 2000,
  },
  verifying: {
    message: "Checking if you're human...",
    emoji: "🔍",
    duration: 0,
  },
  verified: {
    message: "You're human! Badge earned!",
    emoji: "✅",
    duration: 4000,
  },
  not_verified: {
    message: "Hmm, couldn't see you. Try again?",
    emoji: "❓",
    duration: 4000,
  },
  photo_deleted: {
    message: "Photo deleted! Privacy safe!",
    emoji: "🗑️",
    duration: 3000,
  },
  streak: {
    message: "day streak! You're on fire!",
    emoji: "🔥",
    duration: 5000,
  },
  camera_needed: {
    message: "Camera access needed to verify",
    emoji: "📷",
    duration: 0, // Persistent until user acts
  },
};

interface TrissToastContentProps {
  message: string;
  emoji: string;
  logoUrl?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

function TrissToastContent({ message, emoji, logoUrl, actionButton }: TrissToastContentProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Triss"
          className="h-10 w-10 flex-shrink-0 animate-wiggle"
        />
      ) : (
        <div className="h-10 w-10 flex-shrink-0 animate-wiggle rounded-full bg-primary" />
      )}
      <div className="flex-1">
        <p className="text-sm text-foreground">{message}</p>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="mt-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {actionButton.label}
          </button>
        )}
      </div>
      <span className="flex-shrink-0 text-xl animate-wiggle-emoji">{emoji}</span>
    </div>
  );
}

// Track current toast ID for dismissal
let currentToastId: string | number | undefined;

// Store logo URL for use in toasts
let trissLogoUrl: string | undefined;

/**
 * Set the Triss logo URL for toast notifications.
 * Call this once on app init with the URL to your logo.
 */
export function setTrissLogoUrl(url: string): void {
  trissLogoUrl = url;
}

/**
 * Show a Triss toast notification.
 * Uses sonner's toast.custom() - requires <ToasterSimple /> in your app.
 */
export function showTrissToast(
  state: TrissState,
  customMessage?: string,
  streakCountOrAction?: number | { label: string; onClick: () => void }
): void {
  if (currentToastId !== undefined) {
    toast.dismiss(currentToastId);
  }

  const config = TRISS_TOAST_CONFIG[state];
  let message = customMessage ?? config.message;

  // Handle streak count for backward compatibility
  if (state === "streak" && typeof streakCountOrAction === "number") {
    message = `${streakCountOrAction}-${message}`;
  }

  // Handle action button
  const actionButton = typeof streakCountOrAction === "object" ? streakCountOrAction : undefined;

  currentToastId = toast.custom(
    () => <TrissToastContent message={message} emoji={config.emoji} logoUrl={trissLogoUrl} actionButton={actionButton} />,
    {
      duration: config.duration === 0 ? Infinity : config.duration,
      unstyled: true,
    }
  );
}

/**
 * Hide the current Triss toast.
 */
export function hideTrissToast(): void {
  if (currentToastId !== undefined) {
    toast.dismiss(currentToastId);
    currentToastId = undefined;
  }
}
