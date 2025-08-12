import parseTimeStringToHours from "@src/utils/parse-time-string-to-hours";

export interface PostTimePromoteState {
  ageHours: number | null;
  isPromoted: boolean;
}

// Function to extract relative post age **and** detect promoted status
// Returns { ageHours, isPromoted }
// - ageHours: number of hours since post or null when unknown / promoted
// - isPromoted: true when the element indicates a sponsored post
export default function extractPostTimePromoteState(
  postContainer: HTMLElement,
): PostTimePromoteState {
  try {
    // 1) Primary selector – original assumption
    let span: HTMLElement | null = postContainer.querySelector(
      ".update-components-actor__sub-description",
    );

    // 2) Fallback – any span[aria-hidden="true"] that has pattern like "\d+[mhdw]" or "now" or "promoted"
    if (!span) {
      const candidates = Array.from(
        postContainer.querySelectorAll<HTMLElement>("span[aria-hidden='true']"),
      );
      span =
        candidates.find((el) => {
          const txt = (el.textContent ?? "").trim();
          return /^(promoted|now|\d+\s*[mhdw])/i.test(txt);
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
      return { ageHours: null, isPromoted: false };
    }

    // At this point span & textContent are defined
    const rawText = (span?.textContent ?? "").trim();

    console.log("extracted time or promote state:", rawText);
    if (!rawText) {
      return { ageHours: null, isPromoted: false };
    }

    // Detect promoted posts (matches 'Promoted' anywhere in the string, even with extra words)
    const isPromoted = /promoted/i.test(rawText);

    // Remove everything after bullet (•) to isolate the relative time
    const timeText = (rawText.split("•")[0] ?? "").trim();

    const ageHours = isPromoted ? null : parseTimeStringToHours(timeText);

    return { ageHours, isPromoted };
  } catch (error) {
    console.error("Error extracting post time/promote state:", error);
    return { ageHours: null, isPromoted: false };
  }
}
