import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { LinkedInBrowserSession } from "./linkedin-browser-session";

describe("LinkedInBrowserSession", () => {
  let session!: LinkedInBrowserSession;
  beforeAll(async () => {
    session = new LinkedInBrowserSession(
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
    await session.destroy();
  });

  test(
    "login",
    async () => {
      const result = await session.login();
      expect(result.status).toBe("success");
    },
    Infinity,
  );
});
