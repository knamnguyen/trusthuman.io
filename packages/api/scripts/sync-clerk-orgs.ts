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

    const res = await db.user.createMany({
      data: usersBatch.map((user) => ({
        id: user.id,
        primaryEmailAddress: user.primaryEmailAddress?.emailAddress ?? "",
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        username: user.username ?? null,
        imageUrl: user.imageUrl,
      })),
      skipDuplicates: true,
    });

    console.info(`upserted user ${res.count} into DB`);

    for (const user of usersBatch) {
      console.info(`getting user orgs`);
      const memberships = await withRateLimit(() =>
        clerkClient.users.getOrganizationMembershipList({
          userId: user.id,
        }),
      );

      console.info(`upserting user and orgs into DB`);
      try {
        console.info(
          `upserting ${memberships.data.length} orgs for user ${user.id}`,
        );

        const res2 = await db.organization.createMany({
          data: memberships.data.map((membership) => ({
            id: membership.organization.id,
            name: membership.organization.name,
          })),
          skipDuplicates: true,
        });

        console.info(`upserted ${res2.count} orgs into DB`);

        for (const membership of memberships.data) {
          await db.organizationMember.createMany({
            data: {
              orgId: membership.organization.id,
              userId: user.id,
              role: membership.role,
            },
            skipDuplicates: true,
          });

          console.info(
            `upserted membership of user ${user.id} in org ${membership.organization.id} into DB`,
          );
        }
      } catch (err) {
        // sometimes there might be inconsistencies between clerk and db, though the webhook should populate most cases
        // so just log and continue
        console.error(`error syncing org`, err, memberships);
      }

      console.info(
        `synced org and ${memberships.data.length} membership for user ${user.id} to DB`,
      );
    }
  }
}

await main();
