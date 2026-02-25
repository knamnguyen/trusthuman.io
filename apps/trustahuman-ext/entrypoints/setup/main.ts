/**
 * Setup page script for camera permission
 */

const btn = document.getElementById("grant-btn") as HTMLButtonElement;
const status = document.getElementById("status") as HTMLDivElement;

btn.addEventListener("click", async () => {
  btn.disabled = true;
  btn.textContent = "Requesting...";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    status.className = "granted";
    status.textContent = "Camera permission: granted! You can close this tab.";
    btn.textContent = "Done!";
  } catch (err) {
    console.error("Camera permission error:", err);
    status.className = "denied";
    status.textContent =
      "Camera permission denied. Please allow camera access and try again.";
    btn.disabled = false;
    btn.textContent = "Try Again";
  }
});
