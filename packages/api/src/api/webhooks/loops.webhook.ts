// packages/api/src/api/webhooks/loops.webhook.ts
import crypto from "crypto";
import { Hono } from "hono";

import { db } from "@sassy/db";

import { env } from "../../utils/env";

/**
 * Loops webhook handler
 * Handles email subscription events from Loops
 *
 * Events handled:
 * - contact.unsubscribed: User unsubscribed via email link
 *
 * Setup in Loops Dashboard:
 * 1. Go to Settings > Webhooks
 * 2. Add webhook endpoint: https://your-domain.com/api/webhooks/loops
 * 3. Copy the signing secret to LOOPS_WEBHOOK_SECRET env var
 * 4. Enable "contact.unsubscribed" event
 */

interface LoopsContactIdentity {
  id: string;
  email: string;
  userId?: string;
}

interface LoopsWebhookEvent {
  type: string;
  contactIdentity: LoopsContactIdentity;
}

/**
 * Verify Loops webhook signature
 * Uses HMAC-SHA256 with the signing secret
 */
function verifyLoopsSignature(
  body: string,
  signature: string,
  webhookId: string,
  timestamp: string,
  secret: string,
): boolean {
  try {
    // Decode the signing secret (format: whsec_BASE64)
    const secretParts = secret.split("_");
    const secretBase64 = secretParts.length > 1 ? secretParts[1] : secret;
    const decodedSecret = Buffer.from(secretBase64!, "base64");

    // Create the signed content: eventId.timestamp.body
    const signedContent = `${webhookId}.${timestamp}.${body}`;

    // Generate HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", decodedSecret)
      .update(signedContent)
      .digest("base64");

    // Signature header contains space-separated list of signatures (v1,signature)
    // Check if our computed signature matches any of them
    const signatures = signature.split(" ");
    for (const sig of signatures) {
      const [, sigValue] = sig.split(",");
      if (sigValue === expectedSignature) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error verifying Loops signature:", error);
    return false;
  }
}

export const loopsWebhookRoutes = new Hono().post("/", async (c) => {
  try {
    console.log("Loops webhook received");

    // Check if webhook secret is configured
    if (!env.LOOPS_WEBHOOK_SECRET) {
      console.warn("LOOPS_WEBHOOK_SECRET not configured, skipping signature verification");
    }

    const body = await c.req.text();
    const signature = c.req.header("webhook-signature");
    const webhookId = c.req.header("webhook-id");
    const timestamp = c.req.header("webhook-timestamp");

    // Verify signature if secret is configured
    if (env.LOOPS_WEBHOOK_SECRET) {
      if (!signature || !webhookId || !timestamp) {
        console.error("Missing webhook headers");
        return c.text("Missing webhook headers", { status: 400 });
      }

      const isValid = verifyLoopsSignature(
        body,
        signature,
        webhookId,
        timestamp,
        env.LOOPS_WEBHOOK_SECRET,
      );

      if (!isValid) {
        console.error("Invalid webhook signature");
        return c.text("Invalid signature", { status: 401 });
      }
    }

    // Parse the event
    const event = JSON.parse(body) as LoopsWebhookEvent;
    console.log("Loops event type:", event.type);

    switch (event.type) {
      case "contact.unsubscribed": {
        const { email } = event.contactIdentity;

        if (!email) {
          console.error("contact.unsubscribed: Missing email in payload");
          break;
        }

        // Find user by email and update their email preferences
        const user = await db.user.findFirst({
          where: { primaryEmailAddress: email },
          select: { id: true },
        });

        if (!user) {
          console.log(`contact.unsubscribed: No user found for email ${email}`);
          break;
        }

        // Update or create email preferences with weeklyAnalyticsEnabled = false
        await db.userEmailPreferences.upsert({
          where: { userId: user.id },
          update: { weeklyAnalyticsEnabled: false },
          create: {
            userId: user.id,
            weeklyAnalyticsEnabled: false,
          },
        });

        console.log(`✅ contact.unsubscribed: Disabled weekly analytics for ${email}`);
        break;
      }

      default:
        console.log(`Unhandled Loops event type: ${event.type}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Loops webhook error:", error);
    return c.text(
      "Webhook error: " +
        (error instanceof Error ? error.message : "Unknown error"),
      { status: 500 },
    );
  }
});
