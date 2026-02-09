import { Hono } from "hono";

import { clerkWebhookRoutes } from "./clerk.webhook";
import { loopsWebhookRoutes } from "./loops.webhook";
import { stripeWebhookRoutes } from "./stripe.webhook";

export const webhookRoutes = new Hono()
  .basePath("/api/webhooks")
  .route("/clerk", clerkWebhookRoutes)
  .route("/loops", loopsWebhookRoutes)
  .route("/stripe", stripeWebhookRoutes);
