import type { CommentUtilities } from "./types";
import { navigateLinkedIn } from "../navigate/navigate-linkedin";
import { PostUtilities } from "../post/types";

export async function navigateToPostAndSubmitComment(
  postUtilities: PostUtilities,
  commentUtilities: CommentUtilities,
  postUrn: string,
  commentText: string,
  submitSettings?: Partial<{
    submitDelayRange: string;
    likePostEnabled: boolean;
    likeCommentEnabled: boolean;
    tagPostAuthorEnabled: boolean;
    attachPictureEnabled: boolean;
    pictureAttachUrl: string;
  }>,
) {
  // 1. Navigate to post URL
  navigateLinkedIn(`/feed/update/${postUrn}`);

  // 2. Poll for post container
  let postContainer: HTMLElement | null = null;
  const start = Date.now();
  while (postContainer === null || Date.now() - start < 10_000) {
    postContainer = postUtilities.findPostContainerFromFeedUpdatePage();
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (postContainer === null) {
    console.warn(
      "EngageKit: Post container not found after navigation to post",
    );
    return {
      ok: false,
      reason: "Post container not found",
    } as const;
  }

  // 3. Submit comment using comment utilities
  const inserted = commentUtilities.insertComment(postContainer, commentText);

  if (!inserted) {
    console.warn("EngageKit: Failed to insert comment text");
    return {
      ok: false,
      reason: "Failed to insert comment text",
    } as const;
  }

  await new Promise((r) => setTimeout(r, 300));

  // 4. Tag author if enabled
  if (submitSettings?.tagPostAuthorEnabled) {
    await commentUtilities.tagPostAuthor(postContainer);
    await new Promise((r) => setTimeout(r, 300));
  }

  // 5. Attach image if enabled
  if (
    submitSettings?.attachPictureEnabled &&
    submitSettings?.pictureAttachUrl
  ) {
    const image = await imageUrlToBlob(submitSettings.pictureAttachUrl);

    if (image.ok === false) {
      console.warn(
        "EngageKit: Failed to convert image URL to Blob:",
        image.reason,
      );
    } else {
      await commentUtilities.attachImageToComment(postContainer, image.blob);
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // 6. Submit comment (click button + verify)
  const result = await commentUtilities.submitComment(postContainer);

  console.info({ result });

  if (!result.success) {
    return {
      ok: false,
      reason: "Comment submission verification failed",
    } as const;
  }

  return { ok: true } as const;
}

export const imageUrlToBlob = (url: string) =>
  new Promise<
    | {
        ok: true;
        blob: Blob;
      }
    | {
        ok: false;
        reason: string;
      }
  >((resolve, reject) => {
    const image = new Image();
    // Needed for cross-origin images that actually send CORS headers
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ ok: false, reason: "Failed to get canvas context" });
        return;
      }
      ctx.drawImage(image, 0, 0);
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve({ ok: true, blob })
            : resolve({ ok: false, reason: "Canvas toBlob failed" }),
        "image/png",
      );
    };
    image.onerror = () =>
      resolve({ ok: false, reason: "Image failed to load" });
    image.src = url;
  });
