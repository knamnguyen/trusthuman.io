import extractAuthorInfo from "../extract-author-info";
import { normalizeAuthorName } from "./list-mode-types";

export const mapAuthorsToFirstPost = (params: {
  targetNormalizedAuthors: string[];
}): Map<string, HTMLElement> => {
  const { targetNormalizedAuthors } = params;
  const targetSet = new Set(targetNormalizedAuthors);
  const result = new Map<string, HTMLElement>();

  const containers = document.querySelectorAll(
    "div[data-urn], div[data-id]",
  ) as NodeListOf<HTMLElement>;
  containers.forEach((container) => {
    const info = extractAuthorInfo(container);
    const normalized = info?.name ? normalizeAuthorName(info.name) : "";
    if (normalized && targetSet.has(normalized) && !result.has(normalized)) {
      result.set(normalized, container);
    }
  });

  console.log("[ListMode] Author->post map keys:", Array.from(result.keys()));
  return result;
};
