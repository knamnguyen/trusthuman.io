import type { XAuth } from "@/entrypoints/background/index";

export async function getXAuth(): Promise<XAuth | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getXAuth" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("xBooster: Failed to get auth:", chrome.runtime.lastError);
        resolve(null);
        return;
      }
      resolve(response?.success ? response.auth : null);
    });
  });
}
