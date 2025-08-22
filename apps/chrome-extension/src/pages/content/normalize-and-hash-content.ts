export type NormalizedContentHashResult = {
  hash: string;
  normalized: string;
  originalLength: number;
};

/**
 * Normalize a post's textual content and produce a stable SHA-256 hash.
 * - Lowercases
 * - Strips a wide range of emoji/symbol unicode blocks
 * - Removes punctuation/special chars
 * - Collapses whitespace
 */
export default async function normalizeAndHashContent(
  content: string,
): Promise<NormalizedContentHashResult | null> {
  try {
    if (!content || typeof content !== "string") {
      console.log("Invalid content provided for hashing");
      return null;
    }

    const normalized = content
      .toLowerCase()
      // Emoticons
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
      // Misc Symbols and Pictographs
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
      // Transport and Map
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
      // Regional country flags
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
      // Misc symbols
      .replace(/[\u{2600}-\u{26FF}]/gu, "")
      // Dingbats
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      // Supplemental Symbols and Pictographs
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
      // Symbols and Pictographs Extended-A
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
      // Private use area (some emoji)
      .replace(/[\u{E000}-\u{F8FF}]/gu, "")
      // Remove remaining punctuation and special chars (keep word chars and whitespace)
      .replace(/[^\w\s]/g, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    console.log(`Original length: ${content.length}`);
    console.log(`Normalized: "${normalized.substring(0, 100)}..."`);
    console.log(`Hash: ${hash}`);

    return { hash, normalized, originalLength: content.length };
  } catch (error) {
    console.error("Error normalizing and hashing content:", error);
    return null;
  }
}
