import { getPage } from "../browser";

/**
 * Navigate to a LinkedIn post, type a comment, and submit it.
 * Navigation is done via Puppeteer, DOM operations via page.evaluate().
 */
export async function commentOnPost(
  postUrn: string,
  commentText: string,
): Promise<{ ok: boolean; reason?: string; commentUrl?: string }> {
  const page = getPage();

  // Navigate to the individual post page
  await page.goto(`https://www.linkedin.com/feed/update/${postUrn}`, {
    waitUntil: "domcontentloaded",
  });

  const result = await page.evaluate(
    async (text: string) => {
      const internals = (globalThis as any).engagekitInternals;
      if (!internals)
        throw new Error("engagekitInternals not found on window");

      // Poll for post container (LinkedIn loads content async)
      const containerResult = await internals.retry(
        () => {
          const container =
            internals.postUtils.findPostContainerFromFeedUpdatePage();
          if (!container) throw new Error("not found");
          return container;
        },
        { timeout: 10000, interval: 1000 },
      );

      if (!containerResult.ok) {
        return {
          ok: false as const,
          reason: "Post container not found after 10s",
        };
      }

      const postContainer = containerResult.data;

      // Insert comment text (handles finding/opening the comment editor)
      const inserted = await internals.commentUtils.insertComment(
        postContainer,
        text,
      );
      if (!inserted) {
        return { ok: false as const, reason: "Failed to insert comment text" };
      }

      await new Promise((r) => setTimeout(r, 300));

      // Submit the comment
      const submitResult =
        await internals.commentUtils.submitComment(postContainer);
      if (!submitResult.success) {
        return { ok: false as const, reason: "Comment submission failed" };
      }

      return {
        ok: true as const,
        commentUrl: submitResult.commentUrl ?? undefined,
      };
    },
    commentText,
  );

  return result;
}
