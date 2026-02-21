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
  | "streak";

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
};

interface TrissToastContentProps {
  message: string;
  emoji: string;
  logoUrl?: string;
}

function TrissToastContent({ message, emoji, logoUrl }: TrissToastContentProps) {
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
      <p className="flex-1 text-sm text-foreground">{message}</p>
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
  streakCount?: number
): void {
  if (currentToastId !== undefined) {
    toast.dismiss(currentToastId);
  }

  const config = TRISS_TOAST_CONFIG[state];
  let message = customMessage ?? config.message;

  if (state === "streak" && streakCount) {
    message = `${streakCount}-${message}`;
  }

  currentToastId = toast.custom(
    () => <TrissToastContent message={message} emoji={config.emoji} logoUrl={trissLogoUrl} />,
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
