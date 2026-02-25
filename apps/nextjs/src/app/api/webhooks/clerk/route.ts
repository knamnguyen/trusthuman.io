import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

import { db } from "@sassy/db";

/**
 * Clerk webhook handler for TrustHuman
 * Syncs user data from Clerk to our database
 *
 * Events handled:
 * - user.created: Create user in database
 * - user.updated: Update user in database
 * - user.deleted: Delete user from database (cascade deletes TrustProfile, etc.)
 */

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Clerk webhook received");

    // Set the environment variable that Clerk expects for webhook verification
    if (
      !process.env.CLERK_WEBHOOK_SIGNING_SECRET &&
      process.env.CLERK_WEBHOOK_SECRET
    ) {
      process.env.CLERK_WEBHOOK_SIGNING_SECRET =
        process.env.CLERK_WEBHOOK_SECRET;
    }

    // Verify the webhook using Clerk's verifyWebhook function
    const evt = await verifyWebhook(req);
    const { type: eventType, data } = evt;
    console.log(`📨 Received webhook: ${eventType}`);

    switch (eventType) {
      case "user.created": {
        console.log("👤 Processing user.created event");

        const userId = data.id;
        const primaryEmail = data.email_addresses?.find(
          (email) => email.id === data.primary_email_address_id,
        )?.email_address;

        if (!primaryEmail) {
          console.error("❌ No primary email found for user:", userId);
          return new NextResponse("No primary email found", { status: 400 });
        }

        // Create user in database
        const user = await db.user.upsert({
          where: { id: userId },
          update: {
            email: primaryEmail,
            firstName: data.first_name,
            lastName: data.last_name,
            username: data.username,
            imageUrl: data.image_url,
          },
          create: {
            id: userId,
            email: primaryEmail,
            firstName: data.first_name,
            lastName: data.last_name,
            username: data.username,
            imageUrl: data.image_url,
          },
        });

        // Also create TrustProfile at signup so user can visit their profile page
        // Username comes from Clerk (set during signup)
        const clerkUsername = data.username;
        if (clerkUsername) {
          // Check if username is available, append number if not
          let profileUsername = clerkUsername;
          let counter = 1;
          while (await db.trustProfile.findUnique({ where: { username: profileUsername } })) {
            profileUsername = `${clerkUsername}${counter}`;
            counter++;
          }

          await db.trustProfile.upsert({
            where: { userId: userId },
            update: {}, // No update needed if exists
            create: {
              userId: userId,
              username: profileUsername,
              displayName: data.first_name || clerkUsername,
              avatarUrl: data.image_url,
            },
          });

          console.log(`✅ TrustProfile created: ${profileUsername}`);
        }

        console.log(`✅ User created: ${userId}`);
        break;
      }

      case "user.updated": {
        console.log("👤 Processing user.updated event");

        const userId = data.id;
        const primaryEmail = data.email_addresses?.find(
          (email) => email.id === data.primary_email_address_id,
        )?.email_address;

        if (!primaryEmail) {
          console.error("❌ No primary email found for user:", userId);
          return new NextResponse("No primary email found", { status: 400 });
        }

        // Update user in database
        await db.user.update({
          where: { id: userId },
          data: {
            email: primaryEmail,
            firstName: data.first_name,
            lastName: data.last_name,
            username: data.username,
            imageUrl: data.image_url,
          },
        });

        // Also update TrustProfile if it exists (sync displayName and avatarUrl)
        const existingProfile = await db.trustProfile.findUnique({
          where: { userId: userId },
        });

        if (existingProfile) {
          await db.trustProfile.update({
            where: { userId: userId },
            data: {
              displayName: data.first_name || existingProfile.displayName,
              avatarUrl: data.image_url || existingProfile.avatarUrl,
              // Note: We don't auto-update username to avoid breaking profile URLs
            },
          });
          console.log(`✅ TrustProfile updated for user: ${userId}`);
        }

        console.log(`✅ User updated: ${userId}`);
        break;
      }

      case "user.deleted": {
        console.log("👤 Processing user.deleted event");

        const userId = data.id;

        // Delete user from database (cascade will handle TrustProfile, etc.)
        const deleteResult = await db.user.deleteMany({
          where: { id: userId },
        });

        if (deleteResult.count === 0) {
          console.log(`⚠️ User not found: ${userId}`);
        } else {
          console.log(`✅ User deleted: ${userId}`);
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Clerk webhook error:", error);
    return new NextResponse(
      "Webhook error: " +
        (error instanceof Error ? error.message : "Unknown error"),
      { status: 400 },
    );
  }
}

// Ensure this route is always dynamically evaluated
export const dynamic = "force-dynamic";
