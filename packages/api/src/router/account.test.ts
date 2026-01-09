// import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// import type { PrismaClient } from "@sassy/db";
// import { createTestPrismaClient } from "@sassy/db/client/test";

// import { getUserAccount } from "./account";

// let db: PrismaClient;

// beforeEach(async () => {
//   db = await createTestPrismaClient();
// });

// afterEach(async () => {
//   await db.$disconnect();
// });

// describe("trpc auth utils", () => {
//   test("getUserAccount", async () => {
//     const aliceUserId = crypto.randomUUID();
//     const bobUserId = crypto.randomUUID();

//     await db.user.createMany({
//       data: [
//         {
//           id: aliceUserId,
//           primaryEmailAddress: "alice@test.com",
//         },
//         {
//           id: bobUserId,
//           primaryEmailAddress: "bob@test.com",
//         },
//       ],
//     });

//     const aliceAccountId = crypto.randomUUID();
//     const bobAccountId = crypto.randomUUID();

//     await db.linkedInAccount.createMany({
//       data: [
//         {
//           id: aliceAccountId,
//           ownerId: aliceUserId,
//           status: "CONNECTED",
//           browserProfileId: "123",
//           browserLocation: "US",
//         },
//         {
//           id: bobAccountId,
//           ownerId: bobUserId,
//           status: "CONNECTED",
//           browserProfileId: "456",
//           browserLocation: "US",
//         },
//       ],
//     });

//     // alice accessing her own account, should be permitted
//     const alice = await getUserAccount(db, aliceUserId, aliceAccountId);

//     expect(alice?.user.id).toBe(aliceUserId);
//     expect(alice?.account?.id).toBe(aliceAccountId);
//     expect(alice?.account?.permitted).toBe(true);

//     // bob accessing his own account, should be permitted
//     const bob = await getUserAccount(db, bobUserId, bobAccountId);
//     expect(bob?.user.id).toBe(bobUserId);
//     expect(bob?.account?.id).toBe(bobAccountId);
//     expect(bob?.account?.permitted).toBe(true);

//     // alice accessing bob's account, should NOT be permitted
//     const aliceAccessingBob = await getUserAccount(
//       db,
//       aliceUserId,
//       bobAccountId,
//     );
//     expect(aliceAccessingBob?.user.id).toBe(aliceUserId);
//     expect(aliceAccessingBob?.account?.id).toBe(bobAccountId);
//     expect(aliceAccessingBob?.account?.permitted).toBe(false);

//     // bob accessing alice's account, should NOT be permitted
//     const bobAccessingAlice = await getUserAccount(
//       db,
//       bobUserId,
//       aliceAccountId,
//     );
//     expect(bobAccessingAlice?.user.id).toBe(bobUserId);
//     expect(bobAccessingAlice?.account?.id).toBe(aliceAccountId);
//     expect(bobAccessingAlice?.account?.permitted).toBe(false);

//     // accesing non-existent account or user
//     const nonExistingUser = await getUserAccount(
//       db,
//       crypto.randomUUID(),
//       aliceAccountId,
//     );
//     expect(nonExistingUser).toBeNull();

//     // accessing non-existent account
//     const nonExistingAccount = await getUserAccount(
//       db,
//       aliceUserId,
//       crypto.randomUUID(),
//     );
//     expect(nonExistingAccount?.user.id).toBe(aliceUserId);
//     expect(nonExistingAccount?.account).toBeNull();
//   });
// });
