import parseTimeStringToHours from "@src/utils/parse-time-string-to-hours";

// Function to extract relative time ("1m", "2h", etc.) from a post container
export default function extractPostTime(
  postContainer: HTMLElement,
): number | null {
  try {
    // 1) Primary selector – original assumption
    let span: HTMLElement | null = postContainer.querySelector(
      ".update-components-actor__sub-description.text-body-xsmall [aria-hidden='true']",
    );

    // 2) Fallback – any span[aria-hidden="true"] that has pattern like "\d+[mhdw]" or "now"
    if (!span) {
      const candidates = Array.from(
        postContainer.querySelectorAll<HTMLElement>("span[aria-hidden='true']"),
      );
      span =
        candidates.find((el) => {
          const txt = (el.textContent ?? "").trim();
          return /^(now|\d+\s*[mhdw])/i.test(txt);
        }) || null;
    }

    // 3) Final fallback – visually hidden text (long form)
    if (!span) {
      const hidden = postContainer.querySelector<HTMLElement>(
        ".update-components-actor__sub-description.visually-hidden",
      );
      if (hidden) span = hidden;
    }

    if (!span || !span.textContent) {
      return null;
    }

    const rawText = (span.textContent as string).trim();
    // Remove everything after bullet (•) to isolate the relative time
    const timeText = rawText.split("•")[0].trim();

    return parseTimeStringToHours(timeText);
  } catch (error) {
    console.error("Error extracting post time:", error);
    return null;
  }
}
