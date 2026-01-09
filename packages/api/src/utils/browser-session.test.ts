import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ulid } from "ulidx";

import { createTestPrismaClient } from "@sassy/db/client/test";

import {
  browserRegistry,
  BrowserSession,
  insertCommentOnNonPreviouslyCommentedPosts,
} from "./browser-session";

// eslint-disable-next-line turbo/no-undeclared-env-vars
describe.skipIf(process.env.TEST_BROWSER_SESSION === undefined)(
  "LinkedInBrowserSession",
  () => {
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
          status: "CONNECTED",
          browserProfileId: "mock-profile-id",
          browserLocation: "US",
          ownerId: userId,
        },
      });
      // figure out how to stub and test
      session = new BrowserSession(prisma, browserRegistry, accountId, userId, {
        location: "US",
        browserProfileId: "mock-profile-id",
      });
      console.info("this shit here");
      await session.ready;
      console.info("this shit here ready");
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
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    test.skipIf(process.env.TEST_AUTOCOMMENT === undefined)(
      "startAutoCommenting",
      async () => {
        await session.bringToFront("linkedin");
        const signedin = await session.waitForSigninSuccess(
          new AbortController().signal,
        );
        expect(signedin).toBe(true);
        console.info("sending start autocommenting");
        try {
          const result = await session.startAutoCommenting({
            autoCommentRunId: "",
            scrollDuration: 10,
            maxPosts: 5,
            commentDelay: 30,
            styleGuide: "PROFESSIONAL",
            duplicateWindow: 24,
          });
          console.info({ result });
        } catch (e) {
          console.error(e);
        }
        await new Promise(() => {});
      },
      Infinity,
    );

    // eslint-disable-next-line turbo/no-undeclared-env-vars
    test.skipIf(process.env.TEST_COMMENT_ON_POST === undefined)(
      "commentOnPost",
      async () => {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        if (process.env.TEST_LINKEDIN_POST_URN === undefined) {
          throw new Error("TEST_LINKEDIN_POST_URN is not defined");
        }
        const result = await session.commentOnPost(
          // eslint-disable-next-line turbo/no-undeclared-env-vars
          process.env.TEST_LINKEDIN_POST_URN,
          "best feeling ever!",
        );

        expect(result.status === "success");
        await new Promise(() => {});
      },
      Infinity,
    );

    // eslint-disable-next-line turbo/no-undeclared-env-vars
    test.skipIf(process.env.TEST_LOAD_FEED_AND_SAVE_POSTS === undefined)(
      "loadFeedAndSavePosts",
      async () => {
        const added = await session.loadFeedAndSavePosts(5);

        console.info(`Added ${added} posts`);
      },
      Infinity,
    );
  },
);

describe("insertCommentOnNonPreviouslyCommentedPosts", () => {
  test("insert comments only for posts that has not been commented on before", async () => {
    const db = await createTestPrismaClient();
    await db.user.create({
      data: {
        id: "test-user-id-1",
        primaryEmailAddress: "test@test.com",
      },
    });

    await db.linkedInAccount.createMany({
      data: [
        {
          id: "test-account-id-1",
          email: "lam@test.com",
          status: "CONNECTED",
          browserProfileId: "mock-profile-id-1",
          browserLocation: "US",
          ownerId: "test-user-id-1",
        },
        {
          id: "test-account-id-2",
          email: "lam@lam.com",
          status: "CONNECTED",
          browserProfileId: "mock-profile-id-2",
          browserLocation: "US",
          ownerId: "test-user-id-1",
        },
      ],
    });

    const values = [
      {
        id: "test-comment-id-1",
        postUrn: "urn:li:share:test-post-id-1",
        postContentHtml: "<p>This is a test comment 1</p>",
        postCaptionPreview: "This is a test comment 1",
        postFullCaption: "This is a test comment 1",
        comment: "",
        postCreatedAt: new Date(),
        authorUrn: "urn:li:person:test-author-id-1",
        authorName: "Test Author 1",
        authorProfileUrl: "https://www.linkedin.com/in/test-author-1",
        authorAvatarUrl: "https://www.example.com/avatar1.jpg",
        authorHeadline: "Test Headline 1",
        accountId: "test-account-id-1",
      },
      {
        id: "test-comment-id-2",
        postUrn: "urn:li:share:test-post-id-2",
        postContentHtml: "<p>This is a test comment 2</p>",
        postCaptionPreview: "This is a test comment 2",
        postFullCaption: "This is a test comment 2",
        comment: "",
        postCreatedAt: new Date(),
        authorUrn: "urn:li:person:test-author-id-2",
        authorName: "Test Author 2",
        authorProfileUrl: "https://www.linkedin.com/in/test-author-2",
        authorAvatarUrl: "https://www.example.com/avatar2.jpg",
        authorHeadline: "Test Headline 2",
        accountId: "test-account-id-1",
      },
    ];

    const inserted = await insertCommentOnNonPreviouslyCommentedPosts(
      db,
      values,
    );

    expect(inserted).toBe(2);

    const values2 = [
      {
        id: "test-comment-id-3",
        postUrn: "urn:li:share:test-post-id-3",
        postContentHtml: "<p>This is a test comment 1</p>",
        postCaptionPreview: "This is a test comment 1",
        postFullCaption: "This is a test comment 1",
        comment: "",
        postCreatedAt: new Date(),
        authorUrn: "urn:li:person:test-author-id-1",
        authorName: "Test Author 1",
        authorProfileUrl: "https://www.linkedin.com/in/test-author-1",
        authorAvatarUrl: "https://www.example.com/avatar1.jpg",
        authorHeadline: "Test Headline 1",
        accountId: "test-account-id-1",
      },
      {
        id: "test-comment-id-4",
        postUrn: "urn:li:share:test-post-id-2",
        postContentHtml: "<p>This is a test comment 2</p>",
        postCaptionPreview: "This is a test comment 2",
        postFullCaption: "This is a test comment 2",
        comment: "",
        postCreatedAt: new Date(),
        authorUrn: "urn:li:person:test-author-id-2",
        authorName: "Test Author 2",
        authorProfileUrl: "https://www.linkedin.com/in/test-author-2",
        authorAvatarUrl: "https://www.example.com/avatar2.jpg",
        authorHeadline: "Test Headline 2",
        accountId: "test-account-id-1",
      },
    ];

    const insertedAgain = await insertCommentOnNonPreviouslyCommentedPosts(
      db,
      values2,
    );

    expect(insertedAgain).toBe(1);
  });
});
