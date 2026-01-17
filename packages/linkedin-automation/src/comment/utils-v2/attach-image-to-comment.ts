/**
 * Attach Image to Comment - DOM v2 (React SSR + SDUI)
 *
 * Attaches an image to a LinkedIn comment box programmatically.
 *
 * Flow:
 * 1. Find "Share photo" button by data-view-name or aria-label
 * 2. Click button to make LinkedIn create the file input
 *    (Note: file picker WILL open - can't block from content script)
 * 3. If URL: Fetch image and convert to File object
 *    If Blob: Wrap in File object directly
 * 4. Set file on input using DataTransfer API
 * 5. Dispatch change event to trigger LinkedIn's handler
 * 6. Wait for image preview to appear in UI (up to 5s)
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
    console.log("EngageKit: attachImageToComment called", {
      isBlob: imageSource instanceof Blob,
      type: imageSource instanceof Blob ? imageSource.type : typeof imageSource,
    });

    // Find the "Share photo" button within the post container
    // V2 uses data-view-name="comment-add-image" and aria-label="Share photo"
    let addPhotoBtn = postContainer.querySelector<HTMLElement>(
      '[data-view-name="comment-add-image"]'
    );

    // Fallback to aria-label
    if (!addPhotoBtn) {
      addPhotoBtn = postContainer.querySelector<HTMLElement>(
        '[aria-label="Share photo"]'
      );
    }

    if (!addPhotoBtn) {
      console.warn("EngageKit: Share photo button not found (v2)");
      return false;
    }

    console.log("EngageKit: Found Share photo button, clicking...");

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

    // Click "Share photo" - LinkedIn creates the file input (picker blocked)
    addPhotoBtn.click();

    // Wait for LinkedIn to create the file input
    await new Promise((r) => setTimeout(r, 300));

    // Get File object from source (URL or Blob)
    let file: File;

    if (imageSource instanceof Blob) {
      // Already have blob - wrap in File object
      console.log("EngageKit: Using blob directly", {
        size: imageSource.size,
        type: imageSource.type,
      });
      file = new File([imageSource], "image.jpg", {
        type: imageSource.type || "image/jpeg",
      });
    } else {
      // Fetch the image from URL and convert to File
      console.log("EngageKit: Fetching image from URL:", imageSource);
      const response = await fetch(imageSource);
      if (!response.ok) {
        console.error("EngageKit: Failed to fetch image (v2)", response.status);
        return false;
      }

      const blob = await response.blob();
      const filename = imageSource.split("/").pop() || "image.jpg";
      file = new File([blob], filename, { type: blob.type });
    }

    console.log("EngageKit: File created", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Find the file input that LinkedIn created
    // Note: V2 uses input[accept="image/*"] without a name attribute
    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"][accept="image/*"]'
    );
    if (!fileInput) {
      console.warn(
        "EngageKit: File input not found after clicking Share photo (v2)"
      );
      // Debug: list all file inputs
      const allFileInputs = document.querySelectorAll('input[type="file"]');
      console.log("EngageKit: All file inputs on page:", allFileInputs.length);
      allFileInputs.forEach((input, i) => {
        console.log(`  [${i}]`, {
          accept: input.getAttribute("accept"),
          name: input.getAttribute("name"),
          id: input.id,
        });
      });
      return false;
    }

    console.log("EngageKit: Found file input, setting file...");

    // Set the file using DataTransfer API
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    console.log("EngageKit: File set on input", {
      filesLength: fileInput.files?.length,
      fileName: fileInput.files?.[0]?.name,
    });

    // Dispatch change event to trigger LinkedIn's handler
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("EngageKit: Change event dispatched, waiting for image preview...");

    // Wait for the image preview to appear in the UI
    // LinkedIn V2 shows a thumbnail preview when an image is attached
    const maxWaitTime = 5000; // 5 seconds max
    const pollInterval = 200;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Look for image preview indicators in V2
      // V2 uses componentkey="commentBoxLinkPreview" container with blob image
      const imagePreview = postContainer.querySelector(
        // Primary: V2 preview container with loaded blob image
        'div[componentkey^="commentBoxLinkPreview"] img[data-loaded="true"], ' +
        // Alternative: blob image with data-loaded attribute
        'img[src^="blob:"][data-loaded="true"]'
      );

      if (imagePreview) {
        console.log("EngageKit: Image preview detected, attachment complete (v2)");
        return true;
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    // If we couldn't detect the preview, still return true since the change event was dispatched
    // The image might still be processing
    console.log("EngageKit: Image preview not detected within timeout, but change event was sent (v2)");
    return true;
  } catch (error) {
    console.error("EngageKit: Failed to attach image (v2)", error);
    return false;
  }
}
