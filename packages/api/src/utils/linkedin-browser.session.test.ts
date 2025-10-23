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

  test.todo(
    "login",
    async () => {
      const result = await session.login();
      expect(result.status).toBe("success");
    },
    Infinity,
  );

  test(
    "init",
    async () => {
      await session.bringToFront("linkedin");
      await new Promise((resolve) => setTimeout(resolve, 1000000));
    },
    Infinity,
  );
});
