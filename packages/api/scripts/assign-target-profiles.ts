import { ulid } from "ulidx";

import { db } from "@sassy/db";

import { chunkify } from "../src/utils/commons";

const KELLY_ACCOUNT_ID = "01KG5CBVYH866ZRHY5ZDDJF8AX";

async function* iterateProfiles() {
  let cursor: string | undefined = undefined;

  while (true) {
    const targetProfiles = await db.targetProfile.findMany({
      where: {
        accountId: KELLY_ACCOUNT_ID,
        id: cursor ? { lt: cursor } : undefined,
      },
      take: 500,
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });

    if (targetProfiles.length === 0) {
      break;
    }

    yield* targetProfiles;

    if (targetProfiles.length < 500) {
      break;
    }

    cursor = targetProfiles[targetProfiles.length - 1]?.id as
      | string
      | undefined;
  }
}

async function run() {
  const febListId = "01KH607NV13Z2AASZJNM3QJV7Y";

  const allProfiles = [];

  for await (const profile of iterateProfiles()) {
    allProfiles.push(profile);
  }

  const excludedFirstChunk = allProfiles.splice(0, 25);

  const profilesToAdd = excludedFirstChunk.map((profile) => ({
    id: ulid(),
    profileId: profile.id,
    listId: febListId,
    accountId: KELLY_ACCOUNT_ID,
  }));
  const listsToCreate: {
    id: string;
    name: string;
    accountId: string;
    status: "COMPLETED";
  }[] = [];

  let i = 1;
  for (const chunk of chunkify(allProfiles, 25)) {
    const listId = ulid();
    listsToCreate.push({
      id: listId,
      name: `Feb 11 - ${i++}`,
      accountId: KELLY_ACCOUNT_ID,
      status: "COMPLETED",
    });
    profilesToAdd.push(
      ...chunk.map((profile) => ({
        id: ulid(),
        profileId: profile.id,
        listId: listId,
        accountId: KELLY_ACCOUNT_ID,
      })),
    );
  }

  await db.$transaction(async (tx) => {
    let result = await tx.targetList.createMany({
      data: listsToCreate,
    });

    console.info(`Created ${result.count} lists.`);

    result = await tx.targetListProfile.createMany({
      data: profilesToAdd,
      skipDuplicates: true,
    });

    console.info(`Created ${result.count} list profiles.`);
  });
}

if (import.meta.main) {
  await run();
}
