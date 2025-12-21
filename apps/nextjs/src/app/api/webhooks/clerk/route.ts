import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

import type { Prisma } from "@sassy/db";
import { db } from "@sassy/db";

/**
 * Clerk webhook handler
 * This receives events from Clerk when:
 * - Users are created, updated, or deleted
 * - Organizations are created, updated, or deleted
 * - Organization memberships change
 * It syncs the data to our database
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

        // Use deleteMany to gracefully handle case where user doesn't exist
        const deleteResult = await db.user.deleteMany({
          where: { id: userId },
        });

        if (deleteResult.count === 0) {
          console.log(`⚠️ User not found in database (already deleted or never synced): ${userId}`);
        } else {
          console.log(`✅ User deleted from database: ${userId}`);
        }
        break;
      }

      // ========================================================================
      // ORGANIZATION EVENTS
      // ========================================================================

      case "organization.created": {
        console.log("🏢 Processing organization.created event");

        const orgId = data.id;
        const orgName = data.name;

        console.log(`- Org ID: ${orgId}`);
        console.log(`- Org Name: ${orgName}`);

        console.log("💾 Creating organization in database...");

        await db.organization.create({
          data: {
            id: orgId,
            name: orgName,
          },
        });

        console.log(`✅ Organization created in database: ${orgId}`);
        break;
      }

      case "organization.updated": {
        console.log("🏢 Processing organization.updated event");

        const orgId = data.id;
        const orgName = data.name;

        console.log(`- Org ID: ${orgId}`);
        console.log(`- Org Name: ${orgName}`);

        console.log("💾 Updating organization in database...");

        await db.organization.update({
          where: { id: orgId },
          data: {
            name: orgName,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Organization updated in database: ${orgId}`);
        break;
      }

      case "organization.deleted": {
        console.log("🏢 Processing organization.deleted event");

        const orgId = data.id;
        console.log(`- Org ID: ${orgId}`);

        console.log("🗑️ Deleting organization from database...");

        // Use deleteMany to gracefully handle case where org doesn't exist
        // Members will be cascade deleted due to onDelete: Cascade
        const deleteResult = await db.organization.deleteMany({
          where: { id: orgId },
        });

        if (deleteResult.count === 0) {
          console.log(`⚠️ Organization not found in database (already deleted or never synced): ${orgId}`);
        } else {
          console.log(`✅ Organization deleted from database: ${orgId}`);
        }
        break;
      }

      // ========================================================================
      // ORGANIZATION MEMBERSHIP EVENTS
      // ========================================================================

      case "organizationMembership.created": {
        console.log("👥 Processing organizationMembership.created event");

        const orgId = data.organization.id;
        const userId = data.public_user_data.user_id;
        const role = data.role; // "admin" or "org:member" -> normalize to "member"

        console.log(`- Org ID: ${orgId}`);
        console.log(`- User ID: ${userId}`);
        console.log(`- Role: ${role}`);

        // Normalize Clerk role to our simplified role
        const normalizedRole = role === "org:admin" ? "admin" : "member";

        console.log("💾 Creating organization membership in database...");

        await db.organizationMember.upsert({
          where: {
            orgId_userId: { orgId, userId },
          },
          update: {
            role: normalizedRole,
          },
          create: {
            orgId,
            userId,
            role: normalizedRole,
          },
        });

        console.log(
          `✅ Organization membership created: ${userId} -> ${orgId} (${normalizedRole})`,
        );
        break;
      }

      case "organizationMembership.updated": {
        console.log("👥 Processing organizationMembership.updated event");

        const orgId = data.organization.id;
        const userId = data.public_user_data.user_id;
        const role = data.role;

        console.log(`- Org ID: ${orgId}`);
        console.log(`- User ID: ${userId}`);
        console.log(`- Role: ${role}`);

        // Normalize Clerk role to our simplified role
        const normalizedRole = role === "org:admin" ? "admin" : "member";

        console.log("💾 Updating organization membership in database...");

        await db.organizationMember.update({
          where: {
            orgId_userId: { orgId, userId },
          },
          data: {
            role: normalizedRole,
          },
        });

        console.log(
          `✅ Organization membership updated: ${userId} -> ${orgId} (${normalizedRole})`,
        );
        break;
      }

      case "organizationMembership.deleted": {
        console.log("👥 Processing organizationMembership.deleted event");

        const orgId = data.organization.id;
        const userId = data.public_user_data.user_id;

        console.log(`- Org ID: ${orgId}`);
        console.log(`- User ID: ${userId}`);

        console.log("🗑️ Deleting organization membership from database...");

        // Use deleteMany to gracefully handle case where membership doesn't exist
        const deleteResult = await db.organizationMember.deleteMany({
          where: {
            orgId,
            userId,
          },
        });

        if (deleteResult.count === 0) {
          console.log(
            `⚠️ Membership not found in database (already deleted or never synced): ${userId} -> ${orgId}`,
          );
        } else {
          console.log(
            `✅ Organization membership deleted: ${userId} -> ${orgId}`,
          );
        }
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
