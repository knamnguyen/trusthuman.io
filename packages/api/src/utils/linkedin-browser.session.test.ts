import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
  BrowserSessionRegistry,
  LinkedInBrowserSession,
} from "./linkedin-browser-session";

describe("LinkedInBrowserSession", () => {
  let session!: LinkedInBrowserSession;
  let registry!: BrowserSessionRegistry;
  beforeAll(async () => {
    registry = new BrowserSessionRegistry();
    const session = registry;
    const registered = await LinkedInBrowserSession.getOrCreate(registry);
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
      await new Promise(() => {});
      await session.startAutoCommenting({
        scrollDuration: 10,
        maxPosts: 5,
        commentDelay: 30,
        styleGuide: "PROFESSIONAL",
        duplicateWindow: 24,
      });
    },
    Infinity,
  );
});
