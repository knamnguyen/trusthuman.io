import posthog from "posthog-js";

import { env } from "./env";

console.info("wasup doing this shit now");

posthog.init(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
  api_host: "https://us.i.posthog.com",
  defaults: "2025-11-30",
  capture_pageview: true,
  capture_pageleave: false,
});
