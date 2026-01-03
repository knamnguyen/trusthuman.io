/**
 * Attach an image to a LinkedIn comment box programmatically
 *
 * This works by:
 * 1. Temporarily blocking the file picker from opening
 * 2. Clicking "Add a photo" to make LinkedIn create the file input
 * 3. Fetching the image and creating a File object
 * 4. Setting the file on the input and triggering change event
 */
export async function attachImageToComment(
  form: HTMLFormElement,
  imageUrl: string,
): Promise<boolean> {
  try {
    // Find the "Add a photo" button
    const addPhotoBtn = form.querySelector<HTMLElement>(
      '[aria-label="Add a photo"]',
    );
    if (!addPhotoBtn) {
      console.warn("EngageKit: Add a photo button not found");
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
      console.error("EngageKit: Failed to fetch image", response.status);
      return false;
    }

    const blob = await response.blob();
    const filename = imageUrl.split("/").pop() || "image.jpg";
    const file = new File([blob], filename, { type: blob.type });

    // Find the file input that LinkedIn created
    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"][name="file"]',
    );
    if (!fileInput) {
      console.warn("EngageKit: File input not found after clicking Add a photo");
      return false;
    }

    // Set the file using DataTransfer API
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    // Dispatch change event to trigger LinkedIn's handler
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("EngageKit: Image attached successfully");
    return true;
  } catch (error) {
    console.error("EngageKit: Failed to attach image", error);
    return false;
  }
}
