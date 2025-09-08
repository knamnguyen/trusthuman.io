import wait from "@src/utils/wait";

import extractAuthorInfo from "../extract-author-info";
import {
  clickLoadMore,
  countPosts,
  SCROLL_PAUSE_MS,
  triggerScrollEvents,
} from "../utils/scroll-helpers";
import {
  LIST_MODE_DEFAULT_TIMEOUT_MS,
  ListModeState,
  normalizeAuthorName,
} from "./list-mode-types";

const sendListModeUpdate = (note: string, state: ListModeState) => {
  try {
    chrome.runtime.sendMessage({ action: "listModeUpdate", note, ...state });
  } catch {}
};

export const preloadAuthorsFeed = async (params: {
  isCommentingActiveRef: () => boolean;
  targetNormalizedAuthors: string[];
  timeoutMs?: number;
  statusPanel?: HTMLDivElement;
}): Promise<{ found: string[]; missing: string[] }> => {
  const { isCommentingActiveRef, targetNormalizedAuthors, statusPanel } =
    params;
  const timeoutMs = params.timeoutMs ?? LIST_MODE_DEFAULT_TIMEOUT_MS;

  const targetSet = new Set(targetNormalizedAuthors);

  const foundSet = new Set<string>();

  const start = Date.now();
  const endTime = start + timeoutMs;
  let lastPostCount = 0;
  let scrollAttempts = 0;
  let clicks = 0;

  const tick = async () => {
    // Collect authors from visible posts
    const containers = document.querySelectorAll(
      "div[data-urn], div[data-id]",
    ) as NodeListOf<HTMLElement>;
    containers.forEach((c) => {
      const info = extractAuthorInfo(c);
      if (info?.name) {
        const normalized = normalizeAuthorName(info.name);
        if (targetSet.has(normalized)) {
          foundSet.add(normalized);
        }
      }
    });

    // Update status (overlay + popup)
    const found = Array.from(foundSet);
    const missing = targetNormalizedAuthors.filter((n) => !foundSet.has(n));
    const state: ListModeState = {
      authorsFound: found,
      authorsMissing: missing,
      authorsPending: missing,
      authorsCommented: [],
    };
    sendListModeUpdate(
      `Preloading authors: found ${found.length}/${targetNormalizedAuthors.length}`,
      state,
    );

    if (statusPanel) {
      const timeRemainingElement = statusPanel.querySelector(
        "#time-remaining span",
      );
      const postsLoadedElement =
        statusPanel.querySelector("#posts-loaded span");
      const scrollProgressElement = statusPanel.querySelector(
        "#scroll-progress span",
      );
      if (timeRemainingElement) {
        const currentTime = Date.now();
        const timeRemaining = Math.max(
          0,
          Math.round((endTime - currentTime) / 1000),
        );
        (timeRemainingElement as HTMLElement).textContent = `${timeRemaining}s`;
      }
      if (postsLoadedElement) {
        const currentPosts = countPosts();
        const newPostsThisSession = Math.max(0, currentPosts - lastPostCount);
        (postsLoadedElement as HTMLElement).textContent =
          `${currentPosts} posts (+${newPostsThisSession} this session)`;
      }
      if (scrollProgressElement) {
        (scrollProgressElement as HTMLElement).textContent =
          `⏳ Finding authors: ${found.length}/${targetNormalizedAuthors.length}`;
      }
    }
  };

  // Initial tick
  await tick();
  lastPostCount = countPosts();

  // Aggressive scrolling loop until all found or timeout
  while (isCommentingActiveRef() && foundSet.size < targetSet.size) {
    if (Date.now() >= endTime) break;

    const currentTime = Date.now();
    const timeRemaining = Math.round((endTime - currentTime) / 1000);

    if (statusPanel) {
      const timeRemainingElement = statusPanel.querySelector(
        "#time-remaining span",
      );
      const postsLoadedElement =
        statusPanel.querySelector("#posts-loaded span");
      const scrollProgressElement = statusPanel.querySelector(
        "#scroll-progress span",
      );
      if (timeRemainingElement) {
        (timeRemainingElement as HTMLElement).textContent = `${timeRemaining}s`;
      }
      if (postsLoadedElement) {
        const currentPosts = countPosts();
        const newPostsThisSession = Math.max(0, currentPosts - lastPostCount);
        (postsLoadedElement as HTMLElement).textContent =
          `${currentPosts} posts (+${newPostsThisSession} this session)`;
      }
      if (scrollProgressElement) {
        (scrollProgressElement as HTMLElement).textContent = `Scroll attempt ${
          scrollAttempts + 1
        } - Loading content...`;
      }
    }

    scrollAttempts++;

    if (await clickLoadMore()) clicks++;
    wait(1000);
    console.log("current number of posts: " + countPosts());

    const documentHeight = document.body.scrollHeight;
    window.scrollTo({ top: documentHeight, behavior: "smooth" });
    // Trigger content-world events
    triggerScrollEvents();
    // Signal page-world injector to dispatch events and attempt load-more
    try {
      window.postMessage(
        { source: "EK", type: "EK_TRIGGER_FEED_SCROLL_PULSE" },
        "*",
      );
      console.log("[EK][preload] Posted page-world pulse after scroll");
    } catch (error) {
      console.error("[EK][preload] Failed to post page-world pulse", error);
    }

    await new Promise((r) => setTimeout(r, SCROLL_PAUSE_MS));

    const currentPosts = countPosts();
    if (currentPosts > lastPostCount) {
      const newPosts = currentPosts - lastPostCount;
      lastPostCount = currentPosts;
      if (statusPanel) {
        const scrollProgressElement = statusPanel.querySelector(
          "#scroll-progress span",
        );
        if (scrollProgressElement) {
          (scrollProgressElement as HTMLElement).textContent =
            `✅ Loaded ${newPosts} new posts! (Total: ${currentPosts})`;
        }
      }
    } else {
      if (statusPanel) {
        const scrollProgressElement = statusPanel.querySelector(
          "#scroll-progress span",
        );
        if (scrollProgressElement) {
          (scrollProgressElement as HTMLElement).textContent =
            `⏳ Waiting for new content... (${currentPosts} posts)`;
        }
      }
    }

    await tick();
  }

  const found = Array.from(foundSet);
  const missing = targetNormalizedAuthors.filter((n) => !foundSet.has(n));
  return { found, missing };
};
