/**
 * Attach Image to Comment - DOM v1 (Legacy)
 *
 * Attaches an image to a LinkedIn comment box programmatically.
 *
 * Flow:
 * 1. Find "Add a photo" button by aria-label
 * 2. Temporarily block file picker from opening
 * 3. Click button to make LinkedIn create the file input
 * 4. Fetch image URL and convert to File object
 * 5. Set file on input using DataTransfer API
 * 6. Dispatch change event to trigger LinkedIn's handler
 */

/**
 * Attaches an image to a comment before submitting.
 * Downloads the image from URL and attaches it to the comment box.
 *
 * @param postContainer - The LinkedIn post container element
 * @param imageUrl - URL of the image to attach
 * @returns Promise<boolean> - true if image was attached successfully
 */
export async function attachImageToComment(
  postContainer: HTMLElement,
  imageUrl: string
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

    // Temporarily override click to prevent file picker from opening
    const originalClick = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () {
      if (this.type === "file") return; // Block file picker
      return originalClick.call(this);
    };

    // Click "Add a photo" - LinkedIn creates the file input but picker won't open
    addPhotoBtn.click();

    // Wait for LinkedIn to create the file input
    await new Promise((r) => setTimeout(r, 200));

    // Restore original click behavior
    HTMLInputElement.prototype.click = originalClick;

    // Fetch the image and convert to File
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error("EngageKit: Failed to fetch image (v1)", response.status);
      return false;
    }

    const blob = await response.blob();
    const filename = imageUrl.split("/").pop() || "image.jpg";
    const file = new File([blob], filename, { type: blob.type });

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

    console.log("EngageKit: Image attached successfully (v1)");
    return true;
  } catch (error) {
    console.error("EngageKit: Failed to attach image (v1)", error);
    return false;
  }
}
