import { getStandaloneTRPCClient } from "@src/trpc/react";

class ContentScriptContext {
  private trpcClient: ReturnType<typeof getStandaloneTRPCClient>;
  private opts: { assumedUserToken?: string } = {};

  constructor() {
    this.trpcClient = getStandaloneTRPCClient(this.opts);
  }

  setAssumedUserToken(assumedUserToken: string) {
    this.opts.assumedUserToken = assumedUserToken;
  }

  getTrpcClient() {
    return this.trpcClient;
  }
}

export const contentScriptContext = new ContentScriptContext();
