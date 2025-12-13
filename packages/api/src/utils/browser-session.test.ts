import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ulid } from "ulidx";

import { createTestPrismaClient } from "@sassy/db/client/test";

import type { BrowserSessionRegistry } from "./browser-session";
import { BrowserSession } from "./browser-session";

describe("LinkedInBrowserSession", () => {
  let session!: BrowserSession;
  beforeAll(async () => {
    const prisma = await createTestPrismaClient();
    const userId = ulid();
    await prisma.user.create({
      data: {
        id: userId,
        primaryEmailAddress: "test@email.com",
      },
    });
    const accountId = ulid();
    await prisma.linkedInAccount.create({
      data: {
        id: accountId,
        email: "test@email.com",
        status: "ACTIVE",
        browserProfileId: "mock-profile-id",
        location: "US",
        userId,
      },
    });

    // figure out how to stub and test
    session = new BrowserSession(prisma, accountId, {
      location: "US",
      browserProfileId: "mock-profile-id",
    });
    await session.ready;
  });

  afterAll(async () => {
    await session.destroy();
  });

  // flow
  // 1. login with linkedin page
  // 2. wait for home page to load
  // 3. do some random actions so that it wont look too bot-ish
  // 4. start autocommenting?
  // test.todo(
  //   "login",
  //   async () => {
  //     const result = await session.login();
  //     expect(result.status).toBe("success");
  //   },
  //   Infinity,
  // );

  // test(
  //   "startAutoCommenting",
  //   async () => {
  //     await session.bringToFront("linkedin");
  //     const signedin = await session.waitForSigninSuccess(
  //       new AbortController().signal,
  //     );
  //     expect(signedin).toBe(true);
  //     console.info("sending start autocommenting");
  //     try {
  //       const result = await session.startAutoCommenting({
  //         autoCommentRunId: "",
  //         scrollDuration: 10,
  //         maxPosts: 5,
  //         commentDelay: 30,
  //         styleGuide: "PROFESSIONAL",
  //         duplicateWindow: 24,
  //       });
  //       console.info({ result });
  //     } catch (e) {
  //       console.error(e);
  //     }
  //     await new Promise(() => {});
  //   },
  //   Infinity,
  // );

  test("commentOnPost", async () => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (process.env.TEST_LINKEDIN_POST_URN === undefined) {
      throw new Error("TEST_LINKEDIN_POST_URN is not defined");
    }
    const result = await session.commentOnPost(
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      process.env.TEST_LINKEDIN_POST_URN,
      "Thanks for sharing!",
    );

    expect(result.status === "success");
  });
});
