/**
 * Shared verification flow logic for all platforms
 * Handles camera vs biometric verification based on user preferences
 */

import { showTrissToast, hideTrissToast } from "@sassy/ui/components/triss-toast";
import { trpc } from "./trpc-client";
import { useAuthStore } from "./auth-store";
import { getBiometricCredential } from "./biometric-auth";

export interface VerificationPreferences {
  useSelfie: boolean;
  useBiometric: boolean;
}

const PREFERENCES_KEY = "verification_preferences";

/**
 * Get user's verification method preferences
 * Defaults: selfie=true, biometric=true (use both, prioritize selfie)
 */
export async function getVerificationPreferences(): Promise<VerificationPreferences> {
  const result = await chrome.storage.local.get(PREFERENCES_KEY);
  return result[PREFERENCES_KEY] ?? { useSelfie: true, useBiometric: true };
}

/**
 * Save user's verification method preferences
 */
export async function setVerificationPreferences(prefs: VerificationPreferences): Promise<void> {
  await chrome.storage.local.set({ [PREFERENCES_KEY]: prefs });
}

export interface VerificationContext {
  platform: "linkedin" | "facebook" | "x" | "threads";
  userProfile: {
    profileUrl: string;
    profileHandle: string;
    displayName?: string;
    avatarUrl?: string;
  } | null;
  commentContext: {
    commentText: string;
    commentUrl?: string;
    post: {
      postUrl?: string;
      postAuthorName?: string;
      postAuthorAvatarUrl?: string;
      postTextSnippet?: string;
    };
  } | null;
}

export interface VerificationResult {
  verified: boolean;
  method: "selfie" | "biometric" | "none";
  confidence?: number;
  isFirstVerification?: boolean;
  humanNumber?: number;
  totalVerifications?: number;
  error?: string;
}

/**
 * Execute the verification flow based on user preferences
 * Priority: If both enabled, uses selfie first (more reliable)
 */
export async function executeVerification(
  context: VerificationContext,
  addToLocalStore: (result: VerificationResult) => void
): Promise<VerificationResult> {
  const prefs = await getVerificationPreferences();
  const biometricCredential = await getBiometricCredential();
  const hasBiometric = biometricCredential !== null;

  // Determine which method to use
  // Priority: selfie first if enabled, then biometric
  let useMethod: "selfie" | "biometric" | "none" = "none";

  if (prefs.useSelfie) {
    useMethod = "selfie";
  } else if (prefs.useBiometric && hasBiometric) {
    useMethod = "biometric";
  }

  // If only biometric is enabled but not set up, show error
  if (useMethod === "none") {
    if (prefs.useBiometric && !hasBiometric) {
      showTrissToast("camera_needed", "Biometric not set up. Enable selfie or set up biometric.", {
        label: "Set Up",
        onClick: () => {
          chrome.runtime.sendMessage({ action: "openSetup" });
          hideTrissToast();
        },
      });
    } else {
      showTrissToast("not_verified", "No verification method enabled. Check settings.");
    }
    return { verified: false, method: "none", error: "no_method" };
  }

  // Execute based on method
  if (useMethod === "biometric") {
    return await executeBiometricVerification(context, addToLocalStore);
  } else {
    return await executeSelfieVerification(context, addToLocalStore);
  }
}

/**
 * Execute biometric verification flow
 */
async function executeBiometricVerification(
  context: VerificationContext,
  addToLocalStore: (result: VerificationResult) => void
): Promise<VerificationResult> {
  const credentialId = await getBiometricCredential();
  if (!credentialId) {
    return { verified: false, method: "biometric", error: "no_credential" };
  }

  console.log(`TrustAHuman ${context.platform}: Using biometric verification`);

  // Show biometric prompt toast
  showTrissToast("biometric_prompt", "Touch ID to verify you're human...");

  // Attempt biometric verification via background service worker
  const credentialIdArray = Array.from(new Uint8Array(credentialId));
  const biometricResult = await chrome.runtime.sendMessage({
    action: "verifyBiometric",
    credentialId: credentialIdArray,
    timeoutMs: 15000,
  }) as { success: boolean; error?: string };

  console.log(`TrustAHuman ${context.platform}: Biometric result:`, biometricResult);

  if (!biometricResult.success) {
    if (biometricResult.error === "canceled") {
      showTrissToast("not_verified", "Verification canceled.");
    } else {
      showTrissToast("not_verified", "Biometric failed. Try again.");
    }
    return { verified: false, method: "biometric", error: biometricResult.error };
  }

  // Success - show verifying toast
  console.log(`TrustAHuman ${context.platform}: Biometric verified successfully`);
  showTrissToast("verifying");

  // Check authentication
  const { isSignedIn } = useAuthStore.getState();

  if (!isSignedIn || !context.userProfile || !context.commentContext) {
    showTrissToast("not_verified", "Please sign in to use biometric verification.");
    return { verified: false, method: "biometric", error: "not_signed_in" };
  }

  // Call submitActivity with biometric verification
  try {
    console.log(`TrustAHuman ${context.platform}: Calling submitActivity with biometric`);
    const result = await trpc.verification.submitActivity.mutate({
      verificationMethod: "biometric",
      platform: context.platform,
      userProfile: {
        profileUrl: context.userProfile.profileUrl,
        profileHandle: context.userProfile.profileHandle,
        displayName: context.userProfile.displayName,
        avatarUrl: context.userProfile.avatarUrl,
      },
      activity: {
        commentText: context.commentContext.commentText,
        commentUrl: context.commentContext.commentUrl,
        parentUrl: context.commentContext.post.postUrl,
        parentAuthorName: context.commentContext.post.postAuthorName || `${context.platform} User`,
        parentAuthorAvatarUrl: context.commentContext.post.postAuthorAvatarUrl || "",
        parentTextSnippet: context.commentContext.post.postTextSnippet || "",
      },
    });

    if (result.verified) {
      if (result.isFirstVerification) {
        showTrissToast("verified", `Welcome Human #${result.humanNumber}! You're verified!`);
      } else {
        showTrissToast("verified", `Verified! ${result.totalVerifications} activities`);
      }
    } else {
      showTrissToast("not_verified");
    }

    const verificationResult: VerificationResult = {
      verified: result.verified,
      method: "biometric",
      confidence: result.confidence,
      isFirstVerification: result.isFirstVerification,
      humanNumber: result.humanNumber,
      totalVerifications: result.totalVerifications,
    };

    addToLocalStore(verificationResult);

    // No "photo_deleted" toast for biometric
    await sleep(3000);
    hideTrissToast();

    return verificationResult;
  } catch (err: any) {
    console.error(`TrustAHuman ${context.platform}: submitActivity failed`, err);

    if (err?.message?.includes("UNAUTHORIZED")) {
      showTrissToast("not_verified", "Please sign in to verify.");
    } else if (err?.message?.includes("already linked")) {
      showTrissToast("not_verified", "This profile is linked to another account.");
    } else {
      showTrissToast("not_verified", "Verification failed. Try again.");
    }

    return { verified: false, method: "biometric", error: err?.message };
  }
}

