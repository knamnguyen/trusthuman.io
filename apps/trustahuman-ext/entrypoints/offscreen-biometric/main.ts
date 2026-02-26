/**
 * Offscreen document for biometric (WebAuthn) verification
 * This runs in an offscreen context with access to navigator.credentials
 */

console.log("TrustAHuman Offscreen-Biometric: script loaded");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("TrustAHuman Offscreen-Biometric: received message", message.action);

  if (message.action === "verifyBiometric") {
    handleVerifyBiometric(message.credentialId, message.timeoutMs)
      .then((result) => {
        chrome.runtime.sendMessage({
          action: "biometricResult",
          success: result.success,
          error: result.error
        });
      });
    return true;
  }

  return false;
});

async function handleVerifyBiometric(
  credentialIdArray: number[],
  timeoutMs: number = 10000
): Promise<{ success: boolean; error?: string }> {
  try {
    const credentialId = new Uint8Array(credentialIdArray).buffer;
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const rpId = chrome.runtime.id;

    console.log("TrustAHuman Offscreen-Biometric: Verifying with rpId:", rpId);
    console.log("TrustAHuman Offscreen-Biometric: Credential ID length:", credentialIdArray.length);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId,
        allowCredentials: [
          {
            id: credentialId,
            type: "public-key",
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: timeoutMs,
      },
    });

    if (!assertion) {
      console.log("TrustAHuman Offscreen-Biometric: No assertion returned");
      return { success: false, error: "No assertion returned" };
    }

    console.log("TrustAHuman Offscreen-Biometric: Verification successful");
    return { success: true };
  } catch (err: unknown) {
    console.error("TrustAHuman Offscreen-Biometric: Verification error:", err);
    if (err instanceof Error) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "canceled" };
      }
      if (err.name === "InvalidStateError") {
        return { success: false, error: "invalid_credential" };
      }
      if (err.name === "TimeoutError" || err.message.includes("timeout")) {
        return { success: false, error: "timeout" };
      }
      if (err.name === "NotSupportedError") {
        return { success: false, error: "unavailable" };
      }
    }
    return { success: false, error: "unknown" };
  }
}
