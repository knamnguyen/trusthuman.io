import extractAuthorInfo from "../extract-author-info";
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
      const scrollProgressElement = statusPanel.querySelector(
        "#scroll-progress span",
      );
      if (scrollProgressElement) {
        (scrollProgressElement as HTMLElement).textContent =
          `⏳ Finding authors: ${found.length}/${targetNormalizedAuthors.length}`;
      }
    }
  };

  // Initial tick
  await tick();

  // Aggressive scrolling loop until all found or timeout
  while (isCommentingActiveRef() && foundSet.size < targetSet.size) {
    if (Date.now() - start >= timeoutMs) break;
    window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
    await new Promise((r) => setTimeout(r, 1200));
    await tick();
  }

  const found = Array.from(foundSet);
  const missing = targetNormalizedAuthors.filter((n) => !foundSet.has(n));
  return { found, missing };
};
