import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { BrowserSession, BrowserSessionRegistry } from "./browser-session";

describe("LinkedInBrowserSession", () => {
  let session!: BrowserSession;
  let registry!: BrowserSessionRegistry;
  beforeAll(async () => {
    // figure out how to stub and test
    const registered = new BrowserSession.getOrCreate(registry, {
      accountId: "mock",
      location: "US",
      engagekitExtensionId: "engagekit-mock-id",
      browserProfileId: "mock-profile-id",
    });
    session = registered.instance;
  });

  afterAll(async () => {
    await registry.destroyAll();
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

  test(
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
});
