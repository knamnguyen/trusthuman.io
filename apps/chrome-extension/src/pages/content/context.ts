import { getStandaloneTRPCClient } from "@src/trpc/react";

class ContentScriptContext {
  private trpcClient: ReturnType<typeof getStandaloneTRPCClient>;

  constructor() {
    this.trpcClient = getStandaloneTRPCClient();
  }

  setAssumedUserToken(assumedUserToken: string) {
    console.info("setting assumed user token in content script context");
    this.trpcClient = getStandaloneTRPCClient({ assumedUserToken });
  }

  getTrpcClient() {
    return this.trpcClient;
  }
}

export const contentScriptContext = new ContentScriptContext();
