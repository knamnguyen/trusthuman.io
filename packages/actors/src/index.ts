import type { Browser, Page } from "playwright";
import log from "@apify/log";
import { Actor } from "apify";
import { authenticator } from "otplib";
import { chromium } from "playwright";

interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
}

class LinkedInBrowserSession {
  public browser!: Browser;
  public page!: Page;
  public ready: Promise<void>;

  constructor(
    private readonly opts: {
      username: string;
      password: string;
      twoFactorSecretKey: string;
    },
    private readonly logger: Logger,
  ) {
    this.ready = this.init();
  }

  private async init() {
    this.browser = await chromium.launch({
      headless: false,
    });

    this.page = await this.browser.newPage();
  }

  async login() {
    this.logger.info("navigating to linkedin.com");

    await this.page.goto("https://www.linkedin.com", {
      waitUntil: "networkidle",
    });

    const signInButton = this.page.locator(
      'a[data-tracking-control-name="guest_homepage-basic_nav-header-signin"]',
    );

    if (!(await signInButton.isVisible())) {
      this.logger.error("sign in button not found");
      return {
        status: "error",
        code: 500,
        error: "sign in button not found",
      } as const;
    }

    await signInButton.click();
    await this.page.waitForLoadState("networkidle");
    this.logger.info("navigated to login page");

    this.logger.info("typing username and password");
    await this.page.locator("input#username").fill(this.opts.username);
    this.logger.info("typed username");
    await this.page.locator("input#password").fill(this.opts.password);
    this.logger.info("typed password");

    const submitButton = this.page.locator('button[type="submit"]');
    if (!(await submitButton.isVisible())) {
      this.logger.error("submit button not found");
      return {
        status: "error",
        code: 500,
        error: "submit button not found",
      } as const;
    }

    await submitButton.click();
    await this.page.waitForLoadState("networkidle");

    const url = this.page.url();

    if (!url.includes("checkpoint/challenge")) {
      this.logger.error("account does not have 2fa enabled, cannot proceed");
      return {
        status: "error",
        code: 400,
        error: "Account does not have 2fa enabled, cannot proceed",
      } as const;
    }

    this.logger.info("clicked submit button");
    this.logger.info("navigated to post-login page");

    const otpElement = this.page.locator("input#input__phone_verification_pin");
    if (!(await otpElement.isVisible())) {
      this.logger.error("otp element not found");
      return {
        status: "error",
        code: 500,
        error: "otp element not found",
      } as const;
    }

    const otp = authenticator.generate(this.opts.twoFactorSecretKey);
    this.logger.info(`generated otp: ${otp}`);

    this.logger.info("typing otp");
    await otpElement.fill(otp);

    const submitOtpButton = this.page.locator(
      'button#two-step-submit-button[type="submit"]',
    );

    if (!(await submitOtpButton.isVisible())) {
      this.logger.error("submit otp button not found");
      return {
        status: "error",
        code: 500,
        error: "submit otp button not found",
      } as const;
    }

    this.logger.info("submitting otp");
    await submitOtpButton.click();
    await this.page.waitForLoadState("networkidle");

    return {
      status: "success",
    } as const;
  }

  async close() {
    await this.browser.close();
  }
}

await Actor.init();

const logger: Logger = {
  info: (message: string) => log.info(`[INFO] ${message}`),
  error: (message: string) => log.error(`[ERROR] ${message}`),
  warn: (message: string) => log.warning(`[WARN] ${message}`),
};

const session = new LinkedInBrowserSession(
  {
    username: process.env.LINKEDIN_TEST_ACCOUNT_USERNAME!,
    password: process.env.LINKEDIN_TEST_ACCOUNT_PASSWORD!,
    twoFactorSecretKey: process.env.LINKEDIN_TEST_ACCOUNT_2FA_SECRET_KEY!,
  },
  logger,
);

await session.ready;
const result = await session.login();

if (result.status === "success") {
  logger.info("Login successful");
} else {
  logger.error(`Login failed: ${result.error}`);
}

await session.close();
await Actor.exit();
