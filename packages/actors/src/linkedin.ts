import type { BrowserContext, Page } from "playwright";
import { authenticator } from "otplib";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

import type { Logger } from "./types.js";

export class LinkedIn {
  public browser!: BrowserContext;
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
    chromium.use(stealth());
    const browser = await chromium.launch({
      headless: false,
      channel: "chrome",
    });
    this.browser = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    });

    this.page = await this.browser.newPage();
  }

  async test() {
    await this.page.goto("https://nowsecure.nl");
  }

  async login() {
    this.logger.info("navigating to linkedin.com");

    await this.page.goto("https://www.linkedin.com");

    const signInButton = await this.page.waitForSelector(
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

    await Promise.all([
      this.page.waitForSelector("input#username"),
      signInButton.click(),
    ]);
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

    await Promise.all([
      this.page.waitForURL("**/checkpoint/challenge/*"),
      submitButton.click(),
    ]);

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

    const otpElement = await this.page.waitForSelector(
      "input#input__phone_verification_pin",
      {
        timeout: Infinity,
      },
    );
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
    await Promise.all([
      this.page.waitForLoadState("networkidle"),
      submitOtpButton.click(),
    ]);

    return {
      status: "success",
    } as const;
  }

  async close() {
    await this.browser.close();
  }
}
