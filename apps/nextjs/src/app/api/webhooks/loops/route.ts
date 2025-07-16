import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
// @ts-expect-error - 'loops' has no type declarations yet
import { LoopsClient } from "loops";

// Create a single Loops client instance (server-side only)
const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

/**
 * Clerk → Loops sync webhook
 *
 * This endpoint is configured in Clerk to receive only `user.created` events.
 * When a new user signs up we create (or update) a contact in Loops so they
 * immediately become an email subscriber.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the Clerk webhook (Svix) signature using the dedicated Loops secret
    if (process.env.CLERK_WEBHOOK_LOOPS_SECRET) {
      process.env.CLERK_WEBHOOK_SIGNING_SECRET =
        process.env.CLERK_WEBHOOK_LOOPS_SECRET;
    }

    const evt = await verifyWebhook(req);

    if (evt.type !== "user.created") {
      return NextResponse.json({ ignored: true });
    }

    const data = evt.data;

    const primaryEmail = data.email_addresses?.find(
      (email) => email.id === data.primary_email_address_id,
    )?.email_address;

    if (!primaryEmail) {
      return new NextResponse("No primary email found", { status: 400 });
    }

    // Upsert the contact in Loops – `updateContact` will create if missing
    const resp = await loops.updateContact(primaryEmail, {
      userId: data.id,
      firstName: data.first_name ?? undefined,
      lastName: data.last_name ?? undefined,
      source: "clerk-signup",
    });

    if (!resp.success) {
      console.error("Loops updateContact failed", resp);
      return new NextResponse("Loops error", { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Loops webhook error", error);
    return new NextResponse(
      "Webhook error: " + (error instanceof Error ? error.message : "Unknown"),
      { status: 400 },
    );
  }
}

// Ensure this route is always evaluated dynamically (no Next.js caching)
export const dynamic = "force-dynamic";
