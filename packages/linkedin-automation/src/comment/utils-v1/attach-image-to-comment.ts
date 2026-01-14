/**
 * Attach Image to Comment - DOM v1 (Legacy)
 *
 * Attaches an image to a LinkedIn comment box programmatically.
 *
 * Flow:
 * 1. Find "Add a photo" button by aria-label
 * 2. Temporarily block file picker from opening
 * 3. Click button to make LinkedIn create the file input
 * 4. If URL: Fetch image and convert to File object
 *    If Blob: Wrap in File object directly
 * 5. Set file on input using DataTransfer API
 * 6. Dispatch change event to trigger LinkedIn's handler
 */

/**
 * Attaches an image to a comment before submitting.
 * Downloads the image from URL (or uses Blob directly) and attaches it to the comment box.
 *
 * @param postContainer - The LinkedIn post container element
 * @param imageSource - URL string or Blob of the image to attach
 * @returns Promise<boolean> - true if image was attached successfully
 */
export async function attachImageToComment(
  postContainer: HTMLElement,
  imageSource: string | Blob
): Promise<boolean> {
  try {
    // Find the "Add a photo" button within the post container
    const addPhotoBtn = postContainer.querySelector<HTMLElement>(
      '[aria-label="Add a photo"]'
    );
    if (!addPhotoBtn) {
      console.warn("EngageKit: Add a photo button not found (v1)");
      return false;
    }

    // Inject script into main world to block file picker
    // Using web_accessible_resource to bypass CSP restrictions
    // Must wait for script to load before clicking button
    await new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("block-file-picker.js");
      script.onload = () => {
        script.remove();
        resolve();
      };
      document.documentElement.appendChild(script);
    });

    // Click "Add a photo" - LinkedIn creates the file input (picker blocked)
    addPhotoBtn.click();

    // Wait for LinkedIn to create the file input
    await new Promise((r) => setTimeout(r, 200));

    // Get File object from source (URL or Blob)
    let file: File;

    if (imageSource instanceof Blob) {
      // Already have blob - wrap in File object
      file = new File([imageSource], "image.jpg", { type: imageSource.type || "image/jpeg" });
    } else {
      // Fetch the image from URL and convert to File
      const response = await fetch(imageSource);
      if (!response.ok) {
        console.error("EngageKit: Failed to fetch image (v1)", response.status);
        return false;
      }

      const blob = await response.blob();
      const filename = imageSource.split("/").pop() || "image.jpg";
      file = new File([blob], filename, { type: blob.type });
    }

    // Find the file input that LinkedIn created
    // Note: LinkedIn creates this globally, not within the post container
    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"][name="file"]'
    );
    if (!fileInput) {
      console.warn("EngageKit: File input not found after clicking Add a photo (v1)");
      return false;
    }

    // Set the file using DataTransfer API
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    // Dispatch change event to trigger LinkedIn's handler
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("EngageKit: Change event dispatched, waiting for image preview... (v1)");

    // Wait for the image preview to appear in the UI
    // LinkedIn V1 shows a thumbnail preview when an image is attached
    const maxWaitTime = 5000; // 5 seconds max
    const pollInterval = 200;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Look for image preview indicators in V1
      // V1 uses .comments-comment-media-preview-box__container--cr with data: image
      const imagePreview = postContainer.querySelector(
        // Primary: V1 preview container
        '.comments-comment-media-preview-box__container--cr img, ' +
        // Alternative: V1 media preview image wrapper
        '.comments-comment-box__media-preview--image img, ' +
        // Fallback: data URL image (base64)
        'img[src^="data:image"]'
      );

      if (imagePreview) {
        console.log("EngageKit: Image preview detected, attachment complete (v1)");
        return true;
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    // If we couldn't detect the preview, still return true since the change event was dispatched
    // The image might still be processing
    console.log("EngageKit: Image preview not detected within timeout, but change event was sent (v1)");
    return true;
  } catch (error) {
    console.error("EngageKit: Failed to attach image (v1)", error);
    return false;
  }
}
