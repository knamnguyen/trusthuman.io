import { verifyWebhook } from "@clerk/backend/webhooks";
import { Hono } from "hono";
import Stripe from "stripe";

import type { Prisma } from "@sassy/db";
import { db } from "@sassy/db";

import { env } from "../../utils/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

/**
 * Clerk webhook handler
 * This receives events from Clerk when:
 * - Users are created, updated, or deleted
 * - Organizations are created, updated, or deleted
 * - Organization memberships change
 * It syncs the data to our database
 */

export const clerkWebhookRoutes = new Hono().post("/", async (c) => {
  try {
    const req = c.req;
    console.log("🔄 Clerk webhook received");

    // Verify the webhook using Clerk's verifyWebhook function
    // This function expects Svix headers and will consume the request body
    const evt = await verifyWebhook(req.raw, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });

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
        const primaryEmail = data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id,
        )?.email_address;

        console.log(`- User ID: ${userId}`);
        console.log(`- Primary email: ${primaryEmail}`);

        if (!primaryEmail) {
          console.error("❌ No primary email found for user:", userId);
          return c.text("No primary email found", { status: 400 });
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
        const primaryEmail = data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id,
        )?.email_address;

        console.log(`- User ID: ${userId}`);
        console.log(`- Primary email: ${primaryEmail}`);

        if (!primaryEmail) {
          console.error("❌ No primary email found for user:", userId);
          return c.text("No primary email found", { status: 400 });
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

        const userId = data.id;
        console.log(`- User ID: ${userId}`);

        // Cancel any subscriptions this user is paying for (org-centric billing)
        const paidOrgs = await db.organization.findMany({
          where: { payerId: userId },
          select: { id: true, stripeSubscriptionId: true, name: true },
        });

        for (const org of paidOrgs) {
          if (org.stripeSubscriptionId) {
            try {
              await stripe.subscriptions.update(org.stripeSubscriptionId, {
                cancel_at_period_end: true,
              });
              console.log(
                `📧 Subscription ${org.stripeSubscriptionId} for org ${org.name} set to cancel (user deleted)`,
              );
            } catch (e) {
              console.error(
                `Failed to cancel subscription for org ${org.id}:`,
                e,
              );
            }
          }
        }

        console.log("🗑️ Deleting user from database...");

        // Use deleteMany to gracefully handle case where user doesn't exist
        const deleteResult = await db.user.deleteMany({
          where: { id: userId },
        });

        if (deleteResult.count === 0) {
          console.log(
            `⚠️ User not found in database (already deleted or never synced): ${userId}`,
          );
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

        await db.organization.upsert({
          create: {
            id: orgId,
            name: orgName,
            orgSlug: data.slug,
          },
          where: { id: orgId },
          update: {
            name: orgName,
            updatedAt: new Date(),
            orgSlug: data.slug,
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

        await db.organization.upsert({
          where: { id: orgId },
          create: {
            id: orgId,
            name: orgName,
            orgSlug: data.slug,
          },
          update: {
            name: orgName,
            updatedAt: new Date(),
            orgSlug: data.slug,
          },
        });

        console.log(`✅ Organization updated in database: ${orgId}`);
        break;
      }

      case "organization.deleted": {
        // TODO: Should cancel Stripe subscription before deleting org.
        // Impact: Orphaned Stripe subscription if org deleted via Clerk dashboard.
        // Fix: Check if org has stripeSubscriptionId, call
        // stripe.subscriptions.cancel(), then proceed with deletion.
        console.log("🏢 Processing organization.deleted event");

        const orgId = data.id;
        console.log(`- Org ID: ${orgId}`);

        // First, null out ownerId on LinkedIn accounts belonging to this org
        // (organizationId will be set to NULL automatically via onDelete: SetNull)
        const updateResult = await db.linkedInAccount.updateMany({
          where: { organizationId: orgId },
          data: { ownerId: null },
        });
        console.log(
          `🔗 Set ownerId to NULL on ${updateResult.count} LinkedIn account(s)`,
        );

        console.log("🗑️ Deleting organization from database...");

        // Use deleteMany to gracefully handle case where org doesn't exist
        // Members will be cascade deleted due to onDelete: Cascade
        // LinkedIn accounts will have organizationId set to NULL due to onDelete: SetNull
        const deleteResult = await db.organization.deleteMany({
          where: { id: orgId },
        });

        if (deleteResult.count === 0) {
          console.log(
            `⚠️ Organization not found in database (already deleted or never synced): ${orgId}`,
          );
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

        await db.organization.upsert({
          where: { id: orgId },
          update: {
            updatedAt: new Date(),
            name: data.organization.name,
            orgSlug: data.organization.slug,
          },
          create: {
            id: orgId,
            name: data.organization.name,
            orgSlug: data.organization.slug,
          },
        });

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

        await db.organization.upsert({
          where: { id: orgId },
          update: {
            updatedAt: new Date(),
            orgSlug: data.organization.slug,
            name: data.organization.name,
          },
          create: {
            id: orgId,
            name: data.organization.name,
            orgSlug: data.organization.slug,
          },
        });

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

        // Check if this user was the payer for the org (org-centric billing)
        const org = await db.organization.findUnique({
          where: { id: orgId },
          select: {
            payerId: true,
            stripeSubscriptionId: true,
            name: true,
            subscriptionExpiresAt: true,
          },
        });

        if (org?.payerId === userId && org.stripeSubscriptionId) {
          console.log(
            `💳 Payer ${userId} is leaving org ${orgId}, canceling subscription`,
          );

          try {
            // Cancel subscription at period end (user already paid for current period)
            await stripe.subscriptions.update(org.stripeSubscriptionId, {
              cancel_at_period_end: true,
            });

            // Clear payer immediately (org has no payer now, but subscription still active until period end)
            await db.organization.update({
              where: { id: orgId },
              data: { payerId: null },
            });

            console.log(
              `✅ Subscription for org ${org.name} set to cancel at period end`,
            );

            // TODO: Notify remaining admins about billing admin leaving
          } catch (e) {
            console.error(`Failed to cancel subscription for org ${orgId}:`, e);
          }
        }

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
    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Clerk webhook error:", error);
    console.error("📋 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return c.text(
      "Webhook error: " +
        (error instanceof Error ? error.message : "Unknown error"),
      { status: 400 },
    );
  }
});
