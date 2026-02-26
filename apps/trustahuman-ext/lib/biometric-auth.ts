/**
 * Biometric Authentication Service
 * Provides Touch ID / Windows Hello / fingerprint verification via WebAuthn
 */

/**
 * Check if biometric platform authenticator is available on this device
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) {
      return false;
    }
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (err) {
    console.error("Error checking biometric availability:", err);
    return false;
  }
}

/**
 * Get the rpId for WebAuthn - must match the origin's effective domain
 * For Chrome extensions, this is the extension ID
 */
function getRpId(): string {
  // For Chrome extensions, the rpId is just the extension ID
  // The origin is chrome-extension://[id], and rpId must be a valid domain
  return chrome.runtime.id;
}

/**
 * Get the relying party name for display in system dialogs
 */
function getRpName(): string {
  return "TrustHuman - Human Verification";
}

/**
 * Register biometric credential (one-time setup)
 * Uses WebAuthn to create a platform authenticator credential
 */
export async function registerBiometric(): Promise<{
  credentialId: ArrayBuffer | null;
  success: boolean;
  error?: string;
}> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const rpId = getRpId();

    console.log("TrustHuman Biometric: Registering with rpId:", rpId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: getRpName(),
          id: rpId,
        },
        user: {
          id: userId,
          name: "TrustHuman User",
          displayName: "TrustHuman User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256 (fallback)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          requireResidentKey: false,
        },
        timeout: 60000, // 60 seconds
      },
    });

    if (!credential || !(credential instanceof PublicKeyCredential)) {
      return { credentialId: null, success: false, error: "Invalid credential" };
    }

    // Set preference to true on successful registration
    await setBiometricPreference(true);

    return {
      credentialId: credential.rawId,
      success: true,
    };
  } catch (err: unknown) {
    console.error("Biometric registration error:", err);
    if (err instanceof Error) {
      if (err.name === "NotAllowedError") {
        return { credentialId: null, success: false, error: "canceled" };
      }
      if (err.name === "NotSupportedError") {
        return { credentialId: null, success: false, error: "unavailable" };
      }
    }
    return { credentialId: null, success: false, error: "unknown" };
  }
}

/**
 * Verify biometric (per-submission verification)
 * Uses WebAuthn to get an assertion from the platform authenticator
 */
export async function verifyBiometric(
  credentialId: ArrayBuffer,
  timeoutMs: number = 10000
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const rpId = getRpId();

    console.log("TrustHuman Biometric: Verifying with rpId:", rpId);

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
      return { success: false, error: "No assertion returned" };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Biometric verification error:", err);
    if (err instanceof Error) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "canceled" };
      }
      if (err.name === "TimeoutError") {
        return { success: false, error: "timeout" };
      }
      if (err.name === "NotSupportedError") {
        return { success: false, error: "unavailable" };
      }
    }
    return { success: false, error: "unknown" };
  }
}

/**
 * Store biometric credential ID in chrome.storage.local
 */
export async function storeBiometricCredential(credentialId: ArrayBuffer): Promise<void> {
  const credentialArray = Array.from(new Uint8Array(credentialId));
  await chrome.storage.local.set({
    biometric_credential_id: credentialArray,
  });
}

/**
 * Retrieve biometric credential ID from chrome.storage.local
 */
export async function getBiometricCredential(): Promise<ArrayBuffer | null> {
  const result = await chrome.storage.local.get("biometric_credential_id");
  if (!result.biometric_credential_id) {
    return null;
  }
  return new Uint8Array(result.biometric_credential_id).buffer;
}

/**
 * Clear biometric credential from chrome.storage.local
 */
export async function clearBiometricCredential(): Promise<void> {
  await chrome.storage.local.remove(["biometric_credential_id", "biometric_preference"]);
}

/**
 * Set biometric preference (user prefers biometric over camera)
 */
export async function setBiometricPreference(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({
    biometric_preference: enabled,
  });
}

/**
 * Get biometric preference
 */
export async function getBiometricPreference(): Promise<boolean> {
  const result = await chrome.storage.local.get("biometric_preference");
  return result.biometric_preference ?? false;
}
