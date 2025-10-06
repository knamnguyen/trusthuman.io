import log from "@apify/log";
import { Actor } from "apify";

import type { Logger } from "./types.js";
import { LinkedIn } from "./linkedin.js";

await Actor.init();

const logger: Logger = {
  info: (message: string) => log.info(`[INFO] ${message}`),
  error: (message: string) => log.error(`[ERROR] ${message}`),
  warn: (message: string) => log.warning(`[WARN] ${message}`),
};

const linkedin = new LinkedIn(
  {
    username: process.env.LINKEDIN_TEST_ACCOUNT_USERNAME!,
    password: process.env.LINKEDIN_TEST_ACCOUNT_PASSWORD!,
    twoFactorSecretKey: process.env.LINKEDIN_TEST_ACCOUNT_2FA_SECRET_KEY!,
  },
  logger,
);
await linkedin.ready;

const result = await linkedin.login();

if (result.status === "error") {
  logger.error(`Login failed: ${result.error}`);
}

await new Promise((resolve) => setTimeout(resolve, 100000));

await linkedin.close();
await Actor.exit();
