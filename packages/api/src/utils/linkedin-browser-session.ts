import type { Browser, Page } from "puppeteer-core";
import { authenticator } from "otplib";

import type { ProxyLocation } from "./browser";
import type { Logger } from "./commons";
import { browserSession } from "./browser";

export class LinkedInBrowserSession {
  public browser!: Browser;
  public page!: Page;
  public ready: Promise<void>;
  constructor(
    private readonly opts: {
      username: string;
      password: string;
      twoFactorSecretKey: string;
      location: ProxyLocation;
      staticIpId?: string;
      browserProfileId?: string;
    },
    private readonly logger: Logger,
  ) {
    this.ready = this.init();
  }

  private async init() {
    const session = await browserSession.create({
      useProxy: true,
      proxyCountry: this.opts.location,
      profile: {
        id: this.opts.browserProfileId,
      },
      staticIpId: this.opts.staticIpId,
    });

    this.browser = session.browser;

    const [page] = await this.browser.pages();

    if (page === undefined) {
      throw new Error("page not found");
    }
    this.page = page;
  }

  async login() {
    const [page] = await this.browser.pages();
    if (page === undefined) {
      return {
        status: "error",
        code: 500,
        error: "page not found",
      } as const;
    }
    this.logger.info("navigating to linkedin.com");

    await page.goto("https://www.linkedin.com", {
      waitUntil: "networkidle0",
    });
    const signInButton = await page.$(
      'a[data-tracking-control-name="guest_homepage-basic_nav-header-signin"]',
    );
    if (signInButton === null) {
      this.logger.error("sign in button not found");
      return {
        status: "error",
        code: 500,
        error: "sign in button not found",
      } as const;
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      signInButton.click(),
    ]);
    this.logger.info("navigated to login page");

    this.logger.info("typing username and password");
    await page.type("input#username", this.opts.username, {
      delay: 40,
    });
    this.logger.info("typed username");
    await page.type("input#password", this.opts.password, {
      delay: 40,
    });
    this.logger.info("typed password");

    const submitButton = await page.$('button[type="submit"]');
    if (submitButton === null) {
      this.logger.error("submit button not found");
      return {
        status: "error",
        code: 500,
        error: "submit button not found",
      } as const;
    }
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      submitButton.click(),
    ]);

    const url = page.url();

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

    const otpElement = await page.$("input#input__phone_verification_pin");
    if (otpElement === null) {
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
    await otpElement.type(otp, { delay: 40 });

    const submitOtpButton = await page.$(
      'button#two-step-submit-button[type="submit"]',
    );

    if (submitOtpButton === null) {
      this.logger.error("submit otp button not found");
      return {
        status: "error",
        code: 500,
        error: "submit otp button not found",
      } as const;
    }

    this.logger.info("submitting otp");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      submitOtpButton.click(),
    ]);

    return {
      status: "success",
    } as const;
  }
}
