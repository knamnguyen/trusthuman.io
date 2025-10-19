import path from "node:path";
import type { Browser, Page } from "puppeteer";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import { authenticator } from "otplib";
import puppeteer, { TargetType } from "puppeteer";
import { connect } from "puppeteer-core";

import type { PrismaClient } from "@sassy/db";

import type { Logger } from "./commons";
import { env } from "./env";

export const hyperbrowser = new Hyperbrowser({
  apiKey: env.HYPERBROWSER_API_KEY,
});

export type CreateHyperbrowserSessionParams = NonNullable<
  Parameters<Hyperbrowser["sessions"]["create"]>[0]
>;

export type ProxyLocation = NonNullable<
  CreateHyperbrowserSessionParams["proxyCountry"]
>;

interface BrowserSession {
  sessionId: string;
  browser: Browser;
}

async function getExtensionId(manifestJsonPath: string) {
  const json = (await import(manifestJsonPath)) as { key?: string };
  if (!json.key) {
    throw new Error("Extension key not found in manifest.json");
  }

  const binaryKey = Buffer.from(json.key, "base64");

  // SHA-256 hash
  const hash = await crypto.subtle.digest("SHA-256", binaryKey);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Take first 32 characters and translate 0-9a-f to a-p
  const extensionId = hashHex
    .slice(0, 32)
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 48 && code <= 57) {
        // 0-9
        return String.fromCharCode(code + 49); // converts to a-j
      }
      return char; // a-f stays as is
    })
    .join("");

  return extensionId;
}

export class LinkedInBrowserSession {
  public browser!: Browser;
  public pages!: {
    linkedin: Page;
    engagekitExtension: Page;
  };
  public pageInView: "linkedin" | "engagekitExtension" = "linkedin";
  public ready: Promise<void>;
  private browserSessionFactory: BrowserSessionFactory;
  constructor(
    registry: BrowserSessionRegistry,
    private readonly opts: {
      username: string;
      password: string;
      twoFactorSecretKey: string;
      location: ProxyLocation;
      staticIpId?: string;
      browserProfileId?: string;
      extensionIds?: string[];
    },
    private readonly logger: Logger = console,
  ) {
    this.browserSessionFactory = new BrowserSessionFactory(registry);
    // NOTE: remember to call await session.ready before using any methods within the class
    this.ready = this.init();
  }

  public static getLatestEngagekitExtensionId(db: PrismaClient) {
    return db.extensionDeploymentMeta.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  private async init() {
    const result = await this.browserSessionFactory.create(this.opts.username, {
      useProxy: true,
      extensionIds: this.opts.extensionIds,
      proxyCountry: this.opts.location,
      profile: {
        id: this.opts.browserProfileId,
      },
      staticIpId: this.opts.staticIpId,
    });

    this.browser = result.instance.browser;

    const target = this.browser.targets();
    console.info(target.map((t) => t.type()));

    this.pages = {
      linkedin: await this.browser.newPage().then(async (page) => {
        await page.goto("https://www.linkedin.com");
        return page;
      }),
      engagekitExtension: await this.browser.newPage().then(async (page) => {
        // technically we should use the getExtensionId + manifest.dev.json key to get the extension id but screw it
        const extensionId = await getExtensionId(
          path.join(
            __dirname,
            "../../../../apps/chrome-extension/manifest.dev.json",
          ),
        );
        // but somehow this is getting the wrong id, maybe manifest.dev.json's key is wrong idk
        console.info({ extensionId });
        await page.goto(
          `chrome-extension://flcmblnepmbbmohljbdnejgkkpeangfk/src/pages/popup/index.html`,
        );
        return page;
      }),
    };

    await this.bringToFront("linkedin");
  }

  async bringToFront(page: "linkedin" | "engagekitExtension") {
    if (page === this.pageInView) {
      return;
    }
    this.pageInView = page;
    await this.pages[page].bringToFront();
  }

  async loginToEngagekitExtension(tempAuthToken: string) {
    await this.bringToFront("engagekitExtension");
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

export class BrowserSessionRegistry {
  private readonly registry = new Map<string, BrowserSession>();

  get(id: string) {
    return this.registry.get(id);
  }

  register(id: string, session: BrowserSession) {
    const existing = this.registry.get(id);
    if (existing !== undefined) {
      throw new Error(`Session with id ${id} already exists`);
    }
    this.registry.set(id, session);
  }

  async destroy(id: string) {
    const entry = this.registry.get(id);
    if (entry === undefined) {
      return;
    }
    await entry.browser.close();
    await hyperbrowser.sessions.stop(id);
    this.registry.delete(id);
  }

  async destroyAll() {
    const entries = Array.from(this.registry.entries());
    await Promise.all(
      entries
        .filter(([_, entry]) => entry.sessionId !== "mock")
        .map(async ([id, entry]) => {
          await entry.browser.close();
          await hyperbrowser.sessions.stop(id);
          this.registry.delete(id);
        }),
    );
  }
}

export const browserRegistry = new BrowserSessionRegistry();

export class BrowserSessionFactory {
  constructor(private readonly registry: BrowserSessionRegistry) {}

  private async createSession(
    params: CreateHyperbrowserSessionParams,
  ): Promise<BrowserSession> {
    if (process.env.NODE_ENV === "production") {
      const session = await hyperbrowser.sessions.create(params);
      const browser = (await connect({
        browserWSEndpoint: session.wsEndpoint,
        defaultViewport: null,
      })) as unknown as Browser;
      return { sessionId: session.id, browser };
    }

    const filepath = path.join(
      __dirname,
      "../../../../apps/chrome-extension/dist_chrome",
    );

    // TODO: figure out how to add the chrome-extension build dir in production
    const browser = await puppeteer.launch({
      defaultViewport: null,
      headless: false,
      pipe: true,
      enableExtensions: [filepath],
    });

    return {
      sessionId: "mock",
      browser,
    };
  }

  async create(
    id: string,
    params: CreateHyperbrowserSessionParams,
  ): Promise<{
    status: "new" | "existing";
    instance: BrowserSession;
  }> {
    const existing = this.registry.get(id);

    // if there is existing, then check it's status, if its active then just return the existing instance
    // else destroy and create a new one
    if (existing !== undefined) {
      if (existing.sessionId === "mock") {
        return {
          status: "existing",
          instance: existing,
        } as const;
      }

      const status = await hyperbrowser.sessions.get(existing.sessionId);
      if (status.status === "active") {
        return {
          status: "existing",
          instance: existing,
        } as const;
      }

      await this.registry.destroy(id);
    }

    const session = await this.createSession(params);

    this.registry.register(id, session);

    return {
      status: "new",
      instance: session,
    } as const;
  }
}
