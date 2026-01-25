import { PostHog } from "posthog-js/dist/module.no-external";

// Additional features (import only what you need in a given context)
import "posthog-js/dist/posthog-recorder"; // For session replay
import "posthog-js/dist/exception-autocapture"; // For error tracking
import "posthog-js/dist/tracing-headers"; // For tracking across client and server
import "posthog-js/dist/web-vitals"; // For web vitals tracking

import { useEffect } from "react";

import { useBackgroundAuth } from "../hooks/use-background-auth";

export const posthog = new PostHog();

async function getDistinctId() {
  const stored = await chrome.storage.local.get(["posthog_distinct_id"]);
  if (stored.posthog_distinct_id) {
    return stored.posthog_distinct_id;
  } else {
    const newId = crypto.randomUUID();
    await chrome.storage.local.set({ posthog_distinct_id: newId });
    return newId;
  }
}

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

    async function init() {
      posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
        bootstrap: {
          distinctID: await getDistinctId(),
        },
        disable_session_recording: true,
        api_host: "https://pp.engagekit.io",
        ui_host: "https://us.posthog.com",
        disable_external_dependency_loading: true,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: true,
        error_tracking: {
          captureExtensionExceptions: true,
        },
      });

      posthog.capture("extension:initialized:v1");
    }

    void init();
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
