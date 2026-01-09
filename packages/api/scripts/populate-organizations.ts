/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClerkClient } from "@clerk/backend";
import PQueue from "p-queue";

import { db } from "@sassy/db";

import { env } from "../src/utils/env";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

const clerkApiQueue = new PQueue({
  interval: 10_000,
  intervalCap: 99,
});

async function withRateLimit<T>(fn: () => Promise<T>) {
  try {
    return await clerkApiQueue.add(fn);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    if ("status" in (err as any) && (err as any).status === 429) {
      console.warn("got a 429, retrying in 5 sec");
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      return await withRateLimit(fn);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ("errors" in (err as any)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      console.error("Clerk API error:", (err as any).errors);
    }

    throw err;
  }
}

async function* iterateUsersBatch() {
  let offset = 0;

  const batchSize = 100;

  while (true) {
    const res = await withRateLimit(() =>
      clerkClient.users.getUserList({
        limit: batchSize,
        offset: offset,
      }),
    );

    const users = res.data;

    if (users.length === 0) {
      break;
    }

    yield users.slice(0, batchSize);

    if (users.length < batchSize) {
      break;
    }

    offset = offset + batchSize;
  }
}

async function main() {
  for await (const usersBatch of iterateUsersBatch()) {
    console.info(`got batch of ${usersBatch.length} users`);
    for (const user of usersBatch) {
      console.info(`checking if user ${user.id} has orgs`);
      const memberships = await withRateLimit(() =>
        clerkClient.users.getOrganizationMembershipList({
          userId: user.id,
        }),
      );

      if (memberships.totalCount > 0) {
        console.info(`user ${user.id} already has orgs, skipping`);
        continue;
      }

      console.info(`creating org for user ${user.id}`);

      let org;
      let count = 0;

      try {
        org = await withRateLimit(() =>
          clerkClient.organizations.createOrganization({
            name: `${(user.firstName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "User").replaceAll(".", " ")}'s Organization`,
            // when we add createdBy, the org by default adds the member as admin
            createdBy: user.id,
            maxAllowedMemberships: 1,
          }),
        );
        count++;
      } catch (err) {
        // if we meet an organization name conflict, append a number to the name
        if ("status" in (err as any) && (err as any).status === 422) {
          org = await withRateLimit(() =>
            clerkClient.organizations.createOrganization({
              name: `${(user.firstName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "User").replaceAll(".", " ")}'s Organization ${count}`,
              // when we add createdBy, the org by default adds the member as admin
              createdBy: user.id,
              maxAllowedMemberships: 1,
            }),
          );
        }

        throw err;
      }

      console.info(
        `created org and membership for user ${user.id} in org ${org.id}, syncing to DB`,
      );

      try {
        await db.organization.createMany({
          data: {
            id: org.id,
            name: org.name,
          },
          skipDuplicates: true,
        });

        await db.organizationMember.upsert({
          where: {
            orgId_userId: { orgId: org.id, userId: user.id },
          },
          update: {
            role: "admin",
          },
          create: {
            orgId: org.id,
            userId: user.id,
            role: "admin",
          },
        });
      } catch (err) {
        // sometimes there might be inconsistencies between clerk and db, though the webhook should populate most cases
        // so just log and continue
        console.error(
          `error syncing org ${org.id} and membership for user ${user.id} to DB:`,
          err,
        );
      }

      console.info(
        `synced org ${org.id} and membership for user ${user.id} to DB`,
      );
    }
  }
}

await main();
