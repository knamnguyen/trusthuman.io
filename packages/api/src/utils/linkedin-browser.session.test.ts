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
    const registered = await registry.register(
      "test",
      new LinkedInBrowserSession(
        {
          username: process.env.LINKEDIN_TEST_ACCOUNT_USERNAME!,
          password: process.env.LINKEDIN_TEST_ACCOUNT_PASSWORD!,
          twoFactorSecretKey: process.env.LINKEDIN_TEST_ACCOUNT_2FA_SECRET_KEY!,
          location: "US",
          userId: "test-user-id",
        },
        console,
        "mock",
      ),
    );
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
  test.todo(
    "login",
    async () => {
      const result = await session.login();
      expect(result.status).toBe("success");
    },
    Infinity,
  );

  test(
    "startAutoCommenting",
    async () => {
      await session.bringToFront("linkedin");
      await session.startAutoCommenting({
        scrollDuration: 10,
        maxPosts: 5,
        commentDelay: 30,
        styleGuide: "PROFESSIONAL",
        duplicateWindow: 24,
      });

      await new Promise((resolve) => setTimeout(resolve, 20000));
    },
    Infinity,
  );
});
