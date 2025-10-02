import type { Session } from "@hyperbrowser/sdk/types";
import type { Browser } from "puppeteer-core";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import { connect } from "puppeteer-core";

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

export class BrowserSession {
  private readonly registry = new Map<
    string,
    {
      session: Session;
      browser: Browser;
    }
  >();

  get(id: string) {
    return this.registry.get(id);
  }

  async getOrCreate(id: string, params: CreateHyperbrowserSessionParams) {
    const existing = this.registry.get(id);
    if (existing !== undefined) {
      return existing;
    }
    return this.create(id, params);
  }

  async create(id: string, params: CreateHyperbrowserSessionParams) {
    const session = await hyperbrowser.sessions.create(params);

    const browser = await connect({
      browserWSEndpoint: session.wsEndpoint,
      defaultViewport: null,
    });
    this.registry.set(id, { session, browser });

    return {
      session,
      browser,
    };
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

  async status(id: string) {
    const entry = this.registry.get(id);
    if (entry === undefined) {
      return {
        status: "closed",
      } as const;
    }

    const status = await hyperbrowser.sessions.get(entry.session.id);
    return {
      status: status.status,
    } as const;
  }
}

export const browserSession = new BrowserSession();
