import wait from "@src/utils/wait";

/**
 * Switches the comment identity for a single LinkedIn post to the specified company profile.
 *
 * @param postContainer The HTMLElement that contains the LinkedIn post we are about to comment on.
 * @param profileName   The (partial) company name to match. Case-insensitive, ignores surrounding whitespace.
 * @returns `true` if the profile was successfully switched **or** if `profileName` is empty. `false` if the profile could not be found or any required element is missing.
 */
export default async function switchCommentProfile(
  postContainer: HTMLElement,
  profileName: string,
): Promise<boolean> {
  // If the user did not supply a profile name, keep personal profile.
  if (!profileName || !profileName.trim()) {
    return true;
  }

  const desired = profileName.trim().toLowerCase();

  try {
    // 1) Open the identity-switcher menu relative to this post.
    const menuButton = postContainer.querySelector<HTMLElement>(
      '[aria-label="Open menu for switching identity when interacting with this post"]',
    );

    if (!menuButton) {
      console.warn("switchCommentProfile: menu button not found inside post");
      return false;
    }

    menuButton.click();

    // 2) Wait for the modal to appear.
    const modalSelector = '[aria-labelledby="content-admin-identity-modal"]';
    let modal: HTMLElement | null = null;
    const maxAttempts = 15; // ~1.5s total (15 * 100ms)
    for (let i = 0; i < maxAttempts; i++) {
      modal = document.querySelector<HTMLElement>(modalSelector);
      if (modal) break;
      await wait(100);
    }

    if (!modal) {
      console.warn("switchCommentProfile: modal not found");
      return false;
    }

    // 3) Find the element with direct text containing the desired profile name.
    const descendants = Array.from(modal.querySelectorAll<HTMLElement>("*"));
    let targetElement: HTMLElement | null = null;

    for (const el of descendants) {
      let directText = "";
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          directText += node.textContent ?? "";
        }
      }

      if (directText.toLowerCase().includes(desired)) {
        targetElement = el;
        break;
      }
    }

    if (!targetElement) {
      console.warn(
        `switchCommentProfile: no element containing "${profileName}" found in modal`,
      );
      return false;
    }

    targetElement.click();

    // 4) Click the "Save selection" button.
    const saveSelector = '[aria-label="Save selection"]';
    await wait(500); // allow UI to enable save button
    const saveButton = document.querySelector<HTMLElement>(saveSelector);

    if (!saveButton) {
      console.warn("switchCommentProfile: save button not found");
      return false;
    }

    saveButton.click();
    await wait(1000); // brief wait for modal to close / LinkedIn to apply change

    return true;
  } catch (err) {
    console.error("switchCommentProfile: unexpected error", err);
    return false;
  }
}
