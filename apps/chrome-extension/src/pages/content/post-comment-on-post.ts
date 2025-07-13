import wait from "@src/utils/wait";

import switchCommentProfile from "./switch-comment-profile";

// Function to post comment on a specific post
export default async function postCommentOnPost(
  postContainer: HTMLElement,
  comment: string,
  isCommentingActive: boolean,
  profileName: string,
): Promise<boolean> {
  try {
    console.group("📝 Comment Posting Process");
    console.log("Starting to post comment:", comment.substring(0, 100) + "...");

    // Check if we should stop before starting
    if (!isCommentingActive) {
      console.log("❌ Stopping comment posting due to stop signal");
      console.groupEnd();
      return false;
    }

    // Step 1: Find and click the comment button
    console.log("🔍 Looking for comment button...");
    const commentButton = postContainer.querySelector(
      'button[aria-label="Comment"]',
    ) as HTMLButtonElement;
    if (!commentButton) {
      console.error("❌ Comment button not found");
      console.groupEnd();
      return false;
    }

    console.log("👆 Clicking comment button...");
    commentButton.click();

    // Wait for comment editor to appear
    console.log("⏳ Waiting for comment editor to appear...");
    await wait(2000);

    // After editor appears, attempt to switch profile if needed
    const switched = await switchCommentProfile(postContainer, profileName);
    if (!switched) {
      console.error(
        `switchCommentProfile failed – profile \"${profileName}\" not found.`,
      );
      return false;
    }

    // Check again after wait
    if (!isCommentingActive) {
      console.log("❌ Stopping during comment editor wait due to stop signal");
      console.groupEnd();
      return false;
    }

    // Step 2: Find the comment editor
    console.log("🔍 Looking for comment editor...");
    const commentEditor = postContainer.querySelector(
      ".comments-comment-box-comment__text-editor",
    );
    if (!commentEditor) {
      console.error("❌ Comment editor not found");
      console.groupEnd();
      return false;
    }

    // Step 3: Find the editable field within the editor
    console.log("🔍 Looking for editable field...");
    const editableField = commentEditor.querySelector(
      'div[contenteditable="true"]',
    ) as HTMLElement;
    if (!editableField) {
      console.error("❌ Editable field not found");
      console.groupEnd();
      return false;
    }

    console.log("✅ Found editable field, inputting comment...");

    // Check again before inputting
    if (!isCommentingActive) {
      console.log("❌ Stopping during comment input due to stop signal");
      console.groupEnd();
      return false;
    }

    // Step 4: Click on the editable field and input the comment
    editableField.focus();
    editableField.click();
    editableField.innerHTML = "";

    // Input the comment text
    const lines = comment.split("\n");
    lines.forEach((lineText) => {
      const p = document.createElement("p");
      if (lineText === "") {
        p.appendChild(document.createElement("br"));
      } else {
        p.textContent = lineText;
      }
      editableField.appendChild(p);
    });

    // Set cursor position and trigger input event
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      if (editableField.lastChild) {
        range.setStartAfter(editableField.lastChild);
      } else {
        range.selectNodeContents(editableField);
      }
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    editableField.focus();

    const inputEvent = new Event("input", { bubbles: true, cancelable: true });
    editableField.dispatchEvent(inputEvent);

    console.log("✅ Comment text inputted successfully");

    // Wait for submit button to become enabled
    console.log("⏳ Waiting for submit button to become enabled...");
    await wait(1000);

    // Check again before submitting
    if (!isCommentingActive) {
      console.log("❌ Stopping during submit button wait due to stop signal");
      console.groupEnd();
      return false;
    }

    // Step 5: Find and click the submit button
    console.log("🔍 Looking for submit button...");
    const submitButton = postContainer.querySelector(
      ".comments-comment-box__submit-button--cr",
    ) as HTMLButtonElement;
    if (!submitButton || submitButton.disabled) {
      console.error("❌ Submit button not found or disabled");
      console.groupEnd();
      return false;
    }

    console.log("🚀 Clicking submit button...");
    submitButton.click();

    // Wait for comment to be posted
    console.log("⏳ Waiting for comment to be posted...");
    await wait(2000);

    console.log("🎉 Comment posted successfully");
    console.groupEnd();
    return true;
  } catch (error) {
    console.error("💥 Error posting comment:", error);
    console.groupEnd();
    return false;
  }
}
