import { PostHog } from "posthog-js/dist/module.no-external";

// Additional features (import only what you need in a given context)
import "posthog-js/dist/posthog-recorder"; // For session replay
import "posthog-js/dist/exception-autocapture"; // For error tracking
import "posthog-js/dist/tracing-headers"; // For tracking across client and server
import "posthog-js/dist/web-vitals"; // For web vitals tracking

import { useEffect } from "react";

export const posthog = new PostHog();

export function useInitPosthog() {
  const { user } = useBackgroundAuth();

  useEffect(() => {
    if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_POSTHOG) {
      return;
    }

    if (import.meta.env.VITE_POSTHOG_API_KEY === undefined) {
      console.warn(
        "PostHog API key is not defined. Skipping PostHog initialization.",
      );
      return;
    }

    posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
      disable_session_recording: true,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      error_tracking: {
        captureExtensionExceptions: true,
      },
    });
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_POSTHOG) {
      return;
    }

    if (user === null) {
      return;
    }

    posthog.identify(user.id, {
      email: user.emailAddress,
    });
  }, [user]);
}
