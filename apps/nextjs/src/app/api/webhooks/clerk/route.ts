import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

import type { Prisma } from "@sassy/db";
import { db } from "@sassy/db";

/**
 * Clerk webhook handler
 * This receives events from Clerk when users are created, updated, or deleted
 * It syncs the user data to our database
 */

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Clerk webhook received");

    // Debug environment variables
    console.log("🔍 Environment variables check:");
    console.log(
      "- CLERK_WEBHOOK_SECRET:",
      process.env.CLERK_WEBHOOK_SECRET ? "✅ Present" : "❌ Missing",
    );
    console.log(
      "- CLERK_WEBHOOK_SIGNING_SECRET:",
      process.env.CLERK_WEBHOOK_SIGNING_SECRET ? "✅ Present" : "❌ Missing",
    );

    // Set the environment variable that Clerk expects for webhook verification
    if (
      !process.env.CLERK_WEBHOOK_SIGNING_SECRET &&
      process.env.CLERK_WEBHOOK_SECRET
    ) {
      console.log(
        "🔧 Setting CLERK_WEBHOOK_SIGNING_SECRET from CLERK_WEBHOOK_SECRET",
      );
      process.env.CLERK_WEBHOOK_SIGNING_SECRET =
        process.env.CLERK_WEBHOOK_SECRET;
    }

    // Debug headers
    console.log("🔍 Request headers:");
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log("- All headers:", JSON.stringify(allHeaders, null, 2));

    // Check for Svix headers specifically (these are what Clerk actually uses)
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    console.log("🔍 Svix headers check:");
    console.log("- svix-id:", svixId ? "✅ Present" : "❌ Missing");
    console.log(
      "- svix-timestamp:",
      svixTimestamp ? "✅ Present" : "❌ Missing",
    );
    console.log(
      "- svix-signature:",
      svixSignature ? "✅ Present" : "❌ Missing",
    );

    console.log("🔧 Attempting webhook verification...");

    // Verify the webhook using Clerk's verifyWebhook function
    // This function expects Svix headers and will consume the request body
    const evt = await verifyWebhook(req);

    console.log("✅ Webhook verification successful!");

    // Extract event data from the verified webhook
    const { type: eventType, data } = evt;
    console.log(`📨 Received webhook with event type: ${eventType}`);
    console.log("📊 Event data:", JSON.stringify(data, null, 2));

    // Handle different event types
    switch (eventType) {
      case "user.created": {
        console.log("👤 Processing user.created event");

        // Extract user data from Clerk webhook
        const userId = data.id;
        const primaryEmail = data.email_addresses?.find(
          (email) => email.id === data.primary_email_address_id,
        )?.email_address;

        console.log(`- User ID: ${userId}`);
        console.log(`- Primary email: ${primaryEmail}`);

        if (!primaryEmail) {
          console.error("❌ No primary email found for user:", userId);
          return new NextResponse("No primary email found", { status: 400 });
        }

        console.log("💾 Creating/updating user in database...");

        // Create user in database using upsert to handle potential duplicates
        await db.user.upsert({
          where: { id: userId },
          update: {
            firstName: data.first_name,
            lastName: data.last_name,
            username: data.username,
            primaryEmailAddress: primaryEmail,
            imageUrl: data.image_url,
            clerkUserProperties: data as unknown as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
          create: {
            id: userId,
            firstName: data.first_name,
            lastName: data.last_name,
            username: data.username,
            primaryEmailAddress: primaryEmail,
            imageUrl: data.image_url,
            clerkUserProperties: data as unknown as Prisma.InputJsonValue,
          },
        });

        console.log(`✅ User created/updated in database: ${userId}`);
        break;
      }

      case "user.updated": {
        console.log("👤 Processing user.updated event");

        // Extract user data from Clerk webhook
        const userId = data.id;
        const primaryEmail = data.email_addresses?.find(
          (email) => email.id === data.primary_email_address_id,
        )?.email_address;

        console.log(`- User ID: ${userId}`);
        console.log(`- Primary email: ${primaryEmail}`);

        if (!primaryEmail) {
          console.error("❌ No primary email found for user:", userId);
          return new NextResponse("No primary email found", { status: 400 });
        }

        console.log("💾 Updating user in database...");

        // Update user in database
        await db.user.update({
          where: { id: userId },
          data: {
            firstName: data.first_name,
            lastName: data.last_name,
            username: data.username,
            primaryEmailAddress: primaryEmail,
            imageUrl: data.image_url,
            clerkUserProperties: data as unknown as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ User updated in database: ${userId}`);
        break;
      }

      case "user.deleted": {
        console.log("👤 Processing user.deleted event");

        // Extract user ID from Clerk webhook
        const userId = data.id;
        console.log(`- User ID: ${userId}`);

        console.log("🗑️ Deleting user from database...");

        // Delete user from database
        await db.user.delete({
          where: { id: userId },
        });

        console.log(`✅ User deleted from database: ${userId}`);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`);
        break;
    }

    console.log("🎉 Clerk webhook processed successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Clerk webhook error:", error);
    console.error("📋 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new NextResponse(
      "Webhook error: " +
        (error instanceof Error ? error.message : "Unknown error"),
      { status: 400 },
    );
  }
}

// Ensure this route is always dynamically evaluated
export const dynamic = "force-dynamic";
