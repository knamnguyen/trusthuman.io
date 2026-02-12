import { getPage } from "../browser";

/**
 * Navigate to a LinkedIn post and click the Like button.
 * Uses retry polling to wait for the post container to load.
 */
export async function likePost(
  postUrn: string,
): Promise<{ success: boolean; alreadyLiked?: boolean; reason?: string }> {
  const page = getPage();

  // Navigate to the individual post page
  await page.goto(`https://www.linkedin.com/feed/update/${postUrn}`, {
    waitUntil: "domcontentloaded",
  });

  const result = await page.evaluate(async () => {
    const internals = (globalThis as any).engagekitInternals;
    if (!internals) throw new Error("engagekitInternals not found on window");

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
      return { success: false, reason: "Post container not found after 10s" };
    }

    const liked = await internals.commentUtils.likePost(containerResult.data);
    if (!liked) {
      return { success: false, alreadyLiked: true };
    }

    return { success: true };
  });

  return result;
}
