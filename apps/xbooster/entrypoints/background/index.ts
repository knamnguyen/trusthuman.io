import { storage } from "wxt/storage";

export interface XAuth {
  cookie: string;
  csrfToken: string;
  authorization: string;
  userAgent: string;
}

export default defineBackground(() => {
  // Intercept X.com API requests to capture auth headers
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      const headers = Object.fromEntries(
        details.requestHeaders?.map((h) => [h.name.toLowerCase(), h.value]) ??
          [],
      );

      const cookie = headers["cookie"];
      const csrfToken = headers["x-csrf-token"];
      const authorization = headers["authorization"];
      const userAgent = headers["user-agent"];

      if (cookie && csrfToken && authorization) {
        storage.setItem<XAuth>("local:xAuth", {
          cookie,
          csrfToken,
          authorization,
          userAgent: userAgent ?? "",
        });
        console.log("xBooster: Captured X.com auth headers");
      }
    },
    { urls: ["*://x.com/i/api/*", "*://*.x.com/i/api/*"] },
    ["requestHeaders", "extraHeaders"],
  );

  // Handle messages from content scripts
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "getXAuth") {
      storage.getItem<XAuth>("local:xAuth").then((auth) => {
        sendResponse({ success: !!auth, auth });
      });
      return true; // async response
    }
  });

  console.log("xBooster: Background script loaded");
});
