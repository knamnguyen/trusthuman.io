/**
 * Setup page script for camera and biometric permission
 */

import {
  isBiometricAvailable,
  registerBiometric,
  storeBiometricCredential,
  getBiometricCredential,
} from "@/lib/biometric-auth";

const btn = document.getElementById("grant-btn") as HTMLButtonElement;
const status = document.getElementById("status") as HTMLDivElement;

// Biometric setup
const biometricSection = document.getElementById("biometric-section") as HTMLDivElement;
const biometricBtn = document.getElementById("biometric-btn") as HTMLButtonElement;
const biometricStatus = document.getElementById("biometric-status") as HTMLDivElement;

// === Check existing status on page load ===
async function checkExistingStatus() {
  // Check camera permission
  try {
    const permissionResult = await navigator.permissions.query({ name: "camera" as PermissionName });
    if (permissionResult.state === "granted") {
      status.className = "granted";
      status.textContent = "✓ Camera enabled!";
      btn.textContent = "Enabled ✓";
      btn.disabled = true;
    }
  } catch {
    // Permissions API not supported, will check on click
  }

  // Check biometric credential
  const existingCredential = await getBiometricCredential();
  if (existingCredential) {
    biometricStatus.className = "granted";
    biometricStatus.textContent = "✓ Biometric enabled!";
    biometricBtn.textContent = "Enabled ✓";
    biometricBtn.disabled = true;
  }

  // Check biometric availability
  const available = await isBiometricAvailable();
  if (available) {
    biometricSection.style.display = "block";
  } else {
    // Show informational message if biometric not available
    biometricSection.style.display = "block";
    biometricBtn.style.display = "none";
    biometricStatus.className = "pending";
    biometricStatus.textContent = "Not available on this device. Use selfie verification instead.";
  }
}

// Run status check on load
checkExistingStatus();

// Camera permission
btn.addEventListener("click", async () => {
  btn.disabled = true;
  btn.textContent = "Requesting...";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    status.className = "granted";
    status.textContent = "✓ Camera enabled!";
    btn.textContent = "Enabled ✓";
  } catch (err) {
    console.error("Camera permission error:", err);
    status.className = "denied";
    status.textContent = "Camera access denied. Please allow access and try again.";
    btn.disabled = false;
    btn.textContent = "Try Again";
  }
});

// Biometric registration
biometricBtn.addEventListener("click", async () => {
  biometricBtn.disabled = true;
  biometricBtn.textContent = "Registering...";

  try {
    const result = await registerBiometric();

    if (result.success && result.credentialId) {
      await storeBiometricCredential(result.credentialId);
      biometricStatus.className = "granted";
      biometricStatus.textContent = "✓ Biometric enabled!";
      biometricBtn.textContent = "Enabled ✓";
    } else {
      // Handle errors
      biometricStatus.className = "denied";
      if (result.error === "canceled") {
        biometricStatus.textContent = "Cancelled. Try again when ready.";
      } else if (result.error === "unavailable") {
        biometricStatus.textContent = "Not available on this device.";
      } else {
        biometricStatus.textContent = "Setup failed. Please try again.";
      }
      biometricBtn.disabled = false;
      biometricBtn.textContent = "Try Again";
    }
  } catch (err) {
    console.error("Biometric registration error:", err);
    biometricStatus.className = "denied";
    biometricStatus.textContent = "Setup failed. Please try again.";
    biometricBtn.disabled = false;
    biometricBtn.textContent = "Try Again";
  }
});