/**
 * Execute selfie/camera verification flow
 */
async function executeSelfieVerification(
  context: VerificationContext,
  addToLocalStore: (result: VerificationResult) => void
): Promise<VerificationResult> {
  console.log(`TrustAHuman ${context.platform}: Using selfie verification`);

  // Show "capturing" toast
  showTrissToast("capturing");

  // Capture photo via background
  const response = await chrome.runtime.sendMessage({
    action: "capturePhoto",
  });

  if (!response?.base64) {
    console.warn(`TrustAHuman ${context.platform}: No base64 returned, camera denied or failed`);
    showTrissToast("camera_needed", "Camera access needed to verify you're human", {
      label: "Grant Camera Access",
      onClick: () => {
        chrome.runtime.sendMessage({ action: "openSetup" });
        hideTrissToast();
      },
    });
    return { verified: false, method: "selfie", error: "camera_denied" };
  }

  // Show "verifying" toast
  showTrissToast("verifying");

  const { isSignedIn } = useAuthStore.getState();

  if (!isSignedIn || !context.userProfile || !context.commentContext) {
    // Fall back to local-only verification
    console.log(`TrustAHuman ${context.platform}: Not authenticated, using local verification`);
    try {
      const result = await trpc.verification.analyzePhoto.mutate({
        photoBase64: response.base64,
      });

      if (result.verified) {
        showTrissToast("verified", "Verified! Sign in to track your stats.");
      } else {
        showTrissToast("not_verified");
      }

      const verificationResult: VerificationResult = {
        verified: result.verified,
        method: "selfie",
        confidence: result.confidence,
      };

      addToLocalStore(verificationResult);

      // Show photo_deleted toast
      await sleep(3000);
      showTrissToast("photo_deleted");
      await sleep(3000);
      hideTrissToast();

      return verificationResult;
    } catch (err) {
      console.error(`TrustAHuman ${context.platform}: analyzePhoto failed`, err);
      showTrissToast("not_verified", "Verification failed. Try again.");
      return { verified: false, method: "selfie", error: "analyze_failed" };
    }
  }

  // Full verification with submitActivity
  try {
    console.log(`TrustAHuman ${context.platform}: Calling submitActivity with camera`);
    const result = await trpc.verification.submitActivity.mutate({
      verificationMethod: "camera",
      photoBase64: response.base64,
      platform: context.platform,
      userProfile: {
        profileUrl: context.userProfile.profileUrl,
        profileHandle: context.userProfile.profileHandle,
        displayName: context.userProfile.displayName,
        avatarUrl: context.userProfile.avatarUrl,
      },
      activity: {
        commentText: context.commentContext.commentText,
        commentUrl: context.commentContext.commentUrl,
        parentUrl: context.commentContext.post.postUrl,
        parentAuthorName: context.commentContext.post.postAuthorName || `${context.platform} User`,
        parentAuthorAvatarUrl: context.commentContext.post.postAuthorAvatarUrl || "",
        parentTextSnippet: context.commentContext.post.postTextSnippet || "",
      },
    });

    if (result.verified) {
      if (result.isFirstVerification) {
        showTrissToast("verified", `Welcome Human #${result.humanNumber}! You're verified!`);
      } else {
        showTrissToast("verified", `Verified! ${result.totalVerifications} activities`);
      }
    } else {
      showTrissToast("not_verified");
    }

    const verificationResult: VerificationResult = {
      verified: result.verified,
      method: "selfie",
      confidence: result.confidence,
      isFirstVerification: result.isFirstVerification,
      humanNumber: result.humanNumber,
      totalVerifications: result.totalVerifications,
    };

    addToLocalStore(verificationResult);

    // Show photo_deleted toast
    await sleep(3000);
    showTrissToast("photo_deleted");
    await sleep(3000);
    hideTrissToast();

    return verificationResult;
  } catch (err: any) {
    console.error(`TrustAHuman ${context.platform}: submitActivity failed`, err);

    if (err?.message?.includes("UNAUTHORIZED")) {
      showTrissToast("not_verified", "Please sign in to verify.");
    } else if (err?.message?.includes("already linked")) {
      showTrissToast("not_verified", "This profile is linked to another account.");
    } else {
      showTrissToast("not_verified", "Verification failed. Try again.");
    }

    return { verified: false, method: "selfie", error: err?.message };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
