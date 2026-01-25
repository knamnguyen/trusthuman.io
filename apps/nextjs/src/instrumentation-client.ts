import posthog from "posthog-js";

import { env } from "./env";

posthog.init(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
  api_host: "https://pp.engagekit.io",
  ui_host: "https://us.posthog.com",
  defaults: "2025-11-30",
  capture_pageview: true,
  capture_pageleave: false,
});
