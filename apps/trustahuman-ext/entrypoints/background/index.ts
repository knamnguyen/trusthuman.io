export default defineBackground(() => {
  console.log("TrustAHuman - Background loaded");

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("TrustAHuman BG: received message", message.action);

    if (message.action === "openSetup") {
      chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") });
      sendResponse({ ok: true });
      return false;
    }

    if (message.action === "capturePhoto") {
      handleCapturePhoto()
        .then((result) => {
          console.log("TrustAHuman BG: capturePhoto result, has base64:", !!result.base64);
          sendResponse(result);
        })
        .catch((err) => {
          console.error("TrustAHuman BG: capturePhoto error:", err);
          sendResponse({ base64: null });
        });
      return true; // async response
    }

    if (message.action === "captureResult") {
      console.log("TrustAHuman BG: captureResult received, has base64:", !!message.base64);
      return false;
    }
  });

  async function handleCapturePhoto(): Promise<{ base64: string | null }> {
    console.log("TrustAHuman BG: handleCapturePhoto started");
    const hasDoc = await chrome.offscreen.hasDocument();
    console.log("TrustAHuman BG: hasDocument:", hasDoc);

    if (!hasDoc) {
      console.log("TrustAHuman BG: creating offscreen document");
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: "Capture webcam for human verification",
      });
      console.log("TrustAHuman BG: offscreen document created");
    }

    const base64 = await new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("TrustAHuman BG: capturePhoto timed out after 10s");
        resolve(null);
      }, 10000);

      const listener = (msg: any) => {
        if (msg.action === "captureResult") {
          console.log("TrustAHuman BG: captureResult listener fired, has base64:", !!msg.base64);
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(listener);
          resolve(msg.base64 ?? null);
        }
      };
      chrome.runtime.onMessage.addListener(listener);

      console.log("TrustAHuman BG: sending startCapture to offscreen");
      chrome.runtime.sendMessage({ action: "startCapture" });
    });

    try {
      await chrome.offscreen.closeDocument();
      console.log("TrustAHuman BG: offscreen document closed");
    } catch {
      /* already closed */
    }

    return { base64 };
  }
});
