import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page, WebWorker } from "puppeteer-core";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import puppeteer from "puppeteer";
import { connect, TargetType } from "puppeteer-core";
import { z } from "zod";

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface BrowserSession {
  session: {
    id: string;
    liveUrl: string;
  };
  browser: Browser;
}

if (process.env.JWT_SECRET === undefined) {
  throw new Error("JWT_SECRET is not defined");
}

// this token should be attached in headers of every trpc request when browserbase mode is used
// this allows browserbase session to assume as userId
export const assumedAccountJwt = jwtFactory(
  z.object({
    accountId: z.string(),
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
    autoCommentRunId: string;
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

export type BrowserBackendChannelMessage =
  | {
      action: "stopAutoCommenting";
    }
  | {
      action: "sendStatusUpdate";
    }
  | {
      action: "autoCommentingCompleted";
      payload: {
        autoCommentRunId: string;
        success: boolean;
        error?: string;
      };
    };

export interface LinkedInBrowserSessionParams {
  accountId: string;
  location: ProxyLocation;
  staticIpId?: string;
  engagekitExtensionId: string;
  browserProfileId: string;
  liveviewViewOnlyMode?: boolean;
  onBrowserMessage?: (
    this: LinkedInBrowserSession,
    data: BrowserBackendChannelMessage,
  ) => unknown;
}

export class LinkedInBrowserSession {
  public id: string;
  public sessionId!: string;
  public browser!: Browser;
  public liveUrl!: string;
  public pages!: {
    linkedin: Page;
    engagekitExtension: Page;
  };
  public pageInView: "linkedin" | "engagekitExtension" = "linkedin";
  private controller = new AbortController();
  public signal = this.controller.signal;

  private extensionWorker: WebWorker | null = null;
  constructor(
    private readonly registry: BrowserSessionRegistry,
    private readonly opts: LinkedInBrowserSessionParams,
    private readonly logger: Logger = console,
  ) {
    this.id = opts.accountId;
  }

  static async getOrCreate(
    registry: BrowserSessionRegistry,
    opts: LinkedInBrowserSessionParams,
    logger: Logger = console,
  ) {
    return await registry.register(
      new LinkedInBrowserSession(registry, opts, logger),
    );
  }

  async init(): Promise<LinkedInBrowserSession> {
    const accountJwt = await assumedAccountJwt.encode({
      accountId: this.opts.accountId,
    });

    this.controller = new AbortController();

    const result = await createBrowserSession({
      useProxy: true,
      useStealth: true,
      viewOnlyLiveView: this.opts.liveviewViewOnlyMode ?? false,
      solveCaptchas: true,
      extensionIds: [this.opts.engagekitExtensionId],
      proxyCountry: this.opts.location,
      profile: {
        id: this.opts.browserProfileId,
        persistChanges: true,
      },
      staticIpId: this.opts.staticIpId,
    });

    this.liveUrl = result.instance.session.liveUrl;

    this.sessionId = result.instance.session.id;

    this.browser = result.instance.browser;

    const engagekitExtensionPagePromise = this.browser
      .newPage()
      .then(async (page) => {
        // technically we should use the getExtensionId + manifest.dev.json key to get the extension id but screw it
        // const extensionId = await getExtensionId(
        //   path.join(
        //     __dirname,
        //     "../../../../apps/chrome-extension/manifest.dev.json",
        //   ),
        // );
        // // but somehow this is getting the wrong id, maybe manifest.dev.json's key is wrong idk
        // console.info({ extensionId });
        await page.goto(
          `chrome-extension://ofpificfhbopdfmlcmnmhhhmdbepgfbh/src/pages/popup/index.html?userJwt=${accountJwt}`,
          {
            waitUntil: "networkidle0",
          },
        );

        await this.setupBackendChannel(page);

        return page;
      });

    const linkedinPagePromise = this.browser.newPage().then(async (page) => {
      await page.goto("https://www.linkedin.com", {
        timeout: 0,
      });
      return page;
    });

    const [linkedin, engagekitExtension] = await Promise.all([
      linkedinPagePromise,
      engagekitExtensionPagePromise,
    ]);

    this.pages = {
      linkedin,
      engagekitExtension,
    };

    await this.bringToFront("linkedin");

    return this;
  }

  public async destroy() {
    await this.registry.destroy(this.id);
    this.controller.abort();
  }

  private async setupBackendChannel(page: Page) {
    const onBrowserMessage = this.opts.onBrowserMessage;
    if (onBrowserMessage === undefined) {
      return;
    }

    await page.exposeFunction(
      "_sendMessageToPuppeteerBackend",
      (data: BrowserBackendChannelMessage) => {
        onBrowserMessage.bind(this)(data);

        switch (data.action) {
          case "stopAutoCommenting": {
            // TODO: rely on caller to register these functions
            /* await this.destroy(); */
            break;
          }
          case "autoCommentingCompleted": {
            // await this.destroy();
            // if (process.env.NODE_ENV !== "test") {
            //   await this.prisma.autoCommentRun.update({
            //     where: { id: data.payload.autoCommentRunId },
            //     data: {
            //       status: data.payload.success ? "completed" : "errored",
            //       error: data.payload.error,
            //       endedAt: new Date(),
            //     },
            //   });
            // }
            break;
          }
        }
      },
    );
  }

  async bringToFront(page: "linkedin" | "engagekitExtension") {
    if (page === this.pageInView) {
      return;
    }
    this.pageInView = page;
    await this.pages[page].bringToFront();
  }

  async getExtensionWorker() {
    if (this.extensionWorker !== null) {
      return this.extensionWorker;
    }

    const target = await this.browser.waitForTarget(
      (target) => target.type() === TargetType.SERVICE_WORKER,
    );

    let attempts = 0;

    // we need to retry here because sometimes the worker is not ready
    // there is no straightforward method to wait for worker
    // so we just retry in 2000ms untill max_attempts is reached
    while (true) {
      try {
        this.extensionWorker = await target.worker();

        return this.extensionWorker;
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.logger.info(`extension worker met error: ${err as any}, retrying`);
        attempts++;

        if (attempts > 5) {
          throw err;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // TODO: add error handling in general to destroy when any errors are caught
  async startAutoCommenting(params: {
    autoCommentRunId: string;
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
    await this.bringToFront("linkedin");

    const worker = await this.getExtensionWorker();

    // test for target exists to verify the extension is loaded?
    if (worker === null) {
      return {
        status: "error",
        error: "extension target not found",
      } as const;
    }

    const result = await this.pages.linkedin.evaluate(async (params) => {
      const fn =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any)
        // prettier-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ._contentScriptFunctions as BrowserFunctions;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any)
        // prettier-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ._contentScriptFunctions as BrowserFunctions;
      return await fn.stopAutoCommenting();
    });

    return {
      status: "success",
      output: result,
    } as const;
  }
}

export class BrowserSessionRegistry {
  private readonly registry = new Map<string, LinkedInBrowserSession>();

  get(id: string) {
    return this.registry.get(id);
  }

  async register(session: LinkedInBrowserSession) {
    const existing = this.get(session.id);
    if (existing !== undefined) {
      const status = await hyperbrowser.sessions.get(existing.sessionId);
      if (status.status === "active") {
        return {
          status: "existing",
          instance: existing,
        } as const;
      }

      // if existing session exists but status is not active, we destroy it and create it again below
      await this.destroy(session.id);
    }

    const browserSession = await session.init();

    this.registry.set(session.id, browserSession);

    return {
      status: "new",
      instance: browserSession,
    } as const;
  }

  async destroy(accountId: string) {
    const entry = this.registry.get(accountId);
    if (entry === undefined) {
      return;
    }
    await Promise.all([
      entry.browser.close(),
      hyperbrowser.sessions.stop(entry.sessionId),
    ]);
    this.registry.delete(accountId);
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
  if (process.env.NODE_ENV !== "test") {
    const session = await hyperbrowser.sessions.create(params);
    const browser = await connect({
      browserWSEndpoint: session.wsEndpoint,
      defaultViewport: null,
    });

    if (session.liveUrl === undefined) {
      // docs say that liveUrl is always defined but not sure why its undefined here
      // so just throw error for now
      throw new Error("liveUrl is undefined");
    }

    return {
      session: {
        id: session.id,
        liveUrl: session.liveUrl,
      },
      browser,
    };
  }

  const filepath = path.join(
    __dirname,
    "../../../../apps/chrome-extension/dist_chrome",
  );
  console.info({ filepath });

  const browser = (await puppeteer.launch({
    defaultViewport: null,
    headless: false,
    pipe: true,
    userDataDir: path.join(process.cwd(), ".puppeteer", "user_data"),
    enableExtensions: [filepath],
  })) as unknown as Browser;

  return {
    session: {
      id: "mock",
      liveUrl: "http://localhost/mock-live-view",
    },
    browser,
  };
}
