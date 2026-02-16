console.log("TrustAHuman Offscreen: script loaded");

chrome.runtime.onMessage.addListener((message) => {
  console.log("TrustAHuman Offscreen: received message", message.action);
  if (message.action === "startCapture") {
    capturePhoto();
    return true;
  }
});

async function capturePhoto() {
  try {
    console.log("TrustAHuman Offscreen: requesting getUserMedia");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
    });
    console.log("TrustAHuman Offscreen: got stream");

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    // Wait 500ms for camera warmup
    await new Promise((r) => setTimeout(r, 500));

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, 640, 480);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.replace("data:image/jpeg;base64,", "");

    stream.getTracks().forEach((t) => t.stop());

    console.log("TrustAHuman Offscreen: captured, base64 length:", base64.length);
    chrome.runtime.sendMessage({ action: "captureResult", base64 });
  } catch (err) {
    console.error("TrustAHuman Offscreen: Camera capture failed:", err);
    chrome.runtime.sendMessage({ action: "captureResult", base64: null });
  }
}
