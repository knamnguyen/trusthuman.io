import path from "node:path";
import type { Browser, Page } from "puppeteer";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import { authenticator } from "otplib";
import puppeteer, { TargetType } from "puppeteer";
import { connect } from "puppeteer-core";
import { z } from "zod";

import type { PrismaClient } from "@sassy/db";

import type { Logger } from "./commons";
import { env } from "./env";
import { jwtFactory } from "./jwt";

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

if (process.env.JWT_SECRET === undefined) {
  throw new Error("JWT_SECRET is not defined");
}

// this token should be attached in headers of every trpc request when browserbase mode is used
export const assumedUserJwt = jwtFactory(
  z.object({
    userId: z.string(),
  }),
  86_400_000, // put a day
  process.env.JWT_SECRET,
);

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

export interface BrowserFunctions {
  startAutoCommenting: (params: {
    scrollDuration: number;
    commentDelay: number;
    maxPosts: number;
    styleGuide: string;
    duplicateWindow: number;
    commentAsCompanyEnabled?: boolean;
    timeFilterEnabled?: boolean;
    minPostAge?: number;
    manualApproveEnabled?: boolean;
    authenticityBoostEnabled?: boolean;
    commentProfileName?: string;
    languageAwareEnabled?: boolean;
    skipCompanyPagesEnabled?: boolean;
    skipPromotedPostsEnabled?: boolean;
    skipFriendsActivitiesEnabled?: boolean;
    blacklistEnabled?: boolean;
    blacklistAuthors?: string[];
  }) => Promise<void>;
  stopAutoCommenting: () => Promise<void>;
}

export class LinkedInBrowserSession {
  public browser!: Browser;
  public pages!: {
    linkedin: Page;
    engagekitExtension: Page;
  };
  public pageInView: "linkedin" | "engagekitExtension" = "linkedin";
  constructor(
    private readonly opts: {
      userId: string;
      username: string;
      password: string;
      twoFactorSecretKey: string;
      location: ProxyLocation;
      staticIpId?: string;
      browserProfileId?: string;
      extensionIds?: string[];
    },
    private readonly logger: Logger = console,
    public readonly sessionId: string,
  ) {}

  public static getLatestEngagekitExtensionId(db: PrismaClient) {
    return db.extensionDeploymentMeta.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }

  async init(): Promise<LinkedInBrowserSession> {
    const userJwt = await assumedUserJwt.encode({
      userId: this.opts.userId,
    });

    const result = await createBrowserSession({
      useProxy: true,
      useStealth: true,
      solveCaptchas: true,
      extensionIds: this.opts.extensionIds,
      proxyCountry: this.opts.location,
      profile: {
        id: this.opts.browserProfileId,
      },
      staticIpId: this.opts.staticIpId,
    });

    this.browser = result.instance.browser;

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
          `chrome-extension://ofpificfhbopdfmlcmnmhhhmdbepgfbh/src/pages/popup/index.html?userJwt=${userJwt}`,
        );

        return page;
      }),
    };

    await this.bringToFront("linkedin");

    return this;
  }

  async bringToFront(page: "linkedin" | "engagekitExtension") {
    if (page === this.pageInView) {
      return;
    }
    this.pageInView = page;
    await this.pages[page].bringToFront();
  }

  async login() {
    const page = this.pages.linkedin;
    await page.bringToFront();

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

  async startAutoCommenting(params: {
    scrollDuration: number;
    commentDelay: number;
    maxPosts: number;
    styleGuide: string;
    duplicateWindow: number;
    commentAsCompanyEnabled?: boolean;
    timeFilterEnabled?: boolean;
    minPostAge?: number;
    manualApproveEnabled?: boolean;
    authenticityBoostEnabled?: boolean;
    commentProfileName?: string;
    languageAwareEnabled?: boolean;
    skipCompanyPagesEnabled?: boolean;
    skipPromotedPostsEnabled?: boolean;
    skipFriendsActivitiesEnabled?: boolean;
    blacklistEnabled?: boolean;
    blacklistAuthors?: string[];
  }) {
    const worker = await this.getExtensionWorker();
    if (worker === null) {
      return {
        status: "error",
        error: "extension target not found",
      } as const;
    }

    const result = await worker.evaluate(async (params) => {
      const fn =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (globalThis as any).exposedFunctions as BrowserFunctions;
      return await fn.startAutoCommenting(params);
    }, params);

    return {
      status: "success",
      output: result,
    } as const;
  }

  async stopAutoCommenting() {
    const worker = await this.getExtensionWorker();
    if (worker === null) {
      return {
        status: "error",
        error: "extension target not found",
      } as const;
    }

    const result = await worker.evaluate(async () => {
      const fn =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (globalThis as any).exposedFunctions as BrowserFunctions;
      return await fn.stopAutoCommenting();
    });

    return {
      status: "success",
      output: result,
    } as const;
  }

  async getExtensionWorker() {
    const targets = this.browser.targets();
    const target =
      targets.find((t) => t.type() === TargetType.SERVICE_WORKER) ?? null;

    if (target === null) {
      return null;
    }

    const worker = await target.worker();

    if (worker === null) {
      return null;
    }

    return worker;
  }
}

export class BrowserSessionRegistry {
  private readonly registry = new Map<string, LinkedInBrowserSession>();

  get(id: string) {
    return this.registry.get(id);
  }

  async register(id: string, session: LinkedInBrowserSession) {
    const existing = this.get(id);
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

      // if existing session exists but status is not active, we destroy it and create it again below
      await this.destroy(id);
    }

    const browserSession = await session.init();

    return {
      status: "new",
      instance: browserSession,
    } as const;
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

async function createBrowserSession(
  params: CreateHyperbrowserSessionParams,
): Promise<{
  status: "new" | "existing";
  instance: BrowserSession;
}> {
  // if there is existing, then check it's status, if its active then just return the existing instance
  // else destroy and create a new one

  const session = await createHyperbrowserSession(params);

  return {
    status: "new",
    instance: session,
  } as const;
}

async function createHyperbrowserSession(
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

export class BrowserSessionFactory {
  constructor(private readonly registry: BrowserSessionRegistry) {}
}
