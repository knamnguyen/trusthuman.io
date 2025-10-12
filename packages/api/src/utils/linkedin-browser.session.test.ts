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
    session = new LinkedInBrowserSession(
      registry,
      {
        username: process.env.LINKEDIN_TEST_ACCOUNT_USERNAME!,
        password: process.env.LINKEDIN_TEST_ACCOUNT_PASSWORD!,
        twoFactorSecretKey: process.env.LINKEDIN_TEST_ACCOUNT_2FA_SECRET_KEY!,
        location: "US",
      },
      console,
    );
    await session.ready;
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
    "loginToEngagekitExtension",
    async () => {
      await session.loginToEngagekitExtension("test-token");
    },
    Infinity,
  );
});
