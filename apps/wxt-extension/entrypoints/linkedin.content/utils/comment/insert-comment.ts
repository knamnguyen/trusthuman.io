// TODO: Re-enable when comment image feature is ready
// import { useCommentImageStore } from "../stores/comment-image-store";
// import { attachImageToComment } from "./attach-image-to-comment";

/**
 * Insert text into a LinkedIn comment field
 * Handles multi-line content and triggers input events
 * Used by submitCommentToPost for ComposeCard submissions
 */
export async function insertCommentIntoField(
  editableField: HTMLElement,
  comment: string,
): Promise<void> {
  // Clear existing content
  editableField.innerHTML = "";

  // Insert each line as a paragraph
  comment.split("\n").forEach((line) => {
    const p = document.createElement("p");
    if (line === "") {
      p.appendChild(document.createElement("br"));
    } else {
      p.textContent = line;
    }
    editableField.appendChild(p);
  });

  // Dispatch input event so LinkedIn recognizes changes
  editableField.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: true }),
  );

  // TODO: Re-enable when comment image feature is ready
  // Check if image attachment is enabled and attach random image
  // const imageUrl = useCommentImageStore.getState().getRandomImage();
  // if (imageUrl) {
  //   const form = editableField.closest("form") as HTMLFormElement | null;
  //   if (form) {
  //     await attachImageToComment(form, imageUrl);
  //   }
  // }
}
