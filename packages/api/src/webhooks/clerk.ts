/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to our database
 */

import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@trusthuman/db";

export async function handleClerkWebhook(event: WebhookEvent) {
  const eventType = event.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, username, image_url } =
      event.data;

    // Get primary email
    const primaryEmail = email_addresses.find(
      (email) => email.id === event.data.primary_email_address_id,
    );

    if (!primaryEmail) {
      console.error("No primary email found for user", id);
      return { success: false, error: "No primary email" };
    }

    // Upsert user
    await db.user.upsert({
      where: { id },
      create: {
        id,
        email: primaryEmail.email_address,
        firstName: first_name || null,
        lastName: last_name || null,
        username: username || null,
        imageUrl: image_url || null,
      },
      update: {
        email: primaryEmail.email_address,
        firstName: first_name || null,
        lastName: last_name || null,
        username: username || null,
        imageUrl: image_url || null,
      },
    });

    console.log(`User ${eventType}: ${id}`);
    return { success: true };
  }

  if (eventType === "user.deleted") {
    const { id } = event.data;

    if (!id) {
      console.error("No user ID in delete event");
      return { success: false, error: "No user ID" };
    }

    // Delete user (cascade will handle trust profile, verifications, etc.)
    await db.user.delete({
      where: { id },
    });

    console.log(`User deleted: ${id}`);
    return { success: true };
  }

  // Ignore other event types
  return { success: true, ignored: true };
}
